const socket = io(window.location.href);

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
    var table = document.createElement('TABLE');
    table.border = '1';

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);

    var thr = document.createElement('TR');
    tableBody.appendChild(thr);
    ['', 'one', 'two', 'three'].forEach(header => {
        var th = document.createElement('TH');
        th.appendChild(document.createTextNode(header));
        thr.appendChild(th);
    });
    document.getElementById('liqid-table-view').innerHTML = '';
    document.getElementById('liqid-table-view').appendChild(table);
}

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
socket.on('liqid-state-update', (data) => {
    console.log('Liqid system state changed...');
    updateClientView(data);
})