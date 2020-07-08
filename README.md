# Composastructure

This README is up to date for features available as of 7/07/2020. Try to look for a more updated version in a newer branch if there are any. These branches will have a date in its name.

Composastructure is a library/tool built off of Liqid's API for composing machines. The goal is to abstract away the lower level logic required to compose a machine and give you a new API that can do the same thing with as little as just one function call.

**[Important]** Composastructure is meant to be used as an npm module, but since it's not at that stage yet, you can clone this repo into your project's node_modules folder and use it the same way as any other npm module. One last thing to do after cloning though, is to navigate into Composastructure and do `npm install`. The development branch is the default branch, but you can switch to a different one if you'd like.

## Installation (In the future)

Use npm to install Composastructure

```bash
npm install Composastructure
```

## Main Use Cases

Composastructure is both a library and a tool. The following is a list of ways you can use it (ranked from easiet to more complicated to use). The further you go down this readme, the more you will have to learn the little details involved with creating groups or composing machines.

```
1: Standalone
    1.1: REST API with built in browser GUI
    1.2: REST API without built in browser GUI
2: Integrated
    2.1: Composastructure API
    2.2: Liqid API
```

## 1. Standalone

Composastructure comes with a built in REST service that you can easily deploy and use. The benefit of going with the standalone method is the service becomes immediately usable whether you are using just the command line or using a GUI. The service also comes with basic authentication to allow only trusted parties access to endpoints and GUI.

The main model of focus for running this service:
```typescript
interface RestServerConfig {
    liqidSystems: {             // array of systems you want to control
        ip: string,             // ip for the system
        name: string,           // name that you want to give this system
    }[],
    hostPort: number,           // port you want to run the server on
    enableGUI?: boolean,        // do you want to use built in GUI?
    sslCert?: {                 // provide this to use https
        privateKey: string,     
        certificate: string,    
        ca: string              
    },                          
    adminLogin?: {              // custom admin account (or use default)
        username: string,       // default: admin
        password: string        // default: compose
    }
}
```

Expected file structure
```
 📂 root_directory
 |- 📄 server.ts 
 |- ...
 \- 📂 node_modules
    |- 📁 Composastructure
    \- ...
```

### 1.1: REST API with built in browser GUI

This use case is similar to how Liqid does it: exposed API with browser GUI available for interfacing with the system. Currently the GUI is still work in progress, but you can still access it and get a visual of what the Liqid system(s) looks like. This section will focus on how to run and use the GUI. Fow how to use the REST endpoints, refer to the next section.

If you don't have an SSL certificate available, exclude the sslCert property from the config. Notice the property enableGUI is set to true here. A normal JavaScript variant is shown in the next section.
```typescript
// server.ts
import * as fs from 'fs';
import * as path from 'path';
import { RestServerConfig, RestServer } from 'Composastructure';

var config: RestServerConfig = {
    liqidSystems: [{
        ip: '10.0.100.125',
        name: 'DevKit'
    }],
    hostPort: 3000,
    enableGUI: true,
    sslCert: {
        privateKey: fs.readFileSync(path.join("keys", "_.evl.uic.edu.key"), 'utf8'),
        certificate: fs.readFileSync(path.join("keys", "_.evl.uic.edu.crt"), 'utf8'),
        ca: fs.readFileSync(path.join("keys", "_.evl.uic.edu-ca.crt"), 'utf8')
    },
    adminLogin: {
        username: 'admin',
        password: 'compose'
    }
}

var Server = new RestServer(config);

Server.start().then(() => {
    console.log('Server started successfully');
});
```
### 1.2: REST API without built in browser GUI

Built in browser GUI use is set to false as the default value. This use case is ideal if you know you are not needing a GUI, or if you want to build your own.

