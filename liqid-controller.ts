import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { LiqidObserver, OrganizedDeviceStatuses } from './liqid-observer';
import { MachineDeviceRelator, DeviceStatus, Group, Machine, GroupPool } from './models';


export interface ComposeOptions {
    cpu: number | string[],
    gpu: number | string[],
    ssd: number | string[],
    nic: number | string[],
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

    public start = async (): Promise<boolean> => {
        try {
            if (!this.ready) {
                let obsStart = await this.liqidObs.start();
                this.fabricId = await this.identifyFabricId();
                this.ready = true;
            }
            return this.ready;
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
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    public composeV1 = async (options: ComposeOptions): Promise<Machine> => {
        try {
            if (!this.ready)
                throw new Error('Can not compose: controller has not started.');

            if (this.busy)
                throw new Error('Can not compose: a compose, task is currently running.')
            else
                this.busy = true;

            if (options.hasOwnProperty('groupId')) {
                var group: Group = await this.liqidObs.getGroupById(options.groupId);
                if (group == null)
                    throw new Error('Specified groupId does not exist. Aborting Compose!');
            }
            else {
                var group: Group = await this.liqidObs.getGroupById();
                if (group == null)
                    throw new Error('There are currently no existing groups. Aborting Compose! Maybe create group in this step?');
            }

            if (this.liqidObs.checkMachNameExists(options.name))
                throw new Error(`The machine name '${options.name}' already exists. Aborting Compose!`);
            let machine: Machine = {
                grp_id: group.grp_id,
                fabr_gid: '-1',
                fabr_id: this.fabricId,
                mach_id: parseInt(await this.liqidComm.getNextMachineId()),
                mach_name: options.name
            };
            let devices: DeviceStatus[] = [];
            let deviceStats: OrganizedDeviceStatuses = this.liqidObs.getDeviceStatusesOrganized();

            if (typeof options.cpu === 'number' && options.cpu > 0) {
                let deviceNames = Object.keys(deviceStats.cpu);
                if (deviceNames.length < options.cpu)
                    throw new Error('Not enough available CPUs to use. Aborting Compose!');
                for (let i = 0; i < options.cpu; i++)
                    devices.push(deviceStats.cpu[deviceNames[i]]);
            }
            else if (Array.isArray(options.cpu)) {
                for (let i = 0; i < options.cpu.length; i++) {
                    if (deviceStats.cpu.hasOwnProperty(options.cpu[i]))
                        devices.push(deviceStats.cpu[options.cpu[i]]);
                    else
                        throw new Error(`CPU ${options.cpu[i]} does not exist. Aborting Compose!`);
                }
            }
            else throw new Error('CPU specification is neither a number nor a string array. Aborting Compose!');
            if (typeof options.gpu === 'number' && options.gpu > 0) {
                let deviceNames = Object.keys(deviceStats.gpu);
                if (deviceNames.length < options.gpu)
                    throw new Error('Not enough available GPUs to use. Aborting Compose!');
                for (let i = 0; i < options.gpu; i++)
                    devices.push(deviceStats.gpu[deviceNames[i]]);
            }
            else if (Array.isArray(options.gpu)) {
                for (let i = 0; i < options.gpu.length; i++) {
                    if (deviceStats.gpu.hasOwnProperty(options.gpu[i]))
                        devices.push(deviceStats.gpu[options.gpu[i]]);
                    else
                        throw new Error(`GPU ${options.gpu[i]} does not exist. Aborting Compose!`);
                }
            }
            else throw new Error('GPU specification is neither a number nor a string array. Aborting Compose!');
            if (typeof options.ssd === 'number' && options.ssd > 0) {
                let deviceNames = Object.keys(deviceStats.ssd);
                if (deviceNames.length < options.ssd)
                    throw new Error('Not enough available SSDs to use. Aborting Compose!');
                for (let i = 0; i < options.ssd; i++)
                    devices.push(deviceStats.ssd[deviceNames[i]]);
            }
            else if (Array.isArray(options.ssd)) {
                for (let i = 0; i < options.ssd.length; i++) {
                    if (deviceStats.ssd.hasOwnProperty(options.ssd[i]))
                        devices.push(deviceStats.ssd[options.ssd[i]]);
                    else
                        throw new Error(`SSD ${options.ssd[i]} does not exist. Aborting Compose!`);
                }
            }
            else throw new Error('SSD specification is neither a number nor a string array. Aborting Compose!');
            if (typeof options.nic === 'number' && options.nic > 0) {
                let deviceNames = Object.keys(deviceStats.nic);
                if (deviceNames.length < options.nic)
                    throw new Error('Not enough available NICs to use. Aborting Compose!');
                for (let i = 0; i < options.nic; i++)
                    devices.push(deviceStats.nic[deviceNames[i]]);
            }
            else if (Array.isArray(options.nic)) {
                for (let i = 0; i < options.nic.length; i++) {
                    if (deviceStats.nic.hasOwnProperty(options.nic[i]))
                        devices.push(deviceStats.nic[options.nic[i]]);
                    else
                        throw new Error(`NIC ${options.nic[i]} does not exist. Aborting Compose!`);
                }
            }
            else throw new Error('NIC specification is neither a number nor a string array. Aborting Compose!');

            let transitionTime = new Promise((resolve) => { setTimeout(() => resolve(''), 500) });
            //Create machine first
            await this.liqidComm.createMachine(machine);
            await transitionTime;
            //Add devices to machine
            for (let i = 0; i < devices.length; i++) {
                let machDevRelator: MachineDeviceRelator = {
                    groupDeviceRelator: {
                        deviceStatus: devices[i],
                        group: group
                    },
                    machine: machine
                }
                switch (devices[i].type) {
                    case 'ComputeDeviceStatus':
                        await this.liqidComm.addCpuToMach(machDevRelator);
                        break;
                    case 'GpuDeviceStatus':
                        await this.liqidComm.addGpuToMach(machDevRelator);
                        break;
                    case 'SsdDeviceStatus':
                        await this.liqidComm.addStorageToMach(machDevRelator);
                        break;
                    case 'LinkDeviceStatus':
                        await this.liqidComm.addNetCardToMach(machDevRelator);
                        break;
                }
                await transitionTime;
                let returnMachine: Machine = await this.liqidObs.getMachineById(machine.mach_id);
                return returnMachine;
            }
        }
        catch (err) {
            this.busy = false;
            throw new Error(err);
        }
    }

    public composeV2 = async (options: ComposeOptions): Promise<Machine> => {
        let transitionTime = new Promise((resolve) => { setTimeout(() => resolve(''), 500) });
        try {
            if (!this.ready)
                throw new Error('Controller Error: Controller has not started.');

            if (this.busy)
                throw new Error('Controller Busy Error: A compose task is currently running.')
            else
                this.busy = true;

            //determine groub
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

            //grab all current devices
            let deviceStatuses: DeviceStatus[] = await this.liqidObs.gatherRequiredDeviceStatuses({
                cpu: options.cpu,
                gpu: options.gpu,
                ssd: options.ssd,
                nic: options.nic,
                gatherUnused: true
            });

            //move all devices to machine's group

            //create machine
            //individually add each device to machine, wait it to attach, verify that it worked
            //if there's an issue, abort and get rid of created machine


            this.busy = false;
            return null;
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
    public moveDevicesToGroup = async (devices: DeviceStatus[], grpId: number) => {
        let transitionTime = new Promise((resolve) => { setTimeout(() => resolve(''), 500) });
        try {
            var grpsInEditMode: { [key: string]: GroupPool } = {};
            var targetGroup = this.liqidObs.getGroupById(grpId);
            if (!targetGroup) throw new Error('');
            grpsInEditMode[grpId] = {
                grp_id: grpId,
                coordinates: devices[0].location,
                fabr_id: this.fabricId
            };
            await this.liqidComm.enterPoolEditMode(grpsInEditMode[grpId]);

            for (let i = 0; i < devices.length; i++) {
                let predevice = this.liqidObs.getDeviceByName(devices[i].name);
                if (predevice.mach_id != 'n/a') throw new Error(`Move Device Error: Device ${devices[i].name} is currently in use by machine ${predevice.mname}.`);
                if (predevice && !grpsInEditMode.hasOwnProperty(predevice.grp_id)) {
                    grpsInEditMode[predevice.grp_id] = {
                        grp_id: predevice.grp_id,
                        coordinates: devices[i].location,
                        fabr_id: this.fabricId
                    };
                    await this.liqidComm.enterPoolEditMode(grpsInEditMode[grpId]);
                }
            }
            await transitionTime;
            //pull out of pool
            for (let i = 0; i < devices.length; i++) {
                let predevice = this.liqidObs.getDeviceByName(devices[i].name);
                if (predevice && predevice.grp_id != grpId) {
                    //await this.liqidComm.
                }
            }

        }
        catch (err) {
            var grpIds = Object.keys(grpsInEditMode);
            for (let i = 0; i < grpIds.length; i++) {
                await this.liqidComm.cancelPoolEdit(grpsInEditMode[grpIds[i]]);
            }
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