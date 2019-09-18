# Composastructure

## Installation

Use npm to install composastructure

```bash
npm install composastructure
```

## Main Features

```ts
//Liqid Communicator - allows direct commuication with Liqid
let communicator = new LiqidCommunicator(ip);

//Liqid Observer - allows retrieving updated data from Liqid
let observer = new LiqidObserver(ip);

//Liqid Controller - allows easy manipulation of Liqid state
let controller = new LiqidController(ip);

```

## Main Usage

Stick to using only the observer and controller, as they are higher level abstractions of the communicator.

```ts
import { LiqidObserver, LiqidController, ComposeOptions, Machine } from 'composastructure'

let ip = 'ip/url to Liqid user interface';
let observer = new LiqidObserver(ip);
let controller = new LiqidController(ip);

//----------Grab Components----------//



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
