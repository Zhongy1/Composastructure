"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const liqid_communicator_1 = require("./liqid-communicator");
const liqid_observer_1 = require("./liqid-observer");
/**
 * Controller for specific liqid tasks
```typescript
const controller = new LiqidController(ip);
```
 */
class LiqidController {
    constructor(liqidIp) {
        this.liqidIp = liqidIp;
        /**
         * Start the controller. This is to confirm that the controller can connect to Liqid system.
         * @return  {Promise<boolean>}   Return true if start is successful, false if controller has already been started
         */
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.ready) {
                    let obsStart = yield this.liqidObs.start();
                    this.fabricId = yield this.identifyFabricId();
                    this.ready = true;
                    return true;
                }
                return false;
            }
            catch (err) {
                this.ready = false;
                throw new Error('LiqidController start unsuccessful: unable to communicate with Liqid.');
            }
        });
        /**
         * Determine the current fabric ID on which this controller is mounted
         * @return  {Promise<number>}    The ID
         */
        this.identifyFabricId = () => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.liqidComm.getFabricId();
            }
            catch (err) {
                throw new Error('Unable to retrieve fabric ID.');
            }
        });
        /**
         * Create a group/pool
         * @param   {string}    name    The name the new group will use
         * @return  {Promise<Group>}    The created group
         */
        this.createGroup = (name) => __awaiter(this, void 0, void 0, function* () {
            try {
                var group = {
                    fabr_id: this.fabricId,
                    group_name: name,
                    grp_id: yield this.liqidComm.getNextGroupId(),
                    pod_id: -1
                };
                return yield this.liqidComm.createGroup(group);
            }
            catch (err) {
                throw new Error('Unable to create group with name ' + name + '.');
            }
        });
        /**
         * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
         * @param {ComposeOptions} options  Specify parts needed either by name or by how many
         * @return {Machine}                Machine object, returned from Liqid
         */
        this.compose = (options) => __awaiter(this, void 0, void 0, function* () {
            let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time); }); };
            try {
                if (!this.ready)
                    throw new Error('Controller Error: Controller has not started.');
                yield this.liqidObs.refresh();
                if (this.busy)
                    throw new Error('Controller Busy Error: A compose task is currently running.');
                else
                    this.busy = true;
                //determine group
                if (options.groupId) {
                    var group = this.liqidObs.getGroupById(options.groupId);
                    if (!group)
                        throw new Error(`Group Assignment Error: The group with id ${options.groupId} does not exist.`);
                }
                else {
                    var group = this.liqidObs.getGroupById();
                    if (!group)
                        throw new Error('Group Assignment Error: There are currently no available groups (You should create one first).');
                }
                //check machine name
                if (this.liqidObs.checkMachNameExists(options.name)) {
                    throw new Error('Machine Name Error: The given machine name is already in use.');
                }
                //grab all current devices
                let deviceStatuses = yield this.liqidObs.gatherRequiredDeviceStatuses({
                    cpu: options.cpu,
                    gpu: options.gpu,
                    ssd: options.ssd,
                    nic: options.nic,
                    fpga: options.fpga,
                    gatherUnused: true
                });
                //move all devices to machine's group
                yield this.moveDevicesToGroup(deviceStatuses, group.grp_id);
                //create machine
                var machine = {
                    fabr_gid: '-1',
                    fabr_id: this.fabricId,
                    grp_id: group.grp_id,
                    mach_id: parseInt(yield this.liqidComm.getNextMachineId()),
                    mach_name: options.name
                };
                var machineId = (yield this.liqidComm.createMachine(machine)).mach_id;
                //move all devices to machine
                yield this.moveDevicesToMachine(deviceStatuses, machineId);
                //verify all devices exist in machine
                let assembleSuccessful = true;
                yield this.liqidObs.refresh();
                for (let i = 0; i < deviceStatuses.length; i++) {
                    let predevice = this.liqidObs.getDeviceByName(deviceStatuses[i].name);
                    if (predevice.mach_id != machineId.toString()) {
                        assembleSuccessful = false;
                        break;
                    }
                }
                //if there's an issue, abort and get rid of created machine
                if (!assembleSuccessful) {
                    yield this.liqidComm.deleteMachine(machineId);
                    delay(1000);
                    throw new Error('Move Device To Machine Error: One or more devices were not properly moved to new machine. Removing Machine.');
                }
                this.busy = false;
                yield this.liqidObs.refresh();
                return this.liqidObs.getMachineById(machine.mach_id);
            }
            catch (err) {
                this.busy = false;
                // if (poolEditMode) this.liqidComm.cancelPoolEdit();
                // if (fabricEditMode) this.liqidComm.cancelFabricEdit();
                throw new Error(err + ' Aborting Compose!');
            }
        });
        /**
         * Move specified devices to group/pool
         * If device is already in pool, will leave it alone
         * @param {DeviceStatus[]}  devices Array of devices that will be moved
         * @param {number}          grpId   gid/cid: The target group's ID
         */
        this.moveDevicesToGroup = (devices, grpId) => __awaiter(this, void 0, void 0, function* () {
            let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time); }); };
            try {
                if (devices.length == 0)
                    return;
                yield this.liqidObs.refresh();
                //place target group in edit mode
                var grpsInEditMode = {};
                var targetGroup = this.liqidObs.getGroupById(grpId);
                if (!targetGroup)
                    throw new Error(`Group Destination Error: Target group with group ID ${grpId} does not exist.`);
                var targetGroupPool = {
                    grp_id: grpId,
                    coordinates: devices[0].location,
                    fabr_id: this.fabricId
                };
                yield this.liqidComm.enterPoolEditMode(targetGroupPool);
                //only devices outside of target group will be moved
                var transDevices = [];
                for (let i = 0; i < devices.length; i++) {
                    let predevice = this.liqidObs.getDeviceByName(devices[i].name);
                    if (!predevice || predevice.grp_id != grpId)
                        transDevices.push(devices[i]);
                    if (predevice && predevice.mach_id != 'n/a')
                        throw new Error(`Move Device To Group Error: Device ${devices[i].name} is currently in use by machine ${predevice.mname}.`);
                }
                //enter edit mode for transitioning devices
                for (let i = 0; i < transDevices.length; i++) {
                    let predevice = this.liqidObs.getDeviceByName(transDevices[i].name);
                    if (!predevice)
                        continue;
                    if (!grpsInEditMode.hasOwnProperty(predevice.grp_id)) {
                        grpsInEditMode[predevice.grp_id] = {
                            grp_id: predevice.grp_id,
                            coordinates: transDevices[i].location,
                            fabr_id: this.fabricId
                        };
                        yield this.liqidComm.enterPoolEditMode(grpsInEditMode[predevice.grp_id]);
                        yield delay(300);
                    }
                }
                //pull out of pool
                for (let i = 0; i < transDevices.length; i++) {
                    let predevice = this.liqidObs.getDeviceByName(transDevices[i].name);
                    if (!predevice)
                        continue;
                    let groupDeviceRelator = {
                        deviceStatus: transDevices[i],
                        group: this.liqidObs.getGroupById(predevice.grp_id)
                    };
                    switch (transDevices[i].type) {
                        case 'ComputeDeviceStatus':
                            yield this.liqidComm.removeCpuFromPool(groupDeviceRelator);
                            break;
                        case 'GpuDeviceStatus':
                            yield this.liqidComm.removeGpuFromPool(groupDeviceRelator);
                            break;
                        case 'SsdDeviceStatus':
                            yield this.liqidComm.removeStorageFromPool(groupDeviceRelator);
                            break;
                        case 'LinkDeviceStatus':
                            yield this.liqidComm.removeNetCardFromPool(groupDeviceRelator);
                            break;
                        case 'FpgaDeviceStatus':
                            yield this.liqidComm.removeFpgaFromPool(groupDeviceRelator);
                            break;
                    }
                    //await delay(300);
                }
                yield this.liqidObs.refresh();
                //complete removal process (save edit)
                let gids = Object.keys(grpsInEditMode);
                for (let i = 0; i < gids.length; i++) {
                    if (gids[i] == grpId.toString()) {
                        console.log('Something is severely wrong: attempting to save target group edit when not supposed to!');
                        continue;
                    }
                    if (grpsInEditMode.hasOwnProperty(gids[i])) {
                        yield this.liqidComm.savePoolEdit(grpsInEditMode[gids[i]]);
                        yield delay(300);
                        delete grpsInEditMode[gids[i]];
                    }
                }
                yield delay(1000);
                //move from fabric to target pool
                for (let i = 0; i < transDevices.length; i++) {
                    let groupDeviceRelator = {
                        deviceStatus: transDevices[i],
                        group: targetGroup
                    };
                    switch (transDevices[i].type) {
                        case 'ComputeDeviceStatus':
                            yield this.liqidComm.addCpuToPool(groupDeviceRelator);
                            break;
                        case 'GpuDeviceStatus':
                            yield this.liqidComm.addGpuToPool(groupDeviceRelator);
                            break;
                        case 'SsdDeviceStatus':
                            yield this.liqidComm.addStorageToPool(groupDeviceRelator);
                            break;
                        case 'LinkDeviceStatus':
                            yield this.liqidComm.addNetCardToPool(groupDeviceRelator);
                            break;
                        case 'FpgaDeviceStatus':
                            yield this.liqidComm.addFpgaToPool(groupDeviceRelator);
                            break;
                    }
                    //await delay(300);
                }
                yield this.liqidObs.refresh();
                yield this.liqidComm.savePoolEdit(targetGroupPool);
            }
            catch (err) {
                // var grpIds = Object.keys(grpsInEditMode);
                // for (let i = 0; i < grpIds.length; i++) {
                //     await this.liqidComm.cancelPoolEdit(grpsInEditMode[grpIds[i]]);
                // }
                throw new Error(err);
            }
        });
        /**
         * Move specified devices to machine; devices must be in the machine's pool, or errors out
         * If device is already in machine, will leave it alone
         * @param {DeviceStatus[]}  devices Array of devices that will be moved
         * @param {number}          machId  mach_id: The target machine's ID
         */
        this.moveDevicesToMachine = (devices, machId) => __awaiter(this, void 0, void 0, function* () {
            let delay = (time) => { return new Promise((resolve) => { setTimeout(() => resolve(''), time); }); };
            try {
                if (devices.length == 0)
                    return;
                yield this.liqidObs.refresh();
                //gather all neccessary pieces and enter fabric edit mode
                var machine = this.liqidObs.getMachineById(machId);
                if (!machine)
                    throw new Error(`Machine Destination Error: Target machine with machine ID ${machId} does not exist.`);
                var group = this.liqidObs.getGroupById(machine.grp_id);
                yield this.liqidComm.enterFabricEditMode(machine);
                yield delay(300);
                //select only the devices that needs to be moved
                var transDevices = [];
                for (let i = 0; i < devices.length; i++) {
                    let predevice = this.liqidObs.getDeviceByName(devices[i].name);
                    if (!predevice || predevice.grp_id != machine.grp_id)
                        throw new Error(`Move Device To Machine Error: Device ${devices[i].name} is not in the same group as machine.`);
                    if (predevice.mach_id != 'n/a') {
                        if (parseInt(predevice.mach_id) == machine.mach_id)
                            continue;
                        throw new Error(`Move Device To Machine Error: Device ${devices[i].name} is currently in use by machine ${predevice.mname}.`);
                    }
                    transDevices.push(devices[i]);
                }
                //move devices to machine
                for (let i = 0; i < transDevices.length; i++) {
                    let machDeviceRelator = {
                        groupDeviceRelator: {
                            deviceStatus: transDevices[i],
                            group: group
                        },
                        machine: machine
                    };
                    switch (transDevices[i].type) {
                        case 'ComputeDeviceStatus':
                            yield this.liqidComm.addCpuToMach(machDeviceRelator);
                            break;
                        case 'GpuDeviceStatus':
                            yield this.liqidComm.addGpuToMach(machDeviceRelator);
                            break;
                        case 'SsdDeviceStatus':
                            yield this.liqidComm.addStorageToMach(machDeviceRelator);
                            break;
                        case 'LinkDeviceStatus':
                            yield this.liqidComm.addNetCardToMach(machDeviceRelator);
                            break;
                        case 'FpgaDeviceStatus':
                            yield this.liqidComm.addFpgaToMach(machDeviceRelator);
                            break;
                    }
                    //await delay(500);
                }
                yield this.liqidObs.refresh();
                yield this.liqidComm.reprogramFabric(machine);
            }
            catch (err) {
                throw new Error(err);
            }
        });
        /**
         * Decompose a machine
         * @param {Machine} machine The machine to be decomposed
         */
        this.decompose = (machine) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (machine)
                    yield this.liqidComm.deleteMachine(machine.mach_id);
            }
            catch (err) {
                throw new Error(err);
            }
        });
        this.liqidComm = new liqid_communicator_1.LiqidCommunicator(liqidIp);
        this.liqidObs = new liqid_observer_1.LiqidObserver(liqidIp);
        this.ready = false;
        this.busy = false;
    }
}
exports.LiqidController = LiqidController;
