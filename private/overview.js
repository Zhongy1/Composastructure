const socket;

var fabrics;
var fabricSelected;
var liqidView;

function displayFabric(fabricId) {
    liqidView.innerHTML = '';
    if (!fabrics.fabricIds.includes(fabricId)) return;
    let index = fabrics.fabricIds.indexOf(fabricId);
    fabrics.groups[index].forEach(group => {
        let groupCard = document.createElement('div');
        groupCard.setAttribute('class', 'card card-group');
        let groupHeader = document.createElement('div');
        groupHeader.setAttribute('class', 'card-group-header');
        groupHeader.innerHTML = group.gname;
        groupCard.appendChild(groupHeader);

        group.machines.forEach(machine => {
            let machineCard = document.createElement('div');
            machineCard.setAttribute('class', 'card card-machine');
            machineCard.innerHTML = machine.mname;
            groupCard.appendChild(machineCard);
        });
        liqidView.appendChild(groupCard);
    });
}

function selectFabric(fabricId) {
    if (!fabricId || fabricId == fabricSelected) return;
    fabricSelected = fabricId;
    displayFabric(fabricId);
}

$(document).ready(() => {
    liqidView = document.getElementById('liqid-view');
    socket = io(window.location.href);
    socket.on('connect', () => {
        socket.on('initialize', (data) => {
            fabrics = data;
            selectFabric(fabrics.fabricIds[0]);
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
});