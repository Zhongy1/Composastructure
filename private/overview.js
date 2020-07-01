const socket = io();

var fabrics;
var fabricSelected;
var liqidView;
var groupedView = true;

var secondaryConfigShown = false;
var secondaryConfigLocked = false;
var mainConfigShown = false;
var mainConfigLocked = false;

var alertsRegion;
var alerts = {};

var viewOptions = [
    {
        name: 'Grouped View',
        function: () => {
            if (groupedView) return;
            groupedView = true;
            displayFabric(fabricSelected);
        }
    },
    {
        name: 'Ungrouped View',
        function: () => {
            if (!groupedView) return;
            groupedView = false;
            displayFabric(fabricSelected);
        }
    }
];

var miscOptions = [
    {
        name: 'List Devices',
        function: () => {
            loadDevices();
            showSecondarySideConfig();
        }
    },
    {
        name: 'Create New Group',
        function: () => {
            loadGroupSimpleConfig();
            showSecondarySideConfig();
        }
    },
    {
        name: 'Compose New Machine',
        function: () => {
            loadMachineSimpleConfig();
            showSecondarySideConfig();
        }
    }
];

function generateGroupCreateForm() {
    let form = document.createElement('form');
    form.setAttribute('id', 'simple-group-form');
    ['name'].forEach(property => {
        let formLine = document.createElement('div');
        let label = document.createElement('label');
        label.setAttribute('class', 'config-label');
        label.innerHTML = property;
        formLine.appendChild(label);
        let input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('name', property);
        formLine.appendChild(input);
        form.appendChild(formLine);
    });
    let submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    submit.setAttribute('value', 'submit');
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log(getFormData('simple-group-form'));
        postGroupCreateData(getFormData('simple-group-form'));
    });
    return form;
}
var groupCreateForm = generateGroupCreateForm();

function generateSimpleMachineComposeForm() {
    let form = document.createElement('form');
    form.setAttribute('id', 'simple-machine-form');
    ['cpu', 'gpu', 'ssd', 'optane', 'nic', 'fpga'].forEach(property => {
        let formLine = document.createElement('div');
        let label = document.createElement('label');
        label.setAttribute('class', 'config-label');
        label.innerHTML = property;
        formLine.appendChild(label);
        let input = document.createElement('input');
        input.setAttribute('type', 'number');
        input.setAttribute('min', '1');
        input.setAttribute('name', property);
        formLine.appendChild(input);
        form.appendChild(formLine);
    });
    ['name', 'grpId'].forEach(property => {
        let formLine = document.createElement('div');
        let label = document.createElement('label');
        label.setAttribute('class', 'config-label');
        label.innerHTML = property;
        formLine.appendChild(label);
        let input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('name', property);
        formLine.appendChild(input);
        form.appendChild(formLine);
    });
    let submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    submit.setAttribute('value', 'submit');
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log(getFormData('simple-machine-form'));
        postMachineComposeData();
    });
    return form;
}
var simpleMachineComposeForm = generateSimpleMachineComposeForm();

