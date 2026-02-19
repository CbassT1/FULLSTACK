const URL = 'http://localhost:3000';
let token = localStorage.getItem('token');
let idEdicion = null;
let listaFacturas = [];

if(token) mostrarApp();

async function login() {
    const rfc = document.getElementById('rfc').value;
    const password = document.getElementById('pass').value;

    if(!rfc || !password) {
        alert("Por favor ingresa RFC y contraseña");
        return;
    }

    const res = await fetch(URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc, password })
    });

    if(res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        token = data.token;
        mostrarApp();
    } else {
        const msg = await res.text();
        alert('Error al entrar: ' + msg);
    }
}

async function registrar() {
    const rfc = document.getElementById('rfc').value;
    const password = document.getElementById('pass').value;

    const res = await fetch(URL + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc, password })
    });

    if(res.ok) {
        alert('Registrado con éxito. Ahora inicia sesión.');
    } else {
        const mensajeError = await res.text();
        alert('Error: ' + mensajeError);
    }
}

function logout() {
    localStorage.removeItem('token');
    location.reload();
}

function mostrarApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    cargarFacturas();
}

async function cargarFacturas() {
    const res = await fetch(URL + '/facturas', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if(res.status === 401 || res.status === 403) {
        logout();
        return;
    }

    listaFacturas = await res.json();
    renderizarTabla();
}

function renderizarTabla() {
    const tabla = document.getElementById('tabla-facturas');
    tabla.innerHTML = '';

    if(listaFacturas.length === 0) {
        tabla.innerHTML = '<tr><td colspan="4" style="text-align:center">No tienes facturas registradas.</td></tr>';
        return;
    }

    listaFacturas.forEach(f => {
        let claseEstado = 'estado-borrador';
        if(f.estado === 'Emitida') claseEstado = 'estado-emitida';
        if(f.estado === 'Cancelada') claseEstado = 'estado-cancelada';

        const btnEditar = f.estado === 'No emitida'
            ? `<button class="btn-sm" style="background:#ffc107; color:black;" onclick="prepararEdicion(${f.id})">Editar</button>`
            : '';

        const btnEmitir = f.estado === 'No emitida'
            ? `<button class="btn-sm" onclick="cambiarEstado(${f.id}, 'Emitida')">Emitir</button>`
            : '';

        const btnCancelar = f.estado !== 'Cancelada'
            ? `<button class="btn-sm btn-danger" onclick="cambiarEstado(${f.id}, 'Cancelada')">Cancelar</button>`
            : '';

        tabla.innerHTML += `
            <tr>
                <td>${f.cliente} <br> <small style="color:gray">${f.concepto || ''}</small></td>
                <td>$${f.monto}</td>
                <td><span class="${claseEstado}">${f.estado}</span></td>
                <td>
                    ${btnEditar}
                    ${btnEmitir}
                    ${btnCancelar}
                </td>
            </tr>`;
    });
}

function prepararEdicion(id) {
    const factura = listaFacturas.find(f => f.id === id);
    if(factura) {
        document.getElementById('cliente').value = factura.cliente;
        document.getElementById('monto').value = factura.monto;
        document.getElementById('concepto').value = factura.concepto || '';

        idEdicion = id;

        const btnGuardar = document.getElementById('btn-guardar');
        btnGuardar.innerText = "Guardar Cambios";
        btnGuardar.style.backgroundColor = "#ffc107";
        btnGuardar.style.color = "black";
    }
}

async function guardarFactura() {
    const cliente = document.getElementById('cliente').value;
    const monto = document.getElementById('monto').value;
    const concepto = document.getElementById('concepto').value;

    if(!cliente || !monto) {
        alert("El cliente y el monto son obligatorios");
        return;
    }

    if (idEdicion) {
        await fetch(`${URL}/facturas/${idEdicion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cliente, monto, concepto })
        });
        idEdicion = null;

        const btnGuardar = document.getElementById('btn-guardar');
        btnGuardar.innerText = "Crear Borrador";
        btnGuardar.style.backgroundColor = "#0069d9";
        btnGuardar.style.color = "white";

    } else {
        await fetch(URL + '/facturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cliente, monto, concepto })
        });
    }

    document.getElementById('cliente').value = '';
    document.getElementById('monto').value = '';
    document.getElementById('concepto').value = '';

    cargarFacturas();
}

async function cambiarEstado(id, estado) {
    if(!confirm(`¿Estás seguro de cambiar el estado a: ${estado}?`)) return;

    await fetch(`${URL}/facturas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado })
    });
    cargarFacturas();
}