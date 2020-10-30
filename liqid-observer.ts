import _ = require('lodash');
import { LiqidCommunicator, LiqidError } from './liqid-communicator';
import { Group, PreDevice, Machine, DeviceStatus, ConnectionHistory, GroupDetails, MachineDetails, DeviceDetails, NodeStatus } from './models';
import * as Stomp from 'stompjs';


export interface OrganizedDeviceStatuses {
    cpu: { [key: string]: DeviceStatus },
    gpu: { [key: string]: DeviceStatus },
    ssd: { [key: string]: DeviceStatus },
    optane: { [key: string]: DeviceStatus },
    nic: { [key: string]: DeviceStatus },
    fpga: { [key: string]: DeviceStatus }
}

export interface GatheringDevStatsOptions {
    cpu: number | string[],
    gpu: number | string[],
    ssd: number | string[],
    optane: number | string[],
    nic: number | string[],
    fpga: number | string[],
    gatherUnused: boolean
}

/**
 * Observer for liqid system state
```typescript
const observer = new LiqidObserver(ip);
```
 */
export class LiqidObserver {

    private liqidComm: LiqidCommunicator;
    private fabricId: number;

    private wsUrl: string;
    private busyState: boolean;

    private stompClient: Stomp.Client;

    private groups: { [key: string]: Group };
    private machines: { [key: string]: Machine };
    private devices: { [key: string]: PreDevice };
    private deviceStatuses: { [key: string]: DeviceStatus };

    private ipmiToCpuNameMap: { [key: string]: string };
    private cpuNameToIpmiMap: { [key: string]: string };

    private updateCallback;

    public fabricTracked: boolean;

    constructor(private liqidIp: string, public systemName: string = '') {
        this.liqidComm = new LiqidCommunicator(liqidIp);
        this.wsUrl = `ws://${liqidIp}:8080/liqid/event`;
        this.busyState = false;

        this.groups = {};
        this.machines = {};
        this.devices = {};
        this.deviceStatuses = {};

        this.ipmiToCpuNameMap = {};
        this.cpuNameToIpmiMap = {};

        this.fabricTracked = false;
    }

    /**
     * Deep diff between two objects, using lodash.
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Object}        Return a new object that represent the difference
     */
    private difference(object: any, base: any): any {
        function changes(object: any, base: any) {
            return _.transform(object, function (result: any, value: any, key: any) {
                if (!_.isEqual(value, base[key])) {
                    result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                }
            });
        }
        return changes(object, base);
    }

    /**
     * Start tracking Liqid. Check for updates at one second intervals. Stops when encounters an error.
     * The checking for updates at one second intervals is just a work around until a better solution is known.
     * @return  {Promise<boolean>}   Return true if start is successful; false if observer is already in an on state
     */
    public async start(): Promise<boolean> {
        var doSubsribe = (): void => {
            this.stompClient.subscribe('/data/group', (m: Stomp.Message) => {
                if (this.busyState)
                    return;
                let map: { [key: string]: Group } = {};
                JSON.parse(m.body).forEach((group) => {
                    map[group.grp_id] = group;
                });
                let updated: boolean = this.makeNecessaryUpdates(map, this.groups);
            }, { 'id': "group-data-socket" });
            this.stompClient.subscribe('/data/machine', (m: Stomp.Message) => {
                if (this.busyState)
                    return;
                let map: { [key: string]: Group } = {};
                JSON.parse(m.body).forEach((machine) => {
                    map[machine.mach_id] = machine;
                });
                let updated: boolean = this.makeNecessaryUpdates(map, this.machines);
            }, { 'id': "machine-socket" });
            this.stompClient.subscribe('/data/predevice', (m: Stomp.Message) => {
                if (this.busyState)
                    return;
                let map: { [key: string]: PreDevice } = {};
                JSON.parse(m.body).forEach((device) => {
                    map[device.name] = device;
                });
                let updated: boolean = this.makeNecessaryUpdates(map, this.devices);
                // if (this.updateCallback)
                //     this.updateCallback(this.fabricId);
            }, { 'id': "predevice-socket" });
            // this.stompClient.subscribe('/data/device', (m: Stomp.Message) => {
            //     if (this.busyState)
            //         return;
            //     let map: { [key: string]: DeviceStatus } = {};
            //     JSON.parse(m.body).forEach((status) => {
            //         map[status.name] = status;
            //     });
            //     let updated: boolean = this.makeNecessaryUpdates(map, this.deviceStatuses);
            //     //console.log('Change occurred in device statuses:', m);
            // }, { 'id': "device-data-socket" });
        }
        try {
            if (!this.fabricTracked) {
                this.fabricTracked = await this.trackSystemChanges();
                this.fabricId = await this.identifyFabricId();
                await this.loadIpmiCpuMapping();
                if (this.fabricTracked && !this.stompClient) {
                    this.stompClient = Stomp.overWS(this.wsUrl);
                    await this.stompClient.connect({}, doSubsribe, (e) => {
                        console.log('Stomp Error:');
                        console.log(e);
                    });
                    return true;
                }
                return true;
            }
            return false;
        }
        catch (err) {
            this.fabricTracked = false;
            throw new Error('LiqidObserver start unsuccessful: possibly unable to communicate with Liqid.');
        }
    }

