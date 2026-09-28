const path = require('path');
const express = require('express');
const cors = require('cors');
const { FIELDS } = require('./stores');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Returns [person, error]. Trims strings and checks every field is present
// and well formed.
function validatePerson(body) {
    if (!body || typeof body !== 'object') return [null, 'Request body must be JSON'];
    const person = {};
    for (const field of FIELDS) {
        const value = typeof body[field] === 'string' ? body[field].trim() : '';
        if (!value) return [null, `Missing field: ${field}`];
        person[field] = value;
    }
    person.gender = person.gender.toUpperCase();
    if (!['M', 'F'].includes(person.gender)) return [null, 'gender must be M or F'];
    for (const field of ['birthdate', 'firstRegistration']) {
        if (!DATE_RE.test(person[field]) || isNaN(Date.parse(person[field]))) {
            return [null, `${field} must be a date in YYYY-MM-DD format`];
        }
    }
    if (!EMAIL_RE.test(person.email)) return [null, 'email is not valid'];
    return [person, null];
}

function parseId(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'id must be a positive integer' });
        return null;
    }
    return id;
}

function createApp(store) {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/api/persons', async (req, res) => {
        res.json(await store.list());
    });

    app.get('/api/persons/:id', async (req, res) => {
        const id = parseId(req, res);
        if (id === null) return;
        const person = await store.get(id);
        if (!person) return res.status(404).json({ error: 'Not found' });
        res.json(person);
    });

    app.post('/api/persons', async (req, res) => {
        const [person, error] = validatePerson(req.body);
        if (error) return res.status(400).json({ error });
        const added = await store.add(person);
        res.status(201).json(added);
    });

    app.put('/api/persons/:id', async (req, res) => {
        const id = parseId(req, res);
        if (id === null) return;
        const [person, error] = validatePerson(req.body);
        if (error) return res.status(400).json({ error });
        const updated = await store.update(id, person);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    });

    app.delete('/api/persons/:id', async (req, res) => {
        const id = parseId(req, res);
        if (id === null) return;
        const removed = await store.remove(id);
        if (!removed) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    });

    // Express 5 forwards rejected promises from the handlers above to here.
    app.use((err, req, res, next) => {
        console.error(`${req.method} ${req.path} failed:`, err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}

module.exports = { createApp, validatePerson };
