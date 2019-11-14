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
const _ = require("lodash");
const liqid_communicator_1 = require("./liqid-communicator");
/**
 * Observer for liqid system state
```typescript
const observer = new LiqidObserver(ip);
```
 */
class LiqidObserver {
    constructor(liqidIp) {
        this.liqidIp = liqidIp;
        /**
         * Deep diff between two objects, using lodash.
         * @param  {Object} object Object compared
         * @param  {Object} base   Object to compare with
         * @return {Object}        Return a new object that represent the difference
         */
        this.difference = (object, base) => {
            function changes(object, base) {
                return _.transform(object, function (result, value, key) {
                    if (!_.isEqual(value, base[key])) {
                        result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                    }
                });
            }
            return changes(object, base);
        };
        /**
         * Start tracking Liqid. Check for updates at one second intervals. Stops when encounters an error.
         * The checking for updates at one second intervals is just a work around until a better solution is known.
         * @return  {Promise<boolean>}   Return true if start is successful; false if observer is already in an on state
         */
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.fabricTracked) {
                    this.fabricTracked = yield this.trackSystemChanges();
                    if (this.fabricTracked) {
                        this.mainLoop = setInterval(() => {
                            this.trackSystemChanges()
                                .then(success => {
                                if (!success)
                                    this.stop();
                            }, err => {
                                if (err)
                                    this.stop();
                            });
                        }, 1000);
                        return true;
                    }
                }
                return false;
            }
            catch (err) {
                this.fabricTracked = false;
                throw new Error('LiqidObserver start unsuccessful: possibly unable to communicate with Liqid.');
            }
        });
        /**
         * Stop tracking Liqid. Call start to resume.
         */
        this.stop = () => {
            if (!this.fabricTracked)
                return;
            this.fabricTracked = false;
            clearInterval(this.mainLoop);
        };
        /**
         * Refresh observer to get the lastest Liqid system state.
         */
        this.refresh = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let success = yield this.trackSystemChanges();
                if (!success)
                    throw new Error('');
            }
            catch (err) {
                throw new Error('Observer Refresh Error: refresh unsuccessful.');
            }
        });
        /**
         * Pulls up-to-date information from Liqid and compares/modifies existing information.
         * @return {Promise<boolean>}    The success of the operation
         */
        this.trackSystemChanges = () => __awaiter(this, void 0, void 0, function* () {
            var makeNecessaryUpdates = (update, target) => {
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
            };
            try {
                let groups = yield this.fetchGroups();
                let machines = yield this.fetchMachines();
                let devices = yield this.fetchDevices();
                let devStatuses = yield this.fetchDevStatuses();
                makeNecessaryUpdates(groups, this.groups);
                makeNecessaryUpdates(machines, this.machines);
                makeNecessaryUpdates(devices, this.devices);
                makeNecessaryUpdates(devStatuses, this.deviceStatuses);
                return true;
            }
            catch (err) {
                throw new Error('Issue with trackSystemChanges; halting tracking');
            }
        });
        /**
         * Fetch group information
         * @return {Promise<{ [key: string]: Group }}   Group mapping with id as key
         */
        this.fetchGroups = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let groupArray = yield this.liqidComm.getGroupList();
                groupArray.forEach((group) => {
                    map[group.grp_id] = group;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        /**
         * Fetch machine information
         * @return {Promise<{ [key: string]: Machine }}   Machine mapping with id as key
         */
        this.fetchMachines = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let machineArray = yield this.liqidComm.getMachineList();
                machineArray.forEach((machine) => {
                    map[machine.mach_id] = machine;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        /**
         * Fetch device information
         * @return {Promise<{ [key: string]: Predevice }}   Predevice mapping with name as key
         */
        this.fetchDevices = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let deviceArray = yield this.liqidComm.getDeviceList();
                deviceArray.forEach((device) => {
                    map[device.name] = device;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        /**
         * Fetch device statuses
         * @return {Promise<{ [key: string]: DeviceStatus }}   DeviceStatus mapping with name as key
         */
        this.fetchDevStatuses = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let devStatusArray = yield this.liqidComm.getDeviceStats();
                devStatusArray.forEach((status) => {
                    map[status.name] = status;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        /**
         * Get groups
         * @return {{ [key: string]: Group }}   Group mapping with id as key
         */
        this.getGroups = () => {
            return this.groups;
        };
        /**
         * Get machines
         * @return {{ [key: string]: Machine }} Machine mapping with id as key
         */
        this.getMachines = () => {
            return this.machines;
        };
        /**
         * Get devices
         * @return {{ [key: string]: Predevice }}   Predevice mapping with name as key
         */
        this.getDevices = () => {
            return this.devices;
        };
        /**
         * Get device statuses
         * @return {{ [key: string]: DeviceStatus }}    DeviceStatus mapping with name as key
         */
        this.getDeviceStatuses = () => {
            return this.deviceStatuses;
        };
        /**
         * Get group by group ID
         * @param {string | number} [id]    Optional ID used to select group
         * @return {Group}                  Group that matches the given id or null; if id is not specified, then the first available Group or null if no Groups available
         */
        this.getGroupById = (id) => {
            if (id) {
                return (this.groups.hasOwnProperty(id)) ? this.groups[id] : null;
            }
            else {
                let keys = Object.keys(this.groups);
                return (keys.length > 0) ? this.groups[keys[0]] : null;
            }
        };
        /**
         * Get machine by machine ID
         * @param {string | number} [id]    Optional ID used to select machine
         * @return {Machine}                Machine that matches the given id or null; if id is not specified, then the first available Machine or null if no Machines available
         */
        this.getMachineById = (id) => {
            if (id) {
                return (this.machines.hasOwnProperty(id)) ? this.machines[id] : null;
            }
            else {
                let keys = Object.keys(this.machines);
                return (keys.length > 0) ? this.machines[keys[0]] : null;
            }
        };
        /**
         * Get device by device name
         * @param {string | number} [name]  Optional name used to select predevice
         * @return {Predevice}              Predevice that matches the given name or null; if name is not specified, then the first available Predevice or null if no Predevices available
         */
        this.getDeviceByName = (name) => {
            if (name) {
                return (this.devices.hasOwnProperty(name)) ? this.devices[name] : null;
            }
            else {
                let keys = Object.keys(this.devices);
                return (keys.length > 0) ? this.devices[keys[0]] : null;
            }
        };
        /**
         * Get device status by device name
         * @param {string | number} [name]  Optional name used to select device status
         * @return {DeviceStatus}           DeviceStatus that matches the given name or null; if name is not specified, then the first available DeviceStatus or null if no DeviceStatuses available
         */
        this.getDeviceStatusByName = (name) => {
            if (name) {
                return (this.deviceStatuses.hasOwnProperty(name)) ? this.deviceStatuses[name] : null;
            }
            else {
                let keys = Object.keys(this.deviceStatuses);
                return (keys.length > 0) ? this.deviceStatuses[keys[0]] : null;
            }
        };
        /**
         * Get all device statuses organized by type
         * @return {OrganizedDeviceStatuses}    DeviceStatuses; grouped by cpu, gpu, ssd, nic, or fpga
         */
        this.getDeviceStatusesOrganized = () => {
            let statsOrganized = {
                cpu: {},
                gpu: {},
                ssd: {},
                nic: {},
                fpga: {}
            };
            Object.keys(this.deviceStatuses).forEach((devName) => {
                switch (this.deviceStatuses[devName].type) {
                    case 'ComputeDeviceStatus':
                        statsOrganized.cpu[devName] = this.deviceStatuses[devName];
                        break;
                    case 'GpuDeviceStatus':
                        statsOrganized.gpu[devName] = this.deviceStatuses[devName];
                        break;
                    case 'SsdDeviceStatus':
                        statsOrganized.ssd[devName] = this.deviceStatuses[devName];
                        break;
                    case 'LinkDeviceStatus':
                        statsOrganized.nic[devName] = this.deviceStatuses[devName];
                        break;
                }
            });
            return statsOrganized;
        };
        /**
         * Check if machine name is already in use
         * @param {string} name Name that will be checked
         * @return {boolean}    True if name exists already
         */
        this.checkMachNameExists = (name) => {
            Object.keys(this.machines).forEach((mach_id) => {
                if (this.machines.hasOwnProperty(mach_id) && this.machines[mach_id].mach_name == name)
                    return true;
            });
            return false;
        };
        /**
         * Primarily for the controller. Used to select the devices that will be used to compose a machine
         * @param {GatheringDevStatsOptions} options    Options for what devices to be gathered
         * @return {Promise<DeviceStatus[]>}            An array of the gathered devices
         */
        this.gatherRequiredDeviceStatuses = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                let devices = [];
                let deviceStats = this.getDeviceStatusesOrganized();
                let count = 0;
                if (typeof options.cpu === 'number') {
                    let deviceNames = Object.keys(deviceStats.cpu);
                    if (deviceNames.length < options.cpu)
                        throw new Error('The specified number of CPUs is more than what is currently available.');
                    if (options.gatherUnused) {
                        count = options.cpu;
                        for (let i = 0; i < deviceNames.length; i++) {
                            if (count <= 0)
                                break;
                            let predevice = this.getDeviceByName(deviceNames[i]);
                            if (predevice == null || predevice.mach_id == 'n/a') {
                                devices.push(deviceStats.cpu[deviceNames[i]]);
                                count--;
                            }
                        }
                        if (count > 0)
                            throw new Error('The specified number of CPUs is more than the number of CPUs that are unused.');
                    }
                    else {
                        for (let i = 0; i < options.cpu; i++)
                            devices.push(deviceStats.cpu[deviceNames[i]]);
                    }
                }
                else if (Array.isArray(options.cpu)) {
                    for (let i = 0; i < options.cpu.length; i++) {
                        if (deviceStats.cpu.hasOwnProperty(options.cpu[i])) {
                            if (options.gatherUnused) {
                                let predevice = this.getDeviceByName(options.cpu[i]);
                                if (predevice == null || predevice.mach_id == 'n/a')
                                    devices.push(deviceStats.cpu[options.cpu[i]]);
                                else
                                    throw new Error(`CPU ${options.cpu[i]} is currently in use by machine ${predevice.mname}.`);
                            }
                            else
                                devices.push(deviceStats.cpu[options.cpu[i]]);
                        }
                        else
                            throw new Error(`CPU ${options.cpu[i]} does not exist.`);
                    }
                }
                else
                    throw new Error('CPU specification is neither a number nor a string array.');
                if (typeof options.gpu === 'number') {
                    let deviceNames = Object.keys(deviceStats.gpu);
                    if (deviceNames.length < options.gpu)
                        throw new Error('The specified number of GPUs is more than what is currently available.');
                    if (options.gatherUnused) {
                        count = options.gpu;
                        for (let i = 0; i < deviceNames.length; i++) {
                            if (count <= 0)
                                break;
                            let predevice = this.getDeviceByName(deviceNames[i]);
                            if (predevice == null || predevice.mach_id == 'n/a') {
                                devices.push(deviceStats.gpu[deviceNames[i]]);
                                count--;
                            }
                        }
                        if (count > 0)
                            throw new Error('The specified number of GPUs is more than the number of GPUs that are unused.');
                    }
                    else {
                        for (let i = 0; i < options.gpu; i++)
                            devices.push(deviceStats.gpu[deviceNames[i]]);
                    }
                }
                else if (Array.isArray(options.gpu)) {
                    for (let i = 0; i < options.gpu.length; i++) {
                        if (deviceStats.gpu.hasOwnProperty(options.gpu[i])) {
                            if (options.gatherUnused) {
                                let predevice = this.getDeviceByName(options.gpu[i]);
                                if (predevice == null || predevice.mach_id == 'n/a')
                                    devices.push(deviceStats.gpu[options.gpu[i]]);
                                else
                                    throw new Error(`GPU ${options.gpu[i]} is currently in use by machine ${predevice.mname}.`);
                            }
                            else
                                devices.push(deviceStats.gpu[options.gpu[i]]);
                        }
                        else
                            throw new Error(`GPU ${options.gpu[i]} does not exist.`);
                    }
                }
                else
                    throw new Error('GPU specification is neither a number nor a string array.');
                if (typeof options.ssd === 'number') {
                    let deviceNames = Object.keys(deviceStats.ssd);
                    if (deviceNames.length < options.ssd)
                        throw new Error('The specified number of SSDs is more than what is currently available.');
                    if (options.gatherUnused) {
                        count = options.ssd;
                        for (let i = 0; i < deviceNames.length; i++) {
                            if (count <= 0)
                                break;
                            let predevice = this.getDeviceByName(deviceNames[i]);
                            if (predevice == null || predevice.mach_id == 'n/a') {
                                devices.push(deviceStats.ssd[deviceNames[i]]);
                                count--;
                            }
                        }
                        if (count > 0)
                            throw new Error('The specified number of SSDs is more than the number of SSDs that are unused.');
                    }
                    else {
                        for (let i = 0; i < options.ssd; i++)
                            devices.push(deviceStats.ssd[deviceNames[i]]);
                    }
                }
                else if (Array.isArray(options.ssd)) {
                    for (let i = 0; i < options.ssd.length; i++) {
                        if (deviceStats.ssd.hasOwnProperty(options.ssd[i])) {
                            if (options.gatherUnused) {
                                let predevice = this.getDeviceByName(options.ssd[i]);
                                if (predevice == null || predevice.mach_id == 'n/a')
                                    devices.push(deviceStats.ssd[options.ssd[i]]);
                                else
                                    throw new Error(`SSD ${options.ssd[i]} is currently in use by machine ${predevice.mname}.`);
                            }
                            else
                                devices.push(deviceStats.ssd[options.ssd[i]]);
                        }
                        else
                            throw new Error(`SSD ${options.ssd[i]} does not exist.`);
                    }
                }
                else
                    throw new Error('SSD specification is neither a number nor a string array.');
                if (typeof options.nic === 'number') {
                    let deviceNames = Object.keys(deviceStats.nic);
                    if (deviceNames.length < options.nic)
                        throw new Error('The specified number of NICs is more than what is currently available.');
                    if (options.gatherUnused) {
                        count = options.nic;
                        for (let i = 0; i < deviceNames.length; i++) {
                            if (count <= 0)
                                break;
                            let predevice = this.getDeviceByName(deviceNames[i]);
                            if (predevice == null || predevice.mach_id == 'n/a') {
                                devices.push(deviceStats.nic[deviceNames[i]]);
                                count--;
                            }
                        }
                        if (count > 0)
                            throw new Error('The specified number of NICs is more than the number of NICs that are unused.');
                    }
                    else {
                        for (let i = 0; i < options.nic; i++)
                            devices.push(deviceStats.nic[deviceNames[i]]);
                    }
                }
                else if (Array.isArray(options.nic)) {
                    for (let i = 0; i < options.nic.length; i++) {
                        if (deviceStats.nic.hasOwnProperty(options.nic[i])) {
                            if (options.gatherUnused) {
                                let predevice = this.getDeviceByName(options.nic[i]);
                                if (predevice == null || predevice.mach_id == 'n/a')
                                    devices.push(deviceStats.nic[options.nic[i]]);
                                else
                                    throw new Error(`NIC ${options.nic[i]} is currently in use by machine ${predevice.mname}.`);
                            }
                            else
                                devices.push(deviceStats.nic[options.nic[i]]);
                        }
                        else
                            throw new Error(`NIC ${options.nic[i]} does not exist.`);
                    }
                }
                else
                    throw new Error('NIC specification is neither a number nor a string array.');
                if (typeof options.fpga === 'number') {
                    let deviceNames = Object.keys(deviceStats.fpga);
                    if (deviceNames.length < options.fpga)
                        throw new Error('The specified number of FPGAs is more than what is currently available.');
                    if (options.gatherUnused) {
                        count = options.fpga;
                        for (let i = 0; i < deviceNames.length; i++) {
                            if (count <= 0)
                                break;
                            let predevice = this.getDeviceByName(deviceNames[i]);
                            if (predevice == null || predevice.mach_id == 'n/a') {
                                devices.push(deviceStats.fpga[deviceNames[i]]);
                                count--;
                            }
                        }
                        if (count > 0)
                            throw new Error('The specified number of FPGAs is more than the number of FPGAs that are unused.');
                    }
                    else {
                        for (let i = 0; i < options.fpga; i++)
                            devices.push(deviceStats.fpga[deviceNames[i]]);
                    }
                }
                else if (Array.isArray(options.fpga)) {
                    for (let i = 0; i < options.fpga.length; i++) {
                        if (deviceStats.fpga.hasOwnProperty(options.fpga[i])) {
                            if (options.gatherUnused) {
                                let predevice = this.getDeviceByName(options.fpga[i]);
                                if (predevice == null || predevice.mach_id == 'n/a')
                                    devices.push(deviceStats.fpga[options.fpga[i]]);
                                else
                                    throw new Error(`FPGA ${options.fpga[i]} is currently in use by machine ${predevice.mname}.`);
                            }
                            else
                                devices.push(deviceStats.fpga[options.fpga[i]]);
                        }
                        else
                            throw new Error(`FPGA ${options.fpga[i]} does not exist.`);
                    }
                }
                else
                    throw new Error('FPGA specification is neither a number nor a string array.');
                return devices;
            }
            catch (err) {
                throw new Error('Device Specification Error: ' + err);
            }
        });
        this.liqidComm = new liqid_communicator_1.LiqidCommunicator(liqidIp);
        this.groups = {};
        this.machines = {};
        this.devices = {};
        this.deviceStatuses = {};
        this.fabricTracked = false;
    }
}
exports.LiqidObserver = LiqidObserver;
