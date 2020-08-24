const socket = io({
    reconnectionDelayMax: 30000
});

var fabrics = {
    fabrIds: [],
    names: [],
    groups: [],
    devices: []
};
var fabricSelected;
var liqidView;
var groupedView = true;

var secondaryConfigShown = false;
var mainConfigShown = false;

var alertsRegion;
var alerts = {};
var alertsGenerated = 0;
var usableAlertIds = [];

var fabricLocked = true;
var lastControlOperation = 0;
var relockStarted = false;

var complexComposeTracker = {
    cpu: [],
    gpu: [],
    ssd: [],
    optane: [],
    nic: []
}
var deviceDetailsCache = {}

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
            if (secondaryConfigShown) {
                hideSecondarySideConfig(loadDevicesV2, showSecondarySideConfig);
            }
            else {
                loadDevicesV2();
                showSecondarySideConfig();
            }
        }
    },
    {
        name: 'Create New Group',
        function: () => {
            if (secondaryConfigShown) {
                hideSecondarySideConfig(loadGroupSimpleConfig, showSecondarySideConfig);
            }
            else {
                loadGroupSimpleConfig();
                showSecondarySideConfig();
            }
        }
    },
    {
        name: 'Compose New Machine',
        function: () => {
            if (secondaryConfigShown) {
                hideSecondarySideConfig(loadMachineSimpleConfig, showSecondarySideConfig);
            }
            else {
                loadMachineSimpleConfig();
                showSecondarySideConfig();
            }
        }
    }
];

function generateGroupCreateFormV1() {
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
function generateGroupCreateFormV2() {
    let form = createElement('form', 'side-config-form');
    form.setAttribute('id', 'simple-group-form');
    form.setAttribute('spellcheck', 'false');
    ['name'].forEach(property => {
        let formItem = createElement('div', 'form-item');
        form.appendChild(formItem);
        formItem.appendChild(createElement('label', 'item-label', property));
        let valInput = createElement('div', 'value-input');
        formItem.appendChild(valInput);
        let valDisplayer = createElement('div', 'value-displayer');
        valInput.appendChild(valDisplayer);
        let input = createElement('input', 'form-value');
        input.setAttribute('name', property);
        valDisplayer.appendChild(input);
    });
    let submit = document.createElement('button');
    submit.setAttribute('class', 'submit-button');
    submit.innerHTML = 'Submit';
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log(getFormData('simple-group-form'));
        postGroupCreateData(getFormData('simple-group-form'));
    });
    return form;
}
var groupCreateForm = generateGroupCreateFormV2();

