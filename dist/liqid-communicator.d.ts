import { DeviceStatus, ComputeDeviceStatus, FPGADeviceStatus, GPUDeviceStatus, LinkDeviceStatus, SsdDeviceStatus, Machine, PreDevice, Group, MachineDeviceRelator, MachineDetails, NodeStatus, PendingGroupCommand, PendingMachineCommand, LiqidCoordinates, PredeviceParams, DeviceStatusParams } from './models';
export interface Communicator {
}
/**
 * Communicator for server and liqid system
```typescript
const instance = new LiqidCommunicator(ip);
```
 */
export declare class LiqidCommunicator implements Communicator {
    private liqidIp;
    constructor(liqidIp: string);
    getDeviceStats: (options?: DeviceStatusParams) => Promise<DeviceStatus[]>;
    getComputeDeviceStats: () => Promise<ComputeDeviceStatus[]>;
    getParentCpus: () => Promise<string[]>;
    getFPGADeviceStats: () => Promise<FPGADeviceStatus[]>;
    getGpuDeviceStats: () => Promise<GPUDeviceStatus[]>;
    getLinkDeviceStats: () => Promise<LinkDeviceStatus[]>;
    getTargetDeviceStats: () => Promise<SsdDeviceStatus[]>;
    enterEditMode: (machine: Machine) => Promise<Machine>;
    getFabricId: () => Promise<number>;
    reprogramFabric: (machine: Machine) => Promise<Machine>;
    getGroupList: () => Promise<Group[]>;
    getDeviceList: (options?: PredeviceParams) => Promise<PreDevice[]>;
    getMachineList: (cid?: string | number, mid?: string | number, mname?: string) => Promise<Machine[]>;
    createMachine: (machine: Machine) => Promise<Machine>;
    getMachineDetails: (id: string | number) => Promise<MachineDetails>;
    getNextMachineId: () => Promise<string>;
    toggleP2P: (mach: Machine) => Promise<Machine>;
    deleteMachine: (id: string | number) => Promise<Machine>;
    addCpuToMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    removeCpuFromMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    addFpgaToMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    removeFpgaFromMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    addGpuToMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    removeGpuFromMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    addNetCardToMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    removeNetCardFromMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    addStorageToMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    removeStorageFromMach: (options: MachineDeviceRelator) => Promise<MachineDeviceRelator>;
    getAllNodeStatus: () => Promise<NodeStatus[]>;
    getNodeStatusByIds: (fid: string | number, cid: string | number, mid: string | number, mname: string) => Promise<NodeStatus>;
    getNodeStatusByCpuName: (cpuName: string) => Promise<NodeStatus>;
    getNodeStatusByCoordinates: (coordinates: LiqidCoordinates) => Promise<NodeStatus>;
    powerReboot: (machine: Machine) => Promise<Machine>;
    powerRestart: (machine: Machine) => Promise<Machine>;
    powerOff: (machine: Machine) => Promise<Machine>;
    powerOn: (machine: Machine) => Promise<Machine>;
    getDeviceStatusStream: () => EventSource;
    getGroupStream: () => EventSource;
    getGroupDetailsStream: () => EventSource;
    getMachineStream: () => EventSource;
    getMachDetailsStream: () => EventSource;
    getPredeviceStream: () => EventSource;
    getFlags: () => Promise<string[]>;
    getPendingFabricCommands: (fid: string | number) => Promise<PendingMachineCommand[]>;
    getPendingGroupCommands: (fid: string | number, cid: string | number) => Promise<PendingGroupCommand[]>;
    getPendingMachineCommands: (fid: string | number, cid: string | number, mid: string | number) => Promise<PendingMachineCommand>;
}