function selectFabric(fabricId) {
    if (!fabricId || fabricId == fabricSelected) return;
    fabricSelected = fabricId;
    displayFabric(fabricId);
}
function displayFabric(fabricId) {
    if (!fabrics.fabrIds.includes(fabricId)) return;
    liqidView.innerHTML = '';
    if (groupedView)
        displayInGroupModeOn(fabricId);
    else
        displayInGroupModeOff(fabricId);
}
function displayInGroupModeOn(fabricId) {
    liqidView.setAttribute('class', '');
    let index = fabrics.fabrIds.indexOf(fabricId);
    fabrics.groups[index].forEach(group => {
        let groupCard = document.createElement('div');
        groupCard.setAttribute('class', 'card card-group');
        let groupHeader = document.createElement('div');
        groupHeader.setAttribute('class', 'card-group-header');
        groupHeader.innerHTML = group.gname;
        groupHeader.setAttribute('id', 'card-group-' + group.grpId);
        groupHeader.addEventListener('click', (e) => {
            loadGroupSimpleDetails(group);
            showSecondarySideConfig();
        });
        groupCard.appendChild(groupHeader);

        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.setAttribute('id', 'card-machine-' + machine.machId);
            machineCard.addEventListener('click', (e) => {
                loadMachineSimpleDetails(machine);
                showSecondarySideConfig();
            });

            let machineHeader = document.createElement('div');
            machineHeader.setAttribute('class', 'card-machine-header');
            machineHeader.innerHTML = machine.mname;
            machineCard.appendChild(machineHeader);

            let characteristics = getMachineCharacteristics(machine.devices);

            let ipmiBlock = document.createElement('div');
            ipmiBlock.setAttribute('class', 'card-machine-textblock-1');
            ipmiBlock.innerHTML = characteristics.ipmi;
            machineCard.appendChild(ipmiBlock);

            let cpuBlock = document.createElement('div');
            cpuBlock.setAttribute('class', 'card-machine-textblock-2');
            cpuBlock.innerHTML = 'CPUs: ' + characteristics.cpuCount;
            machineCard.appendChild(cpuBlock);

            let gpuBlock = document.createElement('div');
            gpuBlock.setAttribute('class', 'card-machine-textblock-2');
            gpuBlock.innerHTML = 'GPUs: ' + characteristics.gpuCount;
            machineCard.appendChild(gpuBlock);

            let ssdBlock = document.createElement('div');
            ssdBlock.setAttribute('class', 'card-machine-textblock-2');
            ssdBlock.innerHTML = 'SSDs: ' + characteristics.ssdCount;
            machineCard.appendChild(ssdBlock);

            let nicBlock = document.createElement('div');
            nicBlock.setAttribute('class', 'card-machine-textblock-2');
            nicBlock.innerHTML = 'NICs: ' + characteristics.nicCount;
            machineCard.appendChild(nicBlock);

            groupCard.appendChild(machineCard);
        });
        liqidView.appendChild(groupCard);
    });
}
function displayInGroupModeOff(fabricId) {
    liqidView.setAttribute('class', 'unified');
    let index = fabrics.fabrIds.indexOf(fabricId);
    fabrics.groups[index].forEach(group => {
        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.setAttribute('id', 'card-machine-' + machine.machId);
            machineCard.addEventListener('click', (e) => {
                loadMachineSimpleDetails(machine);
                showSecondarySideConfig();
            });

            let machineHeader = document.createElement('div');
            machineHeader.setAttribute('class', 'card-machine-header');
            machineHeader.innerHTML = machine.mname;
            machineCard.appendChild(machineHeader);

            let characteristics = getMachineCharacteristics(machine.devices);

            let ipmiBlock = document.createElement('div');
            ipmiBlock.setAttribute('class', 'card-machine-textblock-1');
            ipmiBlock.innerHTML = characteristics.ipmi;
            machineCard.appendChild(ipmiBlock);

            let cpuBlock = document.createElement('div');
            cpuBlock.setAttribute('class', 'card-machine-textblock-2');
            cpuBlock.innerHTML = 'CPUs: ' + characteristics.cpuCount;
            machineCard.appendChild(cpuBlock);

            let gpuBlock = document.createElement('div');
            gpuBlock.setAttribute('class', 'card-machine-textblock-2');
            gpuBlock.innerHTML = 'GPUs: ' + characteristics.gpuCount;
            machineCard.appendChild(gpuBlock);

            let ssdBlock = document.createElement('div');
            ssdBlock.setAttribute('class', 'card-machine-textblock-2');
            ssdBlock.innerHTML = 'SSDs: ' + characteristics.ssdCount;
            machineCard.appendChild(ssdBlock);

            let nicBlock = document.createElement('div');
            nicBlock.setAttribute('class', 'card-machine-textblock-2');
            nicBlock.innerHTML = 'NICs: ' + characteristics.nicCount;
            machineCard.appendChild(nicBlock);

            liqidView.appendChild(machineCard);
        });
    });
}

function getMachineCharacteristics(deviceArray) {
    let characteristics = {
        ipmi: '',
        cpuCount: 0,
        gpuCount: 0,
        ssdCount: 0,
        nicCount: 0,
        optaneCount: 0
    }
    deviceArray.forEach(device => {
        switch (device.type) {
            case 'cpu':
                if (device.hasOwnProperty('ipmi') && characteristics.ipmi == '')
                    characteristics.ipmi = device.ipmi;
                characteristics.cpuCount++;
                break;
            case 'gpu':
                characteristics.gpuCount++;
                break;
            case 'ssd':
                characteristics.ssdCount++;
                break;
            case 'nic':
                characteristics.nicCount++;
                break;
            case 'optane':
                characteristics.optaneCount++;
                break;
        }
    });
    return characteristics;
}

