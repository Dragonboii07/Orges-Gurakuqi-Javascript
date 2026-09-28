const sql = require('mssql');

const FIELDS = ['firstname', 'lastname', 'birthdate', 'gender', 'firstRegistration', 'celular', 'email', 'phone'];

// Keeps persons in memory; used when no database is configured or reachable.
// Data is lost when the server stops.
function createMemoryStore() {
    const persons = [];
    let nextId = 1;

    return {
        kind: 'memory',
        async list() {
            return persons;
        },
        async get(id) {
            return persons.find(p => p.id === id) || null;
        },
        async add(person) {
            const record = { id: nextId++, ...person };
            persons.push(record);
            return record;
        },
        async update(id, person) {
            const record = persons.find(p => p.id === id);
            if (!record) return null;
            Object.assign(record, person);
            return record;
        },
        async remove(id) {
            const idx = persons.findIndex(p => p.id === id);
            if (idx < 0) return false;
            persons.splice(idx, 1);
            return true;
        },
        async close() {}
    };
}

function bindPerson(request, person) {
    return request
        .input('firstname', sql.VarChar(100), person.firstname)
        .input('lastname', sql.VarChar(100), person.lastname)
        .input('birthdate', sql.Date, person.birthdate)
        .input('gender', sql.Char(1), person.gender)
        .input('firstRegistration', sql.Date, person.firstRegistration)
        .input('celular', sql.VarChar(50), person.celular)
        .input('email', sql.VarChar(200), person.email)
        .input('phone', sql.VarChar(50), person.phone);
}

// Stores persons in the SQL Server table `Persons`.
async function createSqlStore(config) {
    const pool = await new sql.ConnectionPool(config).connect();

    return {
        kind: 'sql',
        async list() {
            const result = await pool.request().query('SELECT * FROM Persons ORDER BY id');
            return result.recordset;
        },
        async get(id) {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM Persons WHERE id = @id');
            return result.recordset[0] || null;
        },
        async add(person) {
            const result = await bindPerson(pool.request(), person).query(
                `INSERT INTO Persons (${FIELDS.join(', ')})
                 OUTPUT INSERTED.*
                 VALUES (${FIELDS.map(f => '@' + f).join(', ')})`);
            return result.recordset[0];
        },
        async update(id, person) {
            const result = await bindPerson(pool.request().input('id', sql.Int, id), person).query(
                `UPDATE Persons SET ${FIELDS.map(f => `${f}=@${f}`).join(', ')}
                 OUTPUT INSERTED.*
                 WHERE id=@id`);
            return result.recordset[0] || null;
        },
        async remove(id) {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Persons WHERE id=@id');
            return result.rowsAffected[0] > 0;
        },
        async close() {
            await pool.close();
        }
    };
}

// Reads the database settings from environment variables. Returns null when
// they are not all set, so the app runs in memory mode instead.
function dbConfigFromEnv(env = process.env) {
    const { DB_USER, DB_PASS, DB_SERVER, DB_NAME } = env;
    if (!DB_USER || !DB_PASS || !DB_SERVER || !DB_NAME) return null;
    return {
        user: DB_USER,
        password: DB_PASS,
        server: DB_SERVER,
        port: parseInt(env.DB_PORT, 10) || 1433,
        database: DB_NAME,
        options: {
            encrypt: true,
            trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE === 'true'
        }
    };
}

async function openStore(env = process.env) {
    const config = dbConfigFromEnv(env);
    if (!config) {
        console.warn('Database settings missing (see .env.example); using in-memory store.');
        return createMemoryStore();
    }
    try {
        const store = await createSqlStore(config);
        console.log('Connected to SQL Server');
        return store;
    } catch (err) {
        console.warn('Could not connect to SQL Server, using in-memory store:', err.message);
        return createMemoryStore();
    }
}

module.exports = { FIELDS, createMemoryStore, createSqlStore, dbConfigFromEnv, openStore };
