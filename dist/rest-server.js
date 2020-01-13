"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const liqid_observer_1 = require("./liqid-observer");
const liqid_controller_1 = require("./liqid-controller");
var DeviceType;
(function (DeviceType) {
    DeviceType["cpu"] = "cpu";
    DeviceType["gpu"] = "gpu";
    DeviceType["ssd"] = "ssd";
    DeviceType["nic"] = "nic";
    DeviceType["optane"] = "optane";
    DeviceType["fpga"] = "fpga";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
class RestServer {
    constructor(config) {
        this.config = config;
        /*
        private generateGetHandlers = (): void => {
            // /observer/getGroups
            this.app.get('/observer/getGroups', (req, res, next) => {
                res.json(this.liqidObs.getGroups());
            });
            // /observer/getMachines
            this.app.get('/observer/getMachines', (req, res, next) => {
                res.json(this.liqidObs.getMachines());
            });
            // /observer/getPreDevices
            this.app.get('/observer/getPreDevices', (req, res, next) => {
                res.json(this.liqidObs.getPreDevices());
            });
            // /observer/getDeviceStatuses
            this.app.get('/observer/getDeviceStatuses', (req, res, next) => {
                res.json(this.liqidObs.getDeviceStatuses());
            });
            // /observer/getGroupById/:grp_id
            this.app.get('/observer/getGroupById/:grp_id', (req, res, next) => {
                res.json(this.liqidObs.getGroupById(req.params.grp_id));
            });
            // /observer/getMachineById/:mach_id
            this.app.get('/observer/getMachineById/:mach_id', (req, res, next) => {
                res.json(this.liqidObs.getMachineById(req.params.mach_id));
            });
            // /observer/getDeviceByName/:name
            this.app.get('/observer/getPreDeviceByName/:name', (req, res, next) => {
                res.json(this.liqidObs.getPreDeviceByName(req.params.name));
            });
            // /observer/getDeviceStatusByName/:name
            this.app.get('/observer/getDeviceStatusByName/:name', (req, res, next) => {
                res.json(this.liqidObs.getDeviceStatusByName(req.params.name));
            });
            // /observer/getDeviceStatusesOrganized
            this.app.get('/observer/getDeviceStatusesOrganized', (req, res, next) => {
                res.json(this.liqidObs.getDeviceStatusesOrganized());
            });
            // /observer/getMiniTopology
            this.app.get('/observer/getMiniTopology', (req, res, next) => {
                res.json(this.liqidObs.getMiniTopology());
            });
        }*/
        this.initializeCollectionsHandlers = () => {
            this.app.get('/api/groups', (req, res, next) => {
                let groups = {};
                Object.keys(this.liqidObservers).forEach((fabr_id) => {
                    groups[fabr_id] = this.liqidObservers[fabr_id].getGroups();
                });
                res.json(groups);
            });
            this.app.get('/api/machines', (req, res, next) => {
                let machines = {};
                Object.keys(this.liqidObservers).forEach((fabr_id) => {
                    machines[fabr_id] = this.liqidObservers[fabr_id].getMachines();
                });
                res.json(machines);
            });
            this.app.get('/api/predevices', (req, res, next) => {
                let predevices = {};
                Object.keys(this.liqidObservers).forEach((fabr_id) => {
                    predevices[fabr_id] = this.liqidObservers[fabr_id].getPreDevices();
                });
                res.json(predevices);
            });
            this.app.get('/api/devicestatuses', (req, res, next) => {
                let devicestatuses = {};
                Object.keys(this.liqidObservers).forEach((fabr_id) => {
                    devicestatuses[fabr_id] = this.liqidObservers[fabr_id].getDeviceStatuses();
                });
                res.json(devicestatuses);
            });
            this.app.get('/api/devices', (req, res, next) => {
                let devices = {};
                Object.keys(this.liqidObservers).forEach((fabr_id) => {
                    devices[fabr_id] = this.summarizeAllDevices(parseInt(fabr_id));
                });
                res.json(devices);
            });
            this.app.get('/api/fabrics', (req, res, next) => {
                res.setHeader('Content-Type', 'application/json');
                let response = {
                    fabrics: []
                };
                Object.keys(this.liqidObservers).forEach(fabr_id => {
                    let fabric = this.getInfoFromFabric(parseInt(fabr_id));
                    if (!fabric)
                        return null;
                    else
                        response.fabrics.push(fabric);
                });
                res.json(response);
            });
        };
        this.initializeLookupHandlers = () => {
            this.app.get('/api/group/:fabr_id/:id', (req, res, next) => {
                if (this.liqidObservers.hasOwnProperty(req.fabr_id))
                    res.json(this.liqidObservers[req.fabr_id].getGroupById(req.id));
                else
                    res.json(null);
            });
            this.app.get('/api/machine/:fabr_id/:id', (req, res, next) => {
                if (this.liqidObservers.hasOwnProperty(req.fabr_id))
                    res.json(this.liqidObservers[req.fabr_id].getMachineById(req.id));
                else
                    res.json(null);
            });
            this.app.get('/api/devicestatus/:fabr_id/:id', (req, res, next) => {
                if (this.liqidObservers.hasOwnProperty(req.fabr_id))
                    res.json(this.liqidObservers[req.fabr_id].getDeviceStatusByName(req.id));
                else
                    res.json(null);
            });
            this.app.get('/api/predevice/:fabr_id/:id', (req, res, next) => {
                if (this.liqidObservers.hasOwnProperty(req.fabr_id))
                    res.json(this.liqidObservers[req.fabr_id].getPreDeviceByName(req.id));
                else
                    res.json(null);
            });
            this.app.get('/api/device/:fabr_id/:id', (req, res, next) => {
                if (this.liqidObservers.hasOwnProperty(req.fabr_id))
                    res.json(this.summarizeDevice(req.fabr_id, req.id));
                else
                    res.json(null);
            });
        };
        this.summarizeDevice = (fabr_id, name) => {
            let device = {
                id: name,
                type: null,
                fabr_id: fabr_id,
                grp_id: null,
                gname: null,
                mach_id: null,
                mname: null,
                lanes: 0
            };
            let deviceStatus = this.liqidObservers[fabr_id].getDeviceStatusByName(name);
            let preDevice = this.liqidObservers[fabr_id].getPreDeviceByName(name);
            if (!deviceStatus)
                return null;
            switch (deviceStatus.type) {
                case 'ComputeDeviceStatus':
                    device.type = DeviceType.cpu;
                    break;
                case 'GpuDeviceStatus':
                    device.type = DeviceType.gpu;
                    break;
                case 'SsdDeviceStatus':
                    if (deviceStatus.name.indexOf('ssd') >= 0)
                        device.type = DeviceType.ssd;
                    else
                        device.type = DeviceType.optane;
                    break;
                case 'LinkDeviceStatus':
                    device.type = DeviceType.nic;
                    break;
                case 'FpgaDeviceStatus':
                    device.type = DeviceType.fpga;
                    break;
            }
            device.lanes = deviceStatus.lanes;
            if (!preDevice)
                return device;
            device.grp_id = preDevice.grp_id;
            device.gname = preDevice.gname;
            if (preDevice.mach_id != 'n/a') {
                device.mach_id = parseInt(preDevice.mach_id);
                device.mname = preDevice.mname;
            }
            return device;
        };
        this.summarizeAllDevices = (fabr_id) => {
            let devices = {};
            let deviceStatuses = this.liqidObservers[fabr_id].getDeviceStatuses();
            Object.keys(deviceStatuses).forEach((dev_name) => {
                devices[dev_name] = this.summarizeDevice(fabr_id, dev_name);
            });
            return devices;
        };
        this.getInfoFromFabric = (fabr_id) => {
            if (!this.liqidObservers.hasOwnProperty(fabr_id))
                return null;
            let fabric = {
                fabricId: fabr_id,
                unassigned: [],
                assigned: {
                    unusedDevices: [],
                    usedDevices: []
                },
                machines: [],
                pools: []
            };
            let summedDevices = this.summarizeAllDevices(fabr_id);
            Object.keys(summedDevices).forEach(id => {
                if (summedDevices[id].grp_id) {
                    if (summedDevices[id].mach_id)
                        fabric.assigned.usedDevices.push(summedDevices[id]);
                    else
                        fabric.assigned.unusedDevices.push(summedDevices[id]);
                }
                else
                    fabric.unassigned.push(summedDevices[id]);
            });
            let machines = this.liqidObservers[fabr_id].getMachines();
            Object.keys(machines).forEach((mach_id) => {
                let machine = {
                    mach_id: machines[mach_id].mach_id,
                    mname: machines[mach_id].mach_name,
                    grp_id: machines[mach_id].grp_id,
                    devices: []
                };
                fabric.assigned.usedDevices.forEach(device => {
                    if (device.mach_id == parseInt(mach_id))
                        machine.devices.push(device);
                });
                fabric.machines.push(machine);
            });
            let groups = this.liqidObservers[fabr_id].getGroups();
            Object.keys(groups).forEach((grp_id) => {
                let pool = {
                    grp_id: groups[grp_id].grp_id,
                    gname: groups[grp_id].group_name,
                    unusedDevices: [],
                    usedDevices: [],
                    machines: []
                };
                Object.keys(summedDevices).forEach(id => {
                    if (summedDevices[id].grp_id == parseInt(grp_id)) {
                        if (summedDevices[id].mach_id)
                            pool.usedDevices.push(summedDevices[id]);
                        else
                            pool.unusedDevices.push(summedDevices[id]);
                    }
                });
                fabric.machines.forEach(machine => {
                    if (machine.grp_id == parseInt(grp_id))
                        pool.machines.push(machine);
                });
                fabric.pools.push(pool);
            });
            return fabric;
        };
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            try {
                for (let i = 0; i < this.config.ips.length; i++) {
                    let obs = new liqid_observer_1.LiqidObserver(this.config.ips[i]);
                    let res = yield obs.start();
                    this.liqidObservers[obs.getFabricId()] = obs;
                    let ctrl = new liqid_controller_1.LiqidController(this.config.ips[i]);
                    res = yield ctrl.start();
                    this.liqidControllers[ctrl.getFabricId()] = ctrl;
                }
                this.app.listen(this.config.hostPort, () => {
                    console.log(`Server running on port ${this.config.hostPort}`);
                });
                this.initializeCollectionsHandlers();
                this.initializeLookupHandlers();
                this.ready = true;
            }
            catch (err) {
                throw new Error('Could not start REST Server');
            }
        });
        this.liqidObservers = {};
        this.liqidControllers = {};
        this.app = express();
        this.ready = false;
    }
}
exports.RestServer = RestServer;