function generateSimpleMachineComposeFormV1() {
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
        input.setAttribute('min', '0');
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
        postMachineComposeData(getFormData('simple-machine-form'));
    });
    return form;
}
function generateSimpleMachineComposeFormV2() {
    let form = createElement('form', 'side-config-form');
    form.setAttribute('id', 'simple-machine-form');
    form.setAttribute('spellcheck', 'false');
    ['cpu', 'gpu', 'ssd', 'optane', 'nic', 'fpga'].forEach(property => {
        let val = 0;
        let throttle = 0;
        let formItem = createElement('div', 'form-item');
        form.appendChild(formItem);
        formItem.appendChild(createElement('label', 'item-label', property));
        let intInput = createElement('div', 'integer-input');
        formItem.appendChild(intInput);
        let incrementer = createElement('div', 'integer-incrementer', '<i class="fa fa-chevron-up"></i>');
        intInput.appendChild(incrementer);
        let valDisplayer = createElement('div', 'value-displayer');
        intInput.appendChild(valDisplayer);
        let input = createElement('input', 'form-value');
        input.setAttribute('value', '0');
        input.setAttribute('name', property);
        input.setAttribute('readonly', '');
        valDisplayer.appendChild(input);
        let decrementer = createElement('div', 'integer-decrementer', '<i class="fa fa-chevron-down"></i>');
        intInput.appendChild(decrementer);
        //scroll listener on intInput
        intInput.addEventListener('wheel', (e) => {
            if (e.deltaY >= 0) {
                if (val >= 100) return;
                if (e.deltaY >= 10) {
                    val++;
                    input.setAttribute('value', val);
                }
                else {
                    throttle += e.deltaY;
                    if (throttle >= 10) {
                        throttle = 0;
                        val++;
                        input.setAttribute('value', val);
                    }
                }
            }
            else if (e.deltaY < 0) {
                if (val <= 0) return;
                if (e.deltaY <= -10) {
                    val--;
                    input.setAttribute('value', val);
                }
                else {
                    throttle -= e.deltaY;
                    if (throttle >= 10) {
                        throttle = 0;
                        val--;
                        input.setAttribute('value', val);
                    }
                }
            }
        }, { passive: true });
        //click listener on incrementer
        incrementer.addEventListener('click', (e) => {
            if (val >= 100) return;
            val++;
            input.setAttribute('value', val);
        });
        //click listen on decrementer
        decrementer.addEventListener('click', (e) => {
            if (val <= 0) return;
            val--;
            input.setAttribute('value', val);
        });
    });
    ['name', 'grpId'].forEach(property => {
        let formItem = createElement('div', 'form-item');
        form.appendChild(formItem);
        formItem.appendChild(createElement('label', 'item-label', property));
        let valInput = createElement('div', 'value-input');
        formItem.appendChild(valInput);
        let valDisplayer = createElement('div', 'value-displayer');
        valInput.appendChild(valDisplayer);
        let input = createElement('input', 'form-value');
        input.setAttribute('name', property);
        valDisplayer.appendChild(input);
    });
    let submit = createElement('button', 'submit-button', 'Submit');
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log(getFormData('simple-machine-form'));
        postMachineComposeData(getFormData('simple-machine-form'));
    });
    return form;
}
var simpleMachineComposeForm = generateSimpleMachineComposeFormV2();

function generateComplexMachineComposeForm() {
    let formWrapper = createElement('div', 'complex-compose-form-wrapper');

    let cpuStoreWrapper = createElement('div', 'device-label-store-wrapper');
    cpuStoreWrapper.appendChild(createElement('div', 'header', 'CPU'));
    let labelStore = createElement('div', 'device-label-store cpu-variant');
    labelStore.setAttribute('data-type', 'cpu');
    labelStore.setAttribute('id', 'store-cpu');
    cpuStoreWrapper.appendChild(labelStore);
    formWrapper.appendChild(cpuStoreWrapper);
    ['GPU', 'SSD', 'OPTANE', 'NIC'].forEach((type) => {
        let deviceStoreWrapper = createElement('div', 'device-label-store-wrapper');
        deviceStoreWrapper.appendChild(createElement('div', 'header', type + 's'));
        let labelStore = createElement('div', 'device-label-store');
        labelStore.setAttribute('data-type', type.toLowerCase());
        labelStore.setAttribute('id', 'store-' + type.toLowerCase());
        deviceStoreWrapper.appendChild(labelStore);
        formWrapper.appendChild(deviceStoreWrapper);
    });

    let form = createElement('form');
    form.setAttribute('id', 'complex-machine-form');
    form.setAttribute('spellcheck', 'false');
    ['name', 'grpId'].forEach(property => {
        let formItem = createElement('div', 'form-item');
        form.appendChild(formItem);
        formItem.appendChild(createElement('label', 'item-label', property));
        let valInput = createElement('div', 'value-input');
        formItem.appendChild(valInput);
        let valDisplayer = createElement('div', 'value-displayer');
        valInput.appendChild(valDisplayer);
        let input = createElement('input', 'form-value');
        input.setAttribute('name', property);
        valDisplayer.appendChild(input);
    });
    let reset = createElement('button', 'submit-button', 'Reset');
    reset.setAttribute('type', 'reset');
    reset.addEventListener('click', () => {
        clearComposeTrackerAndLabels();
    });
    form.appendChild(reset);
    let submit = createElement('button', 'submit-button', 'Submit');
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let fullFormData = {
            ...complexComposeTracker,
            ...getFormData('complex-machine-form')
        }
        console.log(fullFormData);
        postMachineComposeData(fullFormData, true);
    });

    formWrapper.appendChild(form);

    return formWrapper;
}
var complexMachineComposeForm = generateComplexMachineComposeForm();

