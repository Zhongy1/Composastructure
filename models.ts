export enum DeviceType {
    eth = 'eth', link = 'link', nic = 'nic', infi = 'infi', ssd = 'ssd', targ = 'targ', plx = 'plx', cpu = 'cpu', comp = 'comp', gpu = 'gpu', iba = 'iba', fch = 'fch', fpga = 'fpga', fibr = 'fibr', ramd = 'ramd', scm = 'scm', vic = 'vic', encl = 'encl'
}

export enum OSType {
    linux = 'linux', FreeBSD = 'FreeBSD', windows = 'windows', liqidOS = 'liqidos', mac_os_x = 'max os x', unknown = 'unknown'
}

export enum Run {
    up = 'up', on = 'on', off = 'off', unknown = 'unknown'
}

export enum P2PStatus {
    on = 'on', off = 'off'
}

export interface ApplicationVersion {
    'liqcfgd-version': Version,
    'liqmgt-version': Version,
    'liqmond-version': Version,
    'ui-version': Version
}

export interface AssemblyTimestamp {
    assemblyEndTime: number,
    assemblyStartTime: number
}
export interface ClusterDetails {
    cid: number,
    'cluster-name': string,
    'cpu-core-count': number,
    'cpu-count': number,
    'cpu-frequency': number,
    'cpu-lanes': number,
    'gpu-cores': number,
    'gpu-count': number,
    'network-adapter-count': number,
    'storage-drive-count': number,
    'total-capacity': number,
    'total-dram': number,
    'total-machines': number,
    'total-throughput': string
}
export interface ComputeDeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    fabric_type?: string,
    flags?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    hconn?: string,
    unique?: string
}
export interface ConfigurationEntry {
    comment?: string,
    description: ManageableEntryDescription,
    key: string,
    value: string
}
export interface ConfigurationEntryStanza {
    entries: ConfigurationEntry[]
}
export interface ConnectionHistory {
    atime: number,
    dev_type: DeviceType,
    dtime: number,
    fabr_gid: string,
    free: boolean,
    name: string,
    owner_gid: string,
    udesc: string
}
export interface Description {

}
export interface DeviceCount {
    comp_cnt: number,
    fpga_cnt: number,
    gpu_cnt: number,
    link_cnt: number,
    plx_cnt: number,
    targ_cnt: number
}
export interface DeviceDescription {
    udesc: string
}
export interface DeviceFilteringCriteria {
    attributes: any,
    deviceType: string//might be DeviceType
}
export interface DeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    flags?: string,
    index?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string
}
export interface DiscoveryToken {
    discover_token: string,
    index: number,
}
export interface ErrorMessage {
    code: number,
    message: string,
    type: string
}
export interface FabricConfigurationEntry {
    description?: Description,
    fabr_connect: ConfigurationEntry,
    fabr_thresh: ConfigurationEntry,
    fabr_type: ConfigurationEntry,
    fabricThreshhold?: ConfigurationEntry,
    name?: string
}
export interface FabricId {
    id: number
}
export interface FPGADeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    fabric_type?: string,
    flags?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    unique?: string
}
export interface GPUDeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    fabric_type?: string,
    flags?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    unique?: string
}
export interface Group {
    cid: number,
    cluster_name: string,
    fabr_id: number
}
export interface GroupAssembly {
    assemblyTimestamp: AssemblyTimestamp,
    group: Group
}
export interface GroupDeviceRelator {
    deviceStatus: DeviceStatus,
    group: Group
}
export interface GroupPool {
    cluster_id: number,
    coordinates: LiqidCoordinates,
    fabr_id: number
}
export interface HardwareComponent {

}
export interface Image {
    date?: string,
    filename: string,
    index: number,
    owner?: string,
    type: string
}
export interface ImageContext {
    device: any,
    host: any,
    image: Image,
    machine: Machine,
    type: string
}
export interface LinkDeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    fabric_type?: string,
    flags?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    unique?: string
}
export interface LiqidCoordinates {
    node: number,
    rack: number,
    shelf: number
}
export interface LiqidDaemonConfiguration {
    configurationEntries: ConfigurationEntry[],
    configurationEntryStanzas: ConfigurationEntryStanza[],
    fabricConfigurationEntries: FabricConfigurationEntry[]
}
export interface LiqidReset {
    epoch: number
}
export interface Machine {
    cid: number,
    comp_name?: string,
    connection_history?: ConnectionHistory[],
    fabr_gid: string,
    fabr_id: number,
    index?: number,
    mach_id: number,
    mach_name: string,
    mtime?: number,
    p2p?: P2PStatus,
    port_gid?: string,
    swit_gid?: string
}
export interface MachineAssembly {
    assemblyTimestamp: AssemblyTimestamp
    machine: Machine
}
export interface MachineAssemblyList {
    atime: number,
    dev_type: DeviceType,
    dtime: number,
    fabr_gid: string,
    fabr_id: number,
    free: boolean,
    mach_id: number,
    name: string,
    owner_gid: string,
    udesc: string
}
export interface MachineDetails {
    boot_device: string,
    boot_image: string,
    'cpu-cores': number,
    'cpu-frequency': string,
    'cpu-sockets': string,
    'cpu-threads': number,
    cpuSocketsField: string,
    created: number,
    'dram-memory': string,
    'fabric-connect': string,
    'fpga-count': number,
    'fpga-dram-size': number,
    'fpga-speed': string,
    'gpu-cores': number,
    'gpu-count': number,
    ip_address: string,
    ipmi_address: string,
    mach_id: number,
    mach_name: string,
    modified: number,
    'network-adapter-count': number,
    os_name: string,
    'storage-drive-count': number,
    'total-capacity': number,
    'total-throughput': string
}
export interface MachineDeviceRelator {
    groupDeviceRelator: GroupDeviceRelator,
    machine: Machine
}
export interface Manageable {
    type: string
}
export interface ManageableDevice {
    type: string,
    capacity: number,
    companionDevice: string,
    coreMhz: number
    cores: number,
    description: string,
    deviceManufacturer: string,
    deviceType: DeviceType,
    did: string,
    discoveryToken: string,
    dramSize: number,
    dramType: string,
    entry_description: ManageableEntryDescription
    model: string,
    speed: number
    speedString: string,
    threads: number,
    unique?: string,
    vid: string
}
export interface ManageableEntryDescription {
    active: boolean,
    required?: boolean
}
export interface ManageableIpmiAddress {
    type: string,
    cpu_name: string,
    credentials: any,
    ipmi_address: string,
    port: number
}
export interface NodeConfiguration {
    liqcfgd_configuration: LiqidDaemonConfiguration,
    liqmond_configuration: LiqidDaemonConfiguration
}
export interface NodeStatus {
    cfg_vers: number,
    cid: number,
    comps: number,
    currtime: string,
    fabr_id: number,
    flags: string,
    links: number,
    location: LiqidCoordinates,
    os_type: OSType,
    run: Run,
    sw_vers: number,
    targs: number,
    uptime: string
}
export interface PciNode {
    deviceType: DeviceType,
    hardwareComponent: HardwareComponent,
    id: number,
    name: string,
    parentId: number
}
export interface PendingCommandCoordinates {
    cid: number,
    fid: number,
    mid: number
}

