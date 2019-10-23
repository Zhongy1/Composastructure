import axios from 'axios';
import {
    DeviceStatus,
    ComputeDeviceStatus,
    FPGADeviceStatus,
    GPUDeviceStatus,
    LinkDeviceStatus,
    SsdDeviceStatus,
    Machine,
    PreDevice,
    Group,
    MachineDeviceRelator,
    MachineDetails,
    NodeStatus,
    PendingFabricCommand,
    PendingGroupCommand,
    PendingMachineCommand,
    LiqidCoordinates,
    PredeviceParams,
    DeviceStatusParams,
    GroupPool,
    GroupDeviceRelator
} from './models';

/**
 * Communicator for server and liqid system
```typescript
const communicator = new LiqidCommunicator(ip);
```
 */
export class LiqidCommunicator {
    private liqidUri: string;

    constructor(private liqidIp: string) {
        this.liqidUri = 'http://' + this.liqidIp + ':8080/liqidui';
    }

    //Assembly Controller
    //POST '/assembly/assemble' Assemble a specific machine. Requires MachineAssembly
    //POST '/assembly/assemble/all' Assemble each machine belonging to the specified group. Requires GroupAssembly
    //POST '/assembly/assemble/list' Report a machine assembly. Requires MachineAssembly
    //POST '/assembly/assemble/list/all' Report a group assembly. Requires GroupAssembly
    //POST '/assembly/clear' Clear all connection histories for a specific machine. Requires Machine
    //POST '/assembly/clear/all' Clear all connection histories for all machine's associated with the specified group. Requires Group
    //POST '/assembly/disassemble' Disassemble a specific machine. Requires Machine
    //POST '/assembly/disassemble/all' Disassemble each machine belonging to the specified group. Requires Group

    //Assignment Controller
    //GET '/assignment' Obtain the current ids
    //POST '/assignment' Set the ids. Accepts LiqidCoordinates

    //Boot Image Controller
    //GET '/bimg' List all available boot images. Accepts an object parameters (index|filename|date|owner)
    //DELETE '/bimg/{index}' Delete the specified boot image from the system. Accepts a number index
    //POST '/bimg/install' Install a boot image onto the specified boot device. Accepts BootImageMedia. 
    //POST '/bimg/upload' Upload a boot image to the server. Requires a file

    //Clear State Controller
    //POST '/reset' Disconnects the device connections to a cpu, removes liqos state info related to machines, groups, and devices and forces a Liqid rediscovery of the fabric. Requires no parameters
    //POST '/restart' This is a superset of "reset". It does everything reset does but also cycles all the Liqid process pids. Requires no parameters

    //Device Controller
    //PUT '/device/{device_id}' secure erase a drive. Accepts a device_id in hexadecimal
    //GET '/device/attributes' List available device attribute names and all existing values
    //PUT '/device/udesc/{device_type}/{device_id}' Create a device description for a specific device. Accepts a device_type (comp|targ|gpu|link), device_id as a hexadecimal, and DeviceDescription
    //DELETE '/device/udesc/{device_type}/{device_id}' Remove a device description for the specified device. Accepts just device_type and device_id

    //Device Discover Controller
    //GET '/devices/count' deviceCount. Accepts a number fabr_id

