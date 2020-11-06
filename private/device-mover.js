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
let machRef;
let configureDevList;

let logsWindow;


$(document).ready(() => {
    initLocalView();
    initDeviceDragging();
});


function initLocalView() {
    machinesDisplay = document.getElementById('machines-display');
    deviceList = document.getElementById('device-list');
    selectedMachView = document.getElementById('selected-machine-view');
    logsWindow = document.getElementById('logs-window');

    document.getElementById('cancel').addEventListener('click', () => {
        if (!configuring) return;
        displayFabric(fabricSelected);
    });
    document.getElementById('submit').addEventListener('click', () => {
        if (!configuring) return;
        doSubmit();
    });
}

function doSubmit() {
    let options = {
        machId: machRef.machId,
        fabrId: fabricSelected,
        mode: 'union'
    }
    configureDevList.childNodes.forEach(deviceElem => {
        let type = deviceElem.getAttribute('type');
        if (options.hasOwnProperty(type)) {
            options[type].push(deviceElem.innerText);
        }
        else {
            options[type] = [deviceElem.innerText];
        }
    });
    hotToggle(options);
}

function initDeviceDragging() {
    let draggableDevice = document.getElementById('draggable-device');
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
    machRef = machine;
    configureDevList = machElem.querySelector('.device-list');

    selectedMachView.appendChild(machElem);
    machDomRefs[machine.machId].classList.add('disabled');
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
    document.body.classList.remove('configure-mode');
    machinesDisplay.innerHTML = '';
    deviceList.innerHTML = '';
    selectedMachView.innerHTML = '';

    machDomRefs = {};
    machRef = null;
    configureDevList = null;

    let index = fabrics.fabrIds.indexOf(fabricId);
    fabrics.devices[index].forEach(device => {
        if (device.mach_id != null) return;
        let deviceLabel = createDeviceElement(device);
        deviceList.appendChild(deviceLabel);
    });
    fabrics.groups[index].forEach(group => {
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
    let deviceElem = createElement('div', 'device', device.id);
    deviceElem.setAttribute('type', device.type);
    return deviceElem;
}

function createElement(elementType, classes, content) {
    let element = document.createElement(elementType);
    element.setAttribute('class', classes);
    if (content != null) {
        element.innerHTML = content;
    }
    return element;
}

function hotToggle(data) {
    logsWindow.innerHTML = 'Processing...';
    logsWindow.classList.remove('error');
    $.ajax({
        url: `/api/hot-toggle`,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: (mach) => {
            // console.log(mach);
            logsWindow.innerHTML = 'Machine successfully modified. Click cancel to see new system state.';
            logsWindow.classList.remove('error');
        },
        error: (err) => {
            // console.log(err);
            if (err.responseJSON) {
                logsWindow.innerHTML = err.responseJSON.description;
            }
            else {
                logsWindow.innerHTML = 'Connection error. Try refreshing.'
            }
            logsWindow.classList.add('error');
        }
    });
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