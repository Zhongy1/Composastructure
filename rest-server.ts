import * as express from 'express';
import * as https from 'https';
import * as socketio from 'socket.io';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as serveStatic from 'serve-static';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import * as tls from 'tls';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { LiqidObserver } from './liqid-observer';
import { LiqidController, ComposeOptions } from './liqid-controller';
import { Group, Machine, PreDevice, DeviceStatus } from './models';
import { userInfo } from 'os';

const LocalStrategy = passportLocal.Strategy;

export interface RestServerConfig {
    ips: string[],
    hostPort: number,
    sslCert?: any
}

export enum DeviceType {
    cpu = 'cpu',
    gpu = 'gpu',
    ssd = 'ssd',
    nic = 'nic',
    optane = 'optane',
    fpga = 'fpga'
}
export interface Device {
    id: string,
    type: DeviceType,
    fabr_id: number,
    grp_id: number,
    gname: string,
    mach_id: number,
    mname: string,
    lanes: number,
    ipmi?: string
}

export interface SimplifiedMachine {
    mach_id: number,
    mname: string,
    grp_id: number,
    devices: Device[]
}

export interface Pool {
    grp_id: number,
    gname: string,
    unusedDevices: Device[]
    usedDevices: Device[]
    machines: SimplifiedMachine[]
}

export interface Fabric {
    fabricId: number,
    unassigned: Device[],
    assigned: {
        unusedDevices: Device[],
        usedDevices: Device[]
    },
    machines: SimplifiedMachine[],
    pools: Pool[]
}

export interface MainResponse {
    fabrics: Fabric[]
}

export class RestServer {

    private liqidObservers: { [key: string]: LiqidObserver };
    private liqidControllers: { [key: string]: LiqidController };
    private app: express.Express;
    private https: https.Server;
    private io: socketio.Server;
    private ready: boolean;
    private socketioStarted: boolean;

    constructor(private config: RestServerConfig) {
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
        this.io = socketio(this.https);

        this.ready = false;
        this.socketioStarted = false;
    }

    private startSocketIOAndServer = (): void => {
        if (this.socketioStarted) return;
        this.socketioStarted = true;

        this.https.listen(this.config.hostPort, () => {
            console.log(`listening on *:${this.config.hostPort}`);
        });
        this.io.on('connection', (socket) => {
            socket.on('reload', () => {
                let response: MainResponse = {
                    fabrics: []
                }
                Object.keys(this.liqidObservers).forEach(fabr_id => {
                    let fabric: Fabric = this.getInfoFromFabric(parseInt(fabr_id));
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
                    this.liqidControllers[machDeleteOpts.fabr_id].decompose(this.liqidObservers[machDeleteOpts.fabr_id].getMachineById(machDeleteOpts.id))
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
            })
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
    }

    private setupAuthMiddleware = () => {
        passport.serializeUser((user: any, done) => {
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
            if (password != 'getaccess') {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, { name: username, id: 'mainUser' });
        }));

        this.app.use(cookieParser())
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
            } else {
                return res.redirect('/login.html');
            }
        }

        this.app.post('/login', passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login.html'
        }));

