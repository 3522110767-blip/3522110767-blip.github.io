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

// NUEVA CONFIGURACIÓN: Roles de Colaboradores
const COLLABORATOR_ROLES = ["Administrador", "Trabajador", "Desarrollador Senior", "Diseñador UI/UX", "Tester", "Contador"];

// --- BASE DE DATOS LOCAL (Inicialización) ---
const initialDBState = { // Estado inicial para restauración
    tasks: [
        { id: 1, title: 'Revisar servidor principal', status: 'Pendiente', assigneeId: 1, clientId: 1, time_spent: 0, duedate: '2025-12-01', priority: 'Alta', description: 'Revisión mensual de logs y rendimiento.' },
        { id: 2, title: 'Actualizar iconos de la App', status: 'Completada', assigneeId: null, clientId: null, time_spent: 3600000, duedate: '2025-11-20', priority: 'Media', description: 'Cambio de set de iconos según el nuevo branding.' },
        { id: 3, title: 'Reunión de planificación de sprint', status: 'En Curso', assigneeId: 2, clientId: 2, time_spent: 7200000, duedate: '2025-11-28', priority: 'Alta', description: 'Preparar la agenda y documentos.' }
    ],
    clients: [
        { id: 1, name: 'Innovatech Solutions', contact: 'contacto@innovatech.com' },
        { id: 2, name: 'Global Marketing Corp', contact: 'info@globalmkt.net' }
    ],
    projects: [
        { id: 1, name: 'Plataforma e-commerce V2', clientId: 1, duedate: '2026-03-01', status: 'En Curso' },
        { id: 2, name: 'Campaña de lanzamiento Q4', clientId: 2, duedate: '2025-12-15', status: 'Pendiente' }
    ],
    // Colaboradores iniciales con los nuevos roles
    collaborators: [
        { id: 1, name: 'Ana Fernández', role: 'Desarrollador Senior', email: 'ana@bytecraft.com' },
        { id: 2, name: 'Carlos Ruiz', role: 'Diseñador UI/UX', email: 'carlos@bytecraft.com' }
    ],
    notifications: [
        { id: 1, message: 'La tarea "Revisar servidor principal" está próxima a vencer.', read: false, timestamp: Date.now() - 3600000 },
        { id: 2, message: 'Nuevo cliente "SoftStream" añadido.', read: false, timestamp: Date.now() - 7200000 },
        { id: 3, message: 'Proyecto e-commerce V2 actualizado a "En Curso".', read: false, timestamp: Date.now() - 10800000 }
    ],
    deleted_items: [] // Papelera de reciclaje
};

let localDB = JSON.parse(localStorage.getItem('bytecraft_db'));

// Si no hay DB local, usa el estado inicial
if (!localDB) {
    localDB = JSON.parse(JSON.stringify(initialDBState)); // Deep copy
    saveDB();
}

function saveDB() {
    localStorage.setItem('bytecraft_db', JSON.stringify(localDB));
}

// HELPER para generar el HTML de opciones de Rol
function getRoleOptionsHTML(selectedRole = '') {
    return COLLABORATOR_ROLES.map(role => `
        <option value="${role}" ${role === selectedRole ? 'selected' : ''}>${role}</option>
    `).join('');
}

// NUEVOS HELPERS PARA TAREAS
// HELPER para generar el HTML de opciones de Colaborador (Asignado a)
function getCollaboratorOptionsHTML(selectedId = null) {
    let options = '<option value="">Sin Asignar</option>';
    localDB.collaborators.forEach(collab => {
        options += `<option value="${collab.id}" ${collab.id == selectedId ? 'selected' : ''}>${collab.name}</option>`;
    });
    return options;
}

// HELPER para generar el HTML de opciones de Cliente
function getClientOptionsHTML(selectedId = null) {
    let options = '<option value="">Sin Cliente</option>';
    localDB.clients.forEach(client => {
        options += `<option value="${client.id}" ${client.id == selectedId ? 'selected' : ''}>${client.name}</option>`;
    });
    return options;
}


