// --- CONFIGURACIÓN & RUTAS ---
const appConfig = {
    default_route: "dashboard",
    routes: {
        dashboard: { title: "Dashboard - ByteCraft", template_id: "template-dashboard" },
        clientes: { title: "Clientes - ByteCraft", template_id: "template-clientes" },
        tareas: { title: "Tareas - ByteCraft", template_id: "template-tareas" },
        colaboradores: { title: "Colaboradores - ByteCraft", template_id: "template-colaboradores" },
        proyectos: { title: "Proyectos - ByteCraft", template_id: "template-proyectos" },
        configuracion: { title: "Configuración - ByteCraft", template_id: "template-configuracion" }
    }
};

const COLLABORATOR_ROLES = ["Administrador", "Trabajador", "Desarrollador Senior", "Diseñador UI/UX", "Tester", "Contador"];

// --- BASE DE DATOS LOCAL (Inicialización) ---
const initialDBState = {
    tasks: [
        { id: 1, title: 'Revisar servidor', status: 'Pendiente', assigneeId: 1, clientId: 1, time_spent: 0, duedate: '2025-12-01', priority: 'Alta', description: 'Revisión mensual.' },
    ],
    clients: [
        { id: 1, name: 'Innovatech Solutions', contact: 'contacto@innovatech.com' }
    ],
    projects: [],
    collaborators: [
        { id: 1, name: 'Ana Fernández', role: 'Desarrollador Senior', email: 'ana@bytecraft.com' }
    ],
    notifications: [],
    deleted_items: []
};

let localDB = JSON.parse(localStorage.getItem('bytecraft_db'));
if (!localDB) {
    localDB = JSON.parse(JSON.stringify(initialDBState));
    saveDB();
}

function saveDB() {
    localStorage.setItem('bytecraft_db', JSON.stringify(localDB));
}

// HELPERS DE HTML
function getRoleOptionsHTML(selectedRole = '') {
    return COLLABORATOR_ROLES.map(role => `<option value="${role}" ${role === selectedRole ? 'selected' : ''}>${role}</option>`).join('');
}
function getCollaboratorOptionsHTML(selectedId = null) {
    let options = '<option value="">Sin Asignar</option>';
    localDB.collaborators.forEach(collab => {
        options += `<option value="${collab.id}" ${collab.id == selectedId ? 'selected' : ''}>${collab.name}</option>`;
    });
    return options;
}
function getClientOptionsHTML(selectedId = null) {
    let options = '<option value="">Sin Cliente</option>';
    localDB.clients.forEach(client => {
        options += `<option value="${client.id}" ${client.id == selectedId ? 'selected' : ''}>${client.name}</option>`;
    });
    return options;
}

// UTILIDADES
function downloadDBData() {
    const dataStr = JSON.stringify(localDB, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `bytecraft_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    addNotification('Backup descargado.');
}

function addNotification(message) {
    localDB.notifications.unshift({ id: Date.now(), message, read: false, timestamp: Date.now() });
    localDB.notifications = localDB.notifications.slice(0, 20);
    saveDB();
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');
    if(badge) {
        const count = localDB.notifications.filter(n => !n.read).length;
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.toggle('hidden', count === 0);
    }
    if(list) {
        list.innerHTML = localDB.notifications.length === 0 ? '<p class="p-4 text-center text-gray-500">Sin notificaciones.</p>' :
        localDB.notifications.slice(0, 5).map(n => `
            <a href="#" class="block px-4 py-3 hover:bg-gray-50 ${n.read ? 'text-gray-500' : 'font-bold'}">
                <p class="text-sm">${n.message}</p>
            </a>`).join('');
    }
}

// --- NAVEGACIÓN ---
function navigate(page) {
    const route = appConfig.routes[page];
    if (!route) return;
    const template = document.getElementById(route.template_id);
    document.getElementById('app-content').innerHTML = template ? template.innerHTML : '<h1>404</h1>';

    if (page === 'dashboard') renderDashboard();
    if (page === 'clientes') renderClients();
    if (page === 'proyectos') renderProjects();
    if (page === 'tareas') renderTasks();
    if (page === 'colaboradores') renderCollaborators();
    if (page === 'configuracion') renderConfiguracion();

    document.title = route.title;
    const pt = document.getElementById('page-title');
    if (pt) pt.querySelector('span').textContent = page.charAt(0).toUpperCase() + page.slice(1);
    
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if(l.getAttribute('data-page') === page) l.classList.add('active');
    });
    window.location.hash = page;
}

function handleGoBack() { window.history.back(); }
function logout() { localStorage.removeItem('bytecraft_session'); window.location.href = 'login.html'; }

// --- RENDERS ---
function renderDashboard() {
    const stats = document.getElementById('dashboard-stats');
    if(stats) {
        stats.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-teal-500"><h3>Clientes: ${localDB.clients.length}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500"><h3>Proyectos: ${localDB.projects.length}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500"><h3>Tareas: ${localDB.tasks.filter(t=>t.status!=='Completada').length}</h3></div>
        `;
    }
}

