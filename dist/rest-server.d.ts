export interface RestServerConfig {
    ips: string[];
    hostPort: number;
}
export declare enum DeviceType {
    cpu = "cpu",
    gpu = "gpu",
    ssd = "ssd",
    nic = "nic",
    optane = "optane",
    fpga = "fpga"
}
export interface Device {
    id: string;
    type: DeviceType;
    fabr_id: number;
    grp_id: number;
    gname: string;
    mach_id: number;
    mname: string;
    lanes: number;
}
export interface SimplifiedMachine {
    mach_id: number;
    mname: string;
    grp_id: number;
    devices: Device[];
}
export interface Pool {
    grp_id: number;
    gname: string;
    unusedDevices: Device[];
    usedDevices: Device[];
    machines: SimplifiedMachine[];
}
export interface Fabric {
    fabricId: number;
    unassigned: Device[];
    assigned: {
        unusedDevices: Device[];
        usedDevices: Device[];
    };
    machines: SimplifiedMachine[];
    pools: Pool[];
}
export interface MainResponse {
    fabrics: Fabric[];
}
export declare class RestServer {
    private config;
    private liqidObservers;
    private liqidControllers;
    private app;
    private ready;
    constructor(config: RestServerConfig);
    private initializeCollectionsHandlers;
    private initializeLookupHandlers;
    private summarizeDevice;
    private summarizeAllDevices;
    private getInfoFromFabric;
    start: () => Promise<void>;
}
