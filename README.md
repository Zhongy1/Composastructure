# Composastructure

## Installation

Use npm to install composastructure

```bash
npm install composastructure
```

## Main Components

```ts
import { LiqidObserver, LiqidController } from 'composastructure'

let ip = 'IP to Liqid system';

//Liqid Observer - For retrieving information from Liqid
let observer = new LiqidObserver(ip);

//Liqid Controller - For manipulating the Liqid system
let controller = new LiqidController(ip);
```

## Main Usage

```ts
import { LiqidObserver, LiqidController, ComposeOptions, Machine, OrganizedDeviceStatuses } from 'composastructure'

//-------Initialize Components-------//
let ip = 'IP to Liqid system';
let observer = new LiqidObserver(ip);
let controller = new LiqidController(ip);
observer.start()
    .then(success => {
        //... Grab Components
    }, err => {
        //...
    });
controller.start()
    .then(success => {
        //... Compose Machine
    }, err => {
        //...
    });


//----------Grab Components----------//
let deviceStatuses: OrganizedDeviceStatuses = observer.getDeviceStatusesOrganized();
let gpuNamesArray = Object.keys(deviceStatuses.gpu); //['gpu0', 'gpu1', ...]


//----------Compose Machine----------//
//cpu, gpu, ssd, and nic can take either a count or an array of device names
let options: ComposeOptions = {
    cpu: 1,
    gpu: ['gpu0', 'gpu1'],
    ssd: 2,
    nic: 1,
    name: 'SomeMachineName'
}
let createdMachine: Machine;
controller.compose(options)
    .then((machine) => {
        console.log('Machine Composed!');
        createdMachine = machine;
    }, err => {
        console.log(err);
        createdMachine = null;
    });


//---------Decompose Machine---------//
controller.decompose(createdMachine);
```

## Docs
Documentation is generated using typedoc.

Docs have been pregenerated; open dist/docs/index.html with your browser to view them
