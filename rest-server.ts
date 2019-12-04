import * as express from 'express';
import { LiqidObserver } from './liqid-observer';
import { LiqidController } from './liqid-controller';
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

export class RestServer {

    private liqidObservers: { [key: string]: LiqidObserver };
    private liqidControllers: { [key: string]: LiqidController };
    private app: any;
    private ready;

    constructor(private config: RestServerConfig) {
        this.liqidObservers = {};
        this.liqidControllers = {};
        this.app = express();
        this.ready = false;

    }

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
            let categorizedItems = {};
            Object.keys(this.liqidObservers).forEach((fabr_id) => {
                categorizedItems[fabr_id] = {
                    unassignedDevices: {},
                    assignedPoolDevices: {},
                    assignedMachineDevices: {},
                    machines: {},
                    pools: {}
                };
                let groups = this.liqidObservers[fabr_id].getGroups();
                Object.keys(groups).forEach((grp_id) => {
                    categorizedItems[fabr_id].pools[grp_id] = { unassignedDevices: {} };
                });
                let machines = this.liqidObservers[fabr_id].getMachines();
                Object.keys(machines).forEach((mach_id) => {
                    categorizedItems[fabr_id].machines[mach_id] = {};
                    categorizedItems[fabr_id].pools[machines[mach_id].grp_id][mach_id] = {};
                });
                let summedDevices = this.summarizeAllDevices(parseInt(fabr_id));
                Object.keys(summedDevices).forEach((dev_name) => {
                    let device = summedDevices[dev_name];
                    if (!device.gname)
                        categorizedItems[fabr_id].unassignedDevices[dev_name] = device;
                    else if (!device.mname) {
                        categorizedItems[fabr_id].assignedPoolDevices[dev_name] = device;
                        categorizedItems[fabr_id].pools[device.grp_id].unassignedDevices[dev_name] = device;
                    }
                    else {
                        categorizedItems[fabr_id].assignedMachineDevices[dev_name] = device;
                        categorizedItems[fabr_id].pools[device.grp_id][device.mach_id][dev_name] = device;
                        categorizedItems[fabr_id].machines[device.mach_id][dev_name] = device;
                    }
                });
            });
            res.json(categorizedItems);
        });
    }

    private initializeLookupHandlers = (): void => {
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
    }
}