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
var app = express();
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
app.get("/url", (req, res, next) => {
    res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});
class RestServer {
    constructor(liqidIp) {
        this.liqidIp = liqidIp;
        this.generateGetHandlers = () => {
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
        };
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.liqidObs.start();
                res = yield this.liqidCtl.start();
                this.generateGetHandlers();
                this.ready = true;
            }
            catch (err) {
                throw new Error('Could not start REST Server');
            }
        });
        this.liqidObs = new liqid_observer_1.LiqidObserver(liqidIp);
        this.liqidCtl = new liqid_controller_1.LiqidController(liqidIp);
        this.app = express();
        this.ready = false;
    }
}
exports.RestServer = RestServer;
