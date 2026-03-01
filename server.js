require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

// SQL Server configuration
// Move sensitive values to environment variables when pushing to GitHub
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'sql@TCT5*',
    server: process.env.DB_SERVER || '185.158.2.148',
    port: parseInt(process.env.DB_PORT, 10) || 54321,
    database: process.env.DB_NAME || 'Gym',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

app.use(cors());
app.use(express.json());

// use a single connection pool for the lifetime of the app
let pool;
let useMemory = false;
const memoryStore = [];
let nextId = 1;

function getAllMemory() {
    return memoryStore;
}
function getMemory(id) {
    return memoryStore.find(p => p.id === parseInt(id, 10));
}
function addMemory(person) {
    const record = { id: nextId++, ...person };
    memoryStore.push(record);
    return record;
}
function updateMemory(id, updates) {
    const rec = getMemory(id);
    if (!rec) return null;
    Object.assign(rec, updates);
    return rec;
}
function deleteMemory(id) {
    const idx = memoryStore.findIndex(p => p.id === parseInt(id, 10));
    if (idx >= 0) {
        memoryStore.splice(idx, 1);
        return true;
    }
    return false;
}

async function getPool() {
    if (useMemory) {
        throw new Error('Memory mode');
    }
    if (!pool) {
        pool = await sql.connect(dbConfig);
    }
    return pool;
}

// try to connect once at startup
(async () => {
    try {
        await getPool();
        console.log('Connected to SQL Server');
    } catch (err) {
        console.warn('Could not connect to SQL Server, falling back to in-memory store:', err.message);
        useMemory = true;
    }
})();

// Get all persons
app.get('/api/persons', async (req, res) => {
    if (useMemory) {
        return res.json(getAllMemory());
    }
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM Persons');
        res.json(result.recordset);
    } catch (err) {
        console.error('GET /api/persons error', err);
        // on connection error switch to memory mode
        if (err.message && err.message.includes('connect')) {
            useMemory = true;
            return res.json(getAllMemory());
        }
        res.status(500).json({ error: err.message });
    }
});

// Get one person by id
app.get('/api/persons/:id', async (req, res) => {
    const { id } = req.params;
    if (useMemory) {
        const p = getMemory(id);
        if (!p) return res.status(404).json({ error: 'Not found' });
        return res.json(p);
    }
    try {
        const p = await getPool();
        const result = await p.request().input('id', sql.Int, id).query('SELECT * FROM Persons WHERE id = @id');
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('GET /api/persons/:id error', err);
        if (err.message && err.message.includes('connect')) {
            useMemory = true;
            const p = getMemory(id);
            if (!p) return res.status(404).json({ error: 'Not found' });
            return res.json(p);
        }
        res.status(500).json({ error: err.message });
    }
});

// Add new person
app.post('/api/persons', async (req, res) => {
    const { firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone } = req.body;
    if (useMemory) {
        const added = addMemory({ firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone });
        return res.json({ message: 'Person added successfully (memory)', person: added });
    }
    try {
        const p = await getPool();
        await p.request()
            .input('firstname', sql.VarChar(100), firstname)
            .input('lastname', sql.VarChar(100), lastname)
            .input('birthdate', sql.Date, birthdate)
            .input('gender', sql.Char(1), gender)
            .input('firstRegistration', sql.Date, firstRegistration)
            .input('celular', sql.VarChar(50), celular)
            .input('email', sql.VarChar(200), email)
            .input('phone', sql.VarChar(50), phone)
            .query('INSERT INTO Persons (firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone) VALUES (@firstname, @lastname, @birthdate, @gender, @firstRegistration, @celular, @email, @phone)');
        res.json({ message: 'Person added successfully' });
    } catch (err) {
        console.error('POST /api/persons error', err);
        if (err.message && err.message.includes('connect')) {
            useMemory = true;
            const added = addMemory({ firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone });
            return res.json({ message: 'Person added successfully (memory)', person: added });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update person
app.put('/api/persons/:id', async (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone } = req.body;
    if (useMemory) {
        const updated = updateMemory(id, { firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        return res.json({ message: 'Person updated successfully (memory)', person: updated });
    }
    try {
        const p = await getPool();
        await p.request()
            .input('id', sql.Int, id)
            .input('firstname', sql.VarChar(100), firstname)
            .input('lastname', sql.VarChar(100), lastname)
            .input('birthdate', sql.Date, birthdate)
            .input('gender', sql.Char(1), gender)
            .input('firstRegistration', sql.Date, firstRegistration)
            .input('celular', sql.VarChar(50), celular)
            .input('email', sql.VarChar(200), email)
            .input('phone', sql.VarChar(50), phone)
            .query('UPDATE Persons SET firstname=@firstname, lastname=@lastname, birthdate=@birthdate, gender=@gender, firstRegistration=@firstRegistration, celular=@celular, email=@email, phone=@phone WHERE id=@id');
        res.json({ message: 'Person updated successfully' });
    } catch (err) {
        console.error('PUT /api/persons error', err);
        if (err.message && err.message.includes('connect')) {
            useMemory = true;
            const updated = updateMemory(id, { firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone });
            if (!updated) return res.status(404).json({ error: 'Not found' });
            return res.json({ message: 'Person updated successfully (memory)', person: updated });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete person
app.delete('/api/persons/:id', async (req, res) => {
    const { id } = req.params;
    if (useMemory) {
        const ok = deleteMemory(id);
        if (!ok) return res.status(404).json({ error: 'Not found' });
        return res.json({ message: 'Person deleted successfully (memory)' });
    }
    try {
        const p = await getPool();
        await p.request().input('id', sql.Int, id).query('DELETE FROM Persons WHERE id=@id');
        res.json({ message: 'Person deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/persons error', err);
        if (err.message && err.message.includes('connect')) {
            useMemory = true;
            const ok = deleteMemory(id);
            if (!ok) return res.status(404).json({ error: 'Not found' });
            return res.json({ message: 'Person deleted successfully (memory)' });
        }
        res.status(500).json({ error: err.message });
    }
});

// graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (pool) await pool.close();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