// --- FUNCIÓN DE UTILIDAD: DESCARGAR DATA ---
function downloadDBData() {
    // 1. Preparamos el objeto a exportar (excluimos notificaciones para que sea una copia de seguridad limpia)
    const exportData = {
        clients: localDB.clients,
        projects: localDB.projects,
        tasks: localDB.tasks,
        collaborators: localDB.collaborators,
        deleted_items: localDB.deleted_items
    };
    
    // 2. Convertimos el objeto a una cadena JSON
    const dataStr = JSON.stringify(exportData, null, 2); 
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    // 3. Creamos un elemento <a> invisible para simular la descarga
    const exportFileDefaultName = `bytecraft_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    
    // 4. Simulamos el clic y removemos el elemento
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    // 5. Notificamos
    addNotification('Copia de seguridad de la base de datos descargada con éxito.');
}
// --- FIN FUNCIÓN DE UTILIDAD ---


// --- FUNCIONES DE GESTIÓN DE NOTIFICACIONES (Mantenidas) ---
function addNotification(message) {
    const newNotification = {
        id: Date.now(),
        message: message,
        read: false,
        timestamp: Date.now()
    };
    localDB.notifications.unshift(newNotification);
    // Limitar las notificaciones para no saturar
    localDB.notifications = localDB.notifications.slice(0, 20); 
    saveDB();
    renderNotifications();
}

function renderNotifications() {
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');
    const unreadCount = localDB.notifications.filter(n => !n.read).length;

    if (notificationBadge) {
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
    
    if (notificationList) {
        if (localDB.notifications.length === 0) {
            notificationList.innerHTML = '<p class="p-4 text-center text-gray-500">No hay notificaciones.</p>';
        } else {
            notificationList.innerHTML = localDB.notifications.slice(0, 5).map(n => `
                <a href="#" class="block px-4 py-3 hover:bg-gray-50 ${n.read ? 'text-gray-500' : 'font-medium text-gray-900'}">
                    <p class="text-sm">${n.message}</p>
                    <p class="text-xs text-gray-400 mt-1">${new Date(n.timestamp).toLocaleDateString()}</p>
                </a>
            `).join('');
        }
    }
}

function markNotificationsAsRead() {
    localDB.notifications.forEach(n => n.read = true);
    saveDB();
    renderNotifications();
}

// --- PWA (Instalación) (Mantenidas) ---
let deferredPrompt;
const installButton = document.getElementById('install-button');
const desktopNavCards = document.getElementById('desktop-nav-cards');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e;
    if (installButton) {
        installButton.classList.remove('hidden');
    }
});

if (installButton) {
    installButton.addEventListener('click', (e) => {
        installButton.classList.add('hidden');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('El usuario aceptó la instalación.');
                } else {
                    console.log('El usuario rechazó la instalación.');
                    installButton.classList.remove('hidden');
                }
                deferredPrompt = null;
            });
        }
    });
}

window.addEventListener('appinstalled', (e) => {
    if (installButton) {
        installButton.classList.add('hidden');
    }
});
// -----------------------------


// --- FUNCIONES DE NAVEGACIÓN (Mantenidas) ---

function navigate(page) {
    const route = appConfig.routes[page];
    if (!route) return;

    const template = document.getElementById(route.template_id);
    document.getElementById('app-content').innerHTML = template ? template.innerHTML : `<h1>Error 404: Ruta no encontrada para ${page}</h1>`;

    // 1. Renderizar contenido específico
    if (page === 'dashboard') renderDashboard();
    if (page === 'clientes') renderClients();
    if (page === 'proyectos') renderProjects();
    if (page === 'tareas') renderTasks(); // Llama a la función actualizada
    if (page === 'colaboradores') renderCollaborators(); // Llama a la función actualizada
    if (page === 'configuracion') renderConfiguracion();

    document.title = route.title;
    const pageTitleElement = document.getElementById('page-title');
    if (pageTitleElement) {
         pageTitleElement.querySelector('span').textContent = page.charAt(0).toUpperCase() + page.slice(1);
    }

    // 2. Actualizar navegación y cards
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'text-indigo-600', 'font-bold');
        if (link.dataset.page === page) {
            link.classList.add('active', 'text-indigo-600', 'font-bold');
        }
    });

    // 3. Mostrar/Ocultar Cards de Navegación de Escritorio
    if (desktopNavCards) {
        if (page === 'dashboard') {
            desktopNavCards.classList.remove('hidden');
        } else {
            desktopNavCards.classList.add('hidden');
        }
    }
    
    // 4. Lógica del Botón de Retroceso (Mobile)
    const backButton = document.getElementById('back-button');
    if (backButton) {
        if (page !== 'dashboard') {
            backButton.style.display = 'block';
            document.querySelector('header')?.classList.remove('flex'); // Ocultar el logo en subpáginas
            document.querySelector('header')?.classList.add('hidden');
        } else {
            backButton.style.display = 'none';
            document.querySelector('header')?.classList.remove('hidden');
            document.querySelector('header')?.classList.add('flex');
        }
    }
    
    // 5. Actualizar URL y historial
    history.pushState({ page }, route.title, `#${page}`);
}