function selectFabric(fabricId) {
    if (!fabricId || fabricId == fabricSelected) return;
    fabricSelected = fabricId;
    displayFabric(fabricId);
}
function displayFabric(fabricId) {
    if (!fabrics.fabrIds.includes(fabricId)) return;
    liqidView.innerHTML = '';
    let index = fabrics.fabrIds.indexOf(fabricId);
    document.getElementById('fabric-id').innerHTML = fabricId;
    document.getElementById('fabric-name').innerHTML = fabrics.names[index];
    if (groupedView)
        displayInGroupModeOn(fabricId);
    else
        displayInGroupModeOff(fabricId);
}
function displayInGroupModeOn(fabricId) {
    liqidView.setAttribute('class', '');
    let index = fabrics.fabrIds.indexOf(fabricId);
    if (index == -1) return;
    fabrics.groups[index].forEach(group => {
        let groupCard = document.createElement('div');
        groupCard.setAttribute('class', 'card card-group');
        let groupHeader = document.createElement('div');
        groupHeader.setAttribute('class', 'card-group-header');
        groupHeader.innerHTML = `${group.gname} (id: ${group.grpId})`;
        groupHeader.setAttribute('id', 'card-group-' + group.grpId);
        groupHeader.addEventListener('click', (e) => {
            loadGroupDetailsV2(group);
            showSecondarySideConfig();
        });
        groupCard.appendChild(groupHeader);

        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.setAttribute('id', 'card-machine-' + machine.machId);
            machineCard.addEventListener('click', (e) => {
                loadMachineDetailsV2(machine);
                showSecondarySideConfig();
            });

            let machineHeader = document.createElement('div');
            machineHeader.setAttribute('class', 'card-machine-header');
            machineHeader.innerHTML = `${machine.mname} (id: ${machine.machId})`;
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
    if (index == -1) return;
    fabrics.groups[index].forEach(group => {
        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.setAttribute('id', 'card-machine-' + machine.machId);
            machineCard.addEventListener('click', (e) => {
                loadMachineDetailsV2(machine);
                showSecondarySideConfig();
            });

            let machineHeader = document.createElement('div');
            machineHeader.setAttribute('class', 'card-machine-header');
            machineHeader.innerHTML = `${machine.mname} (id: ${machine.machId})`;
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

function indicateOperationBlocked() {
    let indicator = document.getElementById('indicator');
    indicator.classList.add('fabric-blocked');
    setTimeout(() => {
        indicator.classList.remove('fabric-blocked');
    }, 1000);
}

function attemptRelockWhenInactive() {
    let lockState = document.getElementById('lock-state');
    let indicator = document.getElementById('indicator');
    if (!relockStarted) {
        relockStarted = true;
    }
    setTimeout(() => {
        if (Date.now() >= lastControlOperation + 30000) {
            lockState.classList.remove('fa-unlock');
            lockState.classList.add('fa-lock');
            fabricLocked = true;
            indicator.classList.remove('fabric-unlocked');
            relockStarted = false;
        }
        else {
            attemptRelockWhenInactive();
        }
    }, 30000);
}

function prepareSideMenu() {
    let menuToggler = document.getElementById('menu-toggler');
    let menu = document.getElementById('menu');
    let shade = document.getElementById('view-coverer');
    menuToggler.addEventListener('click', (e) => {
        if (menu.classList.contains('shown')) {
            menu.classList.remove('shown');
            shade.classList.remove('shown');
        }
        else {
            menu.classList.add('shown');
            shade.classList.add('shown');
        }
    });
    shade.addEventListener('click', (e) => {
        menu.classList.remove('shown');
        shade.classList.remove('shown');
    });
}

function prepareFabricIndicator() {
    let lock = document.getElementById('fabric-lock');
    let lockState = document.getElementById('lock-state');
    let indicator = document.getElementById('indicator');
    lock.addEventListener('click', (e) => {
        if (fabricLocked) {
            lockState.classList.remove('fa-lock');
            lockState.classList.add('fa-unlock');
            fabricLocked = false;
            indicator.classList.remove('fabric-blocked');
            indicator.classList.add('fabric-unlocked');
            if (!relockStarted) {
                attemptRelockWhenInactive();
            }
        }
        else {
            lockState.classList.remove('fa-unlock');
            lockState.classList.add('fa-lock');
            fabricLocked = true;
            indicator.classList.remove('fabric-unlocked');
        }
    })
}

function prepareSideConfig() {
    let goBackButton = document.getElementById('side-config-return');
    goBackButton.addEventListener('click', (e) => {
        hideSecondarySideConfig();
        hideMainConfig();
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
        let fabricOptionsList = createElement('ul', 'config-list');
        mainSideContent.appendChild(fabricOptionsList);
        fabrics.fabrIds.forEach(id => {
            let index = fabrics.fabrIds.indexOf(id);
            let listElement = document.createElement('li');
            // listElement.setAttribute('class', 'clickable');
            listElement.innerHTML = id + ' - ' + fabrics.names[index];
            listElement.addEventListener('click', () => {
                selectFabric(id);
            });
            fabricOptionsList.appendChild(listElement);
        });
    }
    let viewOptionsHeader = document.createElement('h3');
    viewOptionsHeader.innerHTML = 'View Options'
    mainSideContent.appendChild(viewOptionsHeader);
    let viewOptionsList = createElement('ul', 'config-list');
    mainSideContent.appendChild(viewOptionsList);
    viewOptions.forEach(option => {
        let listElement = document.createElement('li');
        // listElement.setAttribute('class', 'clickable');
        listElement.innerHTML = option.name;
        listElement.addEventListener('click', option.function);
        viewOptionsList.appendChild(listElement);
    });
    let miscOptionsHeader = document.createElement('h3');
    miscOptionsHeader.innerHTML = 'Misc. Options';
    mainSideContent.appendChild(miscOptionsHeader);
    miscOptionsList = createElement('ul', 'config-list');
    mainSideContent.appendChild(miscOptionsList);
    miscOptions.forEach(option => {
        let listElement = document.createElement('li');
        // listElement.setAttribute('class', 'clickable');
        listElement.innerHTML = option.name;
        listElement.addEventListener('click', option.function);
        miscOptionsList.appendChild(listElement);
    });
}
function prepareMainConfig() {
    let goBackButton = document.getElementById('main-config-return');
    goBackButton.addEventListener('click', (e) => {
        hideMainConfig();
    });
}

function prepareDocumentEventHandlers() {
    let beginDeviceMoveEvent = false;
    let targetAlreadySelected = false;
    let startLoc = { x: 0, y: 0 };
    let deviceId = null;
    let deviceMovement = false;
    let draggableLabel = document.getElementById('draggable-label');
    let tempElement;
    document.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('device-label') && e.target.classList.contains('selected')) {
            targetAlreadySelected = true;
            deviceId = e.target.getAttribute('data-value');
        }
        else if (e.target.classList.contains('device-label')) {
            beginDeviceMoveEvent = true;
            startLoc = { x: e.pageX, y: e.pageY };
            deviceId = e.target.getAttribute('data-value');
            tempElement = e.target;
        }
    });
    document.addEventListener('mousemove', (e) => {
        if (!beginDeviceMoveEvent) return;
        if (!deviceMovement && (Math.abs(e.pageX - startLoc.x) > 5 || Math.abs(e.pageY - startLoc.y) > 5)) {
            deviceMovement = true;
            draggableLabel.style.top = e.pageY + 'px';
            draggableLabel.style.left = e.pageX + 'px';
            draggableLabel.innerHTML = deviceId;
            draggableLabel.classList.remove('hidden');
        }
        else if (deviceMovement) {
            draggableLabel.style.top = e.pageY + 'px';
            draggableLabel.style.left = e.pageX + 'px';
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (!beginDeviceMoveEvent && !targetAlreadySelected) return;
        if (deviceMovement) { //drag event
            if (e.target.classList.contains('device-label-store')) {
                let type = e.target.getAttribute('data-type');
                let label = createElement('div', 'device-label-block', deviceId);
                if (type == 'cpu' && deviceId.indexOf('cpu') >= 0) {
                    if (complexComposeTracker.cpu.length == 0) {
                        complexComposeTracker.cpu.push(deviceId);
                        tempElement.classList.add('selected');
                        e.target.appendChild(label);
                    }
                }
                else {
                    if (tempElement.getAttribute('data-type') == type) {
                        complexComposeTracker[type].push(deviceId);
                        tempElement.classList.add('selected');
                        e.target.appendChild(label);
                    }
                }
            }
        }
        else { //normal click event
            fetchDeviceDetails(deviceId, document.getElementById('details-section'));
        }

        draggableLabel.classList.add('hidden');
        beginDeviceMoveEvent = false;
        targetAlreadySelected = false;
        deviceMovement = false;
    });
}

function loadMachineDetails(machine) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = machine.mname + ' (id: ' + machine.machId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(machine));
    secondarySideContent.appendChild(someText);
    let deleteButton = createElement('button', 'delete-button', 'Delete');
    deleteButton.addEventListener('click', (e) => {
        decomposeMachine(machine);
        if (!fabricLocked)
            hideSecondarySideConfig();
    });
    secondarySideContent.appendChild(deleteButton);
}
function loadMachineDetailsV2(machine) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = machine.mname + ' (id: ' + machine.machId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';

    let detailsBlock = createElement('div');
    secondarySideContent.appendChild(detailsBlock);
    fetchMachineDetails(machine.machId, detailsBlock);

    let deleteButton = createElement('button', 'delete-button', 'Delete');
    deleteButton.addEventListener('click', (e) => {
        decomposeMachine(machine);
        if (!fabricLocked)
            hideSecondarySideConfig();
    });
    secondarySideContent.appendChild(deleteButton);
}

function loadGroupDetails(group) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = group.gname + ' (id: ' + group.grpId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    let someText = document.createTextNode(JSON.stringify(group));
    secondarySideContent.appendChild(someText);
    let deleteButton = createElement('button', 'delete-button', 'Delete');
    deleteButton.addEventListener('click', (e) => {
        deleteGroup(group);
        if (!fabricLocked)
            hideSecondarySideConfig();
    });
    secondarySideContent.appendChild(deleteButton);
}