    public setBusyState(state: boolean): void {
        this.busyState = state;
    }

    public attachUpdateCallback(callback): void {
        this.updateCallback = callback;
    }

    /**
     * Determine the current fabric ID on which this observer is mounted
     * @return  {Promise<number>}    The ID
     */
    private async identifyFabricId(): Promise<number> {
        try {
            return await this.liqidComm.getFabricId();
        }
        catch (err) {
            throw new Error('Unable to retrieve fabric ID.');
        }
    }

    public getFabricId(): number {
        return this.fabricId
    }

    private async loadIpmiCpuMapping(): Promise<void> {
        try {
            let list = await this.liqidComm.getManageableIpmiAddresses();
            for (let i = 0; i < list.length; i++) {
                this.ipmiToCpuNameMap[list[i].ip_address] = list[i].cpu_name;
                this.cpuNameToIpmiMap[list[i].cpu_name] = list[i].ip_address;
            }
        }
        catch (err) {
            throw new Error('Unable to retrieve ipmi addresses.');
        }
    }

    public getIpmiAddressByName(name: string): string {
        if (this.cpuNameToIpmiMap.hasOwnProperty(name))
            return this.cpuNameToIpmiMap[name];
        else
            return '';
    }

    public checkGroupIsEmpty(id: number): boolean {
        let arr = Object.keys(this.machines);
        for (let i = 0; i < arr.length; i++) {
            if (this.machines[arr[i]].grp_id == id)
                return false;
        }
        return true;
    }

    /**
     * Stop tracking Liqid. Call start to resume.
     */
    public stop(): void {
        if (!this.fabricTracked) return;
        this.fabricTracked = false;
        this.stompClient.disconnect(() => { });
        // clearInterval(this.mainLoop);
    }

    /**
     * Refresh observer to get the lastest Liqid system state.
     */
    public async refresh(): Promise<void> {
        try {
            let success = await this.trackSystemChanges();
            if (!success)
                throw new Error('');
        }
        catch (err) {
            throw new Error('Observer Refresh Error: refresh unsuccessful.');
        }
    }

    //public

    /**
     * Pulls up-to-date information from Liqid and compares/modifies existing information.
     * @return {Promise<boolean>}    The success of the operation
     */
    private async trackSystemChanges(): Promise<boolean> {
        try {
            var prevBusy = this.busyState;
            if (!prevBusy) this.busyState = true;
            let groups = await this.fetchGroups();
            let machines = await this.fetchMachines();
            let devices = await this.fetchPreDevices();
            let devStatuses = await this.fetchDevStatuses();
            this.makeNecessaryUpdates(groups, this.groups);
            this.makeNecessaryUpdates(machines, this.machines);
            this.makeNecessaryUpdates(devices, this.devices);
            this.makeNecessaryUpdates(devStatuses, this.deviceStatuses);
            if (!prevBusy) this.busyState = false;
            return true;
        }
        catch (err) {
            if (!prevBusy) this.busyState = false;
            throw new Error('Issue with trackSystemChanges; halting tracking');
        }
    }

    private makeNecessaryUpdates(update: { [key: string]: any }, target: { [key: string]: any }): boolean {
        let hasDifferences = false;
        //check for necessary updates
        let detectedChanges = this.difference(update, target);
        if (detectedChanges.length > 0)
            hasDifferences = true;
        //update
        Object.keys(detectedChanges).forEach((key) => {
            target[key] = update[key];
        });
        //check for necessary deletions
        detectedChanges = this.difference(target, update);
        if (!hasDifferences && detectedChanges.length > 0)
            hasDifferences = true;
        //do deletions
        Object.keys(detectedChanges).forEach((key) => {
            delete target[key];
        });
        return hasDifferences;
    }

