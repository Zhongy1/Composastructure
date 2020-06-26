import { Group, PreDevice, Machine, DeviceStatus, ConnectionHistory, GroupDetails, MachineDetails, DeviceDetails } from './models';
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
    optane: {
        [key: string]: DeviceStatus;
    };
    nic: {
        [key: string]: DeviceStatus;
    };
    fpga: {
        [key: string]: DeviceStatus;
    };
}
export interface GatheringDevStatsOptions {
    cpu: number | string[];
    gpu: number | string[];
    ssd: number | string[];
    optane: number | string[];
    nic: number | string[];
    fpga: number | string[];
    gatherUnused: boolean;
}
/**
 * Observer for liqid system state
```typescript
const observer = new LiqidObserver(ip);
```
 */
export declare class LiqidObserver {
    private liqidIp;
    systemName: string;
    private liqidComm;
    private fabricId;
    private wsUrl;
    private busyState;
    private stompClient;
    private groups;
    private machines;
    private devices;
    private deviceStatuses;
    private ipmiToCpuNameMap;
    private cpuNameToIpmiMap;
    private updateCallback;
    fabricTracked: boolean;
    constructor(liqidIp: string, systemName?: string);
    /**
     * Deep diff between two objects, using lodash.
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Object}        Return a new object that represent the difference
     */
    private difference;
    /**
     * Start tracking Liqid. Check for updates at one second intervals. Stops when encounters an error.
     * The checking for updates at one second intervals is just a work around until a better solution is known.
     * @return  {Promise<boolean>}   Return true if start is successful; false if observer is already in an on state
     */
    start(): Promise<boolean>;
    setBusyState(state: boolean): void;
    attachUpdateCallback(callback: any): void;
    /**
     * Determine the current fabric ID on which this observer is mounted
     * @return  {Promise<number>}    The ID
     */
    private identifyFabricId;
    getFabricId(): number;
    private loadIpmiCpuMapping;
    getIpmiAddressByName(name: string): string;
    checkGroupIsEmpty(id: number): boolean;
    /**
     * Stop tracking Liqid. Call start to resume.
     */
    stop(): void;
    /**
     * Refresh observer to get the lastest Liqid system state.
     */
    refresh(): Promise<void>;
    /**
     * Pulls up-to-date information from Liqid and compares/modifies existing information.
     * @return {Promise<boolean>}    The success of the operation
     */
    private trackSystemChanges;
    private makeNecessaryUpdates;
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
    private fetchPreDevices;
    /**
     * Fetch device statuses
     * @return {Promise<{ [key: string]: DeviceStatus }}   DeviceStatus mapping with name as key
     */
    private fetchDevStatuses;
    private fetchNodeStatus;
    fetchDeviceDetails(id: string): Promise<DeviceDetails>;
    fetchMachineDetails(id: number): Promise<MachineDetails>;
    fetchGroupDetails(id: number): Promise<GroupDetails>;
    /**
     * Get groups
     * @return {{ [key: string]: Group }}   Group mapping with id as key
     */
    getGroups(): {
        [key: string]: Group;
    };
    /**
     * Get machines
     * @return {{ [key: string]: Machine }} Machine mapping with id as key
     */
    getMachines(): {
        [key: string]: Machine;
    };
    /**
     * Get devices
     * @return {{ [key: string]: Predevice }}   Predevice mapping with name as key
     */
    getPreDevices(): {
        [key: string]: PreDevice;
    };
    /**
     * Get device statuses
     * @return {{ [key: string]: DeviceStatus }}    DeviceStatus mapping with name as key
     */
    getDeviceStatuses(): {
        [key: string]: DeviceStatus;
    };
    /**
     * Get group by group ID
     * @param {string | number} [id]    Optional ID used to select group
     * @return {Group}                  Group that matches the given id or null; if id is not specified, then the first available Group or null if no Groups available
     */
    getGroupById(id?: number | string): Group;
    /**
     * Get ID of group by name
     * @param {string} name    Name used to select group
     * @return {Group}         Group ID that matches the given name or -1 if name does not exist
     */
    getGroupIdByName(name: string): number;
    /**
     * Get machine by machine ID
     * @param {string | number} [id]    Optional ID used to select machine
     * @return {Machine}                Machine that matches the given id or null; if id is not specified, then the first available Machine or null if no Machines available
     */
    getMachineById(id?: number | string): Machine;
    /**
     * Get device by device name
     * @param {string | number} [name]  Optional name used to select predevice
     * @return {Predevice}              Predevice that matches the given name or null; if name is not specified, then the first available Predevice or null if no Predevices available
     */
    getPreDeviceByName(name?: string): PreDevice;
    /**
     * Get device status by device name
     * @param {string | number} [name]  Optional name used to select device status
     * @return {DeviceStatus}           DeviceStatus that matches the given name or null; if name is not specified, then the first available DeviceStatus or null if no DeviceStatuses available
     */
    getDeviceStatusByName(name?: string): DeviceStatus;
    convertHistToDevStatuses(histList: ConnectionHistory[]): DeviceStatus[];
    /**
     * Get all device statuses organized by type
     * @return {OrganizedDeviceStatuses}    DeviceStatuses; grouped by cpu, gpu, ssd, nic, or fpga
     */
    getDeviceStatusesOrganized(): OrganizedDeviceStatuses;
    /**
     * Check if machine name is already in use
     * @param {string} name Name that will be checked
     * @return {boolean}    True if name exists already
     */
    checkMachNameExists(name: string): boolean;
    private checkIsProperSpecification;
    /**
     * Primarily for the controller. Used to select the devices that will be used to compose a machine
     * @param {GatheringDevStatsOptions} options    Options for what devices to be gathered
     * @return {Promise<DeviceStatus[]>}            An array of the gathered devices
     */
    gatherRequiredDeviceStatuses(options: GatheringDevStatsOptions): Promise<DeviceStatus[]>;
}
