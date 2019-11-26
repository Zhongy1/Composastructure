export declare class RestServer {
    private liqidIp;
    private liqidObs;
    private liqidCtl;
    private app;
    private ready;
    constructor(liqidIp: string);
    private generateGetHandlers;
    start: () => Promise<void>;
}
