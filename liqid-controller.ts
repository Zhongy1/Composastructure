import _ = require('lodash');
import { LiqidCommunicator } from './liqid-communicator';
import { LiqidObserver, OrganizedDeviceStatuses } from './liqid-observer';
import { MachineDeviceRelator, DeviceStatus, Group, Machine } from './models';


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
    private ready: boolean = false;

    constructor(private liqidIp: string) {
        this.liqidComm = new LiqidCommunicator(liqidIp);
        this.liqidObs = new LiqidObserver(liqidIp);
        this.identifyFabricId();
    }

    /**
     * Determine the current fabric id on which this controller is mounted
     */
    private identifyFabricId = (): void => {
        this.liqidComm.getFabricId().then(id => {
            this.fabricId = id;
            this.ready = true;
        }, err => {
            setTimeout(() => { this.identifyFabricId() }, 1000);
        });
    }

    /**
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    public compose = async (options: ComposeOptions): Promise<Machine> => {
        try {
            if (!this.ready)
                throw new Error('Unready');

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
                cid: group.cid,
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