export interface PendingFabricCommand {
    command: string,
    commandId: number,
    credentials: string,
    index: number
    options: PendingCommandCoordinates,
    start: string,
    stop: string,
    threadId: number,
    type: string
}

export interface PendingGroupCommand {
    command: string,
    commandId: number,
    credentials: string,
    index: number
    options: PendingCommandCoordinates,
    start: string,
    stop: string,
    threadId: number,
    type: string
}
export interface PendingMachineCommand {
    command: string,
    commandId: number,
    credentials: string,
    index: number
    options: PendingCommandCoordinates,
    start: string,
    stop: string,
    threadId: number,
    type: string
}
export interface PreDevice {
    cid: number,
    dev_type: string,
    fabr_gid: string,
    fabr_id: number,
    flags: string,
    gname: string,
    index: string,
    lanes: number,
    liqid_gid: string,
    mach_id: string,
    mname: string,
    name: string,
    owner_gid: string,
    port_gid: string,
    swit_gid: string
}
export interface ResponseBodyEmitter {
    timeout: number
}
export interface SsdDeviceStatus {
    dev_id?: string,
    device_state?: string,
    device_type?: string,
    did?: string,
    fabr_gid: string,
    fabr_id: number,
    flags?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    capacity?: number
}
export interface Version {

}


export interface PredeviceParams {
    mach_id?: number | string,
    dev_type?: string,
    cid?: number | string
}