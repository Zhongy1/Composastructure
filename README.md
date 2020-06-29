# Composastructure

This README is up to date for features available as of 6/28/2020. Try to look for a more updated version in a newer branch if there are any. These branches will have a date in its name.

Composastructure is a library/tool built off of Liqid's API for composing machines. The goal is to abstract away the lower level logic required to compose a machine and give you a new API that can do the same thing with as little as just one function call.

**[Important]** Composastructure is meant to be used as an npm module, but since it's not at that stage yet, you can clone this repo into your project's node_modules folder and use it the same way as any other npm module.

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

### 1.1: REST API with built in browser GUI

This use case is similar to how Liqid does it: exposed API with browser GUI available for interfacing with the system. Currently the GUI is still work in progress, but you can still access it and get a visual of what the Liqid system(s) looks like. This section will focus on how to run and use the GUI. Fow how to use the REST endpoints, refer to the next section.

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