// Función para el botón de retroceso
function handleGoBack() {
    // Si la ruta no es el dashboard, volvemos al dashboard
    if (window.location.hash.substring(1) !== 'dashboard') {
        navigate('dashboard');
    }
}

function logout() {
    localStorage.removeItem('bytecraft_session');
    window.location.href = "login.html";
}

function closeModals() {
    document.querySelectorAll('[id^="modal-"]').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function openModal(id) {
    closeModals();
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        // Inicializar selects de rol si es el modal de añadir colaborador
        if (id === 'modal-collaborator') {
            document.getElementById('collab-role').innerHTML = getRoleOptionsHTML();
        }
    }
}
// -----------------------------


// --- FUNCIONES DE TAREAS (Actualizadas) ---

// NUEVA FUNCIÓN: Abrir Modal de Añadir Tarea
function openAddTaskModal() {
    document.getElementById('addTaskForm')?.reset();
    
    // Llenar los campos SELECT con los helpers
    document.getElementById('task-assignee-add').innerHTML = getCollaboratorOptionsHTML();
    document.getElementById('task-client-add').innerHTML = getClientOptionsHTML();

    // Establecer la fecha límite por defecto (ej. 7 días después)
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('task-duedate-add').value = defaultDate;
    
    // Mostrar el modal
    openModal('modal-add-task');
}

// NUEVA FUNCIÓN: Manejar la Adición de Tarea Completa
function handleAddTask(event) {
    event.preventDefault();

    const title = document.getElementById('task-title-add').value.trim();
    const description = document.getElementById('task-description-add').value.trim();
    const duedate = document.getElementById('task-duedate-add').value;
    const priority = document.getElementById('task-priority-add').value;
    const assigneeId = document.getElementById('task-assignee-add').value;
    const clientId = document.getElementById('task-client-add').value;
    const status = document.getElementById('task-status-add').value;

    if (!title || !duedate) { 
        alert('El título y la fecha límite de la tarea son obligatorios.');
        return;
    }

    const newTask = { 
        id: Date.now(), 
        title, 
        description,
        duedate, 
        priority, 
        status, 
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        clientId: clientId ? parseInt(clientId) : null,
        time_spent: 0
    };

    localDB.tasks.push(newTask);
    saveDB();
    renderTasks();
    renderDashboard();
    closeModals();
    addNotification(`Nueva Tarea: "${newTask.title}" añadida.`);
    document.getElementById('addTaskForm').reset();
}


