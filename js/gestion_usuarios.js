// ============================================
// DATOS INICIALES Y ESTRUCTURAS DE DATOS
// ============================================

// Empresas con datos completos
let companies = [
    {
        id: 1,
        name: "Tech Solutions SL",
        cif: "B12345678",
        email: "info@techsolutions.com",
        phone: "912345678",
        address: "Calle Mayor 123, Madrid",
        status: "Activo",
        notes: "Cliente desde 2020. Buen pagador.",
        services: ["Cloud", "Soporte", "Seguridad"],
        contacts: [
            { name: "Juan García", phone: "612345678", email: "juan@techsolutions.com", role: "Director IT" },
            { name: "María López", phone: "654987321", email: "maria@techsolutions.com", role: "Gerente" }
        ],
        createdAt: "2020-03-15",
        activity: [],
        equipos: [
            { id: 1, nombre: "PC-Dirección", usuario: "jgarcia", password: "Tech2024!", ip: "192.168.1.10", anydesk: "123456789" },
            { id: 2, nombre: "PC-Gerencia", usuario: "mlopez", password: "Secure#456", ip: "192.168.1.11", anydesk: "987654321" }
        ],
        servidores: [
            { id: 1, nombre: "SRV-Principal", ip: "192.168.1.5", usuario: "admin", password: "SrvPass2024!", so: "Windows Server 2022" }
        ],
        nas: [
            { id: 1, nombre: "NAS-Backup", ip: "192.168.1.20", usuario: "admin", password: "NasSecure#2024", capacidad: "4TB" }
        ],
        redes: [
            { id: 1, dispositivo: "Router Principal", ip: "192.168.1.1", usuario: "admin", password: "RouterPass!", modelo: "Cisco RV340" }
        ],
        licencias: [
            { id: 1, software: "Microsoft 365 Business", usuarios: 15, vencimiento: "2025-12-31", clave: "XXXXX-XXXXX-XXXXX-XXXXX" }
        ]
    },
    {
        id: 2,
        name: "Red Digital Madrid",
        cif: "B87654321",
        email: "contacto@reddigital.es",
        phone: "911223344",
        address: "Avenida Barcelona 45, Madrid",
        status: "En revisión",
        notes: "Pendiente renovación contrato",
        services: ["Hardware", "Redes"],
        contacts: [
            { name: "Carlos Ruiz", phone: "678123456", email: "carlos@reddigital.es", role: "Técnico" }
        ],
        createdAt: "2021-06-20",
        activity: [],
        equipos: [],
        servidores: [],
        nas: [],
        redes: [],
        licencias: []
    },
    {
        id: 3,
        name: "ServiData Pro",
        cif: "B45678912",
        email: "admin@servidata.com",
        phone: "933445566",
        address: "Plaza Catalonia 10, Barcelona",
        status: "Suspendido",
        notes: "Contrato suspendido por impago",
        services: ["Cloud", "Backup"],
        contacts: [
            { name: "Ana Martínez", phone: "666777888", email: "ana@servidata.com", role: "Administración" }
        ],
        createdAt: "2019-01-10",
        activity: [],
        equipos: [],
        servidores: [],
        nas: [],
        redes: [],
        licencias: []
    },
    {
        id: 4,
        name: "Global Tech Industries",
        cif: "B11223344",
        email: "it@globaltech.es",
        phone: "917889900",
        address: "Polígono Industrial Norte, Sevilla",
        status: "Activo",
        notes: "Gran empresa con múltiples sedes",
        services: ["Cloud", "Soporte", "Hardware", "Redes", "Seguridad"],
        contacts: [
            { name: "Pedro Sánchez", phone: "600111222", email: "pedro@globaltech.es", role: "CIO" },
            { name: "Laura Gómez", phone: "600333444", email: "laura@globaltech.es", role: "Responsable IT" },
            { name: "Miguel Torres", phone: "600555666", email: "miguel@globaltech.es", role: "Técnico Senior" }
        ],
        createdAt: "2018-09-05",
        activity: [],
        equipos: [],
        servidores: [],
        nas: [],
        redes: [],
        licencias: []
    }
];

// Contratos
let contracts = [
    { id: 1, companyId: 1, type: "Mantenimiento Integral", startDate: "2024-01-01", endDate: "2024-12-31", value: 2400, status: "Activo", notes: "Renovación anual" },
    { id: 2, companyId: 1, type: "Cloud Services", startDate: "2024-03-01", endDate: "2025-02-28", value: 1200, status: "Activo", notes: "" },
    { id: 3, companyId: 2, type: "Soporte Técnico", startDate: "2023-06-01", endDate: "2024-05-31", value: 1800, status: "Por vencer", notes: "En negociación" },
    { id: 4, companyId: 4, type: "Mantenimiento Integral", startDate: "2024-01-01", endDate: "2025-12-31", value: 6000, status: "Activo", notes: "Contrato multianual" },
    { id: 5, companyId: 4, type: "Seguridad", startDate: "2024-06-01", endDate: "2025-05-31", value: 1800, status: "Activo", notes: "" }
];

// Facturas
let invoices = [
    { id: 1, number: "FAC-2024-001", companyId: 1, date: "2024-01-15", dueDate: "2024-02-15", amount: 200, status: "Pagada" },
    { id: 2, number: "FAC-2024-002", companyId: 1, date: "2024-02-15", dueDate: "2024-03-15", amount: 200, status: "Pagada" },
    { id: 3, number: "FAC-2024-003", companyId: 1, date: "2024-03-15", dueDate: "2024-04-15", amount: 200, status: "Pendiente" },
    { id: 4, number: "FAC-2024-004", companyId: 2, date: "2024-01-10", dueDate: "2024-02-10", amount: 150, status: "Vencida" },
    { id: 5, number: "FAC-2024-005", companyId: 4, date: "2024-01-01", dueDate: "2024-02-01", amount: 500, status: "Pagada" },
    { id: 6, number: "FAC-2024-006", companyId: 4, date: "2024-02-01", dueDate: "2024-03-01", amount: 500, status: "Pagada" }
];

