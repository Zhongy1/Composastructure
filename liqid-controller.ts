import _ = require('lodash');
import { LiqidCommunicator, LiqidError } from './liqid-communicator';
import { LiqidObserver, OrganizedDeviceStatuses } from './liqid-observer';
import { MachineDeviceRelator, DeviceStatus, Group, Machine, GroupPool, GroupDeviceRelator, PreDevice, P2PStatus } from './models';


export interface ComposeOptions {
    cpu?: number | string[],
    gpu?: number | string[],
    ssd?: number | string[],
    optane?: number | string[],
    nic?: number | string[],
    fpga?: number | string[],
    name: string,
    machId?: number,
    grpId?: number,
    fabrId: number
}

export enum P2PActionType {
    on = 'on', off = 'off', cycleOn = 'cycleOn', setOn = 'setOn', setOff = 'setOff'
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

    constructor(private liqidIp: string, public systemName: string = '') {
        this.liqidComm = new LiqidCommunicator(liqidIp);
        this.liqidObs = new LiqidObserver(liqidIp);
        this.ready = false;
        this.busy = false;
    }

    /**
     * Start the controller. This is to confirm that the controller can connect to Liqid system.
     * @return  {Promise<boolean>}   Return true if start is successful, false if controller has already been started
     */
    public async start(): Promise<boolean> {
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
    private async identifyFabricId(): Promise<number> {
        try {
            return await this.liqidComm.getFabricId();
        }
        catch (err) {
            throw new Error('Unable to retrieve fabric ID.');
        }
    }

    public getFabricId(): number {
        return this.fabricId
    }

    /**
     * Create a group/pool
     * @param   {string}    name    The name the new group will use
     * @return  {Promise<Group>}    The created group
     */
    public async createGroup(name: string, ignoreBusy: boolean = false, grpId?: number): Promise<Group> {
        try {
            if (!this.ready) {
                let err: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: `Controller for fabric ${this.fabricId} is not ready. Server may be unable to connect to this Liqid system.`
                }
                console.log(err);
                throw err;
            }
            if (this.liqidObs.getGroupIdByName(name) != -1) {
                let err: LiqidError = {
                    code: 422,
                    origin: 'controller',
                    description: 'Use a different group name. The one provided is already in use.'
                }
                throw err;
            }
            if (!name.match(/^[A-Za-z0-9]+$/)) {
                let err: LiqidError = {
                    code: 422,
                    origin: 'controller',
                    description: 'Do not use special characters for a group name.'
                }
                throw err;
            }
            if (!ignoreBusy) {
                if (this.busy) {
                    let err: LiqidError = {
                        code: 503,
                        origin: 'controller',
                        description: `Controller for fabric ${this.fabricId} is busy with a previous compose/create request. Please wait a few seconds and retry.`
                    }
                    console.log(err);
                    throw err;
                }
                else {
                    this.busy = true;
                    this.liqidObs.setBusyState(true);
                }
            }
            let group: Group = {
                fabr_id: this.fabricId,
                group_name: name,
                grp_id: (typeof grpId === 'number') ? grpId : await this.liqidComm.getNextGroupId(),
                pod_id: -1
            }
            let grp = await this.liqidComm.createGroup(group);

            if (!ignoreBusy) {
                this.busy = false;
                this.liqidObs.setBusyState(false);
            }

            await this.liqidObs.refresh();

            return grp;
        }
        catch (err) {
            if (!ignoreBusy && (err.code == null || err.code != 503)) {
                this.busy = false;
                this.liqidObs.setBusyState(false);
            }
            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'Undocumented error occurred in group creation.'
                }
                throw error;
            }
        }
    }

    /**
     * Delete a group/pool
     * @param   {number}    id      The id of the group to be deleted
     * @return  {Promise<Group>}    The deleted group
     */
    public async deleteGroup(id: number): Promise<Group> {
        try {
            if (!this.ready) {
                let err: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: `Controller for fabric ${this.fabricId} is not ready. Server may be unable to connect to this Liqid system.`
                }
                console.log(err);
                throw err;
            }
            if (this.busy) {
                let err: LiqidError = {
                    code: 503,
                    origin: 'controller',
                    description: `Controller for fabric ${this.fabricId} is busy with a previous compose/create request. Please wait a few seconds and retry.`
                }
                console.log(err);
                throw err;
            }
            if (this.liqidObs.getGroupById(id)) {
                this.busy = true;
                this.liqidObs.setBusyState(true);

                await this.liqidObs.refresh();

                if (!this.liqidObs.checkGroupIsEmpty(id)) {
                    let err: LiqidError = {
                        code: 422,
                        origin: 'controller',
                        description: `Group ${id} is not empty. Ensure all machines are removed from this group first.`
                    }
                    throw err;
                }

                let grp: Group = await this.liqidComm.deleteGroup(id);

                await this.liqidObs.refresh();
                this.busy = false;
                this.liqidObs.setBusyState(false);

                return grp;
            }
            else {
                let err: LiqidError = {
                    code: 404,
                    origin: 'controller',
                    description: `Group ${id} does not exist.`
                }
                throw err;
            }
        }
        catch (err) {
            if (err.code == null || err.code != 503) {
                this.busy = false;
                this.liqidObs.setBusyState(false);
            }

            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'Undocumented error occurred in group deletion.'
                }
                throw error;
            }
        }
    }

    /**
     * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
     * @param {ComposeOptions} options  Specify parts needed either by name or by how many
     * @return {Machine}                Machine object, returned from Liqid
     */
    public async compose(options: ComposeOptions): Promise<Machine> {
        function delay(time) {
            return new Promise(resolve => { setTimeout(() => resolve(''), time); });
        }
        try {
            if (!this.ready) {
                let err: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: `Controller for fabric ${options.fabrId} is not ready. Server may be unable to connect to this Liqid system.`
                }
                console.log(err);
                throw err;
            }

            await this.liqidObs.refresh();

            if (this.busy) {
                let err: LiqidError = {
                    code: 503,
                    origin: 'controller',
                    description: `Controller for fabric ${options.fabrId} is busy with a previous compose/create request. Please wait a few seconds and retry.`
                }
                console.log(err);
                throw err;
            }
            else {
                this.busy = true;
                this.liqidObs.setBusyState(true);
            }

            //determine group
            if (options.grpId) {
                if (typeof options.grpId !== 'number') {
                    let err: LiqidError = {
                        code: 400,
                        origin: 'controller',
                        description: 'grpId has to be a number.'
                    }
                    throw err;
                }
                var group = this.liqidObs.getGroupById(options.grpId);
                if (!group) {
                    let err: LiqidError = {
                        code: 404,
                        origin: 'controller',
                        description: `Group ${options.grpId} does not exist.`
                    }
                    throw err;
                }
            }
            else {
                let grpId = this.liqidObs.getGroupIdByName('UngroupedGroup');
                if (grpId > 0)
                    var group = this.liqidObs.getGroupById(grpId);
                else {
                    var group = await this.createGroup('UngroupedGroup', true);
                    await this.liqidObs.refresh();
                    await delay(2000);// prevent crashing
                }
            }

            //check machine name
            if (this.liqidObs.checkMachNameExists(options.name)) {
                let err: LiqidError = {
                    code: 422,
                    origin: 'controller',
                    description: 'The given machine name is already in use.'
                }
                throw err;
            }

            //check machine name is only letters
            if (!options.name.match(/^[A-Za-z0-9]+$/)) {
                let err: LiqidError = {
                    code: 422,
                    origin: 'controller',
                    description: 'Do not use special characters for a machine name.'
                }
                throw err;
            }

            //grab all current devices
            let deviceStatuses: DeviceStatus[] = await this.liqidObs.gatherRequiredDeviceStatuses({
                cpu: options.cpu,
                gpu: options.gpu,
                ssd: options.ssd,
                optane: options.optane,
                nic: options.nic,
                fpga: options.fpga,
                gatherUnused: true
            });

            //ensure there is at least one device
            if (deviceStatuses.length == 0) {
                let err: LiqidError = {
                    code: 422,
                    origin: 'controller',
                    description: 'Machine specification must have at least one device.'
                }
                throw err;
            }

            //move all devices to machine's group
            await this.moveDevicesToGroup(deviceStatuses, group.grp_id);

            //create machine
            var machine: Machine = {
                fabr_gid: '-1',
                fabr_id: this.fabricId,
                grp_id: group.grp_id,
                mach_id: (typeof options.machId == 'number') ? options.machId : parseInt(await this.liqidComm.getNextMachineId()),
                mach_name: options.name
            }
            var machineId: number = (await this.liqidComm.createMachine(machine)).mach_id;

            //move all devices to machine
            await this.moveDevicesToMachine(deviceStatuses, machineId);

            //verify all devices exist in machine
            let assembleSuccessful = true;
            await this.liqidObs.refresh();
            await delay(1000);// prevent crashing
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
                await delay(1000);
                let err: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'One or more requested devices did not get assigned properly. Aborting compose!'
                }
                console.log(err);
                throw err;
            }

            await this.liqidObs.refresh();
            await delay(2000);// prevent crashing
            this.busy = false;
            this.liqidObs.setBusyState(false);
            return this.liqidObs.getMachineById(machine.mach_id);
        }
        catch (err) {
            if (err.code == null || err.code != 503) {
                this.busy = false;
                this.liqidObs.setBusyState(false);
            }
            // if (poolEditMode) this.liqidComm.cancelPoolEdit();
            // if (fabricEditMode) this.liqidComm.cancelFabricEdit();
            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'Undocumented error occurred in composing machine.'
                }
                throw error;
            }
        }
    }

    /**
     * Move specified devices to group/pool
     * If device is already in pool, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          grpId   gid/cid: The target group's ID
     */
    public async moveDevicesToGroup(devices: DeviceStatus[], grpId: number): Promise<void> {
        function delay(time) {
            return new Promise(resolve => { setTimeout(() => resolve(''), time); });
        }
        try {
            if (devices.length == 0) return;
            await this.liqidObs.refresh();
            await delay(2000);// prevent crashing
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
            await delay(2000);// prevent crashing
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
                    await delay(1000);// prevent crashing
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
                await delay(2000);// prevent crashing
                //await delay(300);
            }
            await this.liqidObs.refresh();
            await delay(2000);// prevent crashing
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
                await delay(2000);// prevent crashing
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
            throw err;
        }
    }

    /**
     * Move specified devices to machine; devices must be in the machine's pool, or errors out
     * If device is already in machine, will leave it alone
     * @param {DeviceStatus[]}  devices Array of devices that will be moved
     * @param {number}          machId  mach_id: The target machine's ID
     */
    public async moveDevicesToMachine(devices: DeviceStatus[], machId: number): Promise<void> {
        function delay(time) {
            return new Promise(resolve => { setTimeout(() => resolve(''), time); });
        }
        try {
            if (devices.length == 0) return;
            await this.liqidObs.refresh();
            await delay(1000);// prevent crashing
            //gather all neccessary pieces and enter fabric edit mode
            var machine: Machine = this.liqidObs.getMachineById(machId);
            if (!machine)
                throw new Error(`Machine Destination Error: Target machine with machine ID ${machId} does not exist.`)
            var group: Group = this.liqidObs.getGroupById(machine.grp_id);
            await this.liqidComm.enterFabricEditMode(machine);
            await delay(300);
            await delay(1000);// prevent crashing
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
                await delay(2000);// prevent crashing
                //await delay(500);
            }
            await this.liqidObs.refresh();
            await delay(1000);// prevent crashing
            await this.liqidComm.reprogramFabric(machine);
            await delay(2000);// prevent crashing
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Decompose a machine and return devices to fabric layer
     * @param {Machine} machine The machine to be decomposed
     */
    public async decompose(id: number): Promise<Machine> {
        function delay(time) {
            return new Promise(resolve => { setTimeout(() => resolve(''), time); });
        }
        try {
            if (!this.ready) {
                let err: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: `Controller for fabric ${this.fabricId} is not ready. Server may be unable to connect to this Liqid system.`
                }
                console.log(err);
                throw err;
            }
            if (this.busy) {
                let err: LiqidError = {
                    code: 503,
                    origin: 'controller',
                    description: `Controller for fabric ${this.fabricId} is busy with a previous compose/create request. Please wait a few seconds and retry.`
                }
                console.log(err);
                throw err;
            }

            let machine = this.liqidObs.getMachineById(id);
            if (machine) {
                this.busy = true;
                this.liqidObs.setBusyState(true);
                let deviceStatuses = this.liqidObs.convertHistToDevStatuses(machine.connection_history);
                await this.liqidComm.deleteMachine(machine.mach_id);
                await delay(2000);
                //move devices out of group...
                if (deviceStatuses.length == 0) return machine;
                let grpPool: GroupPool = {
                    coordinates: deviceStatuses[0].location,
                    grp_id: machine.grp_id,
                    fabr_id: machine.fabr_id
                }
                await this.liqidComm.enterPoolEditMode(grpPool);
                await delay(2000);
                for (let i = 0; i < deviceStatuses.length; i++) {
                    let groupDeviceRelator: GroupDeviceRelator = {
                        deviceStatus: deviceStatuses[i],
                        group: await this.liqidObs.getGroupById(grpPool.grp_id)
                    };
                    switch (deviceStatuses[i].type) {
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
                    await delay(2000);
                }
                await this.liqidComm.savePoolEdit(grpPool);
                await delay(2000);
                this.liqidObs.refresh();
                this.busy = false;
                this.liqidObs.setBusyState(false);

                return machine;
            }
            else {
                let err: LiqidError = {
                    code: 404,
                    origin: 'controller',
                    description: `Machine ${id} does not exist.`
                }
                throw err;
            }
        }
        catch (err) {
            if (err.code == null || err.code != 503) {
                this.busy = false;
                this.liqidObs.setBusyState(false);
            }

            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'Undocumented error occurred in machine deletion.'
                }
                throw error;
            }
        }
    }

    /**
     * Decompose a machine
     * @param {Machine} machine The machine to be decomposed
     */
    public async decomposeBasic(machine: Machine): Promise<void> {
        try {
            if (machine)
                await this.liqidComm.deleteMachine(machine.mach_id);
        }
        catch (err) {
            throw new Error(err);
        }
    }


    public async triggerP2P(mode: P2PActionType, machId: number | string): Promise<void> {
        function delay(time) {
            return new Promise(resolve => { setTimeout(() => resolve(''), time); });
        }
        try {
            let mach: Machine = this.liqidObs.getMachineById(machId);
            if (!mach) {
                let error: LiqidError = {
                    code: 404,
                    origin: 'controller',
                    description: `Machine ${machId} does not exist.`
                }
                throw error;
            }
            switch (mode) {
                case P2PActionType.cycleOn: // this case will not break; it will attempt to turn p2p off if possible, then continue with turning it back on
                    if (mach.p2p == P2PStatus.on) { // if on, turn it off
                        mach.p2p = P2PStatus.off;
                        let respMach = await this.liqidComm.toggleP2P(mach);
                        if (respMach.p2p != P2PStatus.off) {
                            let error: LiqidError = {
                                code: 500,
                                origin: 'controller',
                                description: 'Liqid command completed without error, but p2p status appears unchanged.'
                            }
                            throw error;
                        }
                        await delay(2000);
                    }
                // else, it should be in off mode, so just move on to the next case
                case P2PActionType.on:
                    if (mach.p2p == P2PStatus.on) {
                        // already on, nothing to do
                        return;
                    }
                    else {
                        mach.p2p = P2PStatus.on;
                        let respMach = await this.liqidComm.toggleP2P(mach);
                        // if status is unchanged, throw
                        if (respMach.p2p != P2PStatus.on) {
                            let error: LiqidError = {
                                code: 500,
                                origin: 'controller',
                                description: 'Liqid command completed without error, but p2p status appears unchanged.'
                            }
                            throw error;
                        }
                    }
                    break;
                case P2PActionType.off:
                    if (mach.p2p == P2PStatus.off) {
                        // already off, nothing to do
                        return;
                    }
                    else {
                        mach.p2p = P2PStatus.off;
                        let respMach = await this.liqidComm.toggleP2P(mach);
                        // if status is unchanged, throw
                        if (respMach.p2p != P2PStatus.off) {
                            let error: LiqidError = {
                                code: 500,
                                origin: 'controller',
                                description: 'Liqid command completed without error, but p2p status appears unchanged.'
                            }
                            throw error;
                        }
                    }
                    break;
                case P2PActionType.setOn: {
                    mach.p2p = P2PStatus.on;
                    let respMach = await this.liqidComm.toggleP2P(mach);
                    break;
                }
                case P2PActionType.setOff: {
                    mach.p2p = P2PStatus.off;
                    let respMach = await this.liqidComm.toggleP2P(mach);
                    break;
                }
            }
        }
        catch (err) {
            if (err.origin) {
                throw err;
            }
            else {
                console.log(err);
                let error: LiqidError = {
                    code: 500,
                    origin: 'controller',
                    description: 'Undocumented error occurred in updating p2p.'
                }
                throw error;
            }
        }
    }
}