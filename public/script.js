// script.js

const API_URL = 'http://localhost:3000/api/persons';
let isEditing = false;

async function loadPersons() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to load persons');
        const persons = await res.json();
        const personsContainer = document.getElementById('persons');
        personsContainer.innerHTML = persons.map(p => `
            <div class="card mb-2 p-2" data-id="${p.id}">
                <div><strong>${p.firstname} ${p.lastname}</strong> (Born: ${formatDate(p.birthdate)})</div>
                <div>Gender: ${p.gender} | First Registration: ${formatDate(p.firstRegistration)}</div>
                <div>Cellular: ${p.celular} | Email: ${p.email} | Phone: ${p.phone}</div>
                <button class="btn btn-danger btn-sm me-2 mt-2 delete-btn">Delete</button>
                <button class="btn btn-secondary btn-sm mt-2 edit-btn">Edit</button>
            </div>
        `).join('');
        attachCardListeners();
    } catch (error) {
        console.error(error);
        alert('Error loading persons.');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}

function attachCardListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.closest('[data-id]').dataset.id;
            deletePerson(id);
        });
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.closest('[data-id]').dataset.id;
            // load data from server instead of inferring from text
            fetch(`${API_URL}/${id}`)
                .then(r => r.json())
                .then(person => fillFormForEdit(person))
                .catch(console.error);
        });
    });
}

function fillFormForEdit(person) {
    document.getElementById('personId').value = person.id;
    document.getElementById('firstname').value = person.firstname;
    document.getElementById('lastname').value = person.lastname;
    if (person.birthdate) document.getElementById('birthdate').value = formatDate(person.birthdate);
    document.getElementById('gender').value = person.gender;
    if (person.firstRegistration) document.getElementById('firstRegistration').value = formatDate(person.firstRegistration);
    document.getElementById('celular').value = person.celular;
    document.getElementById('email').value = person.email;
    document.getElementById('phone').value = person.phone;

    isEditing = true;
    document.getElementById('submitBtn').textContent = 'Update';
    document.getElementById('cancelBtn').style.display = '';
}

function resetForm() {
    document.getElementById('personId').value = '';
    clearForm();
    isEditing = false;
    document.getElementById('submitBtn').textContent = 'Save';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function submitHandler(e) {
    e.preventDefault();
    const id = document.getElementById('personId').value;
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const birthdate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value.trim();
    const firstRegistration = document.getElementById('firstRegistration').value;
    const celular = document.getElementById('celular').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!firstname || !lastname || !birthdate || !gender || !firstRegistration || !celular || !email || !phone) {
        alert('Please fill in all fields.');
        return;
    }

    const payload = { firstname, lastname, birthdate, gender, firstRegistration, celular, email, phone };
    try {
        let res;
        if (isEditing && id) {
            res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        if (!res.ok) throw new Error('Failed to save person');
        resetForm();
        loadPersons();
    } catch (error) {
        console.error(error);
        alert('Error saving person.');
    }
}

document.getElementById('personForm').addEventListener('submit', submitHandler);
document.getElementById('cancelBtn').addEventListener('click', resetForm);

async function deletePerson(id) {
    if (!confirm('Are you sure you want to delete this person?')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete person');
        loadPersons();
    } catch (error) {
        console.error(error);
        alert('Error deleting person.');
    }
}

function clearForm() {
    ['firstname', 'lastname', 'birthdate', 'gender', 'firstRegistration', 'celular', 'email', 'phone'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

window.onload = loadPersons;