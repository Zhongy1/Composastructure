import { DeviceStatus, ComputeDeviceStatus, FPGADeviceStatus, GPUDeviceStatus, LinkDeviceStatus, SsdDeviceStatus, Machine, PreDevice, Group, MachineDeviceRelator, MachineDetails, NodeStatus, PendingGroupCommand, PendingMachineCommand, LiqidCoordinates, PredeviceParams, DeviceStatusParams, GroupPool, GroupDeviceRelator, GroupDetails, ManageableIpmiAddress, ManageableDevice, DeviceDetails } from './models';
export interface LiqidError {
    code: number;
    origin: 'communicator' | 'observer' | 'controller';
    description: string;
}
/**
 * Communicator for server and liqid system
```typescript
const communicator = new LiqidCommunicator(ip);
```
 */
export declare class LiqidCommunicator {
    private liqidIp;
    private liqidUri;
    constructor(liqidIp: string);
    getDeviceStats(options?: DeviceStatusParams): Promise<DeviceStatus[]>;
    getComputeDeviceStats(): Promise<ComputeDeviceStatus[]>;
    getParentCpus(): Promise<string[]>;
    getFPGADeviceStats(): Promise<FPGADeviceStatus[]>;
    getGpuDeviceStats(): Promise<GPUDeviceStatus[]>;
    getLinkDeviceStats(): Promise<LinkDeviceStatus[]>;
    getTargetDeviceStats(): Promise<SsdDeviceStatus[]>;
    cancelFabricEdit(machine: Machine): Promise<Machine>;
    enterFabricEditMode(machine: Machine): Promise<Machine>;
    getFabricId(): Promise<number>;
    reprogramFabric(machine: Machine): Promise<Machine>;
    getGroupList(): Promise<Group[]>;
    createGroup(group: Group): Promise<Group>;
    deleteGroup(id: number | string): Promise<Group>;
    getGroupDetails(id: number | string): Promise<GroupDetails>;
    getNextGroupId(): Promise<number>;
    getDeviceList(options?: PredeviceParams): Promise<PreDevice[]>;
    addCpuToPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    removeCpuFromPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    addFpgaToPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    removeFpgaFromPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    addGpuToPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    removeGpuFromPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    addNetCardToPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    removeNetCardFromPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    addStorageToPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    removeStorageFromPool(options: GroupDeviceRelator): Promise<GroupDeviceRelator>;
    cancelPoolEdit(clusterPool: GroupPool): Promise<GroupPool>;
    savePoolEdit(clusterPool: GroupPool): Promise<GroupPool>;
    enterPoolEditMode(clusterPool: GroupPool): Promise<GroupPool>;
    getMachineList(cid?: number | string, mid?: number | string, mname?: string): Promise<Machine[]>;
    createMachine(machine: Machine): Promise<Machine>;
    getMachineDetails(id: number | string): Promise<MachineDetails>;
    getNextMachineId(): Promise<string>;
    toggleP2P(mach: Machine): Promise<Machine>;
    deleteMachine(id: number | string): Promise<Machine>;
    addCpuToMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    removeCpuFromMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    addFpgaToMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    removeFpgaFromMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    addGpuToMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    removeGpuFromMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    addNetCardToMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    removeNetCardFromMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    addStorageToMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    removeStorageFromMach(options: MachineDeviceRelator): Promise<MachineDeviceRelator>;
    getManageableIpmiAddresses(): Promise<ManageableIpmiAddress[]>;
    getManageableDevices(): Promise<ManageableDevice[]>;
    getAllNodeStatus(): Promise<NodeStatus[]>;
    getNodeStatusByIds(fid: number | string, cid: number | string, mid: number | string, mname: string): Promise<NodeStatus>;
    getNodeStatusByCpuName(cpuName: string): Promise<NodeStatus>;
    getNodeStatusByCoordinates(coordinates: LiqidCoordinates): Promise<NodeStatus>;
    powerReboot(machine: Machine): Promise<Machine>;
    powerRestart(machine: Machine): Promise<Machine>;
    powerOff(machine: Machine): Promise<Machine>;
    powerOn(machine: Machine): Promise<Machine>;
    getDeviceStatusStream(): EventSource;
    getGroupStream(): EventSource;
    getGroupDetailsStream(): EventSource;
    getMachineStream(): EventSource;
    getMachDetailsStream(): EventSource;
    getPredeviceStream(): EventSource;
    getFlags(): Promise<string[]>;
    getPendingFabricCommands(fid: number | string): Promise<PendingMachineCommand[]>;
    getPendingGroupCommands(fid: number | string, cid: number | string): Promise<PendingGroupCommand[]>;
    getPendingMachineCommands(fid: number | string, cid: number | string, mid: number | string): Promise<PendingMachineCommand>;
    getDeviceDetails(device: DeviceStatus): Promise<DeviceDetails>;
}