// Tickets de soporte
let tickets = [
    { id: 1, companyId: 1, subject: "No funciona el correo", description: "Los usuarios no pueden enviar emails", priority: "Alta", status: "Abierto", date: "2024-03-20" },
    { id: 2, companyId: 1, subject: "Solicitud de nuevo usuario", description: "Dar de alta a nuevo empleado", priority: "Baja", status: "Cerrado", date: "2024-03-18" },
    { id: 3, companyId: 4, subject: "Caída de servidor", description: "Servidor principal no responde", priority: "Urgente", status: "En proceso", date: "2024-03-22" },
    { id: 4, companyId: 2, subject: "Configuración VPN", description: "Necesitan configurar acceso remoto", priority: "Media", status: "Abierto", date: "2024-03-21" }
];

// Actividad reciente
let activities = [
    { type: "company", action: "create", description: "Empresa creada: Tech Solutions SL", date: "2020-03-15 10:30" },
    { type: "contract", action: "create", description: "Nuevo contrato: Mantenimiento Integral", date: "2024-01-01 09:00" },
    { type: "invoice", action: "create", description: "Factura FAC-2024-003 emitida", date: "2024-03-15 14:20" },
    { type: "ticket", action: "create", description: "Ticket #1 creado: No funciona el correo", date: "2024-03-20 11:45" }
];

// Variables de paginación
let currentPage = 1;
const itemsPerPage = 10;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderCompanies();
    renderContracts();
    renderInvoices();
    renderTickets();
    updateStats();
    setupNavigation();
    setupFormTabs();
    setupITTabs();
});

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Actualizar navegación
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar sección
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

function setupFormTabs() {
    const formTabs = document.querySelectorAll('.form-tab');
    const formTabContents = document.querySelectorAll('.form-tab-content');
    
    formTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Actualizar tabs
            formTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido correspondiente
            formTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${targetTab}`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ============================================
// RENDERIZADO DE EMPRESAS
// ============================================

function renderCompanies() {
    const table = document.getElementById('companyTable');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;
    
    let filtered = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm) ||
                             c.cif.toLowerCase().includes(searchTerm) ||
                             c.email.toLowerCase().includes(searchTerm) ||
                             c.contacts.some(cont => cont.name.toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        
        const matchesService = serviceFilter === 'all' || c.services.includes(serviceFilter);
        
        return matchesSearch && matchesStatus && matchesService;
    });
    
    // Paginación
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        table.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">No se encontraron empresas</td></tr>`;
        return;
    }
    
    table.innerHTML = paginated.map(c => `
        <tr>
            <td onclick="viewCompany(${c.id})"><strong>${c.name}</strong></td>
            <td>${c.cif}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>
                <div class="services-tags">
                    ${c.services.map(s => `<span class="service-tag">${s}</span>`).join('')}
                </div>
            </td>
            <td><span class="status ${c.status.replace(' ', '-')}">${c.status}</span></td>
            <td>
                <button class="btn-action btn-view" onclick="viewCompany(${c.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" onclick="editCompany(${c.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteCompany(${c.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    renderPagination(totalPages);
    updateStats();
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderCompanies();
}

// ============================================
// RENDERIZADO DE CONTRATOS
// ============================================

function renderContracts() {
    const table = document.getElementById('contractsTable');
    
    table.innerHTML = contracts.map(contract => {
        const company = companies.find(c => c.id === contract.companyId);
        return `
            <tr>
                <td><strong>${company ? company.name : 'Desconocida'}</strong></td>
                <td>${contract.type}</td>
                <td>${formatDate(contract.startDate)}</td>
                <td>${formatDate(contract.endDate)}</td>
                <td><strong>${contract.value}€</strong></td>
                <td><span class="status ${contract.status.replace(' ', '-')}">${contract.status}</span></td>
                <td>
                    <button class="btn-action btn-view" onclick="viewContract(${contract.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editContract(${contract.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteContract(${contract.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateContractStats();
}

// ============================================
// RENDERIZADO DE FACTURAS
// ============================================

