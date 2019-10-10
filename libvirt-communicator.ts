// import * as libvirt from ('libvirt');
var libvirt;
var Hypervisor = libvirt.Hypervisor;
/**
 *
 *
 */





export class LibvirtCommunicator {

    private hypervisor;
    private ready: boolean = false;

    constructor(hostname, port) {
        this.hypervisor = new Hypervisor(`qemu+ssh://root@${hostname}:${port}/system`);
        this.hypervisor.connect(err => {
            if (err)
                this.ready = false;
            else
                this.ready = true;
        });
    }

    public connect = () => {

    }

    public disconnect = () => {

    }

    public getCapabilities = () => {

    }

    public getHostname = () => {

    }

    public getSysInfo = () => {

    }

    public getType = () => {

    }

    public getConnectionUri = () => {

    }

    public getVersion = () => {

    }

    public getLibvirtVersion = () => {

    }

    public isConnectionEncrypted = () => {

    }

    public isConnectionSecure = () => {

    }

    public isConnectionAlive = () => {

    }

    public getMaxVcpus = () => {

    }

    public setKeepAlive = () => {

    }

    public getBaselineCpu = () => {

    }

    public compareCPU = () => {

    }

    public listDefinedDomains = () => {

    }

    public listDefinedNetworks = () => {

    }

    public listDefinedStoragePools = () => {

    }

    public listDefinedInterfaces = () => {

    }

    public listActiveDomains = () => {

    }

    public listActiveInterfaces = () => {

    }

    public listActiveNetworks = () => {

    }

    public ListActiveStoragePools = () => {

    }

    public listNetworkFilters = () => {

    }

    public listSecrets = () => {

    }

    public getNumberOfDefinedDomains = () => {

    }

    public getNumberOfDefinedInterfaces = () => {

    }

    public getNumberOfDefinedNetworks = () => {

    }

    public getNumberOfDefinedStoragePools = () => {

    }

    public getNumberOfActiveDomains = () => {

    }

    public getNumberOfActiveInterfaces = () => {

    }

    public getNumberOfActiveNetworks = () => {

    }

    public getNumberOfNetworkFilters = () => {

    }

    public getNumberOfSecrets = () => {

    }

    public getNumberOfActiveStoragePools = () => {

    }


    // NODE
    public listNodeDevices = () => {

    }

    public getNodeSecurityModel = () => {

    }

    public getNodeInfo = () => {

    }

    public getNodeFreeMemory = () => {

    }

    public getNodeMemoryStats = () => {

    }


    // INTERFACE
    public lookupInterfaceByName = () => {

    }

    public lookupInterfaceByMacAddress = () => {

    }

    public defineInterface = () => {

    }


    // NETWORK
    public createNetwork = () => {

    }

    public lookupNetworkByName = () => {

    }

    public lookupNetworkByUUID = () => {

    }

    public defineNetwork = () => {

    }


    // NETWORK FILTER
    public defineNetworkFilter = () => {

    }

    public lookupNetworkFilterByName = () => {

    }

    public lookupNetworkFilterByUUID = () => {

    }


    // STORAGE POOL
    public createStoragePool = () => {

    }

    public defineStoragePool = () => {

    }

    public lookupStoragePoolByName = () => {

    }

    public lookupStoragePoolByUUID = () => {

    }

    public lookupStoragePoolByVolume = () => {

    }


    // STORAGE VOLUME
    public lookupStorageVolumeByKey = () => {

    }

    public lookupStorageVolumeByPath = () => {

    }


    // SECRET
    public defineSecret = () => {

    }

    public lookupSecretByUsage = () => {

    }

    public lookupSecretByUUID = () => {

    }


    // NODE
    public lookupNodeDeviceByName = () => {

    }

    public createNodeDevice = () => {

    }


    // Domain
    public createDomain = () => {

    }

    public defineDomain = () => {

    }

    public restoreDomain = () => {

    }

    public lookupDomainById = () => {

    }

    public lookupDomainByName = () => {

    }

    public lookupDomainByUUID = () => {

    }


}