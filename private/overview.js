const socket = io();

var fabrics;
var fabricSelected;
var liqidView;
var groupedView = true;
var secondaryConfigShown = false;
var secondaryConfigLocked = false;

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
            showSecondarySideConfig();
        }
    },
    {
        name: 'Compose New Machine',
        function: () => {
            showSecondarySideConfig();
        }
    }
]

function displayFabric(fabricId) {
    liqidView.innerHTML = '';
    if (!fabrics.fabrIds.includes(fabricId)) return;
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
            loadGroupDetails(group);
            showSecondarySideConfig();
        });
        groupCard.appendChild(groupHeader);

        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.setAttribute('id', 'card-machine-' + machine.machId);
            machineCard.addEventListener('click', (e) => {
                loadMachineDetails(machine);
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
                showSecondarySideConfig();
                console.log(this.id);
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

function selectFabric(fabricId) {
    if (!fabricId || fabricId == fabricSelected) return;
    fabricSelected = fabricId;
    displayFabric(fabricId);
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

function loadDevices() {
    let sideHeaderTitle = document.getElementById('drawer-header-title');
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

function loadMachineDetails(machine) {
    let sideHeaderTitle = document.getElementById('drawer-header-title');
    sideHeaderTitle.innerHTML = machine.mname + ' (id: ' + machine.machId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(machine));
    secondarySideContent.appendChild(someText);
}

function loadGroupDetails(group) {
    let sideHeaderTitle = document.getElementById('drawer-header-title');
    sideHeaderTitle.innerHTML = group.gname + ' (id: ' + group.grpId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(group));
    secondarySideContent.appendChild(someText);
}

function showSecondarySideConfig() {
    if (secondaryConfigShown) return;
    $('#side-config-drawer')
        .css({ left: '100%' })
        .animate({ left: '0%' }, 500, () => {
            secondaryConfigShown = true;
        });
}

$(document).ready(() => {
    liqidView = document.getElementById('liqid-view');
    prepareSideConfig();
});

socket.on('connect', () => {
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
});