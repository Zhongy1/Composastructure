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
        app.get("/DeviceStatus", (req, res, next) => {
            res.json(this.liqidObs.getDeviceStatuses());
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