    /**
     * Fetch group information
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    private async fetchGroups(): Promise<{ [key: string]: Group }> {
        try {
            let map: { [key: string]: Group } = {};
            let groupArray = await this.liqidComm.getGroupList();
            groupArray.forEach((group) => {
                map[group.grp_id] = group;
            });
            return map;
        }
        catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Fetch machine information
     * @return {Promise<{ [key: string]: Machine }}   Machine mapping with id as key
     */
    private async fetchMachines(): Promise<{ [key: string]: Machine }> {
        try {
            let map: { [key: string]: Machine } = {};
            let machineArray = await this.liqidComm.getMachineList();
            machineArray.forEach((machine) => {
                map[machine.mach_id] = machine;
            });
            return map;
        }
        catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Fetch device information
     * @return {Promise<{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    private async fetchPreDevices(): Promise<{ [key: string]: PreDevice }> {
        try {
            let map: { [key: string]: PreDevice } = {};
            let deviceArray = await this.liqidComm.getDeviceList();
            deviceArray.forEach((device) => {
                map[device.name] = device;
            });
            return map;
        }
        catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Fetch device statuses
     * @return {Promise<{ [key: string]: DeviceStatus }}   DeviceStatus mapping with name as key
     */
    private async fetchDevStatuses(): Promise<{ [key: string]: DeviceStatus }> {
        try {
            let map: { [key: string]: DeviceStatus } = {};
            let devStatusArray = await this.liqidComm.getDeviceStats();
            devStatusArray.forEach((status) => {
                map[status.name] = status;
            });
            return map;
        }
        catch (err) {
            throw new Error(err);
        }
    }

    private async fetchNodeStatus(id: number): Promise<NodeStatus> {
        try {
            if (!this.machines.hasOwnProperty(id)) return null;
            let mach = this.machines[id];
            let nodeStatus: NodeStatus = await this.liqidComm.getNodeStatusByIds(this.fabricId, mach.grp_id, mach.mach_id, mach.mach_name);
            return nodeStatus;
        }
        catch (err) {
            throw new Error(err);
        }
    }

    public async fetchDeviceDetails(id: string): Promise<DeviceDetails> {
        try {
            if (this.deviceStatuses.hasOwnProperty(id)) {
                return await this.liqidComm.getDeviceDetails(this.deviceStatuses[id]);
            }
            else {
                let err: LiqidError = {
                    code: 404,
                    origin: 'observer',
                    description: `Device ${id} does not exist.`
                }
                throw err;
            }
        }
        catch (err) {
            if (err.origin) {
                throw err;
            }
            else {
                let err: LiqidError = {
                    code: 500,
                    origin: 'observer',
                    description: 'Undocumented error occurred in getting device details.'
                }
                throw err;
            }
        }
    }

    public async fetchMachineDetails(id: number): Promise<MachineDetails> {
        try {
            if (this.machines.hasOwnProperty(id)) {
                return await this.liqidComm.getMachineDetails(id);
            }
            else {
                let err: LiqidError = {
                    code: 404,
                    origin: 'observer',
                    description: `Machine ${id} does not exist.`
                }
                throw err;
            }
        }
        catch (err) {
            if (err.origin) {
                throw err;
            }
            else {
                let error: LiqidError = {
                    code: 500,
                    origin: 'observer',
                    description: 'Undocumented error occurred in getting machine details.'
                }
                throw error;
            }
        }
    }

    public async fetchGroupDetails(id: number): Promise<GroupDetails> {
        try {
            if (this.groups.hasOwnProperty(id)) {
                return await this.liqidComm.getGroupDetails(id);
            }
            else {
                let err: LiqidError = {
                    code: 404,
                    origin: 'observer',
                    description: `Group ${id} does not exist.`
                }
                throw err;
            }
        }
        catch (err) {
            if (err.origin) {
                throw err;
            }
            else {
                let error: LiqidError = {
                    code: 500,
                    origin: 'observer',
                    description: 'Undocumented error occurred in getting group details.'
                }
                throw error;
            }
        }
    }

    /**
     * Get groups
     * @return {{ [key: string]: Group }}   Group mapping with id as key
     */
    public getGroups(): { [key: string]: Group } {
        return this.groups;
    }

    /**
     * Get machines
     * @return {{ [key: string]: Machine }} Machine mapping with id as key
     */
    public getMachines(): { [key: string]: Machine } {
        return this.machines;
    }

    /**
     * Get devices
     * @return {{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    public getPreDevices(): { [key: string]: PreDevice } {
        return this.devices;
    }

    /**
     * Get device statuses
     * @return {{ [key: string]: DeviceStatus }}    DeviceStatus mapping with name as key
     */
    public getDeviceStatuses(): { [key: string]: DeviceStatus } {
        return this.deviceStatuses;
    }

    /**
     * Get group by group ID
     * @param {string | number} [id]    Optional ID used to select group
     * @return {Group}                  Group that matches the given id or null; if id is not specified, then the first available Group or null if no Groups available
     */
    public getGroupById(id?: number | string): Group {
        if (id != null) {
            return (this.groups.hasOwnProperty(id)) ? this.groups[id] : null;
        }
        else {
            let keys = Object.keys(this.groups);
            return (keys.length > 0) ? this.groups[keys[0]] : null;
        }
    }

    /**
     * Get ID of group by name
     * @param {string} name    Name used to select group
     * @return {Group}         Group ID that matches the given name or -1 if name does not exist
     */
    public getGroupIdByName(name: string): number {
        let arr = Object.keys(this.groups);
        for (let i = 0; i < arr.length; i++) {
            if (this.groups[arr[i]].group_name === name)
                return this.groups[arr[i]].grp_id;
        }
        return -1;
    }

    /**
     * Get machine by machine ID
     * @param {string | number} [id]    Optional ID used to select machine
     * @return {Machine}                Machine that matches the given id or null; if id is not specified, then the first available Machine or null if no Machines available
     */
    public getMachineById(id?: number | string): Machine {
        if (id != null) {
            return (this.machines.hasOwnProperty(id)) ? this.machines[id] : null;
        }
        else {
            let keys = Object.keys(this.machines);
            return (keys.length > 0) ? this.machines[keys[0]] : null;
        }
    }

    /**
     * Get device by device name
     * @param {string | number} [name]  Optional name used to select predevice
     * @return {Predevice}              Predevice that matches the given name or null; if name is not specified, then the first available Predevice or null if no Predevices available
     */
    public getPreDeviceByName(name?: string): PreDevice {
        if (name != null) {
            return (this.devices.hasOwnProperty(name)) ? this.devices[name] : null;
        }
        else {
            let keys = Object.keys(this.devices);
            return (keys.length > 0) ? this.devices[keys[0]] : null;
        }
    }

    /**
     * Get device status by device name
     * @param {string | number} [name]  Optional name used to select device status
     * @return {DeviceStatus}           DeviceStatus that matches the given name or null; if name is not specified, then the first available DeviceStatus or null if no DeviceStatuses available
     */
    public getDeviceStatusByName(name?: string): DeviceStatus {
        if (name != null) {
            return (this.deviceStatuses.hasOwnProperty(name)) ? this.deviceStatuses[name] : null;
        }
        else {
            let keys = Object.keys(this.deviceStatuses);
            return (keys.length > 0) ? this.deviceStatuses[keys[0]] : null;
        }
    }

    public convertHistToDevStatuses(histList: ConnectionHistory[]): DeviceStatus[] {
        let devStats = [];
        for (let i = 0; i < histList.length; i++) {
            if (this.deviceStatuses.hasOwnProperty(histList[i].name))
                devStats.push(this.deviceStatuses[histList[i].name]);
        }
        return devStats;
    }

    /**
     * Get all device statuses organized by type
     * @return {OrganizedDeviceStatuses}    DeviceStatuses; grouped by cpu, gpu, ssd, nic, or fpga
     */
    public getDeviceStatusesOrganized(): OrganizedDeviceStatuses {
        let statsOrganized: OrganizedDeviceStatuses = {
            cpu: {},
            gpu: {},
            ssd: {},
            optane: {},
            nic: {},
            fpga: {}
        };
        Object.keys(this.deviceStatuses).forEach((devName) => {
            switch (this.deviceStatuses[devName].type) {
                case 'ComputeDeviceStatus':
                    statsOrganized.cpu[devName] = this.deviceStatuses[devName];
                    break;
                case 'GpuDeviceStatus':
                    statsOrganized.gpu[devName] = this.deviceStatuses[devName];
                    break;
                case 'SsdDeviceStatus':
                    if (devName.includes('scm')) {
                        statsOrganized.optane[devName] = this.deviceStatuses[devName];
                    }
                    else {
                        statsOrganized.ssd[devName] = this.deviceStatuses[devName];
                    }
                    break;
                case 'LinkDeviceStatus':
                    statsOrganized.nic[devName] = this.deviceStatuses[devName];
                    break;
                case 'FpgaDeviceStatus':
                    statsOrganized.fpga[devName] = this.deviceStatuses[devName];
                    break;
            }
        });
        return statsOrganized;
    }

    /**
     * Check if machine name is already in use
     * @param {string} name Name that will be checked
     * @return {boolean}    True if name exists already
     */
    public checkMachNameExists(name: string): boolean {
        let arr = Object.keys(this.machines);
        for (let i = 0; i < arr.length; i++) {
            if (this.machines[arr[i]].mach_name === name)
                return true;
        }
        return false;
    }

    private checkIsProperSpecification(arr: string[]): boolean {
        let map = {};
        for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i] != 'string')
                return false;
            else if (map.hasOwnProperty(arr[i]))
                return false;
            map[arr[i]] = true;
        }
        return true;
    }

    /**
     * Primarily for the controller. Used to select the devices that will be used to compose a machine
     * @param {GatheringDevStatsOptions} options    Options for what devices to be gathered
     * @return {Promise<DeviceStatus[]>}            An array of the gathered devices
     */
    public async gatherRequiredDeviceStatuses(options: GatheringDevStatsOptions): Promise<DeviceStatus[]> {
        try {
            let devices: DeviceStatus[] = [];
            let deviceStats: OrganizedDeviceStatuses = this.getDeviceStatusesOrganized();
            let count = 0;

            if (options.cpu == null) options.cpu = 0;
            if (typeof options.cpu === 'number') {
                options.cpu = (options.cpu < 0) ? 0 : Math.floor(options.cpu);
                let deviceNames = Object.keys(deviceStats.cpu);
                if (options.cpu > 1) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'CPU count can not be more than 1.'
                    }
                    throw err;
                }
                if (deviceNames.length < options.cpu) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of CPUs is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.cpu;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.cpu[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of CPUs is more than the number of CPUs that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.cpu; i++)
                        devices.push(deviceStats.cpu[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.cpu)) {
                if (options.cpu.length > 1) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'CPU specification should have no more than 1.'
                    }
                    throw err;
                }
                if (!this.checkIsProperSpecification(options.cpu)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'CPU specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.cpu.length; i++) {
                    if (deviceStats.cpu.hasOwnProperty(options.cpu[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.cpu[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.cpu[options.cpu[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `CPU ${options.cpu[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.cpu[options.cpu[i]]);
                    }
                    else if (this.ipmiToCpuNameMap.hasOwnProperty(options.cpu[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(this.ipmiToCpuNameMap[options.cpu[i]]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.cpu[this.ipmiToCpuNameMap[options.cpu[i]]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `CPU with IPMI ${this.ipmiToCpuNameMap[options.cpu[i]]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.cpu[this.ipmiToCpuNameMap[options.cpu[i]]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `CPU ${options.cpu[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'CPU specification is neither a number nor a string array.'
                }
                throw err;
            }
            if (options.gpu == null) options.gpu = 0;
            if (typeof options.gpu === 'number') {
                options.gpu = (options.gpu < 0) ? 0 : Math.floor(options.gpu);
                let deviceNames = Object.keys(deviceStats.gpu);
                if (deviceNames.length < options.gpu) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of GPUs is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.gpu;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.gpu[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of GPUs is more than the number of GPUs that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.gpu; i++)
                        devices.push(deviceStats.gpu[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.gpu)) {
                if (!this.checkIsProperSpecification(options.gpu)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'GPU specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.gpu.length; i++) {
                    if (deviceStats.gpu.hasOwnProperty(options.gpu[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.gpu[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.gpu[options.gpu[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `GPU ${options.gpu[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.gpu[options.gpu[i]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `GPU ${options.gpu[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'GPU specification is neither a number nor a string array.'
                }
                throw err;
            }
            if (options.ssd == null) options.ssd = 0;
            if (typeof options.ssd === 'number') {
                options.ssd = (options.ssd < 0) ? 0 : Math.floor(options.ssd);
                let deviceNames = Object.keys(deviceStats.ssd);
                if (deviceNames.length < options.ssd) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of SSDs is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.ssd;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.ssd[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of SSDs is more than the number of SSDs that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.ssd; i++)
                        devices.push(deviceStats.ssd[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.ssd)) {
                if (!this.checkIsProperSpecification(options.ssd)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'SSD specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.ssd.length; i++) {
                    if (deviceStats.ssd.hasOwnProperty(options.ssd[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.ssd[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.ssd[options.ssd[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `SSD ${options.ssd[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.ssd[options.ssd[i]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `SSD ${options.ssd[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'SSD specification is neither a number nor a string array.'
                }
                throw err;
            }
            if (options.optane == null) options.optane = 0;
            if (typeof options.optane === 'number') {
                options.optane = (options.optane < 0) ? 0 : Math.floor(options.optane);
                let deviceNames = Object.keys(deviceStats.optane);
                if (deviceNames.length < options.optane) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of Optane devices is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.optane;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.ssd[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of Optane devices is more than the number of Optane devices that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.optane; i++)
                        devices.push(deviceStats.optane[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.optane)) {
                if (!this.checkIsProperSpecification(options.optane)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'Optane device specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.optane.length; i++) {
                    if (deviceStats.optane.hasOwnProperty(options.optane[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.optane[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.optane[options.optane[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `Optane device ${options.optane[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.optane[options.optane[i]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `Optane device ${options.optane[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'Optane device specification is neither a number nor a string array.'
                }
                throw err;
            }
            if (options.nic == null) options.nic = 0;
            if (typeof options.nic === 'number') {
                options.nic = (options.nic < 0) ? 0 : Math.floor(options.nic);
                let deviceNames = Object.keys(deviceStats.nic);
                if (deviceNames.length < options.nic) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of NICs is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.nic;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.nic[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of NICs is more than the number of NICs that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.nic; i++)
                        devices.push(deviceStats.nic[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.nic)) {
                if (!this.checkIsProperSpecification(options.nic)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'NIC specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.nic.length; i++) {
                    if (deviceStats.nic.hasOwnProperty(options.nic[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.nic[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.nic[options.nic[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `NIC ${options.nic[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.nic[options.nic[i]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `NIC ${options.nic[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'NIC specification is neither a number nor a string array.'
                }
                throw err;
            }
            if (options.fpga == null) options.fpga = 0;
            if (typeof options.fpga === 'number') {
                options.fpga = (options.fpga < 0) ? 0 : Math.floor(options.fpga);
                let deviceNames = Object.keys(deviceStats.fpga);
                if (deviceNames.length < options.fpga) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'The specified number of FPGAs is more than what is currently available.'
                    }
                    throw err;
                }
                if (options.gatherUnused) {
                    count = options.fpga;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getPreDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.fpga[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) {
                        let err: LiqidError = {
                            code: 422,
                            origin: 'observer',
                            description: 'The specified number of FPGAs is more than the number of FPGAs that are unused.'
                        }
                        throw err;
                    }
                }
                else {
                    for (let i = 0; i < options.fpga; i++)
                        devices.push(deviceStats.fpga[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.fpga)) {
                if (!this.checkIsProperSpecification(options.fpga)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'observer',
                        description: 'FPGA specification either contains duplicates or non string elements.'
                    }
                    throw err;
                }
                for (let i = 0; i < options.fpga.length; i++) {
                    if (deviceStats.fpga.hasOwnProperty(options.fpga[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getPreDeviceByName(options.fpga[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.fpga[options.fpga[i]]);
                            else {
                                let err: LiqidError = {
                                    code: 422,
                                    origin: 'observer',
                                    description: `FPGA ${options.fpga[i]} is currently in use by machine ${predevice.mname}.`
                                }
                                throw err;
                            }
                        }
                        else
                            devices.push(deviceStats.fpga[options.fpga[i]]);
                    }
                    else {
                        let err: LiqidError = {
                            code: 404,
                            origin: 'observer',
                            description: `FPGA ${options.fpga[i]} does not exist.`
                        }
                        throw err;
                    }
                }
            }
            else {
                let err: LiqidError = {
                    code: 400,
                    origin: 'observer',
                    description: 'FPGA specification is neither a number nor a string array.'
                }
                throw err;
            }
            return devices;
        }
        catch (err) {
            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'observer',
                    description: 'Undocumented error occurred in gathering resources.'
                }
                throw error;
            }
        }
    }
}