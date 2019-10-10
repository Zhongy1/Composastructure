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
const observer = new LiqidObserver(ip);
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
     * Deep diff between two objects, using lodash.
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Object}        Return a new object who represent the diff
     */
    private difference;
    /**
     * Start tracking Liqid. Check for updates at one second intervals. Stops when encounters an error.
     */
    start: () => void;
    /**
     * Stop tracking Liqid. Call start to resume.
     */
    stop: () => void;
    /**
     * Pulls up-to-date statistics from Liqid and compares/modifies existing statistics.
     * @return {Promise<boolean>}    The success of the operation
     */
    private trackSystemChanges;
    /**
     * Fetch group information
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    private fetchGroups;
    /**
     * Fetch machine information
     * @return {Promise<{ [key: string]: Machine }}   Machine mapping with id as key
     */
    private fetchMachines;
    /**
     * Fetch device information
     * @return {Promise<{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    private fetchDevices;
    /**
     * Fetch device statuses
     * @return {Promise<{ [key: string]: DeviceStatus }}   DeviceStatus mapping with name as key
     */
    private fetchDevStatuses;
    /**
     * Get groups
     * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
     */
    getGroups: () => {
        [key: string]: Group;
    };
    /**
     * Get machines
     * @return {Promise<{ [key: string]: Machine }} Machine mapping with id as key
     */
    getMachines: () => {
        [key: string]: Machine;
    };
    /**
     * Get devices
     * @return {Promise<{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    getDevices: () => {
        [key: string]: PreDevice;
    };
    /**
     * Get device statuses
     * @return {Promise<{ [key: string]: DeviceStatus }}    DeviceStatus mapping with name as key
     */
    getDeviceSatuses: () => {
        [key: string]: DeviceStatus;
    };
    /**
     * Get group by group id
     * @param {string | number} [id]
     * @return {Group}  Group that matches the given id or null; if id is not specified, then the first available Group or null if no Groups available
     */
    getGroupById: (id?: string | number) => Group;
    /**
     * Get machine by machine id
     * @param {string | number} [id]
     * @return {Machine}    Machine that matches the given id or null; if id is not specified, then the first available Machine or null if no Machines available
     */
    getMachineById: (id?: string | number) => Machine;
    /**
     * Get device by device name
     * @param {string | number} [name]
     * @return {Predevice}  Predevice that matches the given name or null; if name is not specified, then the first available Predevice or null if no Predevices available
     */
    getDeviceByName: (name?: string | number) => PreDevice;
    /**
     * Get device status by device name
     * @param {string | number} [name]
     * @return {DeviceStatus}   DeviceStatus that matches the given name or null; if name is not specified, then the first available DeviceStatus or null if no DeviceStatuses available
     */
    getDeviceStatusesByName: (name?: string | number) => DeviceStatus;
    /**
     * Get device statuses organized by type
     * @return {OrganizedDeviceStatuses}    DeviceStatuses; grouped by cpu, gpu, ssd, or nic
     */
    getDeviceStatusesOrganized: () => OrganizedDeviceStatuses;
    /**
     * Check if name is already in use
     * @param {string} name
     * @return {boolean}    True if name exists already
     */
    checkMachNameExists: (name: string) => boolean;
}
