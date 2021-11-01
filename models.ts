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

export interface AbstractAuthProviderConfigurationContext {
    provider: 'okta' | 'google' | 'facebook' | 'keycloak',
    'provider-configuration': AuthProviderConfiguration
}
export interface ApplicationVersion {
    branch: string,
    changeset: string,
    changeset_short: string,
    component: string,
    date: string,
    date_short: string,
    version: string
}
export interface AssemblyTimestamp {
    assemblyEndTime: number,
    assemblyStartTime: number
}
export interface AuthMetaData {
    data: { [key: string]: string },
    mode: 'provided' | 'basic' | 'none'
}
export interface AuthProviderConfiguration {
    'authorization-uri': string,
    'client-secret': string,
    client_id: string,
    'jwk-set-uri': string,
    'token-uri': string
}
export interface CompositeEnclosureId {
    enclosure_index: number,
    vendor_id: number
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
export interface ComputeHostLicenseListing {
    'current host': number,
    licenses: string[],
    'max host licenses': number,
    name: string[]
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
    attributes: { [key: string]: string[] },
    deviceType: string//might be DeviceType
}
export interface DeviceStatus {
    conn_type?: string,
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
    fabr_altlogin: ConfigurationEntry[],
    fabr_connect: ConfigurationEntry[],
    fabr_encl: ConfigurationEntry[]
    fabr_thresh: ConfigurationEntry,
    fabr_type: ConfigurationEntry,
    fabricAlternateLoginEntrie?: ConfigurationEntry[],
    fabricThreshhold?: ConfigurationEntry,
    name?: string
}
export interface FabricId {
    id: number
}
export interface FabircToggleComposite {
    coordinates: LiqidCoordinates,
    flag: ControlFlag,
    options: 'add'
}
export interface FPGADeviceStatus {
    conn_type?: string,
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
    conn_type?: string,
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
export interface IpmiEclosureConnection {
    ipmi_addr: string,
    ipmi_login: string,
    ipmi_passwd: string
}
export interface KubernetesApplicationConfiguration {
    fabric_id: number,
    group_create: boolean,
    group_info: string,
    reset_after: boolean,
    reset_before: boolean,
    server: string,
    system_reset: boolean,
    type: string
}
export interface LinkDeviceStatus {
    conn_type?: string,
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
    fabricConfigurationEntries: FabricConfigurationEntry[],
    portSetConfigurationEntries: ConfigurationEntry[]
}
export interface LiqidDegradedSteps {
    index?: number,
    key?: string,
    steps?: string[],
    type: string
}
export interface LiqidDeploymentState {
    fabricId: number,
    fabricType: string,
    flags: string,
    flags2: string,
    flags3: string,
    instanceMode: string,
    kubernetesEnabled: boolean,
    liqidCoordinates: LiqidCoordinates,
    modeId: number,
    openstackEnabled: boolean,
    quorum: boolean,
    redfishEnabled: boolean,
    slurmEnabled: boolean
}
export interface LiqidNodeCoordinates {
    address: string,
    coordinates: LiqidCoordinates,
    port: number
}
export interface LiqidResetTimestamp {
    epoch: number
}
export interface ListResponseContainer<T> {
    response: ListResponse<T>
}
export interface ListResponse<T> {
    code: number,
    data: T[],
    errors: ErrorMessage[]
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
export interface MachineCreateAttribute {
    mach_create: string,
    name: string,
    type: string
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
    credentials: any,
    ip_address: string,
    port: number,
    type: 'ManageableDevice' | ' ManageableCpuIpmiNetworkConfig' | 'ManageableEnclosureIpmiNetworkConfig'
}
export interface ManageableDevice {
    credentials: any,
    ip_address: string,
    port: number,
    type: string,
    enclosure_name: string
}
export interface ManageableEntryDescription {
    active: boolean,
    required: boolean
}
export interface MappableFabric {
    fabrics: number[],
    'provider-role': string
}
export interface MappableGroup {
    groups: number[],
    'provider-role': string
}
export interface MappableRole {
    'liqid-role': 'ROLE_LIQID_ADMIN' | 'ROLE_LIQID_FABRIC_ADMIN' | 'ROLE_LIQID_GROUP_ADMIN' | 'ROLE_LIQID_READ_ONLY',
    'provider-role': string
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
export interface NorthboundApplicationState {
    application: 'slurm' | 'kubernetes' | 'redfish' | 'openstack',
    coordingates: LiqidCoordinates,
    fabric: number,
    status: 'enabled' | 'disabled'
}
export interface NullDegradedSteps {
    index?: number,
    key?: string,
    steps?: string[],
    type: 'ManageableDevice' | 'ManageableCpuIpmiNetworkConfig' | 'ManageableEnclosureIpmiNetworkConfig'
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
    mach_id: string,
    mname: string,
    name: string,
    owner_gid: string,
    port_gid: string,
    swit_gid: string
}
export interface RedfishEnclosureConnection {
    redfish_addr: string,
    redfish_login: string,
    redfish_passwd: string
}
export interface ResponseBodyEmitter {
    timeout: number
}
export interface Result {
    commandLine: string,
    errorOutput: string,
    exitValue: number,
    standardOutput: string
}
export interface RoleToFabricMapping {
    mappings: { [key: string]: number[] }
}
export interface RoleToGroupMapping {
    mappings: { [key: string]: number[] }
}
export interface RoleToRoleMapping {
    mappings: { [key: string]: string }
}
export interface SlurmApplicationConfiguration {
    fabric_id: number,
    group_create: boolean,
    group_info: string,
    reset_after: boolean,
    reset_before: boolean,
    server: string,
    system_reset: boolean,
    type: string
}
export interface SsdDeviceStatus {
    conn_type?: string,
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
    pod_id: string,
    port_gid?: string,
    sled_id?: string,
    swit_gid?: string,
    type: string,
    vid?: string,
    capacity?: number
}
export interface SshStatus {
    active: boolean,
    enabled: boolean
}
export interface UpgradeArguments {
    arguments: string
}
export interface VapiEnclosureConnection {
    vapi_addr: string,
    vapi_login: string,
    vapi_passwd: string
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