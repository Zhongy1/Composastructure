"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as libvirt from ('libvirt');
var libvirt;
var Hypervisor = libvirt.Hypervisor;
/**
 *
 *
 */
class LibvirtCommunicator {
    constructor(hostname, port) {
        this.ready = false;
        this.connect = () => {
        };
        this.disconnect = () => {
        };
        this.getCapabilities = () => {
        };
        this.getHostname = () => {
        };
        this.getSysInfo = () => {
        };
        this.getType = () => {
        };
        this.getConnectionUri = () => {
        };
        this.getVersion = () => {
        };
        this.getLibvirtVersion = () => {
        };
        this.isConnectionEncrypted = () => {
        };
        this.isConnectionSecure = () => {
        };
        this.isConnectionAlive = () => {
        };
        this.getMaxVcpus = () => {
        };
        this.setKeepAlive = () => {
        };
        this.getBaselineCpu = () => {
        };
        this.compareCPU = () => {
        };
        this.listDefinedDomains = () => {
        };
        this.listDefinedNetworks = () => {
        };
        this.listDefinedStoragePools = () => {
        };
        this.listDefinedInterfaces = () => {
        };
        this.listActiveDomains = () => {
        };
        this.listActiveInterfaces = () => {
        };
        this.listActiveNetworks = () => {
        };
        this.ListActiveStoragePools = () => {
        };
        this.listNetworkFilters = () => {
        };
        this.listSecrets = () => {
        };
        this.getNumberOfDefinedDomains = () => {
        };
        this.getNumberOfDefinedInterfaces = () => {
        };
        this.getNumberOfDefinedNetworks = () => {
        };
        this.getNumberOfDefinedStoragePools = () => {
        };
        this.getNumberOfActiveDomains = () => {
        };
        this.getNumberOfActiveInterfaces = () => {
        };
        this.getNumberOfActiveNetworks = () => {
        };
        this.getNumberOfNetworkFilters = () => {
        };
        this.getNumberOfSecrets = () => {
        };
        this.getNumberOfActiveStoragePools = () => {
        };
        // NODE
        this.listNodeDevices = () => {
        };
        this.getNodeSecurityModel = () => {
        };
        this.getNodeInfo = () => {
        };
        this.getNodeFreeMemory = () => {
        };
        this.getNodeMemoryStats = () => {
        };
        // INTERFACE
        this.lookupInterfaceByName = () => {
        };
        this.lookupInterfaceByMacAddress = () => {
        };
        this.defineInterface = () => {
        };
        // NETWORK
        this.createNetwork = () => {
        };
        this.lookupNetworkByName = () => {
        };
        this.lookupNetworkByUUID = () => {
        };
        this.defineNetwork = () => {
        };
        // NETWORK FILTER
        this.defineNetworkFilter = () => {
        };
        this.lookupNetworkFilterByName = () => {
        };
        this.lookupNetworkFilterByUUID = () => {
        };
        // STORAGE POOL
        this.createStoragePool = () => {
        };
        this.defineStoragePool = () => {
        };
        this.lookupStoragePoolByName = () => {
        };
        this.lookupStoragePoolByUUID = () => {
        };
        this.lookupStoragePoolByVolume = () => {
        };
        // STORAGE VOLUME
        this.lookupStorageVolumeByKey = () => {
        };
        this.lookupStorageVolumeByPath = () => {
        };
        // SECRET
        this.defineSecret = () => {
        };
        this.lookupSecretByUsage = () => {
        };
        this.lookupSecretByUUID = () => {
        };
        // NODE
        this.lookupNodeDeviceByName = () => {
        };
        this.createNodeDevice = () => {
        };
        // Domain
        this.createDomain = () => {
        };
        this.defineDomain = () => {
        };
        this.restoreDomain = () => {
        };
        this.lookupDomainById = () => {
        };
        this.lookupDomainByName = () => {
        };
        this.lookupDomainByUUID = () => {
        };
        this.hypervisor = new Hypervisor(`qemu+ssh://root@${hostname}:${port}/system`);
        this.hypervisor.connect(err => {
            if (err)
                this.ready = false;
            else
                this.ready = true;
        });
    }
}
exports.LibvirtCommunicator = LibvirtCommunicator;