function loadGroupDetailsV2(group) {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = group.gname + ' (id: ' + group.grpId + ')';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';

    let detailsBlock = createElement('div');
    secondarySideContent.appendChild(detailsBlock);
    fetchGroupDetails(group.grpId, detailsBlock);

    let deleteButton = createElement('button', 'delete-button', 'Delete');
    deleteButton.addEventListener('click', (e) => {
        deleteGroup(group);
        if (!fabricLocked)
            hideSecondarySideConfig();
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

    let index = fabrics.fabrIds.indexOf(fabricSelected);
    if (index == -1) return;
    fabrics.devices[index].forEach(device => {
        let listElement = document.createElement('li');
        listElement.innerHTML = device.id;
        if (device.mach_id == null)
            unassignedDevicesList.appendChild(listElement);
        else
            assignedDevicesList.appendChild(listElement);
    });
}
function loadDevicesV2() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Devices';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';

    let unassignedDevicesHeader = createElement('h3', '', 'Unassigned');
    secondarySideContent.appendChild(unassignedDevicesHeader);
    let unassignedDevicesList = createElement('div', 'device-list');
    secondarySideContent.appendChild(unassignedDevicesList);

    let assignedDevicesHeader = createElement('h3', '', 'Assigned');
    secondarySideContent.appendChild(assignedDevicesHeader);
    let assignedDevicesList = createElement('div', 'device-list');
    secondarySideContent.appendChild(assignedDevicesList);

    let detailsHeader = createElement('h3', '', 'Details');
    secondarySideContent.appendChild(detailsHeader);
    let detailsSection = createElement('div');
    detailsSection.setAttribute('id', 'details-section');
    secondarySideContent.appendChild(detailsSection);

    let index = fabrics.fabrIds.indexOf(fabricSelected);
    if (index == -1) return;
    fabrics.devices[index].forEach(device => {
        let deviceItem = createElement('div', 'device-item');
        let deviceLabel = createElement('div', 'device-label', device.id);
        if (complexComposeTracker.hasOwnProperty(device.type) && complexComposeTracker[device.type].includes(device.id)) {
            deviceLabel.classList.add('selected');
        }
        deviceLabel.setAttribute('data-value', device.id);
        deviceLabel.setAttribute('data-type', device.type);
        deviceItem.appendChild(deviceLabel);

        if (device.mach_id == null)
            unassignedDevicesList.appendChild(deviceItem);
        else
            assignedDevicesList.appendChild(deviceItem);
    });
}

function loadGroupSimpleConfig() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Group Create';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    secondarySideContent.appendChild(groupCreateForm);
}