function renderTasks() {
    const taskList = document.getElementById('tasks-list');
    const filterStatus = document.getElementById('task-filter-status')?.value || '';

    // Helpers para la vista
    const getAssigneeName = (id) => localDB.collaborators.find(c => c.id === id)?.name || 'N/A';
    const getClientName = (id) => localDB.clients.find(c => c.id === id)?.name || 'N/A';

    if (!taskList) return;

    const filteredTasks = localDB.tasks.filter(t => !filterStatus || t.status === filterStatus);

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p class="text-center text-gray-500 p-4 bg-white rounded-xl shadow">No hay tareas que coincidan con el filtro.</p>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {
        const priorityClass = task.priority === 'Alta' ? 'bg-red-500' : task.priority === 'Media' ? 'bg-yellow-500' : 'bg-green-500';
        const statusClass = task.status === 'Completada' ? 'bg-green-100 text-green-800' : task.status === 'En Curso' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';

        return `
            <div class="task-item bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
                <div>
                    <h4 class="text-md font-semibold text-gray-900">${task.title}</h4>
                    <p class="text-sm text-gray-500 mt-1">
                        Asignado: ${getAssigneeName(task.assigneeId)} | 
                        Cliente: ${getClientName(task.clientId)} | 
                        Límite: ${task.duedate || 'N/A'}
                    </p>
                    <p class="text-xs text-gray-400 mt-1">${task.description || 'Sin descripción'}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${task.status}
                    </span>
                    <span class="priority-badge ${priorityClass} text-white px-2 py-0.5 rounded text-xs">
                        ${task.priority}
                    </span>
                    <button onclick="openEditTaskModal(${task.id})" class="text-indigo-500 hover:text-indigo-700" title="Editar Tarea">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" class="text-red-500 hover:text-red-700" title="Eliminar Tarea">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Listener de filtro
    document.getElementById('task-filter-status')?.addEventListener('change', renderTasks);
}

function openEditTaskModal(taskId) {
    const task = localDB.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Llenar SELECTS
    document.getElementById('edit-task-assignee').innerHTML = getCollaboratorOptionsHTML(task.assigneeId);
    document.getElementById('edit-task-client').innerHTML = getClientOptionsHTML(task.clientId);

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-description').value = task.description;
    document.getElementById('edit-task-duedate').value = task.duedate;
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-status').value = task.status;
    openModal('modal-edit-task');
}

function handleEditTask(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-task-id').value);
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-description').value;
    const duedate = document.getElementById('edit-task-duedate').value;
    const priority = document.getElementById('edit-task-priority').value;
    const status = document.getElementById('edit-task-status').value;
    // Obtener los valores de los nuevos selects
    const assigneeId = document.getElementById('edit-task-assignee').value; 
    const clientId = document.getElementById('edit-task-client').value; 

    const taskIndex = localDB.tasks.findIndex(t => t.id === id);

    if (taskIndex !== -1) {
        localDB.tasks[taskIndex].title = title;
        localDB.tasks[taskIndex].description = description;
        localDB.tasks[taskIndex].duedate = duedate;
        localDB.tasks[taskIndex].priority = priority;
        localDB.tasks[taskIndex].status = status;
        // Asignar los valores a la DB
        localDB.tasks[taskIndex].assigneeId = assigneeId ? parseInt(assigneeId) : null;
        localDB.tasks[taskIndex].clientId = clientId ? parseInt(clientId) : null;
        
        saveDB();
        renderTasks();
        renderDashboard();
        closeModals();
        addNotification(`Tarea: "${title}" actualizada.`);
    }
}

function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea? Se enviará a la papelera.')) {
        const taskIndex = localDB.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = localDB.tasks.splice(taskIndex, 1)[0];
             // Mover a papelera
            localDB.deleted_items.push({ 
                id: Date.now(), 
                type: 'task', 
                data: task, 
                deletedAt: Date.now() 
            });
            saveDB();
            renderTasks();
            renderDashboard();
            addNotification(`Tarea: "${task.title}" enviada a la papelera.`);
        }
    }
}

// --- FUNCIONES DE CLIENTES (Mantenidas) ---

function renderClients() {
    const clientList = document.getElementById('clients-list');
    if (!clientList) return;

    if (localDB.clients.length === 0) {
        clientList.innerHTML = '<p class="text-center text-gray-500 p-4 bg-white rounded-xl shadow">Aún no hay clientes.</p>';
        return;
    }

    clientList.innerHTML = localDB.clients.map(client => `
        <div class="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
            <div>
                <h4 class="text-lg font-semibold text-gray-900">${client.name}</h4>
                <p class="text-sm text-gray-500">${client.contact}</p>
            </div>
            <div class="flex space-x-3">
                <button onclick="openEditClientModal(${client.id})" class="text-purple-500 hover:text-purple-700" title="Editar Cliente">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteClient(${client.id})" class="text-red-500 hover:text-red-700" title="Eliminar Cliente">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openEditClientModal(clientId) {
    const client = localDB.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-client-name').value = client.name;
    document.getElementById('edit-client-contact').value = client.contact;
    openModal('modal-edit-client');
}

function handleEditClient(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-client-id').value);
    const name = document.getElementById('edit-client-name').value;
    const contact = document.getElementById('edit-client-contact').value;

    const clientIndex = localDB.clients.findIndex(c => c.id === id);

    if (clientIndex !== -1) {
        localDB.clients[clientIndex].name = name;
        localDB.clients[clientIndex].contact = contact;
        saveDB();
        renderClients();
        closeModals();
        addNotification(`Cliente: "${name}" actualizado.`);
    }
}

function deleteClient(clientId) {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente? Se enviará a la papelera.')) {
        const clientIndex = localDB.clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
            const client = localDB.clients.splice(clientIndex, 1)[0];
            // Mover a papelera
            localDB.deleted_items.push({ 
                id: Date.now(), 
                type: 'client', 
                data: client, 
                deletedAt: Date.now() 
            });
            saveDB();
            renderClients();
            addNotification(`Cliente: "${client.name}" enviado a la papelera.`);
        }
    }
}

