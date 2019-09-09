import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { LiqidObserver } from './liqid-observer';


/**
 * Decider for specific liqid tasks
```typescript
const instance = new LiqidControl(ip);
```
 */
export class LiqidController {

    private liqidComm: LiqidCommunicator;
    private liqidObs: LiqidObserver;

    constructor(private liqidIp: string) {
        this.liqidComm = new LiqidCommunicator(liqidIp);
        this.liqidObs = new LiqidObserver(liqidIp);
    }

    //assemble machine using provided information
    //  Complex: server identifies which devices to be used
    //      Pull devices list from observer
    //  Simple: user specifies what devices to use
    //      Check with observer if selected devices are possible
    //disassemble machine using provided machine information
    //
}