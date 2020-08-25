"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
/**
 * Communicator for server and liqid system
```typescript
const communicator = new LiqidCommunicator(ip);
```
 */
class LiqidCommunicator {
    constructor(liqidIp) {
        this.liqidIp = liqidIp;
        this.liqidUri = 'http://' + this.liqidIp + ':8080/liqid/api/v2';
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
    getDeviceStats(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status', {
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
    getComputeDeviceStats() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/compute')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/status/compute/parents' getParentCpus.
    getParentCpus() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/compute/parents')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/status/fpga' getFpgaDeviceStats. Accepts a string criteria and an object parameters
    getFPGADeviceStats() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/fpga')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/status/gpu' getGpuDeviceStats. Accepts a string criteria and an object parameters
    getGpuDeviceStats() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/gpu')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/status/network' getLinkDeviceStats. Accepts a string criteria and an object parameters
    getLinkDeviceStats() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/network')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/status/storage' getTargetDeviceStats. Accepts a string criteria and an object parameters
    getTargetDeviceStats() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/status/storage')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //Fabric Controller
    //POST '/fabric/cancel' Exit fabric edit mode. Exiting fabric edit mode before a reprogram is issued will result in all device connections being reverted. Accepts Machine
    cancelFabricEdit(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/fabric/cancel', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/fabric/edit' Enter fabric edit mode. Entering fabric edit mode allows the fabric to be electrically reconnected. The fabric MUST be put into edit mode before a device is added to a machine. Accepts Machine
    enterFabricEditMode(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/fabric/edit', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/fabric/id' Report the current fabric id.
    getFabricId() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/fabric/id')
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/fabric/id/{id}' Switch to another fabric. EXPIREMENTAL. Accepts a number id 
    //POST '/fabric/reprogram' Reprogram the fabric. This will result in devices associated with a machine being electrically connected to the machine. This step MUST be done in order for a device to be added to a machine. Accepts Machine
    reprogramFabric(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/fabric/reprogram', machine)
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
    getGroupList() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/group')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/group' Create a group. Accepts Group
    createGroup(group) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/group', group)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/group/{id}' Remove a group. Accepts an id
    deleteGroup(id) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/group/' + id)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/group/clear' Perform a reset without rediscovering devices.
    //GET '/group/details/{id}' Report the details for an individual group. Accepts an id
    getGroupDetails(id) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/group/details/' + id)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/group/mapper' Maps a group name to group id. Accepts a string group-name
    //GET '/group/nextid' Report the next available group id.
    getNextGroupId() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/group/nextid')
                .then(res => {
                resolve(parseInt(res.data.response.data[0]));
            }, err => {
                reject(err);
            });
        });
    }
    //Group Device Relator Contoller
    //GET '/predevice' List devices found on system. Accepts a string mach_id, a dev_type (comp|targ|gpu|link), and a string cid
    getDeviceList(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/predevice', {
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
    addCpuToPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/predevice/compute', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/predevice/compute' Remove a CPU device from the Group. Accepts GroupDeviceRelator
    removeCpuFromPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/predevice/compute', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/predevice/fpga' Add a FPGA device to the Group. Accepts GroupDeviceRelator
    addFpgaToPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/predevice/fpga', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/predevice/fpga' Remove a FPGA device from the Group. Accepts GroupDeviceRelator
    removeFpgaFromPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/predevice/fpga', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/predevice/gpu' Add a GPU device to the Group. Accepts GroupDeviceRelator
    addGpuToPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/predevice/gpu', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/predevice/gpu' Remove a GPU device from the Group. Accepts GroupDeviceRelator
    removeGpuFromPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/predevice/gpu', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/predevice/network' Add a network device to the Group. Accepts GroupDeviceRelator
    addNetCardToPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/predevice/network', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/predevice/network' Remove a network device from the Group. Accepts GroupDeviceRelator
    removeNetCardFromPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/predevice/network', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/predevice/storage' Add a storage device to the Group. Accepts GroupDeviceRelator
    addStorageToPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/predevice/storage', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/predevice/storage' Remove a storage device from the Group. Accepts GroupDeviceRelator
    removeStorageFromPool(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/predevice/storage', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //Group Pool Controller
    //POST '/pool/cancel' Cancel editing a group pool. This action will result in all devices either added/removed to/from a Group will be reverted. Requires GroupPool
    cancelPoolEdit(clusterPool) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/pool/cancel', clusterPool)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/pool/done' Finish editing a group pool. Edit mode MUST be completed in order for devices to be added/removed to/from a group. Requires GroupPool
    savePoolEdit(clusterPool) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/pool/done', clusterPool)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/pool/edit' Edit a group pool. Edit mode MUST be entered before adding/removing device(s) to/from a Group. Requires GroupPool
    enterPoolEditMode(clusterPool) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/pool/edit', clusterPool)
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
    getMachineList(cid, mid, mname) {
        let parameters = {};
        if (cid)
            parameters.cid = cid;
        if (mid)
            parameters.mach_id = mid;
        if (mname)
            parameters.mach_name = mname;
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/machine', { params: parameters })
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //POST /machine Create a new machine. Accepts Machine
    createMachine(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/machine', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //GET /machine/details/{id} Report the details associated with the machine. Requires id
    getMachineDetails(id) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/machine/details/' + id)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //GET /machine/nextid Report the next available machine id.
    getNextMachineId() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/machine/nextid')
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST /machine/p2p Enable/disable P2P for a machine. Accepts Machine
    toggleP2P(mach) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/machine/p2p', mach)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE /machine/{id} Delete a machine. Accepts id
    deleteMachine(id) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/machine/' + id)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //Machine Device Relator Controller
    //POST '/relate/compute' Add a CPU device to the Machine. Accepts MachineDeviceRelator
    addCpuToMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/relate/compute', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/relate/compute' Remove a CPU device from the Machine. Accepts MachineDeviceRelator
    removeCpuFromMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/relate/compute', { params: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/relate/fpga' Add a FPGA device to the Machine. Accepts MachineDeviceRelator
    addFpgaToMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/relate/fpga', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/relate/fpga' Remove a FPGA device from the Machine. Accepts MachineDeviceRelator
    removeFpgaFromMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/relate/fpga', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/relate/gpu' Add a GPU device to the Machine. Accepts MachineDeviceRelator
    addGpuToMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/relate/gpu', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/relate/gpu' Remove a GPU device from the Machine. Accepts MachineDeviceRelator
    removeGpuFromMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/relate/gpu', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/relate/network' Add a network device to the Machine. Accepts MachineDeviceRelator
    addNetCardToMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/relate/network', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/relate/network' Remove a network device from the Machine. Accepts MachineDeviceRelator
    removeNetCardFromMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/relate/network', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/relate/storage' Add a storage device to the Machine. Accepts MachineDeviceRelator
    addStorageToMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/relate/storage', options)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //DELETE '/relate/storage' Remove a storage device from the Machine. Accepts MachineDeviceRelator
    removeStorageFromMach(options) {
        return new Promise((resolve, reject) => {
            axios_1.default.delete(this.liqidUri + '/relate/storage', { data: options })
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //Manager Controller
    //GET '/manager/{type}' List all known managed entities; available types: ipmi, device
    getManageableIpmiAddresses() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/manager/network/ipmi/cpu')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    getManageableDevices() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/manager/device')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //Node Configuration Controller
    //GET '/node/config' Endpoint for displaying the default Liqid configuration. The configuration returned by this endpoint is filtered to remove any configuration entries which are not editable.
    //POST '/node/config' Endpoint for updating the system node configuration.
    //Node Status Controller
    //GET '/node/status' Report all available nodes.
    getAllNodeStatus() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/node/status')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/node/bound'(old) '/node/status/bound'(new) Report the NodeStatus of the specified machine. The NodeStatus is primarily used to determine if the node is in a booted state. Accepts an object parameters; required attributes: fabr_id, cluster_id, mach_id, mach_name
    getNodeStatusByIds(fid, cid, mid, mname) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/node/status/bound', {
                params: {
                    fabr_id: fid,
                    group_id: cid,
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
    getNodeStatusByCpuName(cpuName) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/node/status/' + cpuName)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //GET '/node/status/{rack}/{shelf}/{node}' Report the status for the node which is located at the specified coordinates. Accepts rack, shelf, and node
    getNodeStatusByCoordinates(coordinates) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/node/status/' + coordinates.rack + '/' + coordinates.shelf + '/' + coordinates.node)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //Power Management Controller
    //POST '/power/reboot' Reboot the node. Accepts Machine
    powerReboot(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/power/reboot', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/power/restart' Restart the node. Accepts Machine
    powerRestart(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/power/restart', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/power/shutdown' Shutdown the node. Accepts Machine
    powerOff(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/power/shutdown', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //POST '/power/start' Start the node. Accepts Machine
    powerOn(machine) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.liqidUri + '/power/start', machine)
                .then(res => {
                resolve(res.data.response.data[0]);
            }, err => {
                reject(err);
            });
        });
    }
    //Sse Controller
    //GET /sse/device deviceStatusEmitter
    getDeviceStatusStream() {
        return new EventSource(this.liqidUri + '/sse/device');
    }
    //GET /sse/group groupEmitter
    getGroupStream() {
        return new EventSource(this.liqidUri + '/sse/group');
    }
    //GET /sse/group/details groupDetailsEmitter
    getGroupDetailsStream() {
        return new EventSource(this.liqidUri + '/sse/group/details');
    }
    //GET /sse/machine machineEmitter
    getMachineStream() {
        return new EventSource(this.liqidUri + '/sse/machine');
    }
    //GET /sse/machine/details machineDetailsEmitter
    getMachDetailsStream() {
        return new EventSource(this.liqidUri + '/sse/machine/details');
    }
    //GET /sse/predevice predeviceEmitter
    getPredeviceStream() {
        return new EventSource(this.liqidUri + '/sse/predevice');
    }
    //State Controller
    //GET /state/flags List all existing Liqid flags.
    getFlags() {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/state/flags')
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET /state/{fabric} List all pending fabric commands. Requires a number farbic
    getPendingFabricCommands(fid) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/state/' + fid)
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET /state/{fabric}/{group} List all pending group commands. Requires a number fabric and a number group
    getPendingGroupCommands(fid, cid) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/state/' + fid + '/' + cid)
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //GET /state/{fabric}/{group}/{machine} List all pending machine commands. Requires a number fabric, a number group, amd a number machine
    getPendingMachineCommands(fid, cid, mid) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(this.liqidUri + '/state/' + fid + '/' + cid + '/' + mid)
                .then(res => {
                resolve(res.data.response.data);
            }, err => {
                reject(err);
            });
        });
    }
    //Version Controller
    //GET '/version' List all available versions.
    //** Special cases / Undocumented endpoints **
    getDeviceDetails(device) {
        let endpoint = this.liqidUri + '/system/device/info';
        switch (device.type) {
            case 'ComputeDeviceStatus':
                endpoint += '/cpu/' + device.name;
                break;
            case 'GpuDeviceStatus':
                endpoint += '/gpu/' + device.name;
                break;
            case 'SsdDeviceStatus':
                endpoint += '/ssd/' + device.name;
                break;
            case 'LinkDeviceStatus':
                endpoint += '/link/' + device.name;
                break;
            case 'FpgaDeviceStatus':
                endpoint += '/fpga/' + device.name;
                break;
        }
        return new Promise((resolve, reject) => {
            axios_1.default.get(endpoint)
                .then(res => {
                resolve(res.data);
            }, err => {
                reject(err);
            });
        });
    }
}
exports.LiqidCommunicator = LiqidCommunicator;