// function loadGroupComplexConfig() {

// }

function loadMachineSimpleConfig() {
    let sideHeaderTitle = document.getElementById('secondary-drawer-header-title');
    sideHeaderTitle.innerHTML = 'Machine Compose';
    let secondarySideContent = document.getElementById('secondary-side-content');
    secondarySideContent.innerHTML = '';
    secondarySideContent.appendChild(simpleMachineComposeForm);
    let moreOptionsButton = createElement('div', 'more-options-button', '<i class="fa fa-cogs"></i>');
    moreOptionsButton.addEventListener('click', () => {
        hideSecondarySideConfig(loadDevicesV2, showSecondarySideConfig);
        loadMachineComplexConfig();
        showMainConfig();
    });
    secondarySideContent.appendChild(moreOptionsButton);
}

function loadMachineComplexConfig() {
    let mainHeaderTitle = document.getElementById('main-drawer-header-title');
    mainHeaderTitle.innerHTML = 'Machine Compose';
    let mainConfigContent = document.getElementById('main-config-content');
    mainConfigContent.innerHTML = '';
    mainConfigContent.appendChild(complexMachineComposeForm);
}

function showSecondarySideConfig() {
    if (secondaryConfigShown) return;
    $('#side-config-drawer')
        .css({ left: '100%' })
        .animate({ left: '0%' }, 500, () => {
            secondaryConfigShown = true;
        });
}

