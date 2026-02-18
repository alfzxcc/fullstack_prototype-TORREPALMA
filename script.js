// --- Phase 2 & 4: State & Storage ---
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;
window.db = { accounts: [], departments: [], employees: [], requests: [] };

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        // Seed initial data
        window.db.accounts.push({ 
            fname: 'Admin', lname: 'User', email: 'admin@example.com', 
            password: 'Password123!', role: 'admin', verified: true 
        });
        window.db.departments = [
            { name: 'Engineering', desc: 'Tech team' },
            { name: 'HR', desc: 'Human Resources' }
        ];
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// --- Phase 2: Routing ---
function handleRouting() {
    const hash = window.location.hash || '#/';
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    // Protected Route Logic
    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts'];
    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];

    if (protectedRoutes.includes(hash) && !currentUser) {
        window.location.hash = '#/login';
        return;
    }

    if (adminRoutes.includes(hash) && currentUser?.role !== 'admin') {
        window.location.hash = '#/';
        return;
    }

    // Show active page
    const routeMap = {
        '#/': 'home-page',
        '#/register': 'register-page',
        '#/login': 'login-page',
        '#/verify-email': 'verify-email-page',
        '#/profile': 'profile-page',
        '#/accounts': 'accounts-page'
    };

    const activeId = routeMap[hash] || 'home-page';
    document.getElementById(activeId).classList.add('active');

    if (hash === '#/profile') renderProfile();
}

// --- Phase 3: Authentication ---
function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    if (isAuth) {
        body.classList.replace('not-authenticated', 'authenticated');
        document.getElementById('display-username').innerText = user.fname;
        if (user.role === 'admin') body.classList.add('is-admin');
    } else {
        body.classList.replace('authenticated', 'not-authenticated');
        body.classList.remove('is-admin');
        localStorage.removeItem('auth_token');
    }
}

// Registration Form
document.getElementById('register-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    if (window.db.accounts.find(a => a.email === email)) return alert("Email exists!");

    const newUser = {
        fname: document.getElementById('reg-fname').value,
        lname: document.getElementById('reg-lname').value,
        email: email,
        password: document.getElementById('reg-password').value,
        role: 'user',
        verified: false
    };

    window.db.accounts.push(newUser);
    saveToStorage();
    localStorage.unverified_email = email;
    window.location.hash = '#/verify-email';
};

function simulateVerification() {
    const email = localStorage.unverified_email;
    const user = window.db.accounts.find(a => a.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        alert("Verified! You can now login.");
        window.location.hash = '#/login';
    }
}

// Login Form
document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    const user = window.db.accounts.find(a => a.email === email && a.password === pass && a.verified);
    if (user) {
        localStorage.auth_token = email;
        setAuthState(true, user);
        window.location.hash = '#/profile';
    } else {
        alert("Invalid credentials or unverified account.");
    }
};

function logout() {
    setAuthState(false);
    window.location.hash = '#/';
}

// --- Phase 5: Profile ---
function renderProfile() {
    const container = document.getElementById('profile-content');
    container.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.fname} ${currentUser.lname}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> ${currentUser.role.toUpperCase()}</p>
    `;
}

// Initialize
window.addEventListener('hashchange', handleRouting);
window.onload = () => {
    loadFromStorage();
    // Auto-login if token exists
    const token = localStorage.auth_token;
    if (token) {
        const user = window.db.accounts.find(a => a.email === token);
        if (user) setAuthState(true, user);
    }
    handleRouting();
};


// --- Phase 6: Admin Accounts CRUD ---
function renderAccounts() {
    const list = document.getElementById('accounts-list');
    list.innerHTML = window.db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.fname} ${acc.lname}</td>
            <td>${acc.email}</td>
            <td><span class="badge ${acc.role === 'admin' ? 'bg-danger' : 'bg-info'}">${acc.role}</span></td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="resetPassword('${acc.email}')">PW</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteAccount(index) {
    const target = window.db.accounts[index];
    if (target.email === currentUser.email) return alert("You cannot delete yourself!");
    if (confirm("Delete this account?")) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccounts();
    }
}

function resetPassword(email) {
    const newPw = prompt("Enter new password (min 6 chars):");
    if (newPw && newPw.length >= 6) {
        const acc = window.db.accounts.find(a => a.email === email);
        acc.password = newPw;
        saveToStorage();
        alert("Password updated!");
    }
}

// --- Phase 7: Requests System ---
function showRequestModal() { document.getElementById('request-modal').classList.remove('d-none'); }
function closeRequestModal() { document.getElementById('request-modal').classList.add('d-none'); }

function addRequestItem() {
    const div = document.createElement('div');
    div.className = "input-group mb-1";
    div.innerHTML = `<input type="text" class="form-control item-name" placeholder="Item Name">
                     <input type="number" class="form-control item-qty" placeholder="Qty" style="max-width: 80px;">
                     <button class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('dynamic-items').appendChild(div);
}

function submitRequest() {
    const type = document.getElementById('req-type').value;
    const names = document.querySelectorAll('.item-name');
    const qtys = document.querySelectorAll('.item-qty');
    
    let items = [];
    names.forEach((n, i) => {
        if(n.value) items.push({ name: n.value, qty: qtys[i].value || 1 });
    });

    if (items.length === 0) return alert("Add at least one item!");

    const newReq = {
        type,
        items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    if(!window.db.requests) window.db.requests = [];
    window.db.requests.push(newReq);
    saveToStorage();
    closeRequestModal();
    renderRequests();
}

function renderRequests() {
    const list = document.getElementById('requests-list');
    const myReqs = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    list.innerHTML = myReqs.map(r => `
        <tr>
            <td>${r.type}</td>
            <td>${r.items.map(i => `${i.name} (${i.qty})`).join(', ')}</td>
            <td><span class="badge bg-warning text-dark">${r.status}</span></td>
            <td>${r.date}</td>
        </tr>
    `).join('');
}

// Update handleRouting to trigger these renders
const originalHandleRouting = handleRouting;
handleRouting = function() {
    originalHandleRouting();
    const hash = window.location.hash;
    if (hash === '#/accounts') renderAccounts();
    if (hash === '#/requests') renderRequests();
};