You may not be as familiar with TypeScript as JavaScript, or you just want to keep things as simple as possible. In that case, here's the same file in JavaScript. Notice the property enableGUI is set to false here. You can also leave this property out entirely.
```typescript
// server.js
var fs = require('fs');
var path = require('path');
var Composastructure = require('Composastructure');

var config = {
    liqidSystems: [{
        ip: '10.0.100.125',
        name: 'DevKit'
    }],
    hostPort: 3000,
    enableGUI: false,
    sslCert: {
        privateKey: fs.readFileSync(path.join("keys", "_.evl.uic.edu.key"), 'utf8'),
        certificate: fs.readFileSync(path.join("keys", "_.evl.uic.edu.crt"), 'utf8'),
        ca: fs.readFileSync(path.join("keys", "_.evl.uic.edu-ca.crt"), 'utf8')
    },
    adminLogin: {
        username: 'admin',
        password: 'compose'
    }
}

var Server = new Composastructure.RestServer(config);

Server.start().then(() => {
    console.log('Server started successfully');
});
```

#### REST API

**Collections**
| Type | Endpoint      | Response and Type    |
|------|---------------|----------------------|
| GET  | /api/groups   | 200 GroupWrapper[]   |
| GET  | /api/machines | 200 MachineWrapper[] |
| GET  | /api/devices  | 200 DeviceWrapper[]  |
| GET  | /api/fabrics  | 200 Overview         |

**Lookup**
| Type | Endpoint                                    | Response and Type | Error Message |
|------|---------------------------------------------|-------------------|---------------|
| GET  | /api/group/{fabr_id}/{id}   | 200 GroupInfo     | N/A           |
|      |                             | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                             | 404 BasicError    | - Group {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
| GET  | /api/machine/{fabr_id}/{id} | 200 MachineInfo   | N/A           |
|      |                             | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                             | 404 BasicError    | - Machine {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
| GET  | /api/device/{fabr_id}/{id}  | 200 Device        | N/A           |
|      |                             | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                             | 404 BasicError    | - Device {id} does not exist.<br>- Fabric {fabr_id} does not exist. |

**Details**
| Type | Endpoint                                            | Response and Type  | Error Message |
|------|-----------------------------------------------------|--------------------|---------------|
| GET  | /api/details/group/{fabr_id}/{id}   | 200 GroupDetails   | N/A           |
|      |                                     | 400 BasicError     | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                                     | 404 BasicError     | - Group {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|      |                                     | 500 BasicError     | - Undocumented error occurred in getting group details. |
| GET  | /api/details/machine/{fabr_id}/{id} | 200 MachineDetails | N/A           |
|      |                                     | 400 BasicError     | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                                     | 404 BasicError     | - Machine {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|      |                                     | 500 BasicError     | - Undocumented error occurred in getting group details. |
| GET  | /api/details/device/{fabr_id}/{id}  | 200 DeviceDetais   | N/A           |
|      |                                     | 400 BasicError     | - fabr_id has to be a number.<br>- id has to be a number. |
|      |                                     | 404 BasicError     | - Device {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|      |                                     | 500 BasicError     | - Undocumented error occurred in getting group details. |

**Control**
| Type   | Endpoint                    | Request Data Type  | Response and Type | Error Message |
|--------|-----------------------------|--------------------|-------------------|---------------|
| POST   | /api/group                  | GroupCreateOptions | 200 GroupInfo     | N/A           |
|        |                             |                    | 400 BasicError    | - Request body is missing one or more required properties.<br>- fabrId has to be a number.<br>- name has to be a string. |
|        |                             |                    | 404 BasicError    | - Fabric {fabrId} does not exist. |
|        |                             |                    | 422 BasicError    | - Use a different group name. The one provided is already in use or is reserved.<br>- Do not use special characters for a group name. |
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabrId} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in group creation.<br>- Group seems to be created, but final verification failed. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabrId} is busy with a previous compose/create request. Please wait a few seconds and retry. |
| POST   | /api/machine                | ComposeOptions     | 200 MachineInfo   | N/A           |
|        |                             |                    | 400 BasicError    | - Request body is missing one or more required properties.<br>- fabrId has to be a number.<br>- name has to be a string.<br>- grpId has to be a number.<br>- DEVICE specification is neither a number nor a string array. |
|        |                             |                    | 404 BasicError    | - Fabric {fabrId} does not exist.<br>- Group {grpId} does not exist.<br>- DEVICE {device_id} does not exist. |
|        |                             |                    | 422 BasicError    | - The given machine name is already in use.<br>- Do not use special characters for a machine name.<br>- Machine specification must have at least one device.<br>- CPU count can not be more than 1.<br>- CPU specification should have no more than 1.<br>- The specified number of DEVICEs is more than what is currently available.<br>- The specified number of DEVICEs is more than the number of DEVICEs that are unused.<br>- DEVICE specification either contains duplicates or non string elements.<br>- DEVICE {device_id} is currently in use by machine {mach_name}.<br>- CPU with IPMI {ipmi} is currently in use by machine {machine_name}. |
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabrId} is not ready. Server may be unable to connect to this Liqid system.<br>- One or more requested devices did not get assigned properly. Aborting compose!<br>- Undocumented error occurred in gathering resources.<br>- Undocumented error occurred in composing machine.<br>- Machine seems to be composed, but final verification failed. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabrId} is busy with a previous compose/create request. Please wait a few seconds and retry. |
| DELETE | /api/group/{fabr_id}/{id}   | N/A                | 200 GroupInfo     | N/A           |
|        |                             |                    | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|        |                             |                    | 404 BasicError    | - Group {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|        |                             |                    | 422 BasicError    | - Group {id} is not empty. Ensure all machines are removed from this group first. |
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabr_id} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in group deletion. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabr_id} is busy with a previous compose/create request. Please wait a few seconds and retry. |
| DELETE | /api/machine/{fabr_id}/{id} | N/A                | 200 MachineInfo   | N/A           |
|        |                             |                    | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|        |                             |                    | 404 BasicError    | - Machine {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabr_id} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in machine deletion. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabr_id} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in group deletion. |

