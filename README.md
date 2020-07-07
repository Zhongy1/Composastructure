# Composastructure

This README is up to date for features available as of 6/28/2020. Try to look for a more updated version in a newer branch if there are any. These branches will have a date in its name.

Composastructure is a library/tool built off of Liqid's API for composing machines. The goal is to abstract away the lower level logic required to compose a machine and give you a new API that can do the same thing with as little as just one function call.

**[Important]** Composastructure is meant to be used as an npm module, but since it's not at that stage yet, you can clone this repo into your project's node_modules folder and use it the same way as any other npm module. One last thing to do after cloning though, is to navigate into Composastructure and do `npm install`. The development branch is the default branch, but you can switch to a different one if you'd like.

## Installation (In the future)

Use npm to install Composastructure

```bash
npm install Composastructure
```

## Main Use Cases

Composastructure is both a library and a tool. The following is a list of ways you can use it (ranked from easiet to more complicated to use).

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
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabrId} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in group deletion. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabrId} is busy with a previous compose/create request. Please wait a few seconds and retry. |
| DELETE | /api/machine/{fabr_id}/{id} | N/A                | 200 MachineInfo   | N/A           |
|        |                             |                    | 400 BasicError    | - fabr_id has to be a number.<br>- id has to be a number. |
|        |                             |                    | 404 BasicError    | - Machine {id} does not exist.<br>- Fabric {fabr_id} does not exist. |
|        |                             |                    | 500 BasicError    | - Controller for fabric {fabrId} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in machine deletion. |
|        |                             |                    | 503 BasicError    | - Controller for fabric {fabrId} is not ready. Server may be unable to connect to this Liqid system.<br>- Undocumented error occurred in group deletion. |

## 2. Integrated

If you are building an application and you want more control over the system, you can use the following. This will require you to know more of the lower level logic involved in Composastructure or Liqid's API before you can effectively use it. The Composastructure API should provide you with all that you need, but you can supplement with Liqid's API if you need unimplemented features.

### 2.1: Composastructure API

Composastructure implements the core functionalities from the Liqid API and makes it easier to work with in your application. 

### 2.2: Liqid API

Because Composastructure is built on Liqid's API, all of its endpoints are also available for use. Liqid's REST endpoints are wrapped in functions that return only the needed data instead of the entire http response.

# Documentation

## REST API

## Composastructure API

## Liqid API