function prepareSideConfig() {
    let goBackButton = document.getElementById('side-config-return');
    goBackButton.addEventListener('click', (e) => {
        if (secondaryConfigLocked) return;
        $('#side-config-drawer')
            .css({ left: '0%' })
            .animate({ left: '100%' }, 500, () => {
                secondaryConfigShown = false;
            });
    });
    populateMainSideContent();
}
function populateMainSideContent() {
    //Prepare main side content
    let mainSideContent = document.getElementById('main-side-content');
    mainSideContent.innerHTML = '';
    let fabricOptionsHeader = document.createElement('h3');
    fabricOptionsHeader.innerHTML = 'Fabric Options';
    mainSideContent.appendChild(fabricOptionsHeader);
    if (fabricSelected) {
        let fabricOptionsList = document.createElement('ul');
        mainSideContent.appendChild(fabricOptionsList);
        fabrics.fabrIds.forEach(id => {
            let listElement = document.createElement('li');
            listElement.setAttribute('class', 'clickable');
            listElement.innerHTML = id;
            listElement.addEventListener('click', () => {
                selectFabric(id);
            });
            fabricOptionsList.appendChild(listElement);
        });
    }
    let viewOptionsHeader = document.createElement('h3');
    viewOptionsHeader.innerHTML = 'View Options'
    mainSideContent.appendChild(viewOptionsHeader);
    let viewOptionsList = document.createElement('ul');
    mainSideContent.appendChild(viewOptionsList);
    viewOptions.forEach(option => {
        let listElement = document.createElement('li');
        listElement.setAttribute('class', 'clickable');
        listElement.innerHTML = option.name;
        listElement.addEventListener('click', option.function);
        viewOptionsList.appendChild(listElement);
    });
    let miscOptionsHeader = document.createElement('h3');
    miscOptionsHeader.innerHTML = 'Misc. Options';
    mainSideContent.appendChild(miscOptionsHeader);
    miscOptionsList = document.createElement('ul');
    mainSideContent.appendChild(miscOptionsList);
    miscOptions.forEach(option => {
        let listElement = document.createElement('li');
        listElement.setAttribute('class', 'clickable');
        listElement.innerHTML = option.name;
        listElement.addEventListener('click', option.function);
        miscOptionsList.appendChild(listElement);
    });
}
function prepareMainConfig() {
    let goBackButton = document.getElementById('main-config-return');
    goBackButton.addEventListener('click', (e) => {
        if (mainConfigLocked) return;
        $('#side-config-drawer')
            .css({ bottom: '0%' })
            .animate({ bottom: '100%' }, 500, () => {
                mainConfigShown = false;
            });
    });
}

function loadMachineSimpleDetails(machine) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = machine.mname + ' (id: ' + machine.machId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(machine));
    secondarySideContent.appendChild(someText);
    let deleteButton = document.createElement('button');
    deleteButton.setAttribute('class', 'delete-button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.addEventListener('click', (e) => {
        console.log('delete machine ' + machine.machId);
        $.ajax({
            url: `api/machine/${fabricSelected}/${machine.machId}`,
            type: 'DELETE',
            dataType: 'json',
            success: (data) => {
                console.log('From server: ' + JSON.stringify(data));
            },
            error: (err) => {
                console.log('got error: ' + JSON.stringify(err));
                generateAlert({
                    id: 'tempA',
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description,
                    duration: 5000,
                    ignorable: true
                });

            }
        });
    });
    secondarySideContent.appendChild(deleteButton);
}

function loadGroupSimpleDetails(group) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = group.gname + ' (id: ' + group.grpId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(group));
    secondarySideContent.appendChild(someText);
    let deleteButton = document.createElement('button');
    deleteButton.setAttribute('class', 'delete-button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.addEventListener('click', (e) => {
        console.log('delete group ' + group.grpId);
        $.ajax({
            url: `api/group/${fabricSelected}/${group.grpId}`,
            type: 'DELETE',
            dataType: 'json',
            success: (data) => {
                console.log('From server: ' + JSON.stringify(data));
            },
            error: (err) => {
                console.log('got error: ' + JSON.stringify(err));
                generateAlert({
                    id: 'tempB',
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description,
                    duration: 5000,
                    ignorable: true
                });

            }
        });
    });
    secondarySideContent.appendChild(deleteButton);
}

function loadDevices() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Devices';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';

    let unassignedDevicesHeader = document.createElement('h3');
    unassignedDevicesHeader.innerHTML = 'Unassigned';
    secondarySideContent.appendChild(unassignedDevicesHeader);
    let unassignedDevicesList = document.createElement('ul');
    secondarySideContent.appendChild(unassignedDevicesList);

    let assignedDevicesHeader = document.createElement('h3');
    assignedDevicesHeader.innerHTML = 'Assigned';
    secondarySideContent.appendChild(assignedDevicesHeader);
    let assignedDevicesList = document.createElement('ul');
    secondarySideContent.appendChild(assignedDevicesList);

    fabrics.devices[fabrics.fabrIds.indexOf(fabricSelected)].forEach(device => {
        let listElement = document.createElement('li');
        listElement.innerHTML = device.id;
        if (device.mach_id == null)
            unassignedDevicesList.appendChild(listElement);
        else
            assignedDevicesList.appendChild(listElement);
    });
}

