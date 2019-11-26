import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { LiqidObserver, OrganizedDeviceStatuses } from './liqid-observer';
import { MachineDeviceRelator, DeviceStatus, Group, Machine, GroupPool, GroupDeviceRelator, PreDevice } from './models';


export interface ComposeOptions {
    cpu: number | string[],
    gpu: number | string[],
    ssd: number | string[],
    nic: number | string[],
    fpga: number | string[],
    name: string,
    groupId?: number | string
}


/**
 * Controller for specific liqid tasks
```typescript
const controller = new LiqidController(ip);
```
 */
export class LiqidController {

    private liqidComm: LiqidCommunicator;
    private liqidObs: LiqidObserver;
    private fabricId: number;
    private ready: boolean;
    private busy: boolean;

    constructor(private liqidIp: string) {
        this.liqidComm = new LiqidCommunicator(liqidIp);
        this.liqidObs = new LiqidObserver(liqidIp);
        this.ready = false;
        this.busy = false;
    }

    /**
     * Start the controller. This is to confirm that the controller can connect to Liqid system.
     * @return  {Promise<boolean>}   Return true if start is successful, false if controller has already been started
     */
    public start = async (): Promise<boolean> => {
        try {
            if (!this.ready) {
                let obsStart = await this.liqidObs.start();
                this.fabricId = await this.identifyFabricId();
                this.ready = true;
                return true;
            }
            return false;
        }
        catch (err) {
            this.ready = false;
            throw new Error('LiqidController start unsuccessful: unable to communicate with Liqid.');
        }
    }

    /**
     * Determine the current fabric ID on which this controller is mounted
     * @return  {Promise<number>}    The ID
     */
    private identifyFabricId = async (): Promise<number> => {
        try {
            return await this.liqidComm.getFabricId();
        }
        catch (err) {
            throw new Error('Unable to retrieve fabric ID.');
        }
    }

    /**
     * Create a group/pool
     * @param   {string}    name    The name the new group will use
     * @return  {Promise<Group>}    The created group
     */
    public createGroup = async (name: string): Promise<Group> => {
        try {
            var group: Group = {
                fabr_id: this.fabricId,
                group_name: name,
                grp_id: await this.liqidComm.getNextGroupId(),
                pod_id: -1
            }
            return await this.liqidComm.createGroup(group);
        }
        catch (err) {
            throw new Error('Unable to create group with name ' + name + '.');
        }
    }