function hideSecondarySideConfig(...callbacks) {
    if (!secondaryConfigShown) return;
    $('#side-config-drawer')
        .css({ left: '0%' })
        .animate({ left: '100%' }, 500, () => {
            secondaryConfigShown = false;
            if (callbacks) {
                callbacks.forEach(cb => {
                    cb();
                });
            }
        });
}

function showMainConfig() {
    if (mainConfigShown) return;
    $('#main-config-drawer')
        .css({ bottom: '1000%' })
        .animate({ bottom: '0%' }, 500, () => {
            mainConfigShown = true;
        });
}
function hideMainConfig(...callbacks) {
    if (!mainConfigShown) return;
    $('#main-config-drawer')
        .css({ bottom: '0%' })
        .animate({ bottom: '100%' }, 500, () => {
            mainConfigShown = false;
            if (callbacks) {
                callbacks.forEach(cb => {
                    cb();
                });
            }
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

function displayDetails(details, targetElement) {
    if (!targetElement) {
        console.log(details);
        return;
    }
    targetElement.innerHTML = '';
    let list = createElement('ul');
    Object.keys(details).forEach(detail => {
        let listItem = createElement('li', '', `${detail}: ${details[detail]}`);
        list.appendChild(listItem);
    });
    targetElement.appendChild(list);
}

function fetchDeviceDetails(id, targetElement) {
    if (deviceDetailsCache.hasOwnProperty(id)) {
        displayDetails(deviceDetailsCache[id], targetElement);
        return;
    }
    $.ajax({
        url: `api/details/device/${fabricSelected}/${id}`,
        type: 'GET',
        dataType: 'json',
        success: (res) => {
            deviceDetailsCache[id] = res;
            displayDetails(res, targetElement);
        },
        error: (err) => {
            displayDetails(err.responseJSON);
        }
    });
}

function fetchMachineDetails(id, targetElement) {
    $.ajax({
        url: `api/details/machine/${fabricSelected}/${id}`,
        type: 'GET',
        dataType: 'json',
        success: (res) => {
            displayDetails(res, targetElement);
        },
        error: (err) => {
            displayDetails(err.responseJSON);
        }
    });
}

function fetchGroupDetails(id, targetElement) {
    $.ajax({
        url: `api/details/group/${fabricSelected}/${id}`,
        type: 'GET',
        dataType: 'json',
        success: (res) => {
            displayDetails(res, targetElement);
        },
        error: (err) => {
            displayDetails(err.responseJSON);
        }
    });
}

function postGroupCreateData(data) {
    try {
        if (fabricLocked) {
            indicateOperationBlocked();
            return;
        }
        lastControlOperation = Date.now();
        let name = (data.name) ? data.name : '';
        let alertId = generateAlert({
            title: 'Creating: ' + name,
            message: 'Message: ' + 'Trying to create your group. Please wait...',
            duration: -1
        });
        $.ajax({
            url: `api/group`,
            type: 'POST',
            data: JSON.stringify({
                name: name,
                fabrId: parseInt(fabricSelected)
            }),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: (res) => {
                // console.log('From server: ' + JSON.stringify(res));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Success: ' + name + ' has been created.',
                    message: 'Message: Create task completed.'
                });
            },
            error: (err) => {
                // console.log('got error: ' + JSON.stringify(err));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description,
                });
            }
        });
    }
    catch (err) {
        throw 'Error in group create: ' + err;
    }
}

