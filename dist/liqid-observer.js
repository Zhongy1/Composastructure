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
const instance = new LiqidObserver(ip);
```
 */
class LiqidObserver {
    constructor(liqidIp) {
        this.liqidIp = liqidIp;
        this.fabricTracked = false;
        /**
         * Deep diff between two objects, using lodash.
         * @param  {Object} object Object compared
         * @param  {Object} base   Object to compare with
         * @return {Object}        Return a new object who represent the diff
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
         */
        this.start = () => {
            if (this.fabricTracked)
                return;
            this.fabricTracked = true;
            this.mainLoop = setInterval(() => {
                this.trackSystemChanges()
                    .then(success => {
                    if (!success)
                        this.stop();
                });
            }, 1000);
        };
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
         * Pulls up-to-date statistics from Liqid and compares/modifies existing statistics.
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
            var returnVal = true;
            try {
                let groups = yield this.fetchGroups();
                let machines = yield this.fetchMachines();
                let devices = yield this.fetchDevices();
                let devStatuses = yield this.fetchDevStatuses();
                makeNecessaryUpdates(groups, this.groups);
                makeNecessaryUpdates(machines, this.machines);
                makeNecessaryUpdates(devices, this.devices);
                makeNecessaryUpdates(devStatuses, this.deviceStatuses);
            }
            catch (err) {
                console.log('Issue with trackSystemChanges; halting tracking');
                returnVal = false;
            }
            return returnVal;
        });
        /**
         * Fetch group information
         * @return {Promise<{ [key: string]: Group }}
         */
        this.fetchGroups = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let groupArray = yield this.Comm.getGroupList();
                groupArray.forEach((group) => {
                    map[group.cid] = group;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        this.fetchMachines = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let machineArray = yield this.Comm.getMachineList();
                machineArray.forEach((machine) => {
                    map[machine.mach_id] = machine;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        this.fetchDevices = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let deviceArray = yield this.Comm.getDeviceList();
                deviceArray.forEach((device) => {
                    map[device.name] = device;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        this.fetchDevStatuses = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let map = {};
                let devStatusArray = yield this.Comm.getDeviceStats();
                devStatusArray.forEach((status) => {
                    map[status.name] = status;
                });
                return map;
            }
            catch (err) {
                throw new Error(err);
            }
        });
        this.getGroups = () => {
            return this.groups;
        };
        this.getMachines = () => {
            return this.machines;
        };
        this.getDevices = () => {
            return this.devices;
        };
        this.getDeviceSatuses = () => {
            return this.deviceStatuses;
        };
        this.getGroupById = (id) => {
            if (id) {
                return (this.groups.hasOwnProperty(id)) ? this.groups[id] : null;
            }
            else {
                let keys = Object.keys(this.groups);
                return (keys.length > 0) ? this.groups[keys[0]] : null;
            }
        };
        this.getMachineById = (id) => {
            if (id) {
                return (this.machines.hasOwnProperty(id)) ? this.machines[id] : null;
            }
            else {
                let keys = Object.keys(this.machines);
                return (keys.length > 0) ? this.machines[keys[0]] : null;
            }
        };
        this.getDeviceByName = (name) => {
            if (name) {
                return (this.devices.hasOwnProperty(name)) ? this.devices[name] : null;
            }
            else {
                let keys = Object.keys(this.devices);
                return (keys.length > 0) ? this.devices[keys[0]] : null;
            }
        };
        this.getDeviceStatusesByName = (name) => {
            if (name) {
                return (this.deviceStatuses.hasOwnProperty(name)) ? this.deviceStatuses[name] : null;
            }
            else {
                let keys = Object.keys(this.deviceStatuses);
                return (keys.length > 0) ? this.deviceStatuses[keys[0]] : null;
            }
        };
        this.getDeviceStatusesOrganized = () => {
            let statsOrganized = {
                cpu: {},
                gpu: {},
                ssd: {},
                nic: {}
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
        this.checkMachNameExists = (name) => {
            Object.keys(this.machines).forEach((mach_id) => {
                if (this.machines.hasOwnProperty(mach_id) && this.machines[mach_id].mach_name == name)
                    return true;
            });
            return false;
        };
        this.Comm = new liqid_communicator_1.LiqidCommunicator(liqidIp);
        this.groups = {};
        this.machines = {};
        this.devices = {};
        this.deviceStatuses = {};
        this.start();
    }
}
exports.LiqidObserver = LiqidObserver;
