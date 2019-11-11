import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { Group, PreDevice, Machine, DeviceStatus } from './models';


export interface OrganizedDeviceStatuses {
    cpu: { [key: string]: DeviceStatus },
    gpu: { [key: string]: DeviceStatus },
    ssd: { [key: string]: DeviceStatus },
    nic: { [key: string]: DeviceStatus }
}

export interface GatheringDevStatsOptions {
    cpu: number | string[],
    gpu: number | string[],
    ssd: number | string[],
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
    private mainLoop: any;

    private groups: { [key: string]: Group };
    private machines: { [key: string]: Machine };
    private devices: { [key: string]: PreDevice };
    private deviceStatuses: { [key: string]: DeviceStatus }

    public fabricTracked: boolean;

    constructor(private liqidIp: string) {
        this.liqidComm = new LiqidCommunicator(liqidIp);

        this.groups = {};
        this.machines = {};
        this.devices = {};
        this.deviceStatuses = {};

        this.fabricTracked = false;
    }

    /**
     * Deep diff between two objects, using lodash.
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Object}        Return a new object who represent the diff
     */
    private difference = (object: any, base: any): any => {
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
     * @return  {Promise<boolean>}   Return true if start is successful, false if observer is already in an on state
     */
    public start = async (): Promise<boolean> => {
        try {
            if (!this.fabricTracked) {
                this.fabricTracked = await this.trackSystemChanges();
                if (this.fabricTracked)
                    this.mainLoop = setInterval(() => {
                        this.trackSystemChanges()
                            .then(success => {
                                if (!success)
                                    this.stop();
                            }, err => {
                                if (err)
                                    this.stop();
                            });
                    }, 1000);
            }
            return this.fabricTracked;
        }
        catch (err) {
            this.fabricTracked = false;
            throw new Error('LiqidObserver start unsuccessful: possibly unable to communicate with Liqid.');
        }
    }

    /**
     * Stop tracking Liqid. Call start to resume.
     */
    public stop = (): void => {
        if (!this.fabricTracked) return;
        this.fabricTracked = false;
        clearInterval(this.mainLoop);
    }

    /**
     * Refresh observer to get the lastest Liqid system state.
     */
    public refresh = async (): Promise<void> => {
        try {
            let success = await this.trackSystemChanges();
            if (!success)
                throw new Error('');
        }
        catch (err) {
            throw new Error('Observer Refresh Error: refresh unsuccessful.');
        }
    }

    /**
     * Pulls up-to-date statistics from Liqid and compares/modifies existing statistics.
     * @return {Promise<boolean>}    The success of the operation
     */
    private trackSystemChanges = async (): Promise<boolean> => {
        var makeNecessaryUpdates = (update: { [key: string]: any }, target: { [key: string]: any }) => {
            //check for necessary updates
            let detectedChanges = this.difference(update, target);
            //update
            Object.keys(detectedChanges).forEach((key) => {
                target[key] = update[key];
            });
            //check for necessary deletions
            detectedChanges = this.difference(target, update);
            //do deletions
            Object.keys(detectedChanges).forEach((key) => {
                delete target[key];
            });
        }
        try {
            let groups = await this.fetchGroups();
            let machines = await this.fetchMachines();
            let devices = await this.fetchDevices();
            let devStatuses = await this.fetchDevStatuses();
            makeNecessaryUpdates(groups, this.groups);
            makeNecessaryUpdates(machines, this.machines);
            makeNecessaryUpdates(devices, this.devices);
            makeNecessaryUpdates(devStatuses, this.deviceStatuses);
            return true;
        }
        catch (err) {
            throw new Error('Issue with trackSystemChanges; halting tracking');
        }
    }

    /**
     * Fetch group information
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    private fetchGroups = async (): Promise<{ [key: string]: Group }> => {
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
    private fetchMachines = async (): Promise<{ [key: string]: Machine }> => {
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
    private fetchDevices = async (): Promise<{ [key: string]: PreDevice }> => {
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
    private fetchDevStatuses = async (): Promise<{ [key: string]: DeviceStatus }> => {
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

    /**
     * Get groups
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    public getGroups = (): { [key: string]: Group } => {
        return this.groups;
    }

    /**
     * Get machines
     * @return {Promise<{ [key: string]: Machine }} Machine mapping with id as key
     */
    public getMachines = (): { [key: string]: Machine } => {
        return this.machines;
    }

    /**
     * Get devices
     * @return {Promise<{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    public getDevices = (): { [key: string]: PreDevice } => {
        return this.devices;
    }

    /**
     * Get device statuses
     * @return {Promise<{ [key: string]: DeviceStatus }}    DeviceStatus mapping with name as key
     */
    public getDeviceStatuses = (): { [key: string]: DeviceStatus } => {
        return this.deviceStatuses;
    }

    /**
     * Get group by group id
     * @param {string | number} [id]
     * @return {Group}  Group that matches the given id or null; if id is not specified, then the first available Group or null if no Groups available
     */
    public getGroupById = (id?: number | string): Group => {
        if (id) {
            return (this.groups.hasOwnProperty(id)) ? this.groups[id] : null;
        }
        else {
            let keys = Object.keys(this.groups);
            return (keys.length > 0) ? this.groups[keys[0]] : null;
        }
    }

    /**
     * Get machine by machine id
     * @param {string | number} [id]
     * @return {Machine}    Machine that matches the given id or null; if id is not specified, then the first available Machine or null if no Machines available
     */
    public getMachineById = (id?: number | string): Machine => {
        if (id) {
            return (this.machines.hasOwnProperty(id)) ? this.machines[id] : null;
        }
        else {
            let keys = Object.keys(this.machines);
            return (keys.length > 0) ? this.machines[keys[0]] : null;
        }
    }

    /**
     * Get device by device name
     * @param {string | number} [name]
     * @return {Predevice}  Predevice that matches the given name or null; if name is not specified, then the first available Predevice or null if no Predevices available
     */
    public getDeviceByName = (name?: number | string): PreDevice => {
        if (name) {
            return (this.devices.hasOwnProperty(name)) ? this.devices[name] : null;
        }
        else {
            let keys = Object.keys(this.devices);
            return (keys.length > 0) ? this.devices[keys[0]] : null;
        }
    }

    /**
     * Get device status by device name
     * @param {string | number} [name]
     * @return {DeviceStatus}   DeviceStatus that matches the given name or null; if name is not specified, then the first available DeviceStatus or null if no DeviceStatuses available
     */
    public getDeviceStatusByName = (name?: number | string): DeviceStatus => {
        if (name) {
            return (this.deviceStatuses.hasOwnProperty(name)) ? this.deviceStatuses[name] : null;
        }
        else {
            let keys = Object.keys(this.deviceStatuses);
            return (keys.length > 0) ? this.deviceStatuses[keys[0]] : null;
        }
    }

    /**
     * Get device statuses organized by type
     * @return {OrganizedDeviceStatuses}    DeviceStatuses; grouped by cpu, gpu, ssd, or nic
     */
    public getDeviceStatusesOrganized = (): OrganizedDeviceStatuses => {
        let statsOrganized: OrganizedDeviceStatuses = {
            cpu: {},
            gpu: {},
            ssd: {},
            nic: {}
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
                    statsOrganized.ssd[devName] = this.deviceStatuses[devName];
                    break;
                case 'LinkDeviceStatus':
                    statsOrganized.nic[devName] = this.deviceStatuses[devName];
                    break;
            }
        });
        return statsOrganized;
    }

    /**
     * Check if name is already in use
     * @param {string} name
     * @return {boolean}    True if name exists already
     */
    public checkMachNameExists = (name: string): boolean => {
        Object.keys(this.machines).forEach((mach_id) => {
            if (this.machines.hasOwnProperty(mach_id) && this.machines[mach_id].mach_name == name)
                return true;
        });
        return false;
    }

    public gatherRequiredDeviceStatuses = async (options: GatheringDevStatsOptions): Promise<DeviceStatus[]> => {
        try {
            let devices: DeviceStatus[] = [];
            let deviceStats: OrganizedDeviceStatuses = this.getDeviceStatusesOrganized();
            let count = 0;

            if (typeof options.cpu === 'number') {
                let deviceNames = Object.keys(deviceStats.cpu);
                if (deviceNames.length < options.cpu)
                    throw new Error('The specified number of CPUs is more than what is currently available.');
                if (options.gatherUnused) {
                    count = options.cpu;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.cpu[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) throw new Error('The specified number of CPUs is more than the number of CPUs that are unused.');
                }
                else {
                    for (let i = 0; i < options.cpu; i++)
                        devices.push(deviceStats.cpu[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.cpu)) {
                for (let i = 0; i < options.cpu.length; i++) {
                    if (deviceStats.cpu.hasOwnProperty(options.cpu[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getDeviceByName(options.cpu[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.cpu[options.cpu[i]]);
                            else throw new Error(`CPU ${options.cpu[i]} is currently in use by machine ${predevice.mname}.`);
                        }
                        else
                            devices.push(deviceStats.cpu[options.cpu[i]]);
                    }
                    else
                        throw new Error(`CPU ${options.cpu[i]} does not exist.`);
                }
            }
            else throw new Error('CPU specification is neither a number nor a string array.');
            if (typeof options.gpu === 'number') {
                let deviceNames = Object.keys(deviceStats.gpu);
                if (deviceNames.length < options.gpu)
                    throw new Error('The specified number of GPUs is more than what is currently available.');
                if (options.gatherUnused) {
                    count = options.gpu;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.gpu[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) throw new Error('The specified number of GPUs is more than the number of GPUs that are unused.');
                }
                else {
                    for (let i = 0; i < options.gpu; i++)
                        devices.push(deviceStats.gpu[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.gpu)) {
                for (let i = 0; i < options.gpu.length; i++) {
                    if (deviceStats.gpu.hasOwnProperty(options.gpu[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getDeviceByName(options.gpu[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.gpu[options.gpu[i]]);
                            else throw new Error(`GPU ${options.gpu[i]} is currently in use by machine ${predevice.mname}.`);
                        }
                        else
                            devices.push(deviceStats.gpu[options.gpu[i]]);
                    }
                    else
                        throw new Error(`GPU ${options.gpu[i]} does not exist.`);
                }
            }
            else throw new Error('GPU specification is neither a number nor a string array.');
            if (typeof options.ssd === 'number') {
                let deviceNames = Object.keys(deviceStats.ssd);
                if (deviceNames.length < options.ssd)
                    throw new Error('The specified number of SSDs is more than what is currently available.');
                if (options.gatherUnused) {
                    count = options.ssd;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.ssd[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) throw new Error('The specified number of SSDs is more than the number of SSDs that are unused.');
                }
                else {
                    for (let i = 0; i < options.ssd; i++)
                        devices.push(deviceStats.ssd[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.ssd)) {
                for (let i = 0; i < options.ssd.length; i++) {
                    if (deviceStats.ssd.hasOwnProperty(options.ssd[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getDeviceByName(options.ssd[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.ssd[options.ssd[i]]);
                            else throw new Error(`SSD ${options.ssd[i]} is currently in use by machine ${predevice.mname}.`);
                        }
                        else
                            devices.push(deviceStats.ssd[options.ssd[i]]);
                    }
                    else
                        throw new Error(`SSD ${options.ssd[i]} does not exist.`);
                }
            }
            else throw new Error('SSD specification is neither a number nor a string array.');
            if (typeof options.nic === 'number') {
                let deviceNames = Object.keys(deviceStats.nic);
                if (deviceNames.length < options.nic)
                    throw new Error('The specified number of of NICs is more than what is currently available.');
                if (options.gatherUnused) {
                    count = options.nic;
                    for (let i = 0; i < deviceNames.length; i++) {
                        if (count <= 0) break;
                        let predevice: PreDevice = this.getDeviceByName(deviceNames[i]);
                        if (predevice == null || predevice.mach_id == 'n/a') {
                            devices.push(deviceStats.nic[deviceNames[i]]);
                            count--;
                        }
                    }
                    if (count > 0) throw new Error('The specified number of NICs is more than the number of NICs that are unused.');
                }
                else {
                    for (let i = 0; i < options.nic; i++)
                        devices.push(deviceStats.nic[deviceNames[i]]);
                }
            }
            else if (Array.isArray(options.nic)) {
                for (let i = 0; i < options.nic.length; i++) {
                    if (deviceStats.nic.hasOwnProperty(options.nic[i])) {
                        if (options.gatherUnused) {
                            let predevice: PreDevice = this.getDeviceByName(options.nic[i]);
                            if (predevice == null || predevice.mach_id == 'n/a')
                                devices.push(deviceStats.nic[options.nic[i]]);
                            else throw new Error(`NIC ${options.nic[i]} is currently in use by machine ${predevice.mname}.`);
                        }
                        else
                            devices.push(deviceStats.nic[options.nic[i]]);
                    }
                    else
                        throw new Error(`NIC ${options.nic[i]} does not exist.`);
                }
            }
            else throw new Error('NIC specification is neither a number nor a string array.');
            return devices;
        }
        catch (err) {
            throw new Error('Device Specification Error: ' + err);
        }
    }
}