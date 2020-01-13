import { DeviceStatus, Group, Machine } from './models';
export interface ComposeOptions {
    cpu: number | string[];
    gpu: number | string[];
    ssd: number | string[];
    nic: number | string[];
    fpga: number | string[];
    name: string;
    groupId?: number | string;
}
/**
 * Controller for specific liqid tasks
```typescript
const controller = new LiqidController(ip);
```
 */
export declare class LiqidController {
    private liqidIp;
    private liqidComm;
    private liqidObs;
    private fabricId;
    private ready;
    private busy;
    constructor(liqidIp: string);
    /**
     * Start the controller. This is to confirm that the controller can connect to Liqid system.
     * @return  {Promise<boolean>}   Return true if start is successful, false if controller has already been started
     */
    start: () => Promise<boolean>;
    /**
     * Determine the current fabric ID on which this controller is mounted
     * @return  {Promise<number>}    The ID
     */
    private identifyFabricId;
    getFabricId: () => number;
    /**
     * Create a group/pool
     * @param   {string}    name    The name the new group will use
     * @return  {Promise<Group>}    The created group
     */
    createGroup: (name: string) => Promise<Group>;
    /**
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    compose: (options: ComposeOptions) => Promise<Machine>;
    /**
     * Move specified devices to group/pool
     * If device is already in pool, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          grpId   gid/cid: The target group's ID
     */
    moveDevicesToGroup: (devices: DeviceStatus[], grpId: number) => Promise<void>;
    /**
     * Move specified devices to machine; devices must be in the machine's pool, or errors out
     * If device is already in machine, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          machId  mach_id: The target machine's ID
     */
    moveDevicesToMachine: (devices: DeviceStatus[], machId: number) => Promise<void>;
    /**
     * Decompose a machine
     * @param {Machine} machine The machine to be decomposed
     */
    decompose: (machine: Machine) => Promise<void>;
}
