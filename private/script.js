const socket = io();
var config;

function createMachine() {
    create(
        parseInt(document.getElementById('cpu').value),
        parseInt(document.getElementById('ssd').value),
        parseInt(document.getElementById('gpu').value),
        parseInt(document.getElementById('nic').value),
        document.getElementById('name').value,
        parseInt(document.getElementById('gid').value),
        parseInt(document.getElementById('fid').value)
    );
}

function deleteMachine() {
    socket.emit('delete-machine', {
        "fabr_id": parseInt(document.getElementById('fid2').value),
        "id": document.getElementById('mid2').value
    });
}

function deleteGroup() {
    socket.emit('delete-group', {
        "fabr_id": parseInt(document.getElementById('fid3').value),
        "id": document.getElementById('gid3').value
    });
}

function reload() {
    socket.emit('reload');
}

function create(c, s, g, n, name, gid, fid) {
    console.log('Trying to compose.');
    socket.emit('create', {
        "fabr_id": fid,
        "cpu": c,
        "gpu": g,
        "ssd": s,
        "nic": n,
        "fpga": 0,
        "name": name,
        "groupId": gid
    });
}

function updateClientView(data) {
    let index = 0;
    data.fabrIds.forEach(id => {
        var table = document.getElementById(id);
        table.innerHTML = '';

        var tableBody = document.createElement('TBODY');
        table.appendChild(tableBody);

        var thr = document.createElement('TR');
        tableBody.appendChild(thr);
        [`Fabric: ${id}`, 'type', 'fabr_id', 'grp_id', 'gname', 'mach_id', 'mname', 'lanes', 'ipmi'].forEach(header => {
            var th = document.createElement('TH');
            th.appendChild(document.createTextNode(header));
            thr.appendChild(th);
        });

        data.devices[index].forEach(device => {
            var tr = document.createElement('TR');
            tableBody.appendChild(tr);
            Object.keys(device).forEach(property => {
                var td = document.createElement('TD');
                td.appendChild(document.createTextNode(device[property]));
                tr.appendChild(td);
            });
        });

        index++;
    });
}

function generateTables() {
    let fabrIds = config.fabrIds;
    document.getElementById('liqid-table-view').innerHTML = '';
    fabrIds.forEach(id => {
        var table = document.createElement('TABLE');
        table.setAttribute('id', id);
        table.border = '1';
        document.getElementById('liqid-table-view').appendChild(table);
    });
}

$(document).ready(() => {
    generateTables(config.fabrIds);
});

socket.on('update', (update) => {
    console.log('Received an update!');
    document.getElementById('liqid-state').innerHTML = JSON.stringify(update);
});
socket.on('success', (msg) => {
    console.log(msg);
});
socket.on('err', (err) => {
    console.log(err);
});
socket.on('init-config', (c) => {
    config = c;
});
socket.on('liqid-state-update', (data) => {
    console.log('Liqid system state changed...');
    updateClientView(data);
})