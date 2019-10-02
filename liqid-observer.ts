import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { Group, PreDevice, Machine, DeviceStatus } from './models';


export interface OrganizedDeviceStatuses {
    cpu: { [key: string]: DeviceStatus },
    gpu: { [key: string]: DeviceStatus },
    ssd: { [key: string]: DeviceStatus },
    nic: { [key: string]: DeviceStatus }
}

/**
 * Observer for liqid system state
```typescript
const observer = new LiqidObserver(ip);
```
 */
export class LiqidObserver {

    private Comm: LiqidCommunicator;
    private mainLoop: any;

    private groups: { [key: string]: Group };
    private machines: { [key: string]: Machine };
    private devices: { [key: string]: PreDevice };
    private deviceStatuses: { [key: string]: DeviceStatus }

    public fabricTracked: boolean = false;

    constructor(private liqidIp: string) {
        this.Comm = new LiqidCommunicator(liqidIp);

        this.groups = {};
        this.machines = {};
        this.devices = {};
        this.deviceStatuses = {};

        this.start();
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
     */
    public start = (): void => {
        if (this.fabricTracked) return;
        this.fabricTracked = true;
        this.mainLoop = setInterval(() => {
            this.trackSystemChanges()
                .then(success => {
                    if (!success)
                        this.stop();
                });
        }, 1000);
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
        var returnVal = true;
        try {
            let groups = await this.fetchGroups();
            let machines = await this.fetchMachines();
            let devices = await this.fetchDevices();
            let devStatuses = await this.fetchDevStatuses();
            makeNecessaryUpdates(groups, this.groups);
            makeNecessaryUpdates(machines, this.machines);
            makeNecessaryUpdates(devices, this.devices);
            makeNecessaryUpdates(devStatuses, this.deviceStatuses);
        }
        catch (err) {
            console.log('Issue with trackSystemChanges; halting tracking');
            returnVal = false;
        }
        return returnVal;
    }

    /**
     * Fetch group information
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    private fetchGroups = async (): Promise<{ [key: string]: Group }> => {
        try {
            let map: { [key: string]: Group } = {};
            let groupArray = await this.Comm.getGroupList();
            groupArray.forEach((group) => {
                map[group.cid] = group;
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
            let machineArray = await this.Comm.getMachineList();
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
            let deviceArray = await this.Comm.getDeviceList();
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
            let devStatusArray = await this.Comm.getDeviceStats();
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
    public getDeviceSatuses = (): { [key: string]: DeviceStatus } => {
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
    public getDeviceStatusesByName = (name?: number | string): DeviceStatus => {
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
}