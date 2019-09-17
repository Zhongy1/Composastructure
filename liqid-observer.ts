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
const instance = new LiqidObserver(ip);
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
     * Deep diff between two object, using lodash
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

    public start = (): void => {
        this.fabricTracked = true;
        this.mainLoop = setInterval(() => {
            let success = this.trackSystemChanges();
            if (!success)
                this.stop();
        }, 1000);
    }
    public stop = (): void => {
        this.fabricTracked = false;
        clearInterval(this.mainLoop);
    }

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

    public getGroups = (): { [key: string]: Group } => {
        return this.groups;
    }
    public getMachines = (): { [key: string]: Machine } => {
        return this.machines;
    }
    public getDevices = (): { [key: string]: PreDevice } => {
        return this.devices;
    }
    public getDeviceSatuses = (): { [key: string]: DeviceStatus } => {
        return this.deviceStatuses;
    }
    public getGroupById = (id?: number | string): Group => {
        if (id) {
            return (this.groups.hasOwnProperty(id)) ? this.groups[id] : null;
        }
        else {
            let keys = Object.keys(this.groups);
            return (keys.length > 0) ? this.groups[keys[0]] : null;
        }
    }
    public getMachineById = (id?: number | string): Machine => {
        if (id) {
            return (this.machines.hasOwnProperty(id)) ? this.machines[id] : null;
        }
        else {
            let keys = Object.keys(this.machines);
            return (keys.length > 0) ? this.machines[keys[0]] : null;
        }
    }
    public getDeviceByName = (name?: number | string): PreDevice => {
        if (name) {
            return (this.devices.hasOwnProperty(name)) ? this.devices[name] : null;
        }
        else {
            let keys = Object.keys(this.devices);
            return (keys.length > 0) ? this.devices[keys[0]] : null;
        }
    }
    public getDeviceStatusesByName = (name?: number | string): DeviceStatus => {
        if (name) {
            return (this.deviceStatuses.hasOwnProperty(name)) ? this.deviceStatuses[name] : null;
        }
        else {
            let keys = Object.keys(this.deviceStatuses);
            return (keys.length > 0) ? this.deviceStatuses[keys[0]] : null;
        }
    }
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
    public checkMachNameExists = (name: string): boolean => {
        Object.keys(this.machines).forEach((mach_id) => {
            if (this.machines.hasOwnProperty(mach_id) && this.machines[mach_id].mach_name == name)
                return true;
        });
        return false;
    }
}