const express = require('express');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = "secreto_fiscal_super_seguro";

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));

async function leerArchivo(nombre) {
    try {
        const data = await fs.readFile(nombre, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

async function escribirArchivo(nombre, contenido) {
    await fs.writeFile(nombre, JSON.stringify(contenido, null, 2));
}

const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Requiere inicio de sesión' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ mensaje: 'Token inválido' });
        req.user = user;
        next();
    });
};

app.post('/register', async (req, res) => {
    const { rfc, password } = req.body;
    if (!rfc || !password) return res.status(400).send('Datos incompletos');
    const usuarios = await leerArchivo('usuarios.json');
    if (usuarios.find(u => u.rfc === rfc)) return res.status(400).send('RFC ya registrado');

    const hashedPw = await bcrypt.hash(password, 10);
    usuarios.push({ rfc, password: hashedPw });
    await escribirArchivo('usuarios.json', usuarios);
    res.status(201).send('Usuario registrado');
});

app.post('/login', async (req, res) => {
    const { rfc, password } = req.body;
    const usuarios = await leerArchivo('usuarios.json');
    const usuario = usuarios.find(u => u.rfc === rfc);
    if (usuario && await bcrypt.compare(password, usuario.password)) {
        const token = jwt.sign({ rfc: usuario.rfc }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ token });
    } else {
        res.status(400).send('Credenciales incorrectas');
    }
});

app.get('/facturas', autenticarToken, async (req, res) => {
    const facturas = await leerArchivo('facturas.json');
    const misFacturas = facturas.filter(f => f.rfc_emisor === req.user.rfc);
    res.json(misFacturas);
});

app.post('/facturas', autenticarToken, async (req, res) => {
    const { cliente, monto, concepto } = req.body;
    const facturas = await leerArchivo('facturas.json');
    const nueva = { id: Date.now(), rfc_emisor: req.user.rfc, cliente, monto, concepto, estado: "No emitida", fecha: new Date().toISOString() };
    facturas.push(nueva);
    await escribirArchivo('facturas.json', facturas);
    res.status(201).json(nueva);
});

app.put('/facturas/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { estado, cliente, monto, concepto } = req.body;

    let facturas = await leerArchivo('facturas.json');
    const idx = facturas.findIndex(f => f.id == id && f.rfc_emisor === req.user.rfc);

    if (idx === -1) return res.status(404).send('No encontrada');

    if (facturas[idx].estado === "Cancelada") {
        return res.status(400).send('No se puede editar una factura cancelada');
    }

    if (estado) facturas[idx].estado = estado;
    if (cliente) facturas[idx].cliente = cliente;
    if (monto) facturas[idx].monto = monto;
    if (concepto) facturas[idx].concepto = concepto;

    await escribirArchivo('facturas.json', facturas);
    res.json(facturas[idx]);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});