import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as bodyParser from 'body-parser';
import * as serveStatic from 'serve-static';
import * as path from 'path';
import { LiqidObserver } from './liqid-observer';
import { LiqidController, ComposeOptions } from './liqid-controller';
import { Group, Machine, PreDevice, DeviceStatus } from './models';

export interface RestServerConfig {
    ips: string[],
    hostPort: number
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
    lanes: number
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
    private http: http.Server;
    private io: socketio.Server;
    private ready: boolean;
    private socketioStarted: boolean;

    constructor(private config: RestServerConfig) {
        this.liqidObservers = {};
        this.liqidControllers = {};

        this.app = express();
        this.app.set('port', config.hostPort);
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.http = require('http').Server(this.app);
        this.io = socketio(this.http);
        this.ready = false;
        this.socketioStarted = false;
    }

    private startSocketIO = (): void => {
        if (this.socketioStarted) return;
        this.socketioStarted = true;
        this.app.use(serveStatic(path.resolve(__dirname, '../public')));
        const server = this.http.listen(this.config.hostPort, () => {
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
                        return null
                    else
                        response.fabrics.push(fabric);
                });
                socket.emit('update', response);
            });
            socket.on('create', (composeOpts) => {
                if (this.liqidObservers.hasOwnProperty(composeOpts.fabr_id)) {
                    this.liqidControllers[composeOpts.fabr_id].compose(composeOpts.body)
                        .then((mach) => {
                            socket.emit('success', mach);
                        }, err => {
                            socket.emit('error', 'Error composing machine.');
                        });
                }
                else {
                    socket.emit('error', `Fabric with fabr_id ${composeOpts.fabr_id} does not exist.`);
                }
            })
        });
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
                device.type = DeviceType.cpu
                break;
            case 'GpuDeviceStatus':
                device.type = DeviceType.gpu
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
            this.startSocketIO();
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