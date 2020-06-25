import { Run } from './models';
export interface RestServerConfig {
    ips: string[];
    names: string[];
    hostPort: number;
    sslCert?: any;
    enableGUI?: boolean;
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
    ipmi?: string;
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
export interface MachineInfo {
    fabrId: number;
    machId: number;
    mname: string;
    grpId: number;
    devices: Device[];
    status?: Run;
}
export interface GroupInfo {
    fabrId: number;
    grpId: number;
    gname: string;
    machines: MachineInfo[];
}
export interface GroupWrapper {
    fabrId: number;
    groups: GroupInfo[];
}
export interface MachineWrapper {
    fabrId: number;
    machines: MachineInfo[];
}
export interface DeviceWrapper {
    fabrId: number;
    devices: Device[];
}
export interface Overview {
    fabrIds: number[];
    names: string[];
    groups: GroupInfo[][];
    devices: Device[][];
}
export interface GroupCreateOptions {
    name: string;
    fabrId: number;
}
export interface BasicError {
    code: number;
    description: string;
}
export declare class RestServer {
    private config;
    private liqidObservers;
    private liqidControllers;
    private app;
    private apiRouter;
    private https;
    private io;
    private ready;
    private enableGUI;
    private socketioStarted;
    constructor(config: RestServerConfig);
    start(): Promise<void>;
    private startSocketIOAndServer;
    private setupAuthMiddleware;
    private useGUI;
    useBuiltInGUI(): boolean;
    observerCallback(fabrId: number): void;
    private prepareFabricOverview;
    private prepareGroupInfo;
    private prepareMachineInfo;
    private prepareDevices;
    private initializeCollectionsHandlers;
    private initializeLookupHandlers;
    private initializeDetailsHandlers;
    private initializeControlHandlers;
    private summarizeDevice;
    private summarizeAllDevices;
    private getInfoFromFabric;
}