        this.app.use(serveStatic(path.resolve(__dirname, '../public')));
        this.app.use(isLoggedIn, serveStatic(path.resolve(__dirname, '../private')));
        this.app.all('/api', isLoggedIn);
    }

    private initializeCollectionsHandlers = (): void => {
        this.app.get('/api/groups', (req, res, next) => {
            let groups: { [key: string]: { [key: string]: Group } } = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                groups[fabr_id] = this.liqidObservers[fabr_id].getGroups();
            });
            res.json(groups);
        });
        this.app.get('/api/machines', (req, res, next) => {
            let machines: { [key: string]: { [key: string]: Machine } } = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                machines[fabr_id] = this.liqidObservers[fabr_id].getMachines();
            });
            res.json(machines);
        });
        this.app.get('/api/predevices', (req, res, next) => {
            let predevices: { [key: string]: { [key: string]: PreDevice } } = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                predevices[fabr_id] = this.liqidObservers[fabr_id].getPreDevices();
            });
            res.json(predevices);
        });
        this.app.get('/api/devicestatuses', (req, res, next) => {
            let devicestatuses: { [key: string]: { [key: string]: DeviceStatus } } = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                devicestatuses[fabr_id] = this.liqidObservers[fabr_id].getDeviceStatuses();
            });
            res.json(devicestatuses);
        });
        this.app.get('/api/devices', (req, res, next) => {
            let devices: { [key: string]: { [key: string]: Device } } = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                devices[fabr_id] = this.summarizeAllDevices(parseInt(fabr_id));
            });
            res.json(devices);
        });
        this.app.get('/api/fabrics', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            let response: MainResponse = {
                fabrics: []
            }
            Object.keys(this.liqidObservers).forEach(fabr_id => {
                let fabric: Fabric = this.getInfoFromFabric(parseInt(fabr_id));
                if (!fabric)
                    return null
                else
                    response.fabrics.push(fabric);
            });
            res.json(response);
        });
    }

    private initializeLookupHandlers = (): void => {
        this.app.get('/api/group/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id))
                res.json(this.liqidObservers[req.params.fabr_id].getGroupById(req.params.id));
            else
                res.json(null);
        });
        this.app.get('/api/machine/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id))
                res.json(this.liqidObservers[req.params.fabr_id].getMachineById(req.params.id));
            else
                res.json(null);
        });
        this.app.get('/api/devicestatus/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id))
                res.json(this.liqidObservers[req.params.fabr_id].getDeviceStatusByName(req.params.id));
            else
                res.json(null);
        });
        this.app.get('/api/predevice/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id))
                res.json(this.liqidObservers[req.params.fabr_id].getPreDeviceByName(req.params.id));
            else
                res.json(null);
        });
        this.app.get('/api/device/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id))
                res.json(this.summarizeDevice(parseInt(req.params.fabr_id), req.params.id));
            else
                res.json(null);
        });
    }

    private initializeControlHandlers = (): void => {
        this.app.post('/api/group', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.body.fabr_id)) {
                this.liqidControllers[req.body.fabr_id].createGroup(req.body.group_name)
                    .then((group) => {
                        res.send(group);
                    }, err => {
                        res.send('Error creating group.');
                    });
            }
        });
        this.app.delete('/api/group/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id)) {
                this.liqidControllers[req.params.fabr_id].deleteGroup(parseInt(req.params.id))
                    .then((group) => {
                        res.send(group);
                    }, err => {
                        res.send('Error deleting group.')
                    });
            }
        });
        this.app.post('/api/machine', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.body.fabr_id)) {
                this.liqidControllers[req.body.fabr_id].compose(req.body)
                    .then((mach) => {
                        res.send(mach);
                    }, err => {
                        res.send('Error composing machine.');
                    });
            }
            else {
                res.send(`Fabric with fabr_id ${req.body.fabr_id} does not exist.`);
            }
        });
        this.app.delete('/api/machine/:fabr_id/:id', (req, res, next) => {
            if (this.liqidObservers.hasOwnProperty(req.params.fabr_id)) {
                this.liqidControllers[req.params.fabr_id].decompose(this.liqidObservers[req.params.fabr_id].getMachineById(req.params.id))
                    .then(() => {
                        res.send('Machine decomposed successfully.');
                    }, err => {
                        if (err)
                            res.send('There was a problem decomposing a machine.');
                    });
            }
            else {
                res.send(`Fabric with fabr_id ${req.params.fabr_id} does not exist.`);
            }
        });

    }

    private summarizeDevice = (fabr_id: number, name: string): Device => {
        let device: Device = {
            id: name,
            type: null,
            fabr_id: fabr_id,
            grp_id: null,
            gname: null,
            mach_id: null,
            mname: null,
            lanes: 0
        };
        let deviceStatus: DeviceStatus = this.liqidObservers[fabr_id].getDeviceStatusByName(name);
        let preDevice: PreDevice = this.liqidObservers[fabr_id].getPreDeviceByName(name);
        if (!deviceStatus) return null;
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
        if (!preDevice) return device;
        device.grp_id = preDevice.grp_id;
        device.gname = preDevice.gname;
        if (preDevice.mach_id != 'n/a') {
            device.mach_id = parseInt(preDevice.mach_id);
            device.mname = preDevice.mname;
        }
        return device;
    }

    private summarizeAllDevices = (fabr_id: number): { [key: string]: Device } => {
        let devices: { [key: string]: Device } = {};
        let deviceStatuses = this.liqidObservers[fabr_id].getDeviceStatuses();
        Object.keys(deviceStatuses).forEach((dev_name) => {
            devices[dev_name] = this.summarizeDevice(fabr_id, dev_name);
        });
        return devices;
    }

    private getInfoFromFabric = (fabr_id: number): Fabric => {
        if (!this.liqidObservers.hasOwnProperty(fabr_id))
            return null;
        let fabric: Fabric = {
            fabricId: fabr_id,
            unassigned: [],
            assigned: {
                unusedDevices: [],
                usedDevices: []
            },
            machines: [],
            pools: []
        }
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
            let machine: SimplifiedMachine = {
                mach_id: machines[mach_id].mach_id,
                mname: machines[mach_id].mach_name,
                grp_id: machines[mach_id].grp_id,
                devices: []
            }
            fabric.assigned.usedDevices.forEach(device => {
                if (device.mach_id == parseInt(mach_id))
                    machine.devices.push(device);
            });
            fabric.machines.push(machine);
        });
        let groups = this.liqidObservers[fabr_id].getGroups();
        Object.keys(groups).forEach((grp_id) => {
            let pool: Pool = {
                grp_id: groups[grp_id].grp_id,
                gname: groups[grp_id].group_name,
                unusedDevices: [],
                usedDevices: [],
                machines: []
            }
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
    }

    public start = async (): Promise<void> => {
        try {
            for (let i = 0; i < this.config.ips.length; i++) {
                let obs = new LiqidObserver(this.config.ips[i]);
                let res = await obs.start();
                this.liqidObservers[obs.getFabricId()] = obs;
                let ctrl = new LiqidController(this.config.ips[i]);
                res = await ctrl.start();
                this.liqidControllers[ctrl.getFabricId()] = ctrl;
            }
            // this.app.listen(this.config.hostPort, () => {
            //     console.log(`Server running on port ${this.config.hostPort}`);
            // });
            this.startSocketIOAndServer();
            this.setupAuthMiddleware();
            this.initializeCollectionsHandlers();
            this.initializeLookupHandlers();
            this.initializeControlHandlers();
            this.ready = true;
        }
        catch (err) {
            throw new Error('Could not start REST Server');
        }
    }
}