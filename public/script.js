// script.js

// relative URL, so the page works on whatever host/port the server runs on
const API_URL = '/api/persons';
const FIELDS = ['firstname', 'lastname', 'birthdate', 'gender', 'firstRegistration', 'celular', 'email', 'phone'];
let editingId = null;

// escape text before putting it into HTML, so a name like <script> is shown
// as text instead of being run by the browser
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatDate(dateString) {
    if (!dateString) return '';
    return String(dateString).slice(0, 10);
}

async function errorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body.error || fallback;
    } catch {
        return fallback;
    }
}

async function loadPersons() {
    const container = document.getElementById('persons');
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(await errorMessage(res, 'Failed to load persons'));
        const persons = await res.json();
        if (persons.length === 0) {
            container.innerHTML = '<p class="text-muted">No persons yet. Add one below.</p>';
            return;
        }
        container.innerHTML = persons.map(p => `
            <div class="card mb-2 p-2" data-id="${escapeHtml(p.id)}">
                <div><strong>${escapeHtml(p.firstname)} ${escapeHtml(p.lastname)}</strong> (Born: ${escapeHtml(formatDate(p.birthdate))})</div>
                <div>Gender: ${escapeHtml(p.gender)} | First Registration: ${escapeHtml(formatDate(p.firstRegistration))}</div>
                <div>Cellular: ${escapeHtml(p.celular)} | Email: ${escapeHtml(p.email)} | Phone: ${escapeHtml(p.phone)}</div>
                <div>
                    <button class="btn btn-danger btn-sm me-2 mt-2 delete-btn">Delete</button>
                    <button class="btn btn-secondary btn-sm mt-2 edit-btn">Edit</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`;
    }
}

// one listener on the list handles the buttons of every card
document.getElementById('persons').addEventListener('click', async e => {
    const card = e.target.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    if (e.target.classList.contains('delete-btn')) {
        deletePerson(id);
    } else if (e.target.classList.contains('edit-btn')) {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error(await errorMessage(res, 'Failed to load person'));
            fillFormForEdit(await res.json());
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
});

function fillFormForEdit(person) {
    editingId = person.id;
    for (const field of FIELDS) {
        const value = field === 'birthdate' || field === 'firstRegistration'
            ? formatDate(person[field])
            : person[field];
        document.getElementById(field).value = value ?? '';
    }
    document.getElementById('submitBtn').textContent = 'Update';
    document.getElementById('cancelBtn').style.display = '';
    document.getElementById('personForm').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    editingId = null;
    document.getElementById('personForm').reset();
    document.getElementById('submitBtn').textContent = 'Save';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function submitHandler(e) {
    e.preventDefault();
    const payload = {};
    for (const field of FIELDS) {
        payload[field] = document.getElementById(field).value.trim();
    }

    try {
        const res = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await errorMessage(res, 'Failed to save person'));
        resetForm();
        loadPersons();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function deletePerson(id) {
    if (!confirm('Are you sure you want to delete this person?')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await errorMessage(res, 'Failed to delete person'));
        if (String(editingId) === String(id)) resetForm();
        loadPersons();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

document.getElementById('personForm').addEventListener('submit', submitHandler);
document.getElementById('cancelBtn').addEventListener('click', resetForm);
loadPersons();