## 2. Integrated

If you are building an application and you want more control over the system, you can use the following. This will require you to know more of the lower level logic involved in Composastructure or Liqid's API before you can effectively use it. The Composastructure API should provide you with all that you need, but you can supplement with Liqid's API if you need unimplemented features.

### 2.1: Composastructure API

Composastructure implements the core functionalities from the Liqid API and makes it easier to work with in your application. Currently, the majority of error responses are in the form http error responses. This'll likely change in the future.

#### LiqidObserver

Use the LiqidObserver class to pull relevant information about a Liqid system. The methods in this class will not affect the state of groups, machines, or devices in the system. Here are example use cases for public methods. Compared to the LiqidController class, you have multiple observer instances observing a system since they won't interfere with one another. You will notice that the methods are grouped by collections, lookup, and details just like the REST API, but do notice that some of the data types are not the same. Most, if not all, data types are provided by the Liqid API. You can find all of them in models.ts.
```typescript
import { LiqidObserver } from 'Composastructure';
var observer = new LiqidObserver('10.0.100.125', 'DevKit');

// Calling start will allow the observer to grab its first set of data
// as well as establish a stomp connection to the system for real time updates.
// You can use observer.stop() to stop the observer.
observer.start().then((success) => {
    if (success) console.log('Observer successfully started. Now observing DevKit system.');
});
```

**Collections**
```typescript
let groups: { [key: string]: Group } = observer.getGroups(); //group id as key
let machines: { [key: string]: Machine } = observer.getMachines(); // machine id as key
let predevices: { [key: string]: PreDevice } = observer.getPreDevices(); // device name as key
let deviceStatuses: { [key: string]: DeviceStatus } = observer.getDeviceStatuses(); // device name as key
```

**Lookup**
```typescript
let group: Group = observer.getGroupById(1);
let groupId: number = observer.getGroupIdByName('SomeGroup');
let machine: Machine = observer.getMachineById(1);
let predevice: PreDevice = observer.getPreDeviceByName('cpu0');
let deviceStatus: DeviceStatus = observer.getDeviceStatusByName('cpu0');
```

**Details**
```typescript
observer.fetchGroupDetails(1).then((grpDetails: GroupDetails) => { /* ... */ });
observer.fetchMachineDetails(1).then((machDetails: MachineDetails) => { /* ... */ });
observer.fetchDeviceDetails('cpu0').then((deviceDetails: DeviceDetails) => { /* ... */ });
```

