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
        this.ready = false;
        /**
         * Determine the current fabric id on which this controller is mounted
         */
        this.identifyFabricId = () => {
            this.liqidComm.getFabricId().then(id => {
                this.fabricId = id;
                this.ready = true;
            }, err => {
                setTimeout(() => { this.identifyFabricId(); }, 1000);
            });
        };
        /**
         * Compose a machine: specify the parts needed and the controller attempts to compose the machine. Aborts when an error is encountered.
         * @param {ComposeOptions} options  Specify parts needed either by name or by how many
         * @return {Machine}                Machine object, returned from Liqid
         */
        this.compose = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.ready)
                    throw new Error('Unready');
                if (options.hasOwnProperty('groupId')) {
                    var group = yield this.liqidObs.getGroupById(options.groupId);
                    if (group == null)
                        throw new Error('Specified groupId does not exist. Aborting Compose!');
                }
                else {
                    var group = yield this.liqidObs.getGroupById();
                    if (group == null)
                        throw new Error('There are currently no existing groups. Aborting Compose! Maybe create group in this step?');
                }
                if (this.liqidObs.checkMachNameExists(options.name))
                    throw new Error(`The machine name '${options.name}' already exists. Aborting Compose!`);
                let machine = {
                    cid: group.cid,
                    fabr_gid: '-1',
                    fabr_id: this.fabricId,
                    mach_id: parseInt(yield this.liqidComm.getNextMachineId()),
                    mach_name: options.name
                };
                let devices = [];
                let deviceStats = this.liqidObs.getDeviceStatusesOrganized();
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
                else
                    throw new Error('CPU specification is neither a number nor a string array. Aborting Compose!');
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
                else
                    throw new Error('GPU specification is neither a number nor a string array. Aborting Compose!');
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
                else
                    throw new Error('SSD specification is neither a number nor a string array. Aborting Compose!');
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
                else
                    throw new Error('NIC specification is neither a number nor a string array. Aborting Compose!');
                let transitionTime = new Promise((resolve) => { setTimeout(() => resolve(''), 500); });
                //Create machine first
                yield this.liqidComm.createMachine(machine);
                yield transitionTime;
                //Add devices to machine
                for (let i = 0; i < devices.length; i++) {
                    let machDevRelator = {
                        groupDeviceRelator: {
                            deviceStatus: devices[i],
                            group: group
                        },
                        machine: machine
                    };
                    switch (devices[i].type) {
                        case 'ComputeDeviceStatus':
                            yield this.liqidComm.addCpuToMach(machDevRelator);
                            break;
                        case 'GpuDeviceStatus':
                            yield this.liqidComm.addGpuToMach(machDevRelator);
                            break;
                        case 'SsdDeviceStatus':
                            yield this.liqidComm.addStorageToMach(machDevRelator);
                            break;
                        case 'LinkDeviceStatus':
                            yield this.liqidComm.addNetCardToMach(machDevRelator);
                            break;
                    }
                    yield transitionTime;
                    let returnMachine = yield this.liqidObs.getMachineById(machine.mach_id);
                    return returnMachine;
                }
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
        this.identifyFabricId();
    }
}
exports.LiqidController = LiqidController;