function deleteGroup(group) {
    try {
        if (fabricLocked) {
            indicateOperationBlocked();
            return;
        }
        lastControlOperation = Date.now();
        let alertId = generateAlert({
            title: 'Deleting: ' + group.gname,
            message: 'Message: ' + 'Trying to delete your group. Please wait...',
            duration: -1
        });
        $.ajax({
            url: `api/group/${fabricSelected}/${group.grpId}`,
            type: 'DELETE',
            dataType: 'json',
            success: (data) => {
                // console.log('From server: ' + JSON.stringify(data));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Success: ' + group.gname + ' has been deleted.',
                    message: 'Message: Delete task completed.'
                });
            },
            error: (err) => {
                // console.log('got error: ' + JSON.stringify(err));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description
                });
            }
        });
    }
    catch (err) {
        throw 'Error in delete group: ' + err;
    }
}

function postMachineComposeData(data, complex = false) {
    try {
        if (fabricLocked) {
            indicateOperationBlocked();
            return;
        }
        lastControlOperation = Date.now();
        let groupId = parseInt(data.grpId);
        if (typeof groupId != 'number' || isNaN(groupId) || groupId <= 0) {
            groupId = null;
        }
        let name = (data.name) ? data.name : '';
        let alertId = generateAlert({
            title: 'Composing: ' + name,
            message: 'Message: ' + 'Trying to compose your machine. Please wait...',
            duration: -1
        });
        if (complex) {
            var json = JSON.stringify({
                cpu: data.cpu,
                gpu: data.gpu,
                ssd: data.ssd,
                optane: data.optane,
                nic: data.nic,
                name: name,
                grpId: groupId,
                fabrId: parseInt(fabricSelected)
            });
        }
        else {
            var json = JSON.stringify({
                cpu: parseInt(data.cpu) | 0,
                gpu: parseInt(data.gpu) | 0,
                ssd: parseInt(data.ssd) | 0,
                optane: parseInt(data.optane) | 0,
                nic: parseInt(data.nic) | 0,
                fpga: parseInt(data.fpga) | 0,
                name: name,
                grpId: groupId,
                fabrId: parseInt(fabricSelected)
            });
        }
        $.ajax({
            url: `api/machine`,
            type: 'POST',
            data: json,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: (res) => {
                // console.log('From server: ' + JSON.stringify(res));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Success: ' + name + ' has been composed.',
                    message: 'Message: Compose task completed.'
                });
            },
            error: (err) => {
                // console.log('got error: ' + JSON.stringify(err));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Compose Failed: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description
                });
            }
        });
    }
    catch (err) {
        throw 'Error in group create: ' + err;
    }
}

