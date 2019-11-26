import * as express from 'express';
import { LiqidObserver } from './liqid-observer';
import { LiqidController } from './liqid-controller';
var app = express();

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get("/url", (req, res, next) => {
    res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});

export class RestServer {

    private liqidObs: LiqidObserver;
    private liqidCtl: LiqidController;
    private app: any;
    private ready;

    constructor(private liqidIp: string) {
        this.liqidObs = new LiqidObserver(liqidIp);
        this.liqidCtl = new LiqidController(liqidIp);
        this.app = express();
        this.ready = false;
    }

    private generateGetHandlers = (): void => {
        // /observer/getGroups
        app.get('/observer/getGroups', (req, res, next) => {
            res.json(this.liqidObs.getGroups());
        });
        // /observer/getMachines
        app.get('/observer/getMachines', (req, res, next) => {
            res.json(this.liqidObs.getMachines());
        });
        // /observer/getPreDevices
        app.get('/observer/getPreDevices', (req, res, next) => {
            res.json(this.liqidObs.getPreDevices());
        });
        // /observer/getDeviceStatuses
        app.get('/observer/getDeviceStatuses', (req, res, next) => {
            res.json(this.liqidObs.getDeviceStatuses());
        });
        // /observer/getGroupById/:grp_id
        app.get('/observer/getGroupById/:grp_id', (req, res, next) => {
            res.json(this.liqidObs.getGroupById(req.params.grp_id));
        });
        // /observer/getMachineById/:mach_id
        app.get('/observer/getMachineById/:mach_id', (req, res, next) => {
            res.json(this.liqidObs.getMachineById(req.params.mach_id));
        });
        // /observer/getDeviceByName/:name
        app.get('/observer/getPreDeviceByName/:name', (req, res, next) => {
            res.json(this.liqidObs.getPreDeviceByName(req.params.name));
        });
        // /observer/getDeviceStatusByName/:name
        app.get('/observer/getDeviceStatusByName/:name', (req, res, next) => {
            res.json(this.liqidObs.getDeviceStatusByName(req.params.name));
        });
        // /observer/getDeviceStatusesOrganized
        app.get('/observer/getDeviceStatusesOrganized', (req, res, next) => {
            res.json(this.liqidObs.getDeviceStatusesOrganized());
        });
        // /observer/getMiniTopology
        app.get('/observer/getMiniTopology', (req, res, next) => {
            res.json(this.liqidObs.getMiniTopology());
        });
    }

    public start = async (): Promise<void> => {
        try {
            let res = await this.liqidObs.start();
            res = await this.liqidCtl.start();
            this.generateGetHandlers();
            this.ready = true;
        }
        catch (err) {
            throw new Error('Could not start REST Server');
        }
    }
}