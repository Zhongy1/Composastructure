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
    pod_id: number,
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
export interface ControlFlag {
    name: string,
    value: string
}
export interface ControlFlagState {
    control_flag: ControlFlag,
    is_set: boolean
}
export interface DegradedSteps {

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
    fabric_type?: string,
    index?: number,
    lanes?: number,
    location?: LiqidCoordinates,
    name: string,
    owner?: LiqidCoordinates,
    pod_id: number,
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
    description?: ManageableEntryDescription,
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
    pod_id: number,
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
    pod_id: number,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    unique?: string
}
export interface Group {
    fabr_id: number,
    group_name: string,
    grp_id: number,
    pod_id: number
}
export interface GroupAssembly {
    assemblyTimestamp: AssemblyTimestamp,
    group: Group
}
export interface GroupDetails {
    'cpu-core-count': number,
    'cpu-count': number,
    'cpu-frequency': number,//double
    'cpu-lanes': number,
    'gpu-cores': number,
    'gpu-count': number,
    'group_name': string,
    'grp_id': number,
    'network-adapter-count': number,
    'storage-drive-count': number,
    'total-capacity': number,
    'total-dram': number,
    'total-machines': number,
    'total-throughput': string
}
export interface GroupDeviceRelator {
    deviceStatus: DeviceStatus,
    group: Group
}
export interface GroupPool {
    coordinates: LiqidCoordinates,
    fabr_id: number,
    grp_id: number
}
export interface HardwareComponent {

}
export interface Image {
    arguments: string,
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
    pod_id: number,
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
export interface LiqidDegradedSteps {
    index?: number,
    key?: string,
    steps?: string[],
    type: string
}
export interface LiqidReset {
    epoch: number
}
export interface Machine {
    comp_name?: string,
    connection_history?: ConnectionHistory[],
    fabr_gid: string,
    fabr_id: number,
    grp_id: number,
    index?: number,
    mach_id: number,
    mach_name: string,
    mtime?: number,
    p2p?: P2PStatus,
    port_gid?: string,
    swit_gid?: string,
    status?: Run //not originally part of Liqid's model
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
export interface MachineWithBusyDevice {
    device_gid: string,
    device_name: string,
    machine: Machine,
    port: string,
    type: string
}
export interface Manageable {
    type: string //ipmi | device
}
export interface ManageableDevice {
    type: string,
    capacity: number,
    companion_device: string,
    coreMhz: number
    cores: number,
    description: string,
    device_manufacturer: string,
    device_type: DeviceType,
    did: string,
    discovery_token: string,
    dram_size: number,
    dram_type: string,
    entry_description: ManageableEntryDescription,
    model: string,
    speed: number
    speed_string: string,
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
    ip_address: string,
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
    run: Run, //determines if machine is on/off?
    sw_vers: number,
    targs: number,
    uptime: string
}
export interface NullDegradedSteps {
    index: number,
    key: string,
    steps: string[],
    type: string //ManageableDevice|ManageableIpmiAddress
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
    dev_type: string,
    fabr_gid: string,
    fabr_id: number,
    flags: string,
    gname: string,
    grp_id: number,
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
export interface Result {
    'commandLine': string,
    'errorOutput': string,
    'exitValue': number,
    'standardOutput': string
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
    pod_id: string,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    capacity?: number
}
export interface UpgradeArguments {

}
export interface Version {

}

// For request parameters

export interface PredeviceParams {
    mach_id?: number | string,
    dev_type?: string,
    cid?: number | string
}
export interface DeviceStatusParams {

}



//** Special cases / Undocumented models
export interface DeviceDetails {
    index: number,
    name: string,
    flags: string,
    unique: string,
    location: LiqidCoordinates,
    owner: LiqidCoordinates,
    busgen: string,
    buswidth: string,
    vendor: string,
    model: string,
    family: string,
    device_type: string,
    device_state: string,
    fabric_type: string,
    dev_id: string,
    sled_id: string,
    fabr_gid: string,
    pod_id: number,
    pci_vendor: string,
    pci_device: string,
    udesc: string,
    part_num: string,
    class: string,
    serial_num: string,
    fw_rev: string
}
export interface CpuDetails extends DeviceDetails {
    core_cnt: number,
    core_mhz: number,
    thrd_cnt: number,
    dram_sz: number,
    inst_set: string,
    socket: string
}
export interface GpuDetails extends DeviceDetails {
    core_cnt: string,
    core_speed: string,
    cache_size: string,
    dram_size: string,
    dram_type: string
}
export interface SsdDetails extends DeviceDetails {
    capacity: string
}
export interface NicDetails extends DeviceDetails {
    link_speed: string
}