function loadGroupSimpleConfig() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Group Create';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    secondarySideContent.appendChild(groupCreateForm);
}

function loadGroupComplexConfig() {

}

function loadMachineSimpleConfig() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Machine Compose';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    secondarySideContent.appendChild(simpleMachineComposeForm);
}

function loadMachineComplexConfig() {

}

function showSecondarySideConfig() {
    if (secondaryConfigShown) return;
    $('#side-config-drawer')
        .css({ left: '100%' })
        .animate({ left: '0%' }, 500, () => {
            secondaryConfigShown = true;
        });
}

function showMainConfig() {
    if (mainConfigShown) return;
    $('#main-config-drawer')
        .css({ bottom: '100%' })
        .animate({ bottom: '0%' }, 500, () => {
            mainConfigShown = true;
        });
}

function postGroupCreateData(data) {
    try {
        // generateAlert({
        //     id: 'test',
        //     title: 'Error: 400',
        //     message: 'Message: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
        //     duration: 5000,
        //     ignorable: false
        // });
        $.ajax({
            url: `api/group`,
            type: 'POST',
            data: JSON.stringify({
                name: data.name,
                fabrId: parseInt(fabricSelected)
            }),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: (data) => {
                console.log('From server: ' + JSON.stringify(data));
            },
            error: (err) => {
                console.log('got error: ' + JSON.stringify(err));
                generateAlert({
                    id: 'tempB',
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description,
                    duration: 5000,
                    ignorable: true
                });

            }
        });
    }
    catch (err) {
        throw 'My error: ' + err;
    }
}

function postMachineComposeData(data) {
    try {
        // generateAlert({
        //     id: 'test2',
        //     title: 'Error: 500',
        //     message: 'Message: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
        //     duration: 5000,
        //     ignorable: false
        // });
    }
    catch (err) {
        throw err;
    }
}

/*
 * alert: id, title, message, duration, ignorable
 */
function generateAlert(alertConfig) {
    if (alerts.hasOwnProperty(alertConfig.id)) return;
    let alert = document.createElement('div');
    alert.setAttribute('class', 'alert-popup');
    let title = document.createElement('div');
    title.innerHTML = alertConfig.title;
    alert.appendChild(title);
    let message = document.createElement('div');
    message.innerHTML = alertConfig.message;
    alert.appendChild(message);
    alerts[alertConfig.id] = alert;

    $(alert).css('margin-top', '-104px');
    $(alert).css('margin-left', '264px');
    let recentAlert = alertsRegion.firstChild;
    if (recentAlert != null) {
        alertsRegion.insertBefore(alert, recentAlert);
    }
    else {
        alertsRegion.appendChild(alert);
    }
    $(alert)
        .css({ 'margin-top': '-104px' })
        .animate({ 'margin-top': '0px' }, 300, () => {
            $(alert)
                .css({ 'margin-left': '264px' })
                .animate({ 'margin-left': '0px' }, 300, () => {
                    if (alertConfig.ignorable) {
                        alert.addEventListener('click', (e) => {
                            deleteAlert(alertConfig.id);
                        });
                    }
                    setTimeout(() => {
                        deleteAlert(alertConfig.id);
                    }, alertConfig.duration);
                });
        });
    return alert;
}

function deleteAlert(id) {
    if (!alerts.hasOwnProperty(id)) return;
    let alert = alerts[id];
    delete alerts[id];
    alert.remove();
}

function getFormData(formId) {
    return $(`#${formId}`).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
}

$(document).ready(() => {
    liqidView = document.getElementById('liqid-view');
    alertsRegion = document.getElementById('alerts');
    prepareSideConfig();
    prepareMainConfig();
});

// socket.on('connect', () => {

// });
socket.on('initialize', (data) => {
    fabrics = data;
    selectFabric(fabrics.fabrIds[0]);
    populateMainSideContent();
});
socket.on('fabric-update', (data) => {
    if (fabrics && fabrics.fabrIds.includes(data.fabrIds[0])) {
        let index = fabrics.fabrIds.indexOf(data.fabrIds[0]);
        fabrics.groups[index] = data.groups[0];
        fabrics.devices[index] = data.devices[0];
        if (fabricSelected == data.fabrIds[0]) displayFabric(data.fabrIds[0]);
    }
});
// socket.on('busy', (busyData) => {

// });