    //Device Status Controller
    //GET '/status' getStatus. Accepts a string criteria and an object parameters
    public getDeviceStats = (options?: DeviceStatusParams): Promise<DeviceStatus[]> => {
        return new Promise<DeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status', {
                params: options
            })
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/compute' getComputeDeviceStats. Accepts a string criteria and an object parameters
    public getComputeDeviceStats = (): Promise<ComputeDeviceStatus[]> => {
        return new Promise<ComputeDeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/compute')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/compute/parents' getParentCpus.
    public getParentCpus = (): Promise<string[]> => {
        return new Promise<string[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/compute/parents')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/fpga' getFpgaDeviceStats. Accepts a string criteria and an object parameters
    public getFPGADeviceStats = (): Promise<FPGADeviceStatus[]> => {
        return new Promise<FPGADeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/fpga')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/gpu' getGpuDeviceStats. Accepts a string criteria and an object parameters
    public getGpuDeviceStats = (): Promise<GPUDeviceStatus[]> => {
        return new Promise<GPUDeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/gpu')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/network' getLinkDeviceStats. Accepts a string criteria and an object parameters
    public getLinkDeviceStats = (): Promise<LinkDeviceStatus[]> => {
        return new Promise<LinkDeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/network')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/status/storage' getTargetDeviceStats. Accepts a string criteria and an object parameters
    public getTargetDeviceStats = (): Promise<SsdDeviceStatus[]> => {
        return new Promise<SsdDeviceStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/status/storage')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }

    //Fabric Controller
    //POST '/fabric/cancel' Exit fabric edit mode. Exiting fabric edit mode before a reprogram is issued will result in all device connections being reverted. Accepts Machine
    public cancelFabricEdit = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/fabric/cancel', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/fabric/edit' Enter fabric edit mode. Entering fabric edit mode allows the fabric to be electrically reconnected. The fabric MUST be put into edit mode before a device is added to a machine. Accepts Machine
    public enterFabricEditMode = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/fabric/edit', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/fabric/id' Report the current fabric id.
    public getFabricId = (): Promise<number> => {
        return new Promise<number>((resolve, reject) => {
            axios.get(this.liqidUri + '/fabric/id')
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/fabric/id/{id}' Switch to another fabric. EXPIREMENTAL. Accepts a number id 
    //POST '/fabric/reprogram' Reprogram the fabric. This will result in devices associated with a machine being electrically connected to the machine. This step MUST be done in order for a device to be added to a machine. Accepts Machine
    public reprogramFabric = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/fabric/reprogram', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/fabric/topology' Report the current fabric topology

    //Feedback Controller
    //POST '/feedback' reprogram. Requires JiraIssue

    //Group Controller
    //GET '/group' List all available groups. Accepts an object parameters (cid|fabr_id|cluster_name)
    public getGroupList = (): Promise<Group[]> => {
        return new Promise<Group[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/group')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }

    //POST '/group' Create a group. Accepts Group
    //DELETE '/group/{id}' Remove a group. Accepts an id
    //POST '/group/clear' Perform a reset without rediscovering devices.
    //GET '/group/details/{id}' Report the details for an individual group. Accepts an id
    //GET '/group/mapper' Maps a group name to group id. Accepts a string group-name
    //GET '/group/nextid' Report the next available group id.

    //Group Device Relator Contoller
    //GET '/predevice' List devices found on system. Accepts a string mach_id, a dev_type (comp|targ|gpu|link), and a string cid
    public getDeviceList = (options?: PredeviceParams): Promise<PreDevice[]> => {
        return new Promise<PreDevice[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/predevice', {
                params: options
            })
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/predevice/compute' Add a CPU device to the Group. Accepts GroupDeviceRelator
    public addCpuToPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/predevice/compute', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/predevice/compute' Remove a CPU device from the Group. Accepts GroupDeviceRelator
    public removeCpuFromPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/predevice/compute', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/predevice/fpga' Add a FPGA device to the Group. Accepts GroupDeviceRelator
    public addFpgaToPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/predevice/fpga', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/predevice/fpga' Remove a FPGA device from the Group. Accepts GroupDeviceRelator
    public removeFpgaFromPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/predevice/fpga', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/predevice/gpu' Add a GPU device to the Group. Accepts GroupDeviceRelator
    public addGpuToPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/predevice/gpu', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/predevice/gpu' Remove a GPU device from the Group. Accepts GroupDeviceRelator
    public removeGpuFromPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/predevice/gpu', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/predevice/network' Add a network device to the Group. Accepts GroupDeviceRelator
    public addNetCardToPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/predevice/network', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/predevice/network' Remove a network device from the Group. Accepts GroupDeviceRelator
    public removeNetCardFromPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/predevice/network', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/predevice/storage' Add a storage device to the Group. Accepts GroupDeviceRelator
    public addStorageToPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/predevice/storage', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        })
    }
    //DELETE '/predevice/storage' Remove a storage device from the Group. Accepts GroupDeviceRelator
    public removeStorageFromPool = (options: GroupDeviceRelator): Promise<GroupDeviceRelator> => {
        return new Promise<GroupDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/predevice/storage', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }

    //Group Pool Controller
    //POST '/pool/cancel' Cancel editing a group pool. This action will result in all devices either added/removed to/from a Group will be reverted. Requires GroupPool
    public cancelPoolEdit = (clusterPool: GroupPool): Promise<GroupPool> => {
        return new Promise<GroupPool>((resolve, reject) => {
            axios.post(this.liqidUri + '/pool/cancel', clusterPool)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/pool/done' Finish editing a group pool. Edit mode MUST be completed in order for devices to be added/removed to/from a group. Requires GroupPool
    public savePoolEdit = (clusterPool: GroupPool): Promise<GroupPool> => {
        return new Promise<GroupPool>((resolve, reject) => {
            axios.post(this.liqidUri + '/pool/done', clusterPool)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/pool/edit' Edit a group pool. Edit mode MUST be entered before adding/removing device(s) to/from a Group. Requires GroupPool
    public enterPoolEditMode = (clusterPool: GroupPool): Promise<GroupPool> => {
        return new Promise<GroupPool>((resolve, reject) => {
            axios.post(this.liqidUri + '/pool/edit', clusterPool)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }

    //Liqid Node Names Controller
    //GET '/node-names' getNodeNames. Accepts a string criteria and an object parameters

    //Machine Controller
    //GET /machine List all available machines. Accepts an object parameters (cid|mach_id|mach_name)
    public getMachineList = (cid?: number | string, mid?: number | string, mname?: string): Promise<Machine[]> => {
        let parameters: any = {};
        if (cid)
            parameters.cid = cid;
        if (mid)
            parameters.mach_id = mid;
        if (mname)
            parameters.mach_name = mname;
        return new Promise<Machine[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/machine', { params: parameters })
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST /machine Create a new machine. Accepts Machine
    public createMachine = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/machine', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET /machine/details/{id} Report the details associated with the machine. Requires id
    public getMachineDetails = (id: number | string): Promise<MachineDetails> => {
        return new Promise<MachineDetails>((resolve, reject) => {
            axios.get(this.liqidUri + '/machine/details/' + id)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET /machine/nextid Report the next available machine id.
    public getNextMachineId = (): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            axios.get(this.liqidUri + '/machine/nextid')
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST /machine/p2p Enable/disable P2P for a machine. Accepts Machine
    public toggleP2P = (mach: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/machine/p2p', mach)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE /machine/{id} Delete a machine. Accepts id
    public deleteMachine = (id: number | string): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.delete(this.liqidUri + '/machine/' + id)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                })
        });
    }

    //Machine Device Relator Controller
    //POST '/relate/compute' Add a CPU device to the Machine. Accepts MachineDeviceRelator
    public addCpuToMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/relate/compute', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/relate/compute' Remove a CPU device from the Machine. Accepts MachineDeviceRelator
    public removeCpuFromMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/relate/compute', { params: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/relate/fpga' Add a FPGA device to the Machine. Accepts MachineDeviceRelator
    public addFpgaToMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/relate/fpga', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/relate/fpga' Remove a FPGA device from the Machine. Accepts MachineDeviceRelator
    public removeFpgaFromMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/relate/fpga', { data: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/relate/gpu' Add a GPU device to the Machine. Accepts MachineDeviceRelator
    public addGpuToMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/relate/gpu', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/relate/gpu' Remove a GPU device from the Machine. Accepts MachineDeviceRelator
    public removeGpuFromMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/relate/gpu', { data: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/relate/network' Add a network device to the Machine. Accepts MachineDeviceRelator
    public addNetCardToMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/relate/network', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/relate/network' Remove a network device from the Machine. Accepts MachineDeviceRelator
    public removeNetCardFromMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/relate/network', { data: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/relate/storage' Add a storage device to the Machine. Accepts MachineDeviceRelator
    public addStorageToMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.post(this.liqidUri + '/relate/storage', options)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //DELETE '/relate/storage' Remove a storage device from the Machine. Accepts MachineDeviceRelator
    public removeStorageFromMach = (options: MachineDeviceRelator): Promise<MachineDeviceRelator> => {
        return new Promise<MachineDeviceRelator>((resolve, reject) => {
            axios.delete(this.liqidUri + '/relate/storage', { data: options })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }

    //Manager Controller


    //Node Configuration Controller


    //Node Status Controller
    //GET '/node/status' Report all available nodes.
    public getAllNodeStatus = (): Promise<NodeStatus[]> => {
        return new Promise<NodeStatus[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/node/status/')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/node/bound'(old) '/node/status/bound'(new) Report the NodeStatus of the specified machine. The NodeStatus is primarily used to determine if the node is in a booted state. Accepts an object parameters; required attributes: fabr_id, cluster_id, mach_id, mach_name
    public getNodeStatusByIds = (fid: number | string, cid: number | string, mid: number | string, mname: string): Promise<NodeStatus> => {
        return new Promise<NodeStatus>((resolve, reject) => {
            axios.get(this.liqidUri + '/node/status/bound', {
                params: {
                    fabr_id: fid,
                    cluster_id: cid,
                    mach_id: mid,
                    mach_name: mname
                }
            })
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/node/status/{cpuName}' Report the status for the node associated with the specified cpu name. Accepts a string cpuName
    public getNodeStatusByCpuName = (cpuName: string): Promise<NodeStatus> => {
        return new Promise<NodeStatus>((resolve, reject) => {
            axios.get(this.liqidUri + '/node/status/' + cpuName)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET '/node/status/{rack}/{shelf}/{node}' Report the status for the node which is located at the specified coordinates. Accepts rack, shelf, and node
    public getNodeStatusByCoordinates = (coordinates: LiqidCoordinates): Promise<NodeStatus> => {
        return new Promise<NodeStatus>((resolve, reject) => {
            axios.get(this.liqidUri + '/node/status/' + coordinates.rack + '/' + coordinates.shelf + '/' + coordinates.node)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }

    //Power Management Controller
    //POST '/power/reboot' Reboot the node. Accepts Machine
    public powerReboot = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/power/reboot', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/power/restart' Restart the node. Accepts Machine
    public powerRestart = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/power/restart', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/power/shutdown' Shutdown the node. Accepts Machine
    public powerOff = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/power/shutdown', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }
    //POST '/power/start' Start the node. Accepts Machine
    public powerOn = (machine: Machine): Promise<Machine> => {
        return new Promise<Machine>((resolve, reject) => {
            axios.post(this.liqidUri + '/power/start', machine)
                .then(res => {
                    resolve(res.data.response.data[0]);
                }, err => {
                    reject(err);
                });
        });
    }

    //Sse Controller
    //GET /sse/device deviceStatusEmitter
    public getDeviceStatusStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/device');
    }
    //GET /sse/group groupEmitter
    public getGroupStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/group');
    }
    //GET /sse/group/details groupDetailsEmitter
    public getGroupDetailsStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/group/details');
    }
    //GET /sse/machine machineEmitter
    public getMachineStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/machine');
    }
    //GET /sse/machine/details machineDetailsEmitter
    public getMachDetailsStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/machine/details');
    }
    //GET /sse/predevice predeviceEmitter
    public getPredeviceStream = (): EventSource => {
        return new EventSource(this.liqidUri + '/sse/predevice');
    }

    //State Controller
    //GET /state/flags List all existing Liqid flags.
    public getFlags = (): Promise<string[]> => {
        return new Promise<string[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/state/flags')
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET /state/{fabric} List all pending fabric commands. Requires a number farbic
    public getPendingFabricCommands = (fid: number | string): Promise<PendingMachineCommand[]> => {
        return new Promise<PendingFabricCommand[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/state/' + fid)
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET /state/{fabric}/{group} List all pending group commands. Requires a number fabric and a number group
    public getPendingGroupCommands = (fid: number | string, cid: number | string): Promise<PendingGroupCommand[]> => {
        return new Promise<PendingGroupCommand[]>((resolve, reject) => {
            axios.get(this.liqidUri + '/state/' + fid + '/' + cid)
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }
    //GET /state/{fabric}/{group}/{machine} List all pending machine commands. Requires a number fabric, a number group, amd a number machine
    public getPendingMachineCommands = (fid: number | string, cid: number | string, mid: number | string): Promise<PendingMachineCommand> => {
        return new Promise<PendingMachineCommand>((resolve, reject) => {
            axios.get(this.liqidUri + '/state/' + fid + '/' + cid + '/' + mid)
                .then(res => {
                    resolve(res.data.response.data);
                }, err => {
                    reject(err);
                });
        });
    }

    //Version Controller
    //GET '/version' List all available versions.

}