// --- FUNCIONES DE PROYECTOS (Mantenidas) ---

function renderProjects() {
    const projectList = document.getElementById('projects-list');
    const getClientName = (id) => localDB.clients.find(c => c.id === id)?.name || 'N/A';
    
    if (!projectList) return;

    if (localDB.projects.length === 0) {
        projectList.innerHTML = '<p class="text-center text-gray-500 p-4 bg-white rounded-xl shadow">Aún no hay proyectos.</p>';
        return;
    }

    projectList.innerHTML = localDB.projects.map(project => {
        const statusClass = project.status === 'Finalizado' ? 'bg-green-100 text-green-800' : project.status === 'En Curso' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';

        return `
            <div class="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
                <div>
                    <h4 class="text-lg font-semibold text-gray-900">${project.name}</h4>
                    <p class="text-sm text-gray-500 mt-1">Cliente: ${getClientName(project.clientId)} | Límite: ${project.duedate}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${project.status}
                    </span>
                    <button onclick="openEditProjectModal(${project.id})" class="text-purple-500 hover:text-purple-700" title="Editar Proyecto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProject(${project.id})" class="text-red-500 hover:text-red-700" title="Eliminar Proyecto">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Rellenar selects del modal de añadir proyecto
    document.getElementById('project-client').innerHTML = getClientOptionsHTML();
}

function openEditProjectModal(projectId) {
    const project = localDB.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Rellenar selects del modal de edición
    document.getElementById('edit-project-client').innerHTML = getClientOptionsHTML(project.clientId);

    document.getElementById('edit-project-id').value = project.id;
    document.getElementById('edit-project-name').value = project.name;
    document.getElementById('edit-project-duedate').value = project.duedate;
    document.getElementById('edit-project-status').value = project.status;
    openModal('modal-edit-project');
}

function handleEditProject(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-project-id').value);
    const name = document.getElementById('edit-project-name').value;
    const clientId = parseInt(document.getElementById('edit-project-client').value);
    const duedate = document.getElementById('edit-project-duedate').value;
    const status = document.getElementById('edit-project-status').value;

    const projectIndex = localDB.projects.findIndex(p => p.id === id);

    if (projectIndex !== -1) {
        localDB.projects[projectIndex].name = name;
        localDB.projects[projectIndex].clientId = clientId;
        localDB.projects[projectIndex].duedate = duedate;
        localDB.projects[projectIndex].status = status;
        saveDB();
        renderProjects();
        closeModals();
        addNotification(`Proyecto: "${name}" actualizado.`);
    }
}

function deleteProject(projectId) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Se enviará a la papelera.')) {
        const projectIndex = localDB.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const project = localDB.projects.splice(projectIndex, 1)[0];
            // Mover a papelera
            localDB.deleted_items.push({ 
                id: Date.now(), 
                type: 'project', 
                data: project, 
                deletedAt: Date.now() 
            });
            saveDB();
            renderProjects();
            addNotification(`Proyecto: "${project.name}" enviado a la papelera.`);
        }
    }
}

// --- FUNCIONES DE COLABORADORES (Actualizadas) ---

// FUNCIÓN ACTUALIZADA: Obtiene el Rol del SELECT y renderiza la lista
function handleAddCollaborator(event) {
    event.preventDefault();
    const name = document.getElementById('collab-name').value.trim();
    const role = document.getElementById('collab-role').value; // Ahora es un select
    const email = document.getElementById('collab-email').value.trim();

    if (!name || !role || !email) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    const newCollab = { 
        id: Date.now(), 
        name, 
        role, 
        email
    };
    
    localDB.collaborators.push(newCollab);
    saveDB();
    renderCollaborators(); 
    closeModals();
    addNotification(`Nuevo Colaborador: "${name}" (${role}) añadido.`);
    document.getElementById('addCollaboratorForm').reset();
}


// NUEVA FUNCIÓN: Renderizar Colaboradores (Muestra la lista y botones solicitados)
function renderCollaborators() {
    const listContainer = document.getElementById('collaborators-list');
    const noCollabMsg = document.getElementById('no-collaborators');

    if (!listContainer) return;
    
    if (localDB.collaborators.length === 0) {
        listContainer.innerHTML = '';
        noCollabMsg?.classList.remove('hidden');
        return;
    }
    noCollabMsg?.classList.add('hidden');

    listContainer.innerHTML = localDB.collaborators.map(collab => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${collab.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${collab.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600">${collab.role}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openEditCollaboratorModal(${collab.id})" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar Colaborador">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteCollaborator(${collab.id})" class="text-red-600 hover:text-red-900" title="Eliminar Colaborador">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// NUEVA FUNCIÓN: Abrir Modal de Edición de Colaborador
function openEditCollaboratorModal(collaboratorId) {
    const collab = localDB.collaborators.find(c => c.id === collaboratorId);
    if (!collab) return;

    document.getElementById('edit-collab-id').value = collab.id;
    document.getElementById('edit-collab-name').value = collab.name;
    document.getElementById('edit-collab-email').value = collab.email;
    
    // Llenar el SELECT de roles (reutilizando el helper)
    document.getElementById('edit-collab-role').innerHTML = getRoleOptionsHTML(collab.role);

    openModal('modal-edit-collaborator');
}

// NUEVA FUNCIÓN: Manejar la Edición de Colaborador
function handleEditCollaborator(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-collab-id').value);
    const name = document.getElementById('edit-collab-name').value;
    const email = document.getElementById('edit-collab-email').value;
    const role = document.getElementById('edit-collab-role').value;

    const collabIndex = localDB.collaborators.findIndex(c => c.id === id);

    if (collabIndex !== -1) {
        localDB.collaborators[collabIndex].name = name;
        localDB.collaborators[collabIndex].email = email;
        localDB.collaborators[collabIndex].role = role;
        saveDB();
        renderCollaborators();
        closeModals();
        addNotification(`Colaborador: "${name}" actualizado.`);
    }
}

// NUEVA FUNCIÓN: Eliminar Colaborador
function deleteCollaborator(collaboratorId) {
    if (confirm('¿Estás seguro de que quieres eliminar a este colaborador? Se enviará a la papelera.')) {
        const collabIndex = localDB.collaborators.findIndex(c => c.id === collaboratorId);

        if (collabIndex !== -1) {
            const collaborator = localDB.collaborators.splice(collabIndex, 1)[0];
            
            // Mover a papelera
            localDB.deleted_items.push({ 
                id: Date.now(), 
                type: 'collaborator', 
                data: collaborator, 
                deletedAt: Date.now() 
            });

            saveDB();
            renderCollaborators();
            addNotification(`Colaborador: "${collaborator.name}" enviado a la papelera.`);
        }
    }
}


// --- FUNCIONES DE CONFIGURACIÓN (Mantenidas) ---

function renderConfiguracion() {
    const deletedItemsList = document.getElementById('deleted-items-list');
    if (!deletedItemsList) return;

    if (localDB.deleted_items.length === 0) {
        deletedItemsList.innerHTML = '<li class="p-4 text-center text-gray-500">La papelera está vacía.</li>';
        return;
    }

    deletedItemsList.innerHTML = localDB.deleted_items.map(item => `
        <li class="p-4 flex justify-between items-center hover:bg-gray-50">
            <div>
                <span class="font-medium text-gray-900">${item.data.title || item.data.name}</span>
                <span class="text-sm text-gray-500 ml-2">(${item.type.charAt(0).toUpperCase() + item.type.slice(1)})</span>
            </div>
            <div class="text-xs text-gray-400">
                Eliminado: ${new Date(item.deletedAt).toLocaleDateString()}
            </div>
        </li>
    `).join('');
}

function clearAllData() {
    if (confirm("ADVERTENCIA: ¿Estás ABSOLUTAMENTE seguro de que quieres BORRAR TODA la base de datos local? Esta acción es irreversible.")) {
        localStorage.removeItem('bytecraft_db');
        alert("Todos los datos han sido borrados. La página se recargará.");
        window.location.reload();
    }
}

function restoreInitialData() {
     if (confirm("ADVERTENCIA: ¿Estás seguro de que quieres RESTAURAR la base de datos a su estado inicial? Los datos actuales se perderán.")) {
        localStorage.setItem('bytecraft_db', JSON.stringify(initialDBState));
        alert("Datos iniciales restaurados. La página se recargará.");
        window.location.reload();
    }
}


// --- FUNCIONES DEL DASHBOARD (Mantenidas) ---

function renderDashboard() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;

    const totalTasks = localDB.tasks.length;
    const pendingTasks = localDB.tasks.filter(t => t.status === 'Pendiente').length;
    const totalClients = localDB.clients.length;
    const totalProjects = localDB.projects.length;
    
    // Función para crear la tarjeta de estadística
    const createStatCard = (icon, color, title, value) => `
        <div class="bg-white p-5 rounded-xl shadow-lg border-l-4 border-${color}-500 flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500">${title}</p>
                <p class="text-3xl font-bold text-gray-900">${value}</p>
            </div>
            <i class="fas ${icon} text-3xl text-${color}-300 opacity-50"></i>
        </div>
    `;

    statsContainer.innerHTML = `
        ${createStatCard('fa-tasks', 'yellow', 'Tareas Totales', totalTasks)}
        ${createStatCard('fa-clock', 'red', 'Tareas Pendientes', pendingTasks)}
        ${createStatCard('fa-users', 'teal', 'Clientes Activos', totalClients)}
        ${createStatCard('fa-project-diagram', 'purple', 'Proyectos', totalProjects)}
    `;

    // Renderizar Tareas de Alta Prioridad
    const priorityTasksList = document.getElementById('priority-tasks');
    const noPriorityTasksMsg = document.getElementById('no-priority-tasks');
    if (priorityTasksList) {
        const priorityTasks = localDB.tasks.filter(t => t.priority === 'Alta' && t.status !== 'Completada').slice(0, 5);
        if (priorityTasks.length > 0) {
             noPriorityTasksMsg?.classList.add('hidden');
            priorityTasksList.innerHTML = priorityTasks.map(task => `
                <li class="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-800">${task.title}</span>
                    <span class="text-xs text-red-600">${task.duedate || 'N/A'}</span>
                </li>
            `).join('');
        } else {
             noPriorityTasksMsg?.classList.remove('hidden');
             priorityTasksList.innerHTML = '';
        }
    }
    
    // Renderizar Clientes Recientes
    const recentClientsList = document.getElementById('recent-clients');
    const noRecentClientsMsg = document.getElementById('no-recent-clients');
    if (recentClientsList) {
        const recentClients = localDB.clients.slice(-5).reverse(); // Últimos 5
        if (recentClients.length > 0) {
            noRecentClientsMsg?.classList.add('hidden');
            recentClientsList.innerHTML = recentClients.map(client => `
                <li class="p-3 bg-teal-50 border-l-4 border-teal-500 rounded-lg flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-800">${client.name}</span>
                    <span class="text-xs text-teal-600">${client.contact}</span>
                </li>
            `).join('');
        } else {
            noRecentClientsMsg?.classList.remove('hidden');
            recentClientsList.innerHTML = '';
        }
    }
}


// --- INICIALIZACIÓN Y EVENT LISTENERS ---

// Listener para cerrar modales al hacer clic fuera
document.addEventListener('click', (e) => {
    // Lista de IDs de modales
    const modalIds = ['modal-client', 'modal-project', 'modal-collaborator', 'modal-edit-client', 'modal-edit-project', 'modal-edit-task', 'modal-add-task', 'modal-edit-collaborator'];
    
    // Buscar el modal abierto
    const openModalElement = modalIds.map(id => document.getElementById(id)).find(modal => modal && !modal.classList.contains('hidden'));

    if (openModalElement && e.target === openModalElement) {
        closeModals();
    }
    
    // Lógica para cerrar notificaciones
    const dropdown = document.getElementById('notification-dropdown');
    const button = document.getElementById('notification-button');
    if (dropdown && button && !dropdown.classList.contains('hidden') && e.target !== dropdown && !dropdown.contains(e.target) && e.target !== button && !button.contains(e.target)) {
        dropdown.classList.add('hidden');
        markNotificationsAsRead();
    }
});

// Listener para el botón de notificaciones
document.getElementById('notification-button')?.addEventListener('click', () => {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        if (dropdown.classList.contains('hidden')) {
            markNotificationsAsRead();
        }
    }
});

// Listener para la navegación de desktop/cards
document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', function() {
        navigate(this.dataset.page);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar sesión
    if (localStorage.getItem('bytecraft_session') !== 'active') {
        window.location.href = "login.html";
        return;
    }

    // 2. Navegación inicial
    const initialHash = window.location.hash.substring(1);
    navigate(appConfig.routes[initialHash] ? initialHash : appConfig.default_route);
    
    // 3. Renderizar notificaciones
    renderNotifications();

    // 4. Listeners para Formularios
    document.getElementById('addClientForm')?.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('client-name').value;
        const contact = document.getElementById('client-contact').value;

        const newClient = { id: Date.now(), name, contact };
        localDB.clients.push(newClient);
        saveDB();
        renderClients();
        closeModals();
        addNotification(`Nuevo Cliente: "${name}" añadido.`);
        this.reset();
    });
    
    document.getElementById('editClientForm')?.addEventListener('submit', handleEditClient);

    document.getElementById('addProjectForm')?.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('project-name').value;
        const client_id = parseInt(document.getElementById('project-client').value);
        const duedate = document.getElementById('project-duedate').value;
        const status = document.getElementById('project-status').value;

        const newProject = { id: Date.now(), name, clientId: client_id || null, duedate, status };
        localDB.projects.push(newProject);
        saveDB();
        renderProjects();
        closeModals();
        addNotification(`Nuevo Proyecto: "${name}" (estado: ${status}) añadido.`);
        this.reset();
    });

    document.getElementById('editProjectForm')?.addEventListener('submit', handleEditProject);
    
    // Listener para añadir Colaborador (Actualizado)
    document.getElementById('addCollaboratorForm')?.addEventListener('submit', handleAddCollaborator);
    
    // Listener para el NUEVO Modal de AÑADIR TAREA
    document.getElementById('addTaskForm')?.addEventListener('submit', handleAddTask);
    
    // Listener para el Modal de EDITAR TAREA
    document.getElementById('editTaskForm')?.addEventListener('submit', handleEditTask);

    // Listener para el NUEVO Modal de EDITAR COLABORADOR
    document.getElementById('editCollaboratorForm')?.addEventListener('submit', handleEditCollaborator);
});

window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1);
    const page = appConfig.routes[hash] ? hash : appConfig.default_route;
    navigate(page);
});