function renderClients() {
    const list = document.getElementById('clients-list');
    if(!list) return;
    list.innerHTML = localDB.clients.map(c => `
        <div class="bg-white p-4 rounded-lg shadow flex justify-between">
            <div><h3 class="font-bold">${c.name}</h3><p class="text-sm">${c.contact}</p></div>
            <div>
                <button onclick="openEditClientModal(${c.id})" class="text-indigo-500 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="deleteClient(${c.id})" class="text-red-500"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('') || '<p class="text-center text-gray-500">No hay clientes.</p>';
}

function renderProjects() {
    const list = document.getElementById('projects-list');
    if(!list) return;
    list.innerHTML = localDB.projects.map(p => `
        <div class="bg-white p-6 rounded-xl shadow border-t-4 border-purple-500 relative">
            <div class="absolute top-4 right-4"><button onclick="deleteProject(${p.id})" class="text-red-500"><i class="fas fa-trash"></i></button></div>
            <h3 class="font-bold text-lg">${p.name}</h3>
            <span class="text-sm bg-gray-100 px-2 rounded">${p.status}</span>
        </div>`).join('') || '<p class="text-center col-span-3 text-gray-500">No hay proyectos.</p>';
}

function renderCollaborators() {
    const list = document.getElementById('collaborators-list');
    if(!list) return;
    list.innerHTML = localDB.collaborators.map(c => `
        <tr>
            <td class="px-6 py-4">${c.name}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${c.email}</td>
            <td class="px-6 py-4"><span class="bg-green-100 text-green-800 px-2 rounded-full text-xs">${c.role}</span></td>
            <td class="px-6 py-4 text-right"><button onclick="deleteCollaborator(${c.id})" class="text-red-600"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('');
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    const filter = document.getElementById('task-filter-status')?.value || 'Todas';
    if(!list) return;
    
    let tasks = localDB.tasks;
    if(filter !== 'Todas') tasks = tasks.filter(t => t.status === filter);

    list.innerHTML = tasks.map(t => `
        <div class="task-item bg-white p-4 rounded shadow border-l-4 border-${t.priority==='Alta'?'red':(t.priority==='Media'?'yellow':'green')}-500">
            <div class="flex justify-between">
                <h3 class="font-bold">${t.title}</h3>
                <span class="text-xs text-gray-500">${t.duedate}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">${t.description||''}</p>
            <div class="flex justify-between items-center mt-3">
                <span class="bg-gray-100 text-xs px-2 py-1 rounded">${t.status}</span>
                <div>
                    <button onclick="openEditTaskModal(${t.id})" class="text-indigo-500 mr-2"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTask(${t.id})" class="text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`).join('') || '<p class="text-center col-span-2 text-gray-500">No hay tareas.</p>';
    
    document.getElementById('task-filter-status')?.addEventListener('change', renderTasks);
}

function renderConfiguracion() {
    const list = document.getElementById('deleted-items-list');
    if(list) {
        list.innerHTML = localDB.deleted_items.map(i => `<li class="p-4 text-sm">${i.type}: ${i.data.name||i.data.title}</li>`).join('') || '<li class="p-4 text-center text-gray-500">Papelera vacía.</li>';
    }
}

// --- MODALES ---
function closeModals() { document.querySelectorAll('.fixed.inset-0').forEach(m => m.classList.add('hidden')); }
function openModal(id) { 
    closeModals(); 
    const m = document.getElementById(id);
    if(m) {
        m.classList.remove('hidden');
        if(id==='modal-collaborator') document.getElementById('collab-role').innerHTML = getRoleOptionsHTML();
        if(id==='modal-project') document.getElementById('project-client').innerHTML = getClientOptionsHTML();
    }
}

// --- GESTIÓN DE DATOS (CRUD + BLOQUEO OFFLINE) ---

function handleAddClient(e) {
    e.preventDefault();
    if(!navigator.onLine) return alert("Offline: No puedes guardar.");
    localDB.clients.push({ id: Date.now(), name: document.getElementById('client-name').value, contact: document.getElementById('client-contact').value });
    saveDB(); renderClients(); closeModals(); e.target.reset();
}
function openEditClientModal(id) {
    const c = localDB.clients.find(x => x.id === id);
    if(c) {
        document.getElementById('edit-client-id').value = c.id;
        document.getElementById('edit-client-name').value = c.name;
        document.getElementById('edit-client-contact').value = c.contact;
        openModal('modal-edit-client');
    }
}
function handleEditClient(e) {
    e.preventDefault();
    if(!navigator.onLine) return alert("Offline: No puedes editar.");
    const id = parseInt(document.getElementById('edit-client-id').value);
    const idx = localDB.clients.findIndex(c => c.id === id);
    if(idx !== -1) {
        localDB.clients[idx].name = document.getElementById('edit-client-name').value;
        localDB.clients[idx].contact = document.getElementById('edit-client-contact').value;
        saveDB(); renderClients(); closeModals();
    }
}
function deleteClient(id) {
    if(!navigator.onLine) return alert("Offline: No puedes borrar.");
    if(confirm('¿Borrar cliente?')) {
        const item = localDB.clients.splice(localDB.clients.findIndex(c=>c.id===id),1)[0];
        localDB.deleted_items.push({type:'client', data:item, deletedAt:Date.now()});
        saveDB(); renderClients();
    }
}

function handleAddProject(e) {
    e.preventDefault(); if(!navigator.onLine) return alert("Offline");
    localDB.projects.push({
        id: Date.now(),
        name: document.getElementById('project-name').value,
        clientId: parseInt(document.getElementById('project-client').value)||null,
        duedate: document.getElementById('project-duedate').value,
        status: document.getElementById('project-status').value
    });
    saveDB(); renderProjects(); closeModals(); e.target.reset();
}
function deleteProject(id) {
    if(!navigator.onLine) return alert("Offline");
    localDB.deleted_items.push({type:'project', data: localDB.projects.splice(localDB.projects.findIndex(p=>p.id===id),1)[0], deletedAt:Date.now()});
    saveDB(); renderProjects();
}

function handleAddCollaborator(e) {
    e.preventDefault(); if(!navigator.onLine) return alert("Offline");
    localDB.collaborators.push({
        id: Date.now(),
        name: document.getElementById('collab-name').value,
        email: document.getElementById('collab-email').value,
        role: document.getElementById('collab-role').value
    });
    saveDB(); renderCollaborators(); closeModals(); e.target.reset();
}
function deleteCollaborator(id) {
    if(!navigator.onLine) return alert("Offline");
    localDB.deleted_items.push({type:'collaborator', data: localDB.collaborators.splice(localDB.collaborators.findIndex(c=>c.id===id),1)[0], deletedAt:Date.now()});
    saveDB(); renderCollaborators();
}

function openAddTaskModal() {
    document.getElementById('addTaskForm').reset();
    document.getElementById('task-assignee-add').innerHTML = getCollaboratorOptionsHTML();
    document.getElementById('task-client-add').innerHTML = getClientOptionsHTML();
    openModal('modal-add-task');
}
function handleAddTask(e) {
    e.preventDefault(); if(!navigator.onLine) return alert("Offline");
    localDB.tasks.push({
        id: Date.now(),
        title: document.getElementById('task-title-add').value,
        description: document.getElementById('task-description-add').value,
        duedate: document.getElementById('task-duedate-add').value,
        priority: document.getElementById('task-priority-add').value,
        status: document.getElementById('task-status-add').value,
        assigneeId: parseInt(document.getElementById('task-assignee-add').value)||null,
        clientId: parseInt(document.getElementById('task-client-add').value)||null
    });
    saveDB(); renderTasks(); closeModals();
}
function openEditTaskModal(id) {
    const t = localDB.tasks.find(x => x.id === id);
    if(t) {
        document.getElementById('edit-task-assignee').innerHTML = getCollaboratorOptionsHTML(t.assigneeId);
        document.getElementById('edit-task-client').innerHTML = getClientOptionsHTML(t.clientId);
        document.getElementById('edit-task-id').value = t.id;
        document.getElementById('edit-task-title').value = t.title;
        document.getElementById('edit-task-description').value = t.description;
        document.getElementById('edit-task-duedate').value = t.duedate;
        document.getElementById('edit-task-priority').value = t.priority;
        document.getElementById('edit-task-status').value = t.status;
        openModal('modal-edit-task');
    }
}
function handleEditTask(e) {
    e.preventDefault(); if(!navigator.onLine) return alert("Offline");
    const id = parseInt(document.getElementById('edit-task-id').value);
    const idx = localDB.tasks.findIndex(t => t.id === id);
    if(idx!==-1) {
        localDB.tasks[idx] = { ...localDB.tasks[idx],
            title: document.getElementById('edit-task-title').value,
            description: document.getElementById('edit-task-description').value,
            duedate: document.getElementById('edit-task-duedate').value,
            priority: document.getElementById('edit-task-priority').value,
            status: document.getElementById('edit-task-status').value,
            assigneeId: parseInt(document.getElementById('edit-task-assignee').value)||null,
            clientId: parseInt(document.getElementById('edit-task-client').value)||null
        };
        saveDB(); renderTasks(); closeModals();
    }
}
function deleteTask(id) {
    if(!navigator.onLine) return alert("Offline");
    if(confirm('¿Borrar tarea?')) {
        localDB.deleted_items.push({type:'task', data: localDB.tasks.splice(localDB.tasks.findIndex(t=>t.id===id),1)[0], deletedAt:Date.now()});
        saveDB(); renderTasks();
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('bytecraft_session')) return window.location.href = 'login.html';
    
    navigate(appConfig.routes[window.location.hash.substring(1)] ? window.location.hash.substring(1) : appConfig.default_route);

    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', (e)=>{ e.preventDefault(); navigate(l.getAttribute('data-page')); }));
    document.querySelectorAll('.dashboard-card').forEach(c => c.addEventListener('click', ()=> navigate(c.getAttribute('data-page'))));
    document.getElementById('notification-button')?.addEventListener('click', () => document.getElementById('notification-dropdown').classList.toggle('hidden'));

    document.getElementById('addClientForm')?.addEventListener('submit', handleAddClient);
    document.getElementById('editClientForm')?.addEventListener('submit', handleEditClient);
    document.getElementById('addProjectForm')?.addEventListener('submit', handleAddProject);
    document.getElementById('editProjectForm')?.addEventListener('submit', handleEditProject); // Añadido
    document.getElementById('addCollaboratorForm')?.addEventListener('submit', handleAddCollaborator);
    document.getElementById('editCollaboratorForm')?.addEventListener('submit', handleAddCollaborator); // Fix para edit
    document.getElementById('addTaskForm')?.addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm')?.addEventListener('submit', handleEditTask);

    updateConnectionStatus();
});

