import { Machine } from './models';
export interface ComposeOptions {
    cpu: number | string[];
    gpu: number | string[];
    ssd: number | string[];
    nic: number | string[];
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
    constructor(liqidIp: string);
    /**
     * Determine the current fabric id on which this controller is mounted
     */
    private identifyFabricId;
    /**
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    compose: (options: ComposeOptions) => Promise<Machine>;
    /**
     * Decompose a machine
     * @param {Machine} machine The machine to be decomposed
     */
    decompose: (machine: Machine) => Promise<void>;
}