**Intended Mainly for Controller Use**
```typescript
// Transform connection history to something more usable
let connectionHistList: ConnectionHistory[] = [ /* ... */ ];
let deviceStatuses: DeviceStatus[] = observer.convertHistToDevStatuses(connectionHistList);

// You can get DeviceStatuses using .getDeviceStatuses, but you can use this if you
// you prefer it be categorized by device type.
let deviceStatuses: OrganizedDeviceStatuses = observer.getDeviceStatusesOrganized();

// This is the core function for selecting deviceStatuses to be used in a machine
// This is the function that can handle quantities of devices, list of device names, and/or list of device names.
// GatheringDevStatsOptions has a property called gatherUnused. If set to false, it will select from devices
// that are used by other machines. Idealy, set this to true.
let options: GatheringDevStatsOptions = { /* ... */ };
let deviceStatuses: DeviceStatus[] = observer.gatherRequiredDeviceStatuses(options);
```

**Miscellaneous**
```typescript
// Get the fabric ID associated with this system
let id: number = observer.getFabricId();

// Set the busy state of the system. Intended for use by the LiqidController.
// True if you want to disable real time updates.
// False if you want to re-enable real time updates.
observer.setBusyState(false);

// Use the name of a cpu device to get its ipmi address
let ipmi: string = observer.getIpmiAddressByName('cpu0');

// Provide the group id to check if the group is empty or not.
let isEmpty: boolean = observer.checkGroupIsEmpty(1);

// Check to see if a machine name is used; for determining if machine name can be used or not
let exists: boolean = observer.checkMachNameExists('MachName');

// After a compose/create operation, the observer may not get notified right away,
// or its busy state is set to true. Use refresh to update the observer.
observer.refresh().then(() => { console.log('Observer refreshed.') });
```

#### LiqidController

Use the LiqidController class to modify the state of the Liqid system. Almost all methods in this class will affect the state of the system in some way. Avoid creating multiple instances of this class on the same system. Using two instances at the same time can result in undefined behavior, because there's a high chance that one instance may nullify the commands of the other instance.
```typescript
import { LiqidController } from 'Composastructure';
var controller = new LiqidObserver('10.0.100.125', 'DevKit');

// Calling start will allow the controller to start its own private observer instance
// It will use this to determine if your create/compose command is valid or not
controller.start().then((success) => {
    if (success) console.log('Controller successfully started. You can now create/compose on DevKit system.');
});
```

**Control-Groups**

These methods for groups are the same ones available in the REST API.
```typescript
let group: Group = await controller.createGroup('GroupName');
let deletedGroup: Group = await controller.deleteGroup(1); // provide group id
```

**Control-Machines**

These methods for machines are the same ones available in the REST API.
```typescript
let composeOptions: ComposeOptions = { /* ... */ };
let machine: Machine = await controller.compose(composeOptions);
let deletedMachine: Machine = await controller.decompose(1); // provide machine id
```

**Control-Devices**

These methods for devices are not available in the REST API. They are used in the controller.compose(), but they are available for use if you choose. Some things to keep in mind though: 
- moveDevicesToGroup works on any device that is not in a machine
- moveDevicesToMachine works only on devices that are in the same group as the machine
- you can't get a device out of a machine, but you can decompose the machine to get back the devices
```typescript
let deviceStatuses: DeviceStatus[] = [ /* ... */ ];
await controller.moveDevicesToGroup(deviceStatuses, 1); // provide target group id
await controller.moveDevicesToMachine(deviceStatuses, 1); // provide target machine id
```

**Miscellaneous**
```typescript
// Get the fabric ID associated with this system
let id: number = controller.getFabricId();
```

### 2.2: Liqid API (Composastructure as wrapper)

Because Composastructure is built on Liqid's API, almost all of its endpoints are also available for use. Liqid's REST endpoints are wrapped in functions that return only the needed data instead of the entire http response.