    /**
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    public compose = async (options: ComposeOptions): Promise<Machine> => {
        let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time) }) };
        try {
            if (!this.ready)
                throw new Error('Controller Error: Controller has not started.');

            await this.liqidObs.refresh();

            if (this.busy)
                throw new Error('Controller Busy Error: A compose task is currently running.')
            else
                this.busy = true;

            //determine group
            if (options.groupId) {
                var group = this.liqidObs.getGroupById(options.groupId);
                if (!group)
                    throw new Error(`Group Assignment Error: The group with id ${options.groupId} does not exist.`)
            }
            else {
                var group = this.liqidObs.getGroupById();
                if (!group)
                    throw new Error('Group Assignment Error: There are currently no available groups (You should create one first).')
            }

            //check machine name
            if (this.liqidObs.checkMachNameExists(options.name)) {
                throw new Error('Machine Name Error: The given machine name is already in use.')
            }

            //grab all current devices
            let deviceStatuses: DeviceStatus[] = await this.liqidObs.gatherRequiredDeviceStatuses({
                cpu: options.cpu,
                gpu: options.gpu,
                ssd: options.ssd,
                nic: options.nic,
                fpga: options.fpga,
                gatherUnused: true
            });
            //move all devices to machine's group
            await this.moveDevicesToGroup(deviceStatuses, group.grp_id);

            //create machine
            var machine: Machine = {
                fabr_gid: '-1',
                fabr_id: this.fabricId,
                grp_id: group.grp_id,
                mach_id: parseInt(await this.liqidComm.getNextMachineId()),
                mach_name: options.name
            }
            var machineId: number = (await this.liqidComm.createMachine(machine)).mach_id;

            //move all devices to machine
            await this.moveDevicesToMachine(deviceStatuses, machineId);

            //verify all devices exist in machine
            let assembleSuccessful = true;
            await this.liqidObs.refresh();
            for (let i = 0; i < deviceStatuses.length; i++) {
                let predevice = this.liqidObs.getPreDeviceByName(deviceStatuses[i].name);
                if (predevice.mach_id != machineId.toString()) {
                    assembleSuccessful = false;
                    break;
                }
            }

            //if there's an issue, abort and get rid of created machine
            if (!assembleSuccessful) {
                await this.liqidComm.deleteMachine(machineId);
                delay(1000);
                throw new Error('Move Device To Machine Error: One or more devices were not properly moved to new machine. Removing Machine.');
            }

            this.busy = false;
            await this.liqidObs.refresh();
            return this.liqidObs.getMachineById(machine.mach_id);
        }
        catch (err) {
            this.busy = false;
            // if (poolEditMode) this.liqidComm.cancelPoolEdit();
            // if (fabricEditMode) this.liqidComm.cancelFabricEdit();
            throw new Error(err + ' Aborting Compose!');
        }
    }

    /**
     * Move specified devices to group/pool
     * If device is already in pool, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          grpId   gid/cid: The target group's ID
     */
    public moveDevicesToGroup = async (devices: DeviceStatus[], grpId: number): Promise<void> => {
        let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time) }) };
        try {
            if (devices.length == 0) return;
            await this.liqidObs.refresh();
            //place target group in edit mode
            var grpsInEditMode: { [key: string]: GroupPool } = {};
            var targetGroup = this.liqidObs.getGroupById(grpId);
            if (!targetGroup) throw new Error(`Group Destination Error: Target group with group ID ${grpId} does not exist.`);
            var targetGroupPool: GroupPool = {
                grp_id: grpId,
                coordinates: devices[0].location,
                fabr_id: this.fabricId
            };
            await this.liqidComm.enterPoolEditMode(targetGroupPool);
            //only devices outside of target group will be moved
            var transDevices: DeviceStatus[] = [];
            for (let i = 0; i < devices.length; i++) {
                let predevice = this.liqidObs.getPreDeviceByName(devices[i].name);
                if (!predevice || predevice.grp_id != grpId) transDevices.push(devices[i]);
                if (predevice && predevice.mach_id != 'n/a') throw new Error(`Move Device To Group Error: Device ${devices[i].name} is currently in use by machine ${predevice.mname}.`);
            }
            //enter edit mode for transitioning devices
            for (let i = 0; i < transDevices.length; i++) {
                let predevice = this.liqidObs.getPreDeviceByName(transDevices[i].name);
                if (!predevice) continue;
                if (!grpsInEditMode.hasOwnProperty(predevice.grp_id)) {
                    grpsInEditMode[predevice.grp_id] = {
                        grp_id: predevice.grp_id,
                        coordinates: transDevices[i].location,
                        fabr_id: this.fabricId
                    };
                    await this.liqidComm.enterPoolEditMode(grpsInEditMode[predevice.grp_id]);
                    await delay(300);
                }
            }
            //pull out of pool
            for (let i = 0; i < transDevices.length; i++) {
                let predevice = this.liqidObs.getPreDeviceByName(transDevices[i].name);
                if (!predevice) continue;
                let groupDeviceRelator: GroupDeviceRelator = {
                    deviceStatus: transDevices[i],
                    group: this.liqidObs.getGroupById(predevice.grp_id)
                }
                switch (transDevices[i].type) {
                    case 'ComputeDeviceStatus':
                        await this.liqidComm.removeCpuFromPool(groupDeviceRelator);
                        break;
                    case 'GpuDeviceStatus':
                        await this.liqidComm.removeGpuFromPool(groupDeviceRelator);
                        break;
                    case 'SsdDeviceStatus':
                        await this.liqidComm.removeStorageFromPool(groupDeviceRelator);
                        break;
                    case 'LinkDeviceStatus':
                        await this.liqidComm.removeNetCardFromPool(groupDeviceRelator);
                        break;
                    case 'FpgaDeviceStatus':
                        await this.liqidComm.removeFpgaFromPool(groupDeviceRelator);
                        break;
                }
                //await delay(300);
            }
            await this.liqidObs.refresh();
            //complete removal process (save edit)
            let gids = Object.keys(grpsInEditMode);
            for (let i = 0; i < gids.length; i++) {
                if (gids[i] == grpId.toString()) {
                    console.log('Something is severely wrong: attempting to save target group edit when not supposed to!');
                    continue;
                }
                if (grpsInEditMode.hasOwnProperty(gids[i])) {
                    await this.liqidComm.savePoolEdit(grpsInEditMode[gids[i]]);
                    await delay(300);
                    delete grpsInEditMode[gids[i]];
                }
            }
            await delay(1000);
            //move from fabric to target pool
            for (let i = 0; i < transDevices.length; i++) {
                let groupDeviceRelator: GroupDeviceRelator = {
                    deviceStatus: transDevices[i],
                    group: targetGroup
                }
                switch (transDevices[i].type) {
                    case 'ComputeDeviceStatus':
                        await this.liqidComm.addCpuToPool(groupDeviceRelator);
                        break;
                    case 'GpuDeviceStatus':
                        await this.liqidComm.addGpuToPool(groupDeviceRelator);
                        break;
                    case 'SsdDeviceStatus':
                        await this.liqidComm.addStorageToPool(groupDeviceRelator);
                        break;
                    case 'LinkDeviceStatus':
                        await this.liqidComm.addNetCardToPool(groupDeviceRelator);
                        break;
                    case 'FpgaDeviceStatus':
                        await this.liqidComm.addFpgaToPool(groupDeviceRelator);
                        break;
                }
                //await delay(300);
            }
            await this.liqidObs.refresh();
            await this.liqidComm.savePoolEdit(targetGroupPool);
        }
        catch (err) {
            // var grpIds = Object.keys(grpsInEditMode);
            // for (let i = 0; i < grpIds.length; i++) {
            //     await this.liqidComm.cancelPoolEdit(grpsInEditMode[grpIds[i]]);
            // }
            throw new Error(err);
        }
    }

    /**
     * Move specified devices to machine; devices must be in the machine's pool, or errors out
     * If device is already in machine, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          machId  mach_id: The target machine's ID
     */
    public moveDevicesToMachine = async (devices: DeviceStatus[], machId: number): Promise<void> => {
        let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time) }) };
        try {
            if (devices.length == 0) return;
            await this.liqidObs.refresh();
            //gather all neccessary pieces and enter fabric edit mode
            var machine: Machine = this.liqidObs.getMachineById(machId);
            if (!machine)
                throw new Error(`Machine Destination Error: Target machine with machine ID ${machId} does not exist.`)
            var group: Group = this.liqidObs.getGroupById(machine.grp_id);
            await this.liqidComm.enterFabricEditMode(machine);
            await delay(300);
            //select only the devices that needs to be moved
            var transDevices: DeviceStatus[] = [];
            for (let i = 0; i < devices.length; i++) {
                let predevice = this.liqidObs.getPreDeviceByName(devices[i].name);
                if (!predevice || predevice.grp_id != machine.grp_id)
                    throw new Error(`Move Device To Machine Error: Device ${devices[i].name} is not in the same group as machine.`);
                if (predevice.mach_id != 'n/a') {
                    if (parseInt(predevice.mach_id) == machine.mach_id) continue;
                    throw new Error(`Move Device To Machine Error: Device ${devices[i].name} is currently in use by machine ${predevice.mname}.`);
                }
                transDevices.push(devices[i]);
            }
            //move devices to machine
            for (let i = 0; i < transDevices.length; i++) {
                let machDeviceRelator: MachineDeviceRelator = {
                    groupDeviceRelator: {
                        deviceStatus: transDevices[i],
                        group: group
                    },
                    machine: machine
                }
                switch (transDevices[i].type) {
                    case 'ComputeDeviceStatus':
                        await this.liqidComm.addCpuToMach(machDeviceRelator);
                        break;
                    case 'GpuDeviceStatus':
                        await this.liqidComm.addGpuToMach(machDeviceRelator);
                        break;
                    case 'SsdDeviceStatus':
                        await this.liqidComm.addStorageToMach(machDeviceRelator);
                        break;
                    case 'LinkDeviceStatus':
                        await this.liqidComm.addNetCardToMach(machDeviceRelator);
                        break;
                    case 'FpgaDeviceStatus':
                        await this.liqidComm.addFpgaToMach(machDeviceRelator);
                        break;
                }
                //await delay(500);
            }
            await this.liqidObs.refresh();
            await this.liqidComm.reprogramFabric(machine);
        }
        catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Decompose a machine
     * @param {Machine} machine The machine to be decomposed
     */
    public decompose = async (machine: Machine): Promise<void> => {
        try {
            if (machine)
                await this.liqidComm.deleteMachine(machine.mach_id);
        }
        catch (err) {
            throw new Error(err);
        }
    }
}