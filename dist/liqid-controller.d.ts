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
 * Decider for specific liqid tasks
```typescript
const instance = new LiqidController(ip);
```
 */
export declare class LiqidController {
    private liqidIp;
    private liqidComm;
    private liqidObs;
    private fabricId;
    private ready;
    constructor(liqidIp: string);
    private identifyFabricId;
    compose: (options: ComposeOptions) => Promise<Machine>;
    decompose: (machine: Machine) => Promise<void>;
}
