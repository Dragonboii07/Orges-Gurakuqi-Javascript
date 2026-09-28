const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { createMemoryStore, dbConfigFromEnv } = require('../src/stores');

const anna = {
    firstname: 'Anna',
    lastname: 'Muller',
    birthdate: '2000-05-01',
    gender: 'f',
    firstRegistration: '2024-01-15',
    celular: '+49 170 1234567',
    email: 'anna@example.com',
    phone: '030 123456'
};

async function withServer(fn) {
    const server = createApp(createMemoryStore()).listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/persons`;
    const call = (path, method = 'GET', body) => fetch(base + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
    });
    try {
        await fn(call);
    } finally {
        server.close();
    }
}

test('create, read, update and delete a person', () => withServer(async call => {
    let res = await call('', 'POST', anna);
    assert.strictEqual(res.status, 201);
    const created = await res.json();
    assert.strictEqual(created.id, 1);
    assert.strictEqual(created.gender, 'F');

    res = await call('/1');
    assert.strictEqual((await res.json()).firstname, 'Anna');

    res = await call('/1', 'PUT', { ...anna, lastname: 'Schmidt' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).lastname, 'Schmidt');

    res = await call('', 'GET');
    assert.strictEqual((await res.json()).length, 1);

    res = await call('/1', 'DELETE');
    assert.strictEqual(res.status, 204);
    res = await call('/1');
    assert.strictEqual(res.status, 404);
}));

test('rejects missing or invalid fields', () => withServer(async call => {
    let res = await call('', 'POST', { ...anna, email: '' });
    assert.strictEqual(res.status, 400);
    assert.match((await res.json()).error, /email/);

    res = await call('', 'POST', { ...anna, gender: 'X' });
    assert.strictEqual(res.status, 400);

    res = await call('', 'POST', { ...anna, birthdate: '01/05/2000' });
    assert.strictEqual(res.status, 400);
}));

test('unknown or malformed ids', () => withServer(async call => {
    assert.strictEqual((await call('/99')).status, 404);
    assert.strictEqual((await call('/99', 'PUT', anna)).status, 404);
    assert.strictEqual((await call('/99', 'DELETE')).status, 404);
    assert.strictEqual((await call('/abc')).status, 400);
}));

test('database config needs every setting', () => {
    assert.strictEqual(dbConfigFromEnv({}), null);
    const config = dbConfigFromEnv({ DB_USER: 'u', DB_PASS: 'p', DB_SERVER: 'localhost', DB_NAME: 'Gym' });
    assert.strictEqual(config.port, 1433);
    assert.strictEqual(config.options.trustServerCertificate, false);
});
