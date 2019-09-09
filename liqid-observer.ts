import _ = require('lodash');
import { LiqidCommunicator, Communicator } from './liqid-communicator';
import { Group, PreDevice, Machine } from './models';



export interface Observer {
    Comm: Communicator;
}

/**
 * Observer for liqid system state
```typescript
const instance = new LiqidObserver(ip);
```
 */
export class LiqidObserver {

    private Comm: LiqidCommunicator;
    private mainLoop: number = 0;

    private groups: { [key: string]: Group };
    private machines: { [key: string]: Machine };
    private devices: { [key: string]: PreDevice };

    public fabricTracked: boolean = false;

    constructor(private liqidIp: string) {
        this.Comm = new LiqidCommunicator(liqidIp);

        this.groups = {};
        this.machines = {};
        this.devices = {};

        this.start();
    }

    //Capture fabric state information
    //  Start tracking upon creation
    //Capture CPU/GPU information (not sure how just yet)
    //  Track information only when given what machine to track
    //Allow subscribing to tracked information
    //  Allow 


    // private trackFabric = (): boolean => {
    //     this.fabricState = {}; //retrieved
    //     Object.keys(this.fabricListeners).forEach(cb => {
    //         if (this.fabricListeners[cb] && typeof this.fabricListeners[cb] === 'function')
    //             this.fabricListeners[cb](_.cloneDeep(this.fabricState));
    //         else
    //             delete this.fabricListeners[cb];
    //     })
    //     return false;
    // }

    // public subscribeToFabricState = (callback: (state: any) => void): void => {
    //     let index = Object.keys(this.fabricListeners).length;
    //     this.fabricListeners[index] = callback;
    // }

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
            makeNecessaryUpdates(groups, this.groups);
            makeNecessaryUpdates(machines, this.machines);
            makeNecessaryUpdates(devices, this.devices);
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

    public getGroups = (): { [key: string]: Group } => {
        return this.groups;
    }
    public getMachines = (): { [key: string]: Machine } => {
        return this.machines;
    }
    public getDevices = (): { [key: string]: PreDevice } => {
        return this.devices;
    }
}