function decomposeMachine(machine) {
    try {
        if (fabricLocked) {
            indicateOperationBlocked();
            return;
        }
        lastControlOperation = Date.now();
        let alertId = generateAlert({
            title: 'Decomposing: ' + machine.mname,
            message: 'Message: ' + 'Trying to decompose your machine. Please wait...',
            duration: -1
        });
        $.ajax({
            url: `api/machine/${fabricSelected}/${machine.machId}`,
            type: 'DELETE',
            dataType: 'json',
            success: (data) => {
                // console.log('From server: ' + JSON.stringify(data));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Success: ' + machine.mname + ' has been decomposed.',
                    message: 'Message: Decompose task completed.'
                });
            },
            error: (err) => {
                // console.log('got error: ' + JSON.stringify(err));
                deleteAlert(alertId);
                generateAlert({
                    title: 'Error: ' + err.responseJSON.code,
                    message: 'Message: ' + err.responseJSON.description
                });
            }
        });
    }
    catch (err) {
        throw 'Error in decompose machine: ' + err;
    }
}

function generateAlertId() {
    if (usableAlertIds.length > 0) {
        let id = usableAlertIds.pop();
        return id;
    }
    else {
        let id = alertsGenerated.toString();
        alertsGenerated++;
        return id;
    }
}
/*
 * alert: title, message, duration, ignorable
 */
function generateAlert(alertConfig) {
    let id = generateAlertId();
    if (alerts.hasOwnProperty(alertConfig.id)) {
        console.log('Duplicate alert id generated, please look into this problem');
        return;
    }
    let alert = document.createElement('div');
    alert.setAttribute('class', 'alert-popup');
    let title = document.createElement('div');
    title.innerHTML = alertConfig.title;
    alert.appendChild(title);
    let message = document.createElement('div');
    message.innerHTML = alertConfig.message;
    alert.appendChild(message);
    alerts[id] = alert;

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
                    if (alertConfig.ignorable == null || alertConfig.ignorable == true) {
                        alert.addEventListener('click', (e) => {
                            deleteAlert(id);
                        });
                    }
                    if (alertConfig.duration >= 0) {
                        setTimeout(() => {
                            deleteAlert(id);
                        }, alertConfig.duration);
                    }
                    else if (alertConfig.duration == null) {
                        setTimeout(() => {
                            deleteAlert(id);
                        }, 5000);
                    }
                });
        });
    return id;
}

function deleteAlert(id) {
    if (!alerts.hasOwnProperty(id)) return;
    let alert = alerts[id];
    delete alerts[id];
    usableAlertIds.push(id);
    $(alert)
        .css({ 'margin-left': '0px' })
        .animate({ 'margin-left': '264px' }, 300, () => {
            $(alert)
                .css({ 'margin-top': '0px' })
                .animate({ 'margin-top': '-104px' }, 300, () => {
                    alert.remove();
                });
        });
}

function getFormData(formId) {
    return $(`#${formId}`).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
}

function createElement(elementType, classes, content) {
    let element = document.createElement(elementType);
    element.setAttribute('class', classes);
    if (content != null) {
        element.innerHTML = content;
    }
    return element;
}

function clearComposeTrackerAndLabels() {
    complexComposeTracker = {
        cpu: [],
        gpu: [],
        ssd: [],
        optane: [],
        nic: []
    }
    Object.keys(complexComposeTracker).forEach(type => {
        document.getElementById('store-' + type).innerHTML = '';
    });
    loadDevicesV2();
}

$(document).ready(() => {
    liqidView = document.getElementById('liqid-view');
    alertsRegion = document.getElementById('alerts');
    prepareSideMenu();
    prepareFabricIndicator();
    prepareSideConfig();
    prepareMainConfig();
    prepareDocumentEventHandlers();
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
        if (secondaryConfigShown && document.getElementById('secondary-drawer-header-title').innerHTML == 'Devices') {

        }
    }
});
// socket.on('busy', (busyData) => {

// });