window.addEventListener('popstate', () => navigate(window.location.hash.substring(1) || 'dashboard'));

// --- OFFLINE/ONLINE STATUS ---
function updateConnectionStatus() {
    const alertBox = document.getElementById('offline-alert');
    if (!navigator.onLine) {
        alertBox.classList.remove('hidden');
        setTimeout(() => alertBox.classList.add('show'), 10);
        document.body.classList.add('offline-mode');
        document.querySelectorAll('button[type="submit"], .action-btn').forEach(b => { b.disabled=true; b.classList.add('opacity-50','cursor-not-allowed'); });
    } else {
        alertBox.classList.remove('show');
        document.body.classList.remove('offline-mode');
        setTimeout(() => alertBox.classList.add('hidden'), 300);
        document.querySelectorAll('button[type="submit"], .action-btn').forEach(b => { b.disabled=false; b.classList.remove('opacity-50','cursor-not-allowed'); });
    }
}
window.addEventListener('online', () => { updateConnectionStatus(); addNotification("Conexión restaurada."); });
window.addEventListener('offline', updateConnectionStatus);


// ===============================================
// 🔔 GESTIÓN DE NOTIFICACIONES PUSH REALES
// ===============================================

// ✅ LLAVE PÚBLICA INSERTADA CORRECTAMENTE
const PUBLIC_VAPID_KEY = 'BE2bcd8sXnk20P-vV1k2sYvxDFSZLGFE1faOZRVat0MbOw4JkB0EnPXujwpShzJmEVngeVi1HyvF61XcmtoHIpk'; 

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator)) return;
    if (!navigator.onLine) return alert("Necesitas internet para activar notificaciones.");

    const registration = await navigator.serviceWorker.ready;
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return alert('Permiso denegado para notificaciones.');

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        console.log("👇 COPIA EL SIGUIENTE JSON PARA USARLO EN TU SERVIDOR 👇");
        console.log(JSON.stringify(subscription));
        
        alert("¡Suscripción exitosa! Revisa la consola (F12) para obtener el código de suscripción.");
        addNotification("Notificaciones Push activadas en este dispositivo.");
    } catch (error) {
        console.error('Error suscribiendo:', error);
        alert('Hubo un error al activar las notificaciones. Revisa la consola.');
    }
}