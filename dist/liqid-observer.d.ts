import { Group, PreDevice, Machine, DeviceStatus } from './models';
export interface OrganizedDeviceStatuses {
    cpu: {
        [key: string]: DeviceStatus;
    };
    gpu: {
        [key: string]: DeviceStatus;
    };
    ssd: {
        [key: string]: DeviceStatus;
    };
    nic: {
        [key: string]: DeviceStatus;
    };
}
/**
 * Observer for liqid system state
```typescript
const instance = new LiqidObserver(ip);
```
 */
export declare class LiqidObserver {
    private liqidIp;
    private Comm;
    private mainLoop;
    private groups;
    private machines;
    private devices;
    private deviceStatuses;
    fabricTracked: boolean;
    constructor(liqidIp: string);
    /**
     * Deep diff between two object, using lodash
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Object}        Return a new object who represent the diff
     */
    private difference;
    start: () => void;
    stop: () => void;
    private trackSystemChanges;
    private fetchGroups;
    private fetchMachines;
    private fetchDevices;
    private fetchDevStatuses;
    getGroups: () => {
        [key: string]: Group;
    };
    getMachines: () => {
        [key: string]: Machine;
    };
    getDevices: () => {
        [key: string]: PreDevice;
    };
    getDeviceSatuses: () => {
        [key: string]: DeviceStatus;
    };
    getGroupById: (id?: string | number) => Group;
    getMachineById: (id?: string | number) => Machine;
    getDeviceByName: (name?: string | number) => PreDevice;
    getDeviceStatusesByName: (name?: string | number) => DeviceStatus;
    getDeviceStatusesOrganized: () => OrganizedDeviceStatuses;
    checkMachNameExists: (name: string) => boolean;
}
