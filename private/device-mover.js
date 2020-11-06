const socket = io({
    reconnectionDelayMax: 30000
});

let fabrics = {
    fabrIds: [],
    names: [],
    groups: [],
    devices: []
};
let fabricSelected;

let machinesDisplay;
let deviceList;
let selectedMachView;

let configuring = true;
let machDomRefs = {};
let configureDevList;



$(document).ready(() => {
    initLocalView();
    initDeviceDragging();
});


function initLocalView() {
    machinesDisplay = document.getElementById('machines-display');
    deviceList = document.getElementById('device-list');
    selectedMachView = document.getElementById('selected-machine-view');

    document.getElementById('cancel', () => {
        if (!configuring) return;
        displayFabric(fabricSelected);
    });
    document.getElementById('submit', () => {
        if (!configuring) return;
        console.log('submitting?');
    })
}

function initDeviceDragging() {
    let draggableDevice = document.getElementById('draggable-device');
    let selectedMachView = document.getElementById('selected-machine-view');
    let targ;
    document.body.addEventListener('mousedown', (e) => {
        if (!configuring) return;
        targ = e.target;
        if (targ && targ.classList.contains('device')) {
            draggableDevice.innerText = targ.innerText;
            draggableDevice.setAttribute('type', targ.getAttribute('type'));
            draggableDevice.style.top = e.pageY + 'px';
            draggableDevice.style.left = e.pageX + 'px';
            draggableDevice.classList.remove('hidden');
        }
    });
    document.body.addEventListener('mouseup', (e) => {
        if (!configuring) return;
        if (e.target == selectedMachView) {
            let clone = targ.cloneNode(true);
            targ.classList.add('disabled');
            configureDevList.appendChild(clone);
        }
        draggableDevice.classList.add('hidden');
        targ = null;
    });
    document.body.addEventListener('mousemove', (e) => {
        if (!configuring) return;
        if (targ && targ.classList.contains('device')) {
            draggableDevice.style.top = e.pageY + 'px';
            draggableDevice.style.left = e.pageX + 'px';
        }
    });
}

function configureMachine(machine) {
    let machElem = createMachineElement(machine);
    machElem.classList.add('for-show');
    configureDevList = machElem.querySelector('.device-list');

    selectedMachView.appendChild(machElem);
    configuring = true;
    document.body.classList.add('configure-mode');
}

function selectFabric(fabricId) {
    if (!fabricId || fabricId == fabricSelected) return;
    fabricSelected = fabricId;
    displayFabric(fabricId);
}

function displayFabric(fabricId) {
    if (!fabrics.fabrIds.includes(fabricId)) return;
    configuring = false;
    document.body.classList.remove('conifgure-mode');
    machinesDisplay.innerHTML = '';
    deviceList.innerHTML = '';
    selectedMachView = '';

    machDomRefs = {};
    configureDevList = null;

    fabrics.devices.forEach(device => {
        let deviceLabel = createDeviceElement(device.id, device.type);
        deviceList.appendChild(deviceLabel);
    });
    fabrics.groups.forEach(group => {
        group.machines.forEach(machine => {
            let machElem = createMachineElement(machine);
            machDomRefs[machine.machId] = machElem;
            machinesDisplay.appendChild(machElem);
        });
    });

}

function createMachineElement(machine) {
    let machElem = createElement('div', 'machine');
    let title = createElement('div', 'title', `${machine.mname} (ID: ${machine.machId})`);
    title.addEventListener('click', () => {
        if (configuring) return;
        configureMachine(machine);
    });
    machElem.appendChild(title);
    let devList = createElement('div', 'device-list');
    machine.devices.forEach(device => {
        devList.appendChild(createDeviceElement(device));
    });
    machElem.appendChild(devList);
    return machElem;
}

function createDeviceElement(device) {
    let device = createElement('div', 'device', device.id);
    device.setAttribute('type', device.type);
    return device;
}

function createElement(elementType, classes, content) {
    let element = document.createElement(elementType);
    element.setAttribute('class', classes);
    if (content != null) {
        element.innerHTML = content;
    }
    return element;
}


socket.on('initialize', (data) => {
    fabrics = data;
    selectFabric(fabrics.fabrIds[0]);
});
socket.on('fabric-update', (data) => {
    if (fabrics && fabrics.fabrIds.includes(data.fabrIds[0])) {
        let index = fabrics.fabrIds.indexOf(data.fabrIds[0]);
        fabrics.groups[index] = data.groups[0];
        fabrics.devices[index] = data.devices[0];
        if (fabricSelected == data.fabrIds[0] && !configuring) displayFabric(data.fabrIds[0]);
    }
});