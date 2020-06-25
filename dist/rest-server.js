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
const express = require("express");
const https = require("https");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const serveStatic = require("serve-static");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const liqid_observer_1 = require("./liqid-observer");
const liqid_controller_1 = require("./liqid-controller");
const LocalStrategy = passportLocal.Strategy;
var DeviceType;
(function (DeviceType) {
    DeviceType["cpu"] = "cpu";
    DeviceType["gpu"] = "gpu";
    DeviceType["ssd"] = "ssd";
    DeviceType["nic"] = "nic";
    DeviceType["optane"] = "optane";
    DeviceType["fpga"] = "fpga";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
// export interface SuccessResponse<T> {
//     code: number,
//     description: string,
//     content: T
// }
class RestServer {
    constructor(config) {
        this.config = config;
        this.summarizeAllDevices = (fabr_id) => {
            if (!this.liqidObservers.hasOwnProperty(fabr_id))
                return null;
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
        this.liqidObservers = {};
        this.liqidControllers = {};
        this.app = express();
        this.app.set('port', config.hostPort);
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        if (!config.sslCert)
            this.https = require('http').Server(this.app);
        else
            this.https = https.createServer({
                key: config.sslCert.privateKey,
                cert: config.sslCert.certificate,
                ca: config.sslCert.ca,
                requestCert: false,
                rejectUnauthorized: true,
                honorCipherOrder: true
            }, this.app);
        this.io = socketio(this.https, {
            pingTimeout: 600000
        });
        this.ready = false;
        this.enableGUI = config.enableGUI;
        this.socketioStarted = false;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.ready)
                    return;
                for (let i = 0; i < this.config.ips.length; i++) {
                    let obs = new liqid_observer_1.LiqidObserver(this.config.ips[i], this.config.names[i]);
                    let res = yield obs.start();
                    this.liqidObservers[obs.getFabricId()] = obs;
                    let ctrl = new liqid_controller_1.LiqidController(this.config.ips[i], this.config.names[i]);
                    res = yield ctrl.start();
                    this.liqidControllers[ctrl.getFabricId()] = ctrl;
                }
                // this.app.listen(this.config.hostPort, () => {
                //     console.log(`Server running on port ${this.config.hostPort}`);
                // });
                this.startSocketIOAndServer();
                this.setupAuthMiddleware();
                if (this.enableGUI)
                    this.useGUI();
                this.initializeCollectionsHandlers();
                this.initializeLookupHandlers();
                this.initializeDetailsHandlers();
                this.initializeControlHandlers();
                this.ready = true;
            }
            catch (err) {
                throw new Error('Could not start REST Server');
            }
        });
    }
    startSocketIOAndServer() {
        if (this.socketioStarted)
            return;
        this.socketioStarted = true;
        this.https.listen(this.config.hostPort, () => {
            console.log(`listening on *:${this.config.hostPort}`);
        });
        this.io.on('connection', (socket) => {
            socket.emit('init-config', { fabrIds: Object.keys(this.liqidObservers) });
            //new stuff vvv
            socket.emit('initialize', this.prepareFabricOverview());
            //new stuff ^^^
            socket.on('refresh-devices', () => {
                let deviceArray = [];
                let fabrIds = Object.keys(this.liqidObservers);
                for (let i = 0; i < fabrIds.length; i++) {
                    let devices = this.summarizeAllDevices(parseInt(fabrIds[i]));
                    deviceArray.push([]);
                    Object.keys(devices).forEach((deviceId) => {
                        deviceArray[i].push(devices[deviceId]);
                    });
                }
                socket.emit('liqid-state-update', { fabrIds: fabrIds, devices: deviceArray });
            });
            socket.on('reload', () => {
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
                socket.emit('update', response);
            });
            socket.on('create', (composeOpts) => {
                if (this.liqidObservers.hasOwnProperty(composeOpts.fabr_id)) {
                    this.liqidControllers[composeOpts.fabr_id].compose(composeOpts)
                        .then((mach) => {
                        socket.emit('success', mach);
                    }, err => {
                        socket.emit('err', 'Error composing machine.');
                    });
                }
                else {
                    socket.emit('err', `Fabric with fabr_id ${composeOpts.fabr_id} does not exist.`);
                }
            });
            socket.on('delete-machine', (machDeleteOpts) => {
                if (this.liqidObservers.hasOwnProperty(machDeleteOpts.fabr_id)) {
                    this.liqidControllers[machDeleteOpts.fabr_id].decompose(machDeleteOpts.id)
                        .then(() => {
                        socket.emit('success', 'Machine decomposed successfully.');
                    }, err => {
                        if (err)
                            socket.emit('err', 'There was a problem decomposing a machine.');
                    });
                }
                else {
                    socket.emit('err', `Fabric with fabr_id ${machDeleteOpts.fabr_id} does not exist.`);
                }
            });
            socket.on('delete-group', (grpDeleteOpts) => {
                if (this.liqidObservers.hasOwnProperty(grpDeleteOpts.fabr_id)) {
                    this.liqidControllers[grpDeleteOpts.fabr_id].deleteGroup(parseInt(grpDeleteOpts.id))
                        .then((group) => {
                        socket.emit('success', group);
                    }, err => {
                        socket.emit('err', 'Error deleting group.');
                    });
                }
                else {
                    socket.emit('err', `Fabric with fabr_id ${grpDeleteOpts.fabr_id} does not exist.`);
                }
            });
        });
        Object.keys(this.liqidObservers).forEach(fabrId => {
            //currently disabled in observer (not used)
            this.liqidObservers[fabrId].attachUpdateCallback(this.observerCallback);
        });
    }
    setupAuthMiddleware() {
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });
        passport.deserializeUser((id, done) => {
            if (id == 'mainUser') {
                done(null, { name: 'evlroot', id: 'mainUser' });
            }
        });
        passport.use(new LocalStrategy((username, password, done) => {
            if (username != 'evlroot') {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (password != 'getaccess[asdjkl90-]') {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, { name: username, id: 'mainUser' });
        }));
        this.app.use(cookieParser());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(session({
            secret: 'thismightwork',
            resave: false,
            saveUninitialized: true
        }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        var isLoggedIn = (req, res, next) => {
            if (req.isAuthenticated()) {
                return next();
            }
            else {
                return res.redirect('/login.html');
            }
        };
        if (this.enableGUI) {
            this.app.post('/login', passport.authenticate('local', {
                successRedirect: '/overview.html',
                failureRedirect: '/login.html',
                successFlash: true,
                failureFlash: true
            }));
        }
        else {
            this.app.post('/login', passport.authenticate('local', {
                successFlash: true,
                failureFlash: true
            }));
        }
        // this.app.use(serveStatic(path.resolve(__dirname, '../public')));
        // this.app.use(isLoggedIn, serveStatic(path.resolve(__dirname, '../private')));
        this.app.all('/api', isLoggedIn);
    }
    useGUI() {
        var isLoggedIn = (req, res, next) => {
            if (req.isAuthenticated()) {
                return next();
            }
            else {
                return res.redirect('/login.html');
            }
        };
        this.app.use(serveStatic(path.resolve(__dirname, '../public')));
        this.app.use(isLoggedIn, serveStatic(path.resolve(__dirname, '../private')));
    }
    useBuiltInGUI() {
        if (!this.enableGUI) {
            this.enableGUI = true;
            this.useGUI();
            return true;
        }
        return false;
    }
    observerCallback(fabrId) {
        let devicesMap = this.summarizeAllDevices(fabrId);
        let devices = [];
        Object.keys(devicesMap).forEach(deviceId => {
            devices.push(devicesMap[deviceId]);
        });
        //this.io.sockets.emit('liqid-state-update', { fabrIds: [fabrId.toString()], devices: [devices] });
        this.io.sockets.emit('fabric-update', this.prepareFabricOverview(fabrId));
    }
    prepareFabricOverview(fabrId) {
        let fabrIdsTemp = (fabrId != null) ? [fabrId.toString()] : Object.keys(this.liqidObservers);
        let fabrIds = [];
        let names = [];
        for (let i = 0; i < fabrIdsTemp.length; i++) {
            fabrIds.push(parseInt(fabrIdsTemp[i]));
            names.push(this.liqidObservers[fabrIdsTemp[i]].systemName);
        }
        let overview = {
            fabrIds: fabrIds,
            names: names,
            groups: [],
            devices: []
        };
        for (let i = 0; i < overview.fabrIds.length; i++) {
            let groups = this.liqidObservers[overview.fabrIds[i]].getGroups();
            let tempGroups = {};
            Object.keys(groups).forEach(grpId => {
                let group = {
                    fabrId: fabrIds[i],
                    grpId: groups[grpId].grp_id,
                    gname: groups[grpId].group_name,
                    machines: []
                };
                tempGroups[group.grpId] = group;
                //overview.groups[overview.fabrIds[i]].push(group);
            });
            let machines = this.liqidObservers[overview.fabrIds[i]].getMachines();
            let tempMachines = {};
            Object.keys(machines).forEach((machId) => {
                let machine = {
                    fabrId: fabrIds[i],
                    machId: machines[machId].mach_id,
                    mname: machines[machId].mach_name,
                    grpId: machines[machId].grp_id,
                    devices: []
                };
                tempMachines[machine.machId] = machine;
            });
            let devices = this.summarizeAllDevices(overview.fabrIds[i]);
            overview.devices.push([]);
            Object.keys(devices).forEach((deviceId) => {
                overview.devices[i].push(devices[deviceId]);
                if (devices[deviceId].mach_id)
                    tempMachines[devices[deviceId].mach_id].devices.push(devices[deviceId]);
            });
            Object.keys(tempMachines).forEach(machId => {
                tempGroups[tempMachines[machId].grpId].machines.push(tempMachines[machId]);
            });
            overview.groups.push([]);
            Object.keys(tempGroups).forEach(grpId => {
                overview.groups[i].push(tempGroups[grpId]);
            });
        }
        return overview;
    }
    prepareGroupInfo(fabrId, grpId) {
        if (grpId != null) {
            if (!this.liqidObservers.hasOwnProperty(fabrId))
                return null;
            let group = this.liqidObservers[fabrId].getGroupById(grpId);
            if (group == null)
                return null;
            let groupInfo = {
                fabrId: fabrId,
                grpId: group.grp_id,
                gname: group.group_name,
                machines: []
            };
            let machInfos = this.prepareMachineInfo(fabrId).machines;
            machInfos.forEach(machInfo => {
                if (machInfo.grpId == grpId) {
                    groupInfo.machines.push(machInfo);
                }
            });
            return groupInfo;
        }
        else if (fabrId != null) {
            if (!this.liqidObservers.hasOwnProperty(fabrId))
                return null;
            let groups = this.liqidObservers[fabrId].getGroups();
            let grpInfos = [];
            let machInfos = this.prepareMachineInfo(fabrId).machines;
            let tempGrpInfoMap = {};
            Object.keys(groups).forEach(grpId => {
                let grpInfo = {
                    fabrId: fabrId,
                    grpId: groups[grpId].grp_id,
                    gname: groups[grpId].group_name,
                    machines: []
                };
                tempGrpInfoMap[grpId] = grpInfo;
            });
            machInfos.forEach(machInfo => {
                if (tempGrpInfoMap.hasOwnProperty(machInfo.grpId)) {
                    tempGrpInfoMap[machInfo.grpId].machines.push(machInfo);
                }
            });
            Object.keys(tempGrpInfoMap).forEach(grpId => {
                grpInfos.push(tempGrpInfoMap[grpId]);
            });
            let grpWrapper = {
                fabrId: fabrId,
                groups: grpInfos
            };
            return grpWrapper;
        }
        else {
            let grpWrappers = [];
            Object.keys(this.liqidObservers).forEach(fabrId => {
                let groups = this.liqidObservers[fabrId].getGroups();
                let grpInfos = [];
                let machInfos = this.prepareMachineInfo(parseInt(fabrId)).machines;
                let tempGrpInfoMap = {};
                Object.keys(groups).forEach(grpId => {
                    let grpInfo = {
                        fabrId: parseInt(fabrId),
                        grpId: groups[grpId].grp_id,
                        gname: groups[grpId].group_name,
                        machines: []
                    };
                    tempGrpInfoMap[grpId] = grpInfo;
                });
                machInfos.forEach(machInfo => {
                    if (tempGrpInfoMap.hasOwnProperty(machInfo.grpId)) {
                        tempGrpInfoMap[machInfo.grpId].machines.push(machInfo);
                    }
                });
                Object.keys(tempGrpInfoMap).forEach(grpId => {
                    grpInfos.push(tempGrpInfoMap[grpId]);
                });
                let grpWrapper = {
                    fabrId: parseInt(fabrId),
                    groups: grpInfos
                };
                grpWrappers.push(grpWrapper);
            });
            return grpWrappers;
        }
    }
    prepareMachineInfo(fabrId, machId) {
        if (machId != null) {
            if (!this.liqidObservers.hasOwnProperty(fabrId))
                return null;
            let machine = this.liqidObservers[fabrId].getMachineById(machId);
            if (machine == null)
                return null;
            let machineInfo = {
                fabrId: fabrId,
                machId: machine.mach_id,
                mname: machine.mach_name,
                grpId: machine.grp_id,
                devices: []
            };
            let devices = this.summarizeAllDevices(fabrId);
            Object.keys(devices).forEach(deviceId => {
                if (devices[deviceId].mach_id == machine.mach_id) {
                    machineInfo.devices.push(devices[deviceId]);
                }
            });
            return machineInfo;
        }
        else if (fabrId != null) {
            if (!this.liqidObservers.hasOwnProperty(fabrId))
                return null;
            let machines = this.liqidObservers[fabrId].getMachines();
            let machineInfos = [];
            let devices = this.summarizeAllDevices(fabrId);
            let tempMachInfoMap = {};
            Object.keys(machines).forEach(machId => {
                let machineInfo = {
                    fabrId: fabrId,
                    machId: machines[machId].mach_id,
                    mname: machines[machId].mach_name,
                    grpId: machines[machId].grp_id,
                    devices: []
                };
                tempMachInfoMap[machId] = machineInfo;
            });
            Object.keys(devices).forEach(deviceId => {
                if (devices[deviceId].mach_id && tempMachInfoMap.hasOwnProperty(devices[deviceId].mach_id)) {
                    tempMachInfoMap[devices[deviceId].mach_id].devices.push(devices[deviceId]);
                }
            });
            Object.keys(tempMachInfoMap).forEach(machId => {
                machineInfos.push(tempMachInfoMap[machId]);
            });
            let machWrapper = {
                fabrId: fabrId,
                machines: machineInfos
            };
            return machWrapper;
        }
        else {
            let machWrappers = [];
            Object.keys(this.liqidObservers).forEach(fabrId => {
                let machines = this.liqidObservers[fabrId].getMachines();
                let machineInfos = [];
                let devices = this.summarizeAllDevices(parseInt(fabrId));
                let tempMachInfoMap = {};
                Object.keys(machines).forEach(machId => {
                    let machineInfo = {
                        fabrId: parseInt(fabrId),
                        machId: machines[machId].mach_id,
                        mname: machines[machId].mach_name,
                        grpId: machines[machId].grp_id,
                        devices: []
                    };
                    tempMachInfoMap[machId] = machineInfo;
                });
                Object.keys(devices).forEach(deviceId => {
                    if (devices[deviceId].mach_id && tempMachInfoMap.hasOwnProperty(devices[deviceId].mach_id)) {
                        tempMachInfoMap[devices[deviceId].mach_id].devices.push(devices[deviceId]);
                    }
                });
                Object.keys(tempMachInfoMap).forEach(machId => {
                    machineInfos.push(tempMachInfoMap[machId]);
                });
                let machWrapper = {
                    fabrId: parseInt(fabrId),
                    machines: machineInfos
                };
                machWrappers.push(machWrapper);
            });
            return machWrappers;
        }
    }
    prepareDevices(fabrId, deviceId) {
        if (deviceId != null) {
            let device = this.summarizeDevice(fabrId, deviceId);
            return device;
        }
        else if (fabrId != null) {
            let devices = this.summarizeAllDevices(fabrId);
            let devicesArray = [];
            Object.keys(devices).forEach(deviceId => {
                devicesArray.push(devices[deviceId]);
            });
            let deviceWrapper = {
                fabrId: fabrId,
                devices: devicesArray
            };
            return deviceWrapper;
        }
        else {
            let deviceWrappers = [];
            Object.keys(this.liqidObservers).forEach(fabrId => {
                let devices = this.summarizeAllDevices(parseInt(fabrId));
                let devicesArray = [];
                Object.keys(devices).forEach(deviceId => {
                    devicesArray.push(devices[deviceId]);
                });
                let deviceWrapper = {
                    fabrId: parseInt(fabrId),
                    devices: devicesArray
                };
                deviceWrappers.push(deviceWrapper);
            });
            return deviceWrappers;
        }
    }
    initializeCollectionsHandlers() {
        this.app.get('/api/groups', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            let data = this.prepareGroupInfo();
            res.json(data);
        });
        this.app.get('/api/machines', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            let data = this.prepareMachineInfo();
            res.json(data);
        });
        this.app.get('/api/devices', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            let data = this.prepareDevices();
            res.json(data);
        });
        this.app.get('/api/fabrics', (req, res, next) => {
            // res.setHeader('Content-Type', 'application/json');
            // let response: MainResponse = {
            //     fabrics: []
            // }
            // Object.keys(this.liqidObservers).forEach(fabr_id => {
            //     let fabric: Fabric = this.getInfoFromFabric(parseInt(fabr_id));
            //     if (!fabric)
            //         return null
            //     else
            //         response.fabrics.push(fabric);
            // });
            // res.json(response);
            res.setHeader('Content-Type', 'application/json');
            let data = this.prepareFabricOverview();
            res.json(data);
        });
    }
    initializeLookupHandlers() {
        this.app.get('/api/group/:fabr_id/:id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (parseInt(req.params.id) == NaN) {
                let err = { code: 400, description: 'id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                let data = this.prepareGroupInfo(parseInt(req.params.fabr_id), parseInt(req.params.id));
                if (data)
                    res.json(data);
                else {
                    let err = { code: 404, description: 'Group ' + parseInt(req.params.id) + ' does not exist.' };
                    res.status(err.code).json(err);
                }
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.get('/api/machine/:fabr_id/:id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (parseInt(req.params.id) == NaN) {
                let err = { code: 400, description: 'id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                let data = this.prepareMachineInfo(parseInt(req.params.fabr_id), parseInt(req.params.id));
                if (data)
                    res.json(data);
                else {
                    let err = { code: 404, description: 'Machine ' + parseInt(req.params.id) + ' does not exist.' };
                    res.status(err.code).json(err);
                }
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.get('/api/device/:fabr_id/:id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                let data = this.prepareDevices(parseInt(req.params.fabr_id), req.params.id);
                if (data)
                    res.json(data);
                else {
                    let err = { code: 404, description: 'Device ' + req.params.id + ' does not exist.' };
                    res.status(err.code).json(err);
                }
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
    }
    initializeDetailsHandlers() {
        this.app.get('/api/details/group/fabr_id/id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                this.liqidObservers[req.params.fabr_id].fetchGroupDetails(parseInt(req.params.id))
                    .then(data => {
                    res.json(data);
                }, err => {
                    res.status(err.code).json(err);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.get('/api/details/machine/fabr_id/id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                this.liqidObservers[req.params.fabr_id].fetchMachineDetails(parseInt(req.params.id))
                    .then(data => {
                    res.json(data);
                }, err => {
                    res.status(err.code).json(err);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.get('/api/details/device/fabr_id/id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidObservers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                this.liqidObservers[req.params.fabr_id].fetchDeviceDetails(req.params.id)
                    .then(data => {
                    res.json(data);
                }, err => {
                    res.status(err.code).json(err);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
    }
    initializeControlHandlers() {
        this.app.post('/api/group', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.body.fabrId == null || req.body.name == null) {
                let err = { code: 400, description: 'Request body is missing one or more required properties.' };
                res.status(err.code).json(err);
            }
            else if (typeof req.body.fabrId !== 'number') {
                let err = { code: 400, description: 'fabrId has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (typeof req.body.name !== 'string') {
                let err = { code: 400, description: 'name has to be a string.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidControllers.hasOwnProperty(Math.floor(req.body.fabrId))) {
                this.liqidControllers[req.body.fabrId].createGroup(req.body.name)
                    .then((group) => {
                    let data = this.prepareGroupInfo(Math.floor(req.body.fabrId), group.grp_id);
                    if (data) {
                        res.json(data);
                        this.liqidObservers[req.params.fabr_id].refresh()
                            .then(() => {
                            this.io.sockets.emit('fabric-update', this.prepareFabricOverview(parseInt(req.params.fabr_id)));
                        }, err => {
                            console.log('Group creation refresh failed: ' + err);
                        });
                    }
                    else {
                        let err = { code: 500, description: 'Group seems to be created, but final verification failed.' };
                        console.log(err);
                        res.status(err.code).json(err);
                    }
                }, err => {
                    let error = { code: err.code, description: err.description };
                    res.status(error.code).json(error);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.body.fabrId) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.delete('/api/group/:fabr_id/:id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (parseInt(req.params.id) == NaN) {
                let err = { code: 400, description: 'id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidControllers.hasOwnProperty(parseInt(req.params.fabr_id))) {
                let grpInfo = this.prepareGroupInfo(parseInt(req.params.fabr_id), parseInt(req.params.id));
                this.liqidControllers[req.params.fabr_id].deleteGroup(parseInt(req.params.id))
                    .then((group) => {
                    res.json(grpInfo);
                    this.liqidObservers[req.params.fabr_id].refresh()
                        .then(() => {
                        this.io.sockets.emit('fabric-update', this.prepareFabricOverview(parseInt(req.params.fabr_id)));
                    }, err => {
                        console.log('Group deletion refresh failed: ' + err);
                    });
                }, err => {
                    let error = { code: err.code, description: err.description };
                    res.status(error.code).json(error);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.post('/api/machine', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.body.fabrId == null || req.body.name == null) {
                let err = { code: 400, description: 'Request body is missing one or more required properties.' };
                res.status(err.code).json(err);
            }
            else if (typeof req.body.fabrId !== 'number') {
                let err = { code: 400, description: 'fabrId has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (typeof req.body.name !== 'string') {
                let err = { code: 400, description: 'name has to be a string.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidControllers.hasOwnProperty(Math.floor(req.body.fabrId))) {
                this.liqidControllers[req.body.fabrId].compose(req.body)
                    .then((mach) => {
                    let data = this.prepareMachineInfo(Math.floor(req.body.fabrId), mach.mach_id);
                    if (data) {
                        res.json(data);
                        this.liqidObservers[req.params.fabr_id].refresh()
                            .then(() => {
                            this.io.sockets.emit('fabric-update', this.prepareFabricOverview(parseInt(req.params.fabr_id)));
                        }, err => {
                            console.log('Machine compose refresh failed: ' + err);
                        });
                    }
                    else {
                        let err = { code: 500, description: 'Machine seems to be composed, but final verification failed.' };
                        console.log(err);
                        res.status(err.code).json(err);
                    }
                }, err => {
                    let error = { code: err.code, description: err.description };
                    res.status(error.code).json(error);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.body.fabrId) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
        this.app.delete('/api/machine/:fabr_id/:id', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            if (parseInt(req.params.fabr_id) == NaN) {
                let err = { code: 400, description: 'fabr_id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (parseInt(req.params.id) == NaN) {
                let err = { code: 400, description: 'id has to be a number.' };
                res.status(err.code).json(err);
            }
            else if (this.liqidControllers.hasOwnProperty(req.params.fabr_id)) {
                let machInfo = this.prepareMachineInfo(parseInt(req.params.fabr_id), parseInt(req.params.id));
                this.liqidControllers[req.params.fabr_id].decompose(parseInt(req.params.id))
                    .then((machine) => {
                    res.json(machInfo);
                    this.liqidObservers[req.params.fabr_id].refresh()
                        .then(() => {
                        this.io.sockets.emit('fabric-update', this.prepareFabricOverview(parseInt(req.params.fabr_id)));
                    }, err => {
                        console.log('Machine deletion refresh failed: ' + err);
                    });
                }, err => {
                    let error = { code: err.code, description: err.description };
                    res.status(error.code).json(error);
                });
            }
            else {
                let err = { code: 404, description: 'Fabric ' + parseInt(req.params.fabr_id) + ' does not exist.' };
                res.status(err.code).json(err);
            }
        });
    }
    summarizeDevice(fabr_id, name) {
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
                device.ipmi = this.liqidObservers[fabr_id].getIpmiAddressByName(name);
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
    }
}
exports.RestServer = RestServer;