function renderInvoices() {
    const table = document.getElementById('invoicesTable');
    
    table.innerHTML = invoices.map(invoice => {
        const company = companies.find(c => c.id === invoice.companyId);
        return `
            <tr>
                <td><strong>${invoice.number}</strong></td>
                <td>${company ? company.name : 'Desconocida'}</td>
                <td>${formatDate(invoice.date)}</td>
                <td><strong>${invoice.amount.toFixed(2)}€</strong></td>
                <td><span class="status ${invoice.status}">${invoice.status}</span></td>
                <td>
                    <button class="btn-action btn-view" onclick="viewInvoice(${invoice.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editInvoice(${invoice.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteInvoice(${invoice.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateInvoiceStats();
}

// ============================================
// RENDERIZADO DE TICKETS
// ============================================

function renderTickets() {
    const table = document.getElementById('ticketsTable');
    
    table.innerHTML = tickets.map(ticket => {
        const company = companies.find(c => c.id === ticket.companyId);
        return `
            <tr>
                <td><strong>#${ticket.id}</strong></td>
                <td>${company ? company.name : 'Desconocida'}</td>
                <td>${ticket.subject}</td>
                <td><span class="status Prioridad-${ticket.priority}">${ticket.priority}</span></td>
                <td><span class="status ${ticket.status.replace(' ', '-')}">${ticket.status}</span></td>
                <td>${formatDate(ticket.date)}</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewTicket(${ticket.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editTicket(${ticket.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTicket(${ticket.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateTicketStats();
}

// ============================================
// ESTADÍSTICAS
// ============================================

function updateStats() {
    document.getElementById('totalEmpresas').innerText = companies.length;
    document.getElementById('empresasActivas').innerText = companies.filter(c => c.status === 'Activo').length;
}

function updateContractStats() {
    document.getElementById('totalContratos').innerText = contracts.length;
    document.getElementById('contratosActivos').innerText = contracts.filter(c => c.status === 'Activo').length;
    
    // Contratos por vencer en los próximos 30 días
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const porVencer = contracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate <= thirtyDaysFromNow && c.status === 'Activo';
    }).length;
    document.getElementById('contratosPorVencer').innerText = porVencer;
    
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
    document.getElementById('facturacionTotal').innerText = totalValue.toLocaleString() + '€';
}

function updateInvoiceStats() {
    document.getElementById('totalFacturas').innerText = invoices.length;
    document.getElementById('facturasPagadas').innerText = invoices.filter(i => i.status === 'Pagada').length;
    document.getElementById('facturasPendientes').innerText = invoices.filter(i => i.status === 'Pendiente').length;
    document.getElementById('facturasVencidas').innerText = invoices.filter(i => i.status === 'Vencida').length;
}

function updateTicketStats() {
    document.getElementById('totalTickets').innerText = tickets.length;
    document.getElementById('ticketsAbiertos').innerText = tickets.filter(t => t.status === 'Abierto').length;
    document.getElementById('ticketsCerrados').innerText = tickets.filter(t => t.status === 'Cerrado').length;
    document.getElementById('ticketsUrgentes').innerText = tickets.filter(t => t.priority === 'Urgente' && t.status !== 'Cerrado').length;
}

// ============================================
// ALERTAS DE CONTRATOS
// ============================================

// Función deshabilitada - Las alertas no se mostrarán al cargar la página
/*
function checkContractAlerts() {
    const container = document.getElementById('alertsContainer');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringContracts = contracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate <= thirtyDaysFromNow && c.status === 'Activo';
    });
    
    if (expiringContracts.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    expiringContracts.forEach(contract => {
        const company = companies.find(c => c.id === contract.companyId);
        const daysLeft = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="alert">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="alert-content">
                    <div class="alert-title">Contrato próximo a vencer</div>
                    <div class="alert-desc">${company ? company.name : 'Empresa'} - ${contract.type} (${daysLeft} días restantes)</div>
                </div>
                <button class="alert-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
*/

// ============================================
// MODAL DE EMPRESAS
// ============================================

function openCompanyModal(company = null) {
    const modal = document.getElementById('companyModal');
    const title = document.getElementById('companyModalTitle');
    const form = document.getElementById('companyForm');
    
    if (company) {
        title.innerText = 'Editar Empresa';
        document.getElementById('editCompanyIndex').value = company.id;
        document.getElementById('newName').value = company.name;
        document.getElementById('newCif').value = company.cif;
        document.getElementById('newEmail').value = company.email;
        document.getElementById('newPhone').value = company.phone;
        document.getElementById('newAddress').value = company.address || '';
        document.getElementById('newStatus').value = company.status;
        document.getElementById('newNotes').value = company.notes || '';
        
        // Servicios
        document.querySelectorAll('input[name="services"]').forEach(checkbox => {
            checkbox.checked = company.services.includes(checkbox.value);
        });
        
        // Contactos
        const contactsContainer = document.getElementById('contactsContainer');
        contactsContainer.innerHTML = '';
        company.contacts.forEach(contact => {
            addContactRow(contact);
        });
    } else {
        title.innerText = 'Nueva Empresa';
        form.reset();
        document.getElementById('editCompanyIndex').value = '';
        document.getElementById('contactsContainer').innerHTML = '';
        addContactRow();
        document.querySelectorAll('input[name="services"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    modal.style.display = 'flex';
}

function closeCompanyModal() {
    document.getElementById('companyModal').style.display = 'none';
}

function saveCompany() {
    const id = document.getElementById('editCompanyIndex').value;
    const name = document.getElementById('newName').value.trim();
    const cif = document.getElementById('newCif').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const phone = document.getElementById('newPhone').value.trim();
    const address = document.getElementById('newAddress').value.trim();
    const status = document.getElementById('newStatus').value;
    const notes = document.getElementById('newNotes').value.trim();
    
    if (!name || !cif || !email) {
        showToast('error', 'Error', 'Por favor completa los campos obligatorios');
        return;
    }
    
    // Recoger servicios
    const services = [];
    document.querySelectorAll('input[name="services"]:checked').forEach(checkbox => {
        services.push(checkbox.value);
    });
    
    // Recoger contactos
    const contacts = [];
    document.querySelectorAll('.contact-row').forEach(row => {
        const name = row.querySelector('.contact-name').value.trim();
        const phone = row.querySelector('.contact-phone').value.trim();
        const email = row.querySelector('.contact-email').value.trim();
        const role = row.querySelector('.contact-role').value.trim();
        
        if (name) {
            contacts.push({ name, phone, email, role });
        }
    });
    
    if (id) {
        // Editar empresa existente
        const index = companies.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            const oldCompany = companies[index];
            companies[index] = {
                ...oldCompany,
                name, cif, email, phone, address, status, notes, services, contacts
            };
            
            addActivity('company', 'update', `Empresa actualizada: ${name}`);
            showToast('success', 'Éxito', 'Empresa actualizada correctamente');
        }
    } else {
        // Nueva empresa
        const newCompany = {
            id: Date.now(),
            name, cif, email, phone, address, status, notes, services, contacts,
            createdAt: new Date().toISOString().split('T')[0],
            activity: []
        };
        companies.push(newCompany);
        
        addActivity('company', 'create', `Nueva empresa creada: ${name}`);
        showToast('success', 'Éxito', 'Empresa creada correctamente');
    }
    
    closeCompanyModal();
    renderCompanies();
}

// ============================================
// VER DETALLE DE EMPRESA
// ============================================

// Variable global para saber qué empresa estamos viendo
let currentCompanyId = null;

function viewCompany(id) {
    currentCompanyId = id;
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    document.getElementById('itModalCompanyName').innerText = company.name;
    
    // Renderizar la primera pestaña (Equipos) por defecto
    renderEquipos(id);
    
    // Mostrar modal
    document.getElementById('itInfraModal').style.display = 'flex';
    
    // Activar primera pestaña
    document.querySelectorAll('.it-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.it-tab[data-tab="equipos"]').classList.add('active');
}

function closeITModal() {
    document.getElementById('itInfraModal').style.display = 'none';
    currentCompanyId = null;
}

// ============================================
// PESTAÑAS DE INFRAESTRUCTURA IT
// ============================================

function setupITTabs() {
    const tabs = document.querySelectorAll('.it-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Actualizar tabs activos
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Renderizar contenido según pestaña
            if (currentCompanyId) {
                switch(tabName) {
                    case 'equipos':
                        renderEquipos(currentCompanyId);
                        break;
                    case 'servidores':
                        renderServidores(currentCompanyId);
                        break;
                    case 'nas':
                        renderNAS(currentCompanyId);
                        break;
                    case 'redes':
                        renderRedes(currentCompanyId);
                        break;
                    case 'licencias':
                        renderLicencias(currentCompanyId);
                        break;
                }
            }
        });
    });
}

// ============================================
// RENDER EQUIPOS
// ============================================

function renderEquipos(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const container = document.getElementById('itContent');
    
    if (!company.equipos || company.equipos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-desktop" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay equipos registrados</p>
                <button class="btn-primary" onclick="openAddEquipoModal()">
                    <i class="fas fa-plus"></i> Añadir Primer Equipo
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3><i class="fas fa-desktop"></i> Equipos (Ordenadores)</h3>
            <button class="btn-primary" onclick="openAddEquipoModal()">
                <i class="fas fa-plus"></i> Añadir Equipo
            </button>
        </div>
        <div class="it-items-grid">
    `;
    
    company.equipos.forEach(equipo => {
        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas fa-desktop"></i> ${equipo.nombre}</h4>
                    <button class="btn-action btn-delete" onclick="deleteEquipo(${equipo.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">
                    <div class="it-item-row">
                        <span class="it-label">Usuario:</span>
                        <span>${equipo.usuario}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Contraseña:</span>
                        <span id="pass-equipo-${equipo.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pass-equipo-${equipo.id}', '${equipo.password}')" title="Ver contraseña">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">IP:</span>
                        <span>${equipo.ip}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">AnyDesk ID:</span>
                        <span>${equipo.anydesk}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// RENDER SERVIDORES
// ============================================

function renderServidores(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const container = document.getElementById('itContent');
    
    if (!company.servidores || company.servidores.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-server" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay servidores registrados</p>
                <button class="btn-primary" onclick="openAddServidorModal()">
                    <i class="fas fa-plus"></i> Añadir Primer Servidor
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3><i class="fas fa-server"></i> Servidores</h3>
            <button class="btn-primary" onclick="openAddServidorModal()">
                <i class="fas fa-plus"></i> Añadir Servidor
            </button>
        </div>
        <div class="it-items-grid">
    `;
    
    company.servidores.forEach(servidor => {
        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas fa-server"></i> ${servidor.nombre}</h4>
                    <button class="btn-action btn-delete" onclick="deleteServidor(${servidor.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">
                    <div class="it-item-row">
                        <span class="it-label">IP:</span>
                        <span>${servidor.ip}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Usuario:</span>
                        <span>${servidor.usuario}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Contraseña:</span>
                        <span id="pass-servidor-${servidor.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pass-servidor-${servidor.id}', '${servidor.password}')" title="Ver contraseña">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Sistema Operativo:</span>
                        <span>${servidor.so}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// RENDER NAS
// ============================================

function renderNAS(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const container = document.getElementById('itContent');
    
    if (!company.nas || company.nas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-hdd" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay dispositivos NAS registrados</p>
                <button class="btn-primary" onclick="openAddNASModal()">
                    <i class="fas fa-plus"></i> Añadir Primer NAS
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3><i class="fas fa-hdd"></i> Dispositivos NAS</h3>
            <button class="btn-primary" onclick="openAddNASModal()">
                <i class="fas fa-plus"></i> Añadir NAS
            </button>
        </div>
        <div class="it-items-grid">
    `;
    
    company.nas.forEach(nas => {
        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas fa-hdd"></i> ${nas.nombre}</h4>
                    <button class="btn-action btn-delete" onclick="deleteNAS(${nas.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">
                    <div class="it-item-row">
                        <span class="it-label">IP:</span>
                        <span>${nas.ip}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Usuario:</span>
                        <span>${nas.usuario}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Contraseña:</span>
                        <span id="pass-nas-${nas.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pass-nas-${nas.id}', '${nas.password}')" title="Ver contraseña">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Capacidad:</span>
                        <span>${nas.capacidad}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// RENDER REDES
// ============================================

function renderRedes(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const container = document.getElementById('itContent');
    
    if (!company.redes || company.redes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-network-wired" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay dispositivos de red registrados</p>
                <button class="btn-primary" onclick="openAddRedModal()">
                    <i class="fas fa-plus"></i> Añadir Primer Dispositivo
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3><i class="fas fa-network-wired"></i> Dispositivos de Red</h3>
            <button class="btn-primary" onclick="openAddRedModal()">
                <i class="fas fa-plus"></i> Añadir Dispositivo
            </button>
        </div>
        <div class="it-items-grid">
    `;
    
    company.redes.forEach(red => {
        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas fa-network-wired"></i> ${red.dispositivo}</h4>
                    <button class="btn-action btn-delete" onclick="deleteRed(${red.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">
                    <div class="it-item-row">
                        <span class="it-label">IP:</span>
                        <span>${red.ip}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Usuario:</span>
                        <span>${red.usuario}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Contraseña:</span>
                        <span id="pass-red-${red.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pass-red-${red.id}', '${red.password}')" title="Ver contraseña">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Modelo:</span>
                        <span>${red.modelo}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// RENDER LICENCIAS
// ============================================

function renderLicencias(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const container = document.getElementById('itContent');
    
    if (!company.licencias || company.licencias.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-key" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay licencias registradas</p>
                <button class="btn-primary" onclick="openAddLicenciaModal()">
                    <i class="fas fa-plus"></i> Añadir Primera Licencia
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3><i class="fas fa-key"></i> Licencias de Software</h3>
            <button class="btn-primary" onclick="openAddLicenciaModal()">
                <i class="fas fa-plus"></i> Añadir Licencia
            </button>
        </div>
        <div class="it-items-grid">
    `;
    
    company.licencias.forEach(licencia => {
        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas fa-key"></i> ${licencia.software}</h4>
                    <button class="btn-action btn-delete" onclick="deleteLicencia(${licencia.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">
                    <div class="it-item-row">
                        <span class="it-label">Usuarios/Puestos:</span>
                        <span>${licencia.usuarios}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Vencimiento:</span>
                        <span>${formatDate(licencia.vencimiento)}</span>
                    </div>
                    <div class="it-item-row">
                        <span class="it-label">Clave de Licencia:</span>
                        <span id="clave-licencia-${licencia.id}" class="password-hidden">••••••••••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('clave-licencia-${licencia.id}', '${licencia.clave}')" title="Ver clave">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// TOGGLE PASSWORD
// ============================================

function togglePassword(elementId, password) {
    const element = document.getElementById(elementId);
    const button = element.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (element.classList.contains('password-hidden')) {
        element.innerText = password;
        element.classList.remove('password-hidden');
        element.classList.add('password-visible');
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        element.innerText = '••••••••';
        element.classList.remove('password-visible');
        element.classList.add('password-hidden');
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function closeDetailModal() {
    document.getElementById('companyDetailModal').style.display = 'none';
}

// ============================================
// EDITAR Y ELIMINAR EMPRESAS
// ============================================

function editCompany(id) {
    const company = companies.find(c => c.id === id);
    if (company) {
        openCompanyModal(company);
    }
}

function deleteCompany(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar la empresa "${company.name}"?`)) {
        companies = companies.filter(c => c.id !== id);
        addActivity('company', 'delete', `Empresa eliminada: ${company.name}`);
        showToast('success', 'Eliminado', 'Empresa eliminada correctamente');
        renderCompanies();
    }
}

// ============================================
// CONTACTOS
// ============================================

function addContactRow(contact = null) {
    const container = document.getElementById('contactsContainer');
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML = `
        <input type="text" placeholder="Nombre" class="contact-name" value="${contact ? contact.name : ''}">
        <input type="tel" placeholder="Teléfono" class="contact-phone" value="${contact ? contact.phone : ''}">
        <input type="email" placeholder="Email" class="contact-email" value="${contact ? contact.email : ''}">
        <input type="text" placeholder="Cargo" class="contact-role" value="${contact ? contact.role : ''}">
        <button type="button" class="btn-remove-contact" onclick="removeContactRow(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(row);
}

function removeContactRow(button) {
    const row = button.parentElement;
    const container = row.parentElement;
    if (container.children.length > 1) {
        row.remove();
    } else {
        // Limpiar si es el último
        row.querySelectorAll('input').forEach(input => input.value = '');
    }
}

// ============================================
// CONTRATOS
// ============================================

function openContractModal() {
    // Llenar selector de empresas
    const select = document.getElementById('contractCompany');
    select.innerHTML = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    document.getElementById('contractForm').reset();
    document.getElementById('contractStart').value = today;
    document.getElementById('contractEnd').value = nextYear.toISOString().split('T')[0];
    
    document.getElementById('contractModal').style.display = 'flex';
}

function closeContractModal() {
    document.getElementById('contractModal').style.display = 'none';
}

function saveContract() {
    const companyId = parseInt(document.getElementById('contractCompany').value);
    const type = document.getElementById('contractType').value;
    const startDate = document.getElementById('contractStart').value;
    const endDate = document.getElementById('contractEnd').value;
    const value = parseFloat(document.getElementById('contractValue').value);
    const notes = document.getElementById('contractNotes').value;
    
    if (!companyId || !type || !startDate || !endDate || !value) {
        showToast('error', 'Error', 'Por favor completa todos los campos obligatorios');
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    
    contracts.push({
        id: Date.now(),
        companyId, type, startDate, endDate, value,
        status: 'Activo',
        notes
    });
    
    addActivity('contract', 'create', `Nuevo contrato para ${company.name}: ${type}`);
    showToast('success', 'Éxito', 'Contrato creado correctamente');
    closeContractModal();
    renderContracts();
}

function viewContract(id) {
    showToast('info', 'Ver', 'Función de vista de contrato');
}

function editContract(id) {
    showToast('info', 'Editar', 'Función de edición de contrato');
}

function deleteContract(id) {
    if (confirm('¿Eliminar este contrato?')) {
        contracts = contracts.filter(c => c.id !== id);
        showToast('success', 'Eliminado', 'Contrato eliminado');
        renderContracts();
    }
}

// ============================================
// FACTURAS
// ============================================

function openInvoiceModal() {
    const select = document.getElementById('invoiceCompany');
    select.innerHTML = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    
    document.getElementById('invoiceForm').reset();
    document.getElementById('invoiceDate').value = today;
    document.getElementById('invoiceDueDate').value = thirtyDays.toISOString().split('T')[0];
    
    document.getElementById('invoiceModal').style.display = 'flex';
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').style.display = 'none';
}

function saveInvoice() {
    const number = document.getElementById('invoiceNumber').value.trim();
    const companyId = parseInt(document.getElementById('invoiceCompany').value);
    const date = document.getElementById('invoiceDate').value;
    const dueDate = document.getElementById('invoiceDueDate').value;
    const amount = parseFloat(document.getElementById('invoiceAmount').value);
    const status = document.getElementById('invoiceStatus').value;
    
    if (!number || !companyId || !date || !dueDate || !amount) {
        showToast('error', 'Error', 'Por favor completa todos los campos obligatorios');
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    
    invoices.push({
        id: Date.now(),
        number, companyId, date, dueDate, amount, status
    });
    
    addActivity('invoice', 'create', `Factura ${number} creada para ${company.name}`);
    showToast('success', 'Éxito', 'Factura creada correctamente');
    closeInvoiceModal();
    renderInvoices();
}

function viewInvoice(id) {
    showToast('info', 'Ver', 'Función de vista de factura');
}

function editInvoice(id) {
    showToast('info', 'Editar', 'Función de edición de factura');
}

function deleteInvoice(id) {
    if (confirm('¿Eliminar esta factura?')) {
        invoices = invoices.filter(i => i.id !== id);
        showToast('success', 'Eliminado', 'Factura eliminada');
        renderInvoices();
    }
}

// ============================================
// TICKETS
// ============================================

function openTicketModal() {
    const select = document.getElementById('ticketCompany');
    select.innerHTML = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    document.getElementById('ticketForm').reset();
    
    document.getElementById('ticketModal').style.display = 'flex';
}

function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
}

function saveTicket() {
    const companyId = parseInt(document.getElementById('ticketCompany').value);
    const subject = document.getElementById('ticketSubject').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    const priority = document.getElementById('ticketPriority').value;
    const status = document.getElementById('ticketStatus').value;
    const date = new Date().toISOString().split('T')[0];
    
    if (!companyId || !subject) {
        showToast('error', 'Error', 'Por favor completa los campos obligatorios');
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    
    tickets.push({
        id: Date.now(),
        companyId, subject, description, priority, status, date
    });
    
    addActivity('ticket', 'create', `Nuevo ticket para ${company.name}: ${subject}`);
    showToast('success', 'Éxito', 'Ticket creado correctamente');
    closeTicketModal();
    renderTickets();
}

function viewTicket(id) {
    showToast('info', 'Ver', 'Función de vista de ticket');
}

function editTicket(id) {
    showToast('info', 'Editar', 'Función de edición de ticket');
}

function deleteTicket(id) {
    if (confirm('¿Eliminar este ticket?')) {
        tickets = tickets.filter(t => t.id !== id);
        showToast('success', 'Eliminado', 'Ticket eliminado');
        renderTickets();
    }
}

// ============================================
// GESTIÓN DE INFRAESTRUCTURA IT
// ============================================

// EQUIPOS
function openAddEquipoModal() {
    document.getElementById('itItemModal').style.display = 'flex';
    document.getElementById('itItemModalTitle').innerText = 'Añadir Equipo';
    document.getElementById('itItemForm').innerHTML = `
        <div class="form-group">
            <label>Nombre del Equipo *</label>
            <input type="text" id="equipoNombre" placeholder="Ej: PC-Dirección" required>
        </div>
        <div class="form-group">
            <label>Usuario *</label>
            <input type="text" id="equipoUsuario" placeholder="Ej: jgarcia" required>
        </div>
        <div class="form-group">
            <label>Contraseña *</label>
            <input type="text" id="equipoPassword" placeholder="Contraseña del equipo" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Dirección IP *</label>
                <input type="text" id="equipoIP" placeholder="192.168.1.10" required>
            </div>
            <div class="form-group">
                <label>AnyDesk ID *</label>
                <input type="text" id="equipoAnydesk" placeholder="123456789" required>
            </div>
        </div>
    `;
    document.getElementById('saveITItemBtn').onclick = saveEquipo;
}

function saveEquipo() {
    const nombre = document.getElementById('equipoNombre').value.trim();
    const usuario = document.getElementById('equipoUsuario').value.trim();
    const password = document.getElementById('equipoPassword').value.trim();
    const ip = document.getElementById('equipoIP').value.trim();
    const anydesk = document.getElementById('equipoAnydesk').value.trim();
    
    if (!nombre || !usuario || !password || !ip || !anydesk) {
        showToast('error', 'Error', 'Por favor completa todos los campos');
        return;
    }
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    if (!company.equipos) company.equipos = [];
    
    company.equipos.push({
        id: Date.now(),
        nombre, usuario, password, ip, anydesk
    });
    
    showToast('success', 'Éxito', 'Equipo añadido correctamente');
    closeITItemModal();
    renderEquipos(currentCompanyId);
}

function deleteEquipo(equipoId) {
    if (!confirm('¿Eliminar este equipo?')) return;
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    company.equipos = company.equipos.filter(e => e.id !== equipoId);
    showToast('success', 'Eliminado', 'Equipo eliminado correctamente');
    renderEquipos(currentCompanyId);
}

// SERVIDORES
function openAddServidorModal() {
    document.getElementById('itItemModal').style.display = 'flex';
    document.getElementById('itItemModalTitle').innerText = 'Añadir Servidor';
    document.getElementById('itItemForm').innerHTML = `
        <div class="form-group">
            <label>Nombre del Servidor *</label>
            <input type="text" id="servidorNombre" placeholder="Ej: SRV-Principal" required>
        </div>
        <div class="form-group">
            <label>Dirección IP *</label>
            <input type="text" id="servidorIP" placeholder="192.168.1.5" required>
        </div>
        <div class="form-group">
            <label>Usuario *</label>
            <input type="text" id="servidorUsuario" placeholder="admin" required>
        </div>
        <div class="form-group">
            <label>Contraseña *</label>
            <input type="text" id="servidorPassword" placeholder="Contraseña del servidor" required>
        </div>
        <div class="form-group">
            <label>Sistema Operativo *</label>
            <input type="text" id="servidorSO" placeholder="Ej: Windows Server 2022" required>
        </div>
    `;
    document.getElementById('saveITItemBtn').onclick = saveServidor;
}

function saveServidor() {
    const nombre = document.getElementById('servidorNombre').value.trim();
    const ip = document.getElementById('servidorIP').value.trim();
    const usuario = document.getElementById('servidorUsuario').value.trim();
    const password = document.getElementById('servidorPassword').value.trim();
    const so = document.getElementById('servidorSO').value.trim();
    
    if (!nombre || !ip || !usuario || !password || !so) {
        showToast('error', 'Error', 'Por favor completa todos los campos');
        return;
    }
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    if (!company.servidores) company.servidores = [];
    
    company.servidores.push({
        id: Date.now(),
        nombre, ip, usuario, password, so
    });
    
    showToast('success', 'Éxito', 'Servidor añadido correctamente');
    closeITItemModal();
    renderServidores(currentCompanyId);
}

function deleteServidor(servidorId) {
    if (!confirm('¿Eliminar este servidor?')) return;
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    company.servidores = company.servidores.filter(s => s.id !== servidorId);
    showToast('success', 'Eliminado', 'Servidor eliminado correctamente');
    renderServidores(currentCompanyId);
}

// NAS
function openAddNASModal() {
    document.getElementById('itItemModal').style.display = 'flex';
    document.getElementById('itItemModalTitle').innerText = 'Añadir NAS';
    document.getElementById('itItemForm').innerHTML = `
        <div class="form-group">
            <label>Nombre del NAS *</label>
            <input type="text" id="nasNombre" placeholder="Ej: NAS-Backup" required>
        </div>
        <div class="form-group">
            <label>Dirección IP *</label>
            <input type="text" id="nasIP" placeholder="192.168.1.20" required>
        </div>
        <div class="form-group">
            <label>Usuario *</label>
            <input type="text" id="nasUsuario" placeholder="admin" required>
        </div>
        <div class="form-group">
            <label>Contraseña *</label>
            <input type="text" id="nasPassword" placeholder="Contraseña del NAS" required>
        </div>
        <div class="form-group">
            <label>Capacidad *</label>
            <input type="text" id="nasCapacidad" placeholder="Ej: 4TB, 8TB" required>
        </div>
    `;
    document.getElementById('saveITItemBtn').onclick = saveNAS;
}

function saveNAS() {
    const nombre = document.getElementById('nasNombre').value.trim();
    const ip = document.getElementById('nasIP').value.trim();
    const usuario = document.getElementById('nasUsuario').value.trim();
    const password = document.getElementById('nasPassword').value.trim();
    const capacidad = document.getElementById('nasCapacidad').value.trim();
    
    if (!nombre || !ip || !usuario || !password || !capacidad) {
        showToast('error', 'Error', 'Por favor completa todos los campos');
        return;
    }
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    if (!company.nas) company.nas = [];
    
    company.nas.push({
        id: Date.now(),
        nombre, ip, usuario, password, capacidad
    });
    
    showToast('success', 'Éxito', 'NAS añadido correctamente');
    closeITItemModal();
    renderNAS(currentCompanyId);
}

function deleteNAS(nasId) {
    if (!confirm('¿Eliminar este NAS?')) return;
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    company.nas = company.nas.filter(n => n.id !== nasId);
    showToast('success', 'Eliminado', 'NAS eliminado correctamente');
    renderNAS(currentCompanyId);
}

// REDES
function openAddRedModal() {
    document.getElementById('itItemModal').style.display = 'flex';
    document.getElementById('itItemModalTitle').innerText = 'Añadir Dispositivo de Red';
    document.getElementById('itItemForm').innerHTML = `
        <div class="form-group">
            <label>Nombre del Dispositivo *</label>
            <input type="text" id="redDispositivo" placeholder="Ej: Router Principal" required>
        </div>
        <div class="form-group">
            <label>Dirección IP *</label>
            <input type="text" id="redIP" placeholder="192.168.1.1" required>
        </div>
        <div class="form-group">
            <label>Usuario *</label>
            <input type="text" id="redUsuario" placeholder="admin" required>
        </div>
        <div class="form-group">
            <label>Contraseña *</label>
            <input type="text" id="redPassword" placeholder="Contraseña del dispositivo" required>
        </div>
        <div class="form-group">
            <label>Modelo *</label>
            <input type="text" id="redModelo" placeholder="Ej: Cisco RV340" required>
        </div>
    `;
    document.getElementById('saveITItemBtn').onclick = saveRed;
}

function saveRed() {
    const dispositivo = document.getElementById('redDispositivo').value.trim();
    const ip = document.getElementById('redIP').value.trim();
    const usuario = document.getElementById('redUsuario').value.trim();
    const password = document.getElementById('redPassword').value.trim();
    const modelo = document.getElementById('redModelo').value.trim();
    
    if (!dispositivo || !ip || !usuario || !password || !modelo) {
        showToast('error', 'Error', 'Por favor completa todos los campos');
        return;
    }
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    if (!company.redes) company.redes = [];
    
    company.redes.push({
        id: Date.now(),
        dispositivo, ip, usuario, password, modelo
    });
    
    showToast('success', 'Éxito', 'Dispositivo añadido correctamente');
    closeITItemModal();
    renderRedes(currentCompanyId);
}

function deleteRed(redId) {
    if (!confirm('¿Eliminar este dispositivo?')) return;
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    company.redes = company.redes.filter(r => r.id !== redId);
    showToast('success', 'Eliminado', 'Dispositivo eliminado correctamente');
    renderRedes(currentCompanyId);
}

// LICENCIAS
function openAddLicenciaModal() {
    document.getElementById('itItemModal').style.display = 'flex';
    document.getElementById('itItemModalTitle').innerText = 'Añadir Licencia';
    document.getElementById('itItemForm').innerHTML = `
        <div class="form-group">
            <label>Software *</label>
            <input type="text" id="licenciaSoftware" placeholder="Ej: Microsoft 365 Business" required>
        </div>
        <div class="form-group">
            <label>Número de Usuarios/Puestos *</label>
            <input type="number" id="licenciaUsuarios" placeholder="Ej: 15" required>
        </div>
        <div class="form-group">
            <label>Fecha de Vencimiento *</label>
            <input type="date" id="licenciaVencimiento" required>
        </div>
        <div class="form-group">
            <label>Clave de Licencia *</label>
            <input type="text" id="licenciaClave" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" required>
        </div>
    `;
    document.getElementById('saveITItemBtn').onclick = saveLicencia;
}

function saveLicencia() {
    const software = document.getElementById('licenciaSoftware').value.trim();
    const usuarios = parseInt(document.getElementById('licenciaUsuarios').value);
    const vencimiento = document.getElementById('licenciaVencimiento').value;
    const clave = document.getElementById('licenciaClave').value.trim();
    
    if (!software || !usuarios || !vencimiento || !clave) {
        showToast('error', 'Error', 'Por favor completa todos los campos');
        return;
    }
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    if (!company.licencias) company.licencias = [];
    
    company.licencias.push({
        id: Date.now(),
        software, usuarios, vencimiento, clave
    });
    
    showToast('success', 'Éxito', 'Licencia añadida correctamente');
    closeITItemModal();
    renderLicencias(currentCompanyId);
}

function deleteLicencia(licenciaId) {
    if (!confirm('¿Eliminar esta licencia?')) return;
    
    const company = companies.find(c => c.id === currentCompanyId);
    if (!company) return;
    
    company.licencias = company.licencias.filter(l => l.id !== licenciaId);
    showToast('success', 'Eliminado', 'Licencia eliminada correctamente');
    renderLicencias(currentCompanyId);
}

function closeITItemModal() {
    document.getElementById('itItemModal').style.display = 'none';
}

// ============================================
// EXPORTAR A EXCEL
// ============================================

async function exportToExcel() {
    // Importar la librería SheetJS desde CDN
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }
    
    // Preparar los datos
    const data = companies.map(c => ({
        'Nombre': c.name,
        'CIF': c.cif,
        'Email': c.email,
        'Teléfono': c.phone,
        'Dirección': c.address || '',
        'Estado': c.status,
        'Servicios': c.services.join(', '),
        'Fecha Creación': c.createdAt
    }));
    
    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Configurar el ancho de las columnas
    ws['!cols'] = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // CIF
        { wch: 30 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 40 }, // Dirección
        { wch: 15 }, // Estado
        { wch: 40 }, // Servicios
        { wch: 15 }  // Fecha Creación
    ];
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    
    // Generar el nombre del archivo con fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `empresas_${fecha}.xlsx`;
    
    // Descargar el archivo
    XLSX.writeFile(wb, nombreArchivo);
    
    showToast('success', 'Exportado', 'Datos exportados a Excel correctamente');
}

// ============================================
// ACTIVIDAD
// ============================================

function addActivity(type, action, description) {
    const activity = {
        type,
        action,
        description,
        date: new Date().toLocaleString()
    };
    activities.unshift(activity);
    
    // Mantener solo las últimas 50 actividades
    if (activities.length > 50) {
        activities = activities.slice(0, 50);
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto eliminar después de 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// ============================================
// FORMATO DE FECHAS
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ============================================
// EVENT LISTENERS ADICIONALES
// ============================================

document.getElementById('searchInput').addEventListener('input', renderCompanies);
document.getElementById('statusFilter').addEventListener('change', renderCompanies);
document.getElementById('serviceFilter').addEventListener('change', renderCompanies);

document.getElementById('addCompanyBtn').addEventListener('click', () => openCompanyModal());
document.getElementById('addContractBtn').addEventListener('click', () => openContractModal());
document.getElementById('addInvoiceBtn').addEventListener('click', () => openInvoiceModal());
document.getElementById('addTicketBtn').addEventListener('click', () => openTicketModal());

// Botón de cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        showToast('success', 'Sesión cerrada', 'Hasta pronto');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// Cerrar modales al hacer click fuera
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});