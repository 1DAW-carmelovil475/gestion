// ============================================
// HOLA INFORMÁTICA — GESTIÓN FRONTEND
// config.js debe cargarse antes que este archivo
// ============================================

let itItemsCache = [];
let companies  = [];
// let contracts  = []; // DESACTIVADO — Contratos
// let invoices   = []; // DESACTIVADO — Facturas
let tickets    = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentCompanyId = null;
let previousSection = 'empresas'; // para el botón volver

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function () {
    setupNavigation();
    setupFormTabs();
    setupITTabs();
    await loadAll();
});

async function loadAll() {
    showLoading(true);
    try {
        const loads = [loadEmpresas(), loadTickets()];
        if (isAdmin()) loads.push(loadUsuarios());
        await Promise.all(loads);
        renderCompanies();
        renderTickets();
        updateStats();
    } catch (e) {
        showToast('error', 'Error de conexión', e.message);
    } finally {
        showLoading(false);
    }
}

// ============================================
// CARGA DE DATOS
// ============================================
async function loadEmpresas()  { companies = await apiFetch('/api/empresas'); }
// async function loadContratos() { contracts = await apiFetch('/api/contratos'); } // DESACTIVADO — Contratos
// async function loadFacturas()  { invoices  = await apiFetch('/api/facturas'); }  // DESACTIVADO — Facturas
async function loadTickets()   { tickets   = await apiFetch('/api/tickets'); }

// ============================================
// NAVEGACIÓN
// ============================================
function setupNavigation() {
    // Top nav (desktop)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#')) return;
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            navigateTo(sectionId);
        });
    });

    // Bottom nav (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', function (e) { // ← añade el parámetro "e"
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#')) return;
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            navigateTo(sectionId);
        });
    });
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
    const activeBottom = document.querySelector(`.bottom-nav-item[data-section="${sectionId}"]`);
    if (activeBottom) activeBottom.classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupFormTabs() {
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            const form = this.closest('form') || this.closest('.modal-content');
            form.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            form.querySelectorAll('.form-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `tab-${targetTab}`);
            });
        });
    });
}

// ============================================
// RENDERIZADO — EMPRESAS
// ============================================
function renderCompanies() {
    const searchTerm    = (document.getElementById('searchInput').value || '').toLowerCase();
    const statusFilter  = document.getElementById('statusFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;

    let filtered = companies.filter(c => {
        const contactos = c.contactos || [];
        const matchSearch = c.nombre.toLowerCase().includes(searchTerm)
            || (c.cif || '').toLowerCase().includes(searchTerm)
            || (c.email || '').toLowerCase().includes(searchTerm)
            || contactos.some(ct => (ct.nombre || '').toLowerCase().includes(searchTerm));
        const matchStatus  = statusFilter === 'all'  || c.estado === statusFilter;
        const matchService = serviceFilter === 'all' || (c.servicios || []).includes(serviceFilter);
        return matchSearch && matchStatus && matchService;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    const emptyHtml = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray)">
        <i class="fas fa-search" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px"></i>
        No se encontraron empresas</td></tr>`;

    // — Tabla desktop —
    const table = document.getElementById('companyTable');
    if (table) {
        if (!paginated.length) {
            table.innerHTML = emptyHtml;
        } else {
            table.innerHTML = paginated.map(c => `
                <tr>
                    <td onclick="viewCompany('${c.id}')" style="cursor:pointer"><strong>${c.nombre}</strong></td>
                    <td>${c.cif || '—'}</td>
                    <td>${c.email || '—'}</td>
                    <td>${c.telefono || '—'}</td>
                    <td>
                        <div class="services-tags">
                            ${(c.servicios || []).map(s => `<span class="service-tag">${s}</span>`).join('')}
                        </div>
                    </td>
                    <td><span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado || '—'}</span></td>
                    <td>
                        <button class="btn-action btn-view"   onclick="viewCompany('${c.id}')"   title="Ver IT"><i class="fas fa-server"></i></button>
                        <button class="btn-action btn-edit"   onclick="editCompany('${c.id}')"   title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete" onclick="deleteCompany('${c.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
    }

    // — Cards móvil —
    const cardsContainer = document.getElementById('companyCards');
    if (cardsContainer) {
        if (!paginated.length) {
            cardsContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray)">
                <i class="fas fa-search" style="font-size:2.5rem;opacity:0.25;display:block;margin-bottom:12px"></i>
                <p>No se encontraron empresas</p></div>`;
        } else {
            cardsContainer.innerHTML = paginated.map(c => `
                <div class="company-card">
                    <div class="company-card-header" onclick="viewCompany('${c.id}')">
                        <div class="company-card-header-left">
                            <div class="company-card-name">${c.nombre}</div>
                            <div class="company-card-cif">${c.cif || '—'}</div>
                        </div>
                        <span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado || '—'}</span>
                    </div>
                    <div class="company-card-body">
                        <div class="company-card-info">
                            ${c.email ? `<div class="company-card-info-item"><i class="fas fa-envelope"></i> ${c.email}</div>` : ''}
                            ${c.telefono ? `<div class="company-card-info-item"><i class="fas fa-phone"></i> ${c.telefono}</div>` : ''}
                        </div>
                        ${(c.servicios||[]).length ? `
                            <div class="services-tags" style="margin-bottom:12px">
                                ${(c.servicios||[]).map(s => `<span class="service-tag">${s}</span>`).join('')}
                            </div>` : ''}
                        <div class="company-card-actions">
                            <button class="btn-action btn-view" onclick="viewCompany('${c.id}')"><i class="fas fa-server"></i> Ver IT</button>
                            <button class="btn-action btn-edit" onclick="editCompany('${c.id}')"><i class="fas fa-edit"></i> Editar</button>
                            <button class="btn-action btn-delete" onclick="deleteCompany('${c.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`).join('');
        }
    }

    renderPagination(totalPages);
    updateStats();
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

function goToPage(page) { currentPage = page; renderCompanies(); }

// ============================================
// RENDERIZADO — CONTRATOS (DESACTIVADO)
// ============================================
// function renderContracts() {
//     const table = document.getElementById('contractsTable');
//     const cards = document.getElementById('contractsCards');
//     const emptyMsg = 'Sin contratos registrados';
//
//     if (!contracts.length) {
//         if (table) table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">${emptyMsg}</td></tr>`;
//         if (cards) cards.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray)">${emptyMsg}</div>`;
//         updateContractStats();
//         return;
//     }
//
//     if (table) {
//         table.innerHTML = contracts.map(c => `
//             <tr class="clickable-row" onclick="viewContractDetail('${c.id}')">
//                 <td><strong>${c.empresas?.nombre || '—'}</strong></td>
//                 <td>${c.tipo}</td>
//                 <td>${formatDate(c.fecha_inicio)}</td>
//                 <td>${formatDate(c.fecha_fin)}</td>
//                 <td><strong>${parseFloat(c.valor || 0).toLocaleString('es-ES')}€</strong></td>
//                 <td><span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado}</span></td>
//                 <td onclick="event.stopPropagation()">
//                     <button class="btn-action btn-delete" onclick="deleteContract('${c.id}')" title="Eliminar">
//                         <i class="fas fa-trash"></i>
//                     </button>
//                 </td>
//             </tr>`).join('');
//     }
//
//     if (cards) {
//         cards.innerHTML = contracts.map(c => `
//             <div class="data-card clickable-row" onclick="viewContractDetail('${c.id}')">
//                 <div class="data-card-header">
//                     <div>
//                         <div class="data-card-title">${c.empresas?.nombre || '—'}</div>
//                         <div class="data-card-subtitle">${c.tipo}</div>
//                     </div>
//                     <span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado}</span>
//                 </div>
//                 <div class="data-card-meta">
//                     <span><i class="fas fa-calendar-alt"></i> ${formatDate(c.fecha_inicio)} → ${formatDate(c.fecha_fin)}</span>
//                     <span><i class="fas fa-euro-sign"></i> ${parseFloat(c.valor||0).toLocaleString('es-ES')}€/año</span>
//                 </div>
//                 <div class="data-card-actions" onclick="event.stopPropagation()">
//                     <button class="btn-action btn-delete" onclick="deleteContract('${c.id}')"><i class="fas fa-trash"></i> Eliminar</button>
//                 </div>
//             </div>`).join('');
//     }
//
//     updateContractStats();
// }

// ============================================
// RENDERIZADO — FACTURAS (DESACTIVADO)
// ============================================
// function renderInvoices() {
//     const table = document.getElementById('invoicesTable');
//     const cards = document.getElementById('invoicesCards');
//
//     if (!invoices.length) {
//         if (table) table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--gray)">Sin facturas registradas</td></tr>`;
//         if (cards) cards.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray)">Sin facturas registradas</div>`;
//         updateInvoiceStats();
//         return;
//     }
//
//     if (table) {
//         table.innerHTML = invoices.map(f => `
//             <tr class="clickable-row" onclick="viewInvoiceDetail('${f.id}')">
//                 <td><strong>${f.numero}</strong></td>
//                 <td>${f.empresas?.nombre || '—'}</td>
//                 <td>${formatDate(f.fecha)}</td>
//                 <td><strong>${parseFloat(f.importe || 0).toFixed(2)}€</strong></td>
//                 <td><span class="status ${f.estado}">${f.estado}</span></td>
//                 <td onclick="event.stopPropagation()">
//                     <button class="btn-action btn-delete" onclick="deleteInvoice('${f.id}')" title="Eliminar">
//                         <i class="fas fa-trash"></i>
//                     </button>
//                 </td>
//             </tr>`).join('');
//     }
//
//     if (cards) {
//         cards.innerHTML = invoices.map(f => `
//             <div class="data-card clickable-row" onclick="viewInvoiceDetail('${f.id}')">
//                 <div class="data-card-header">
//                     <div>
//                         <div class="data-card-title">${f.numero}</div>
//                         <div class="data-card-subtitle">${f.empresas?.nombre || '—'}</div>
//                     </div>
//                     <span class="status ${f.estado}">${f.estado}</span>
//                 </div>
//                 <div class="data-card-meta">
//                     <span><i class="fas fa-calendar-alt"></i> ${formatDate(f.fecha)}</span>
//                     <span><i class="fas fa-euro-sign"></i> ${parseFloat(f.importe||0).toFixed(2)}€</span>
//                 </div>
//                 <div class="data-card-actions" onclick="event.stopPropagation()">
//                     <button class="btn-action btn-delete" onclick="deleteInvoice('${f.id}')"><i class="fas fa-trash"></i> Eliminar</button>
//                 </div>
//             </div>`).join('');
//     }
//
//     updateInvoiceStats();
// }

// ============================================
// RENDERIZADO — TICKETS
// ============================================
function renderTickets() {
    const table = document.getElementById('ticketsTable');
    const cards = document.getElementById('ticketsCards');

    if (!tickets.length) {
        if (table) table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">Sin tickets registrados</td></tr>`;
        if (cards) cards.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray)">Sin tickets registrados</div>`;
        updateTicketStats();
        return;
    }

    if (table) {
        table.innerHTML = tickets.map(t => `
            <tr class="clickable-row" onclick="viewTicketDetail('${t.id}')">
                <td><strong>#${(t.id || '').substring(0,8)}</strong></td>
                <td>${t.empresas?.nombre || '—'}</td>
                <td>${t.asunto}</td>
                <td><span class="status Prioridad-${t.prioridad}">${t.prioridad}</span></td>
                <td><span class="status ${(t.estado||'').replace(/ /g,'-')}">${t.estado}</span></td>
                <td>${formatDate(t.created_at)}</td>
                <td onclick="event.stopPropagation()">
                    <button class="btn-action btn-edit" onclick="changeTicketStatus('${t.id}','${t.estado}')" title="Cambiar estado"><i class="fas fa-exchange-alt"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteTicket('${t.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
    }

    if (cards) {
        cards.innerHTML = tickets.map(t => `
            <div class="data-card clickable-row" onclick="viewTicketDetail('${t.id}')">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${t.asunto}</div>
                        <div class="data-card-subtitle">${t.empresas?.nombre || '—'}</div>
                    </div>
                    <span class="status ${(t.estado||'').replace(/ /g,'-')}">${t.estado}</span>
                </div>
                <div class="data-card-meta">
                    <span><i class="fas fa-flag"></i> <span class="status Prioridad-${t.prioridad}" style="padding:2px 8px;font-size:0.72rem">${t.prioridad}</span></span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(t.created_at)}</span>
                </div>
                <div class="data-card-actions" onclick="event.stopPropagation()">
                    <button class="btn-action btn-edit" onclick="changeTicketStatus('${t.id}','${t.estado}')"><i class="fas fa-exchange-alt"></i> Estado</button>
                    <button class="btn-action btn-delete" onclick="deleteTicket('${t.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
    }

    updateTicketStats();
}

// ============================================
// DETALLE — CONTRATO (DESACTIVADO)
// ============================================
// function viewContractDetail(id) {
//     const c = contracts.find(x => x.id === id);
//     if (!c) return;
//     document.getElementById('contractDetailBody').innerHTML = `
//         <div class="detail-info-grid">
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-building"></i> Empresa</span>
//                 <span class="detail-info-value">${c.empresas?.nombre || '—'}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-tag"></i> Tipo</span>
//                 <span class="detail-info-value">${c.tipo || '—'}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-calendar-alt"></i> Fecha Inicio</span>
//                 <span class="detail-info-value">${formatDate(c.fecha_inicio)}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-calendar-times"></i> Fecha Fin</span>
//                 <span class="detail-info-value">${formatDate(c.fecha_fin)}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-euro-sign"></i> Valor Anual</span>
//                 <span class="detail-info-value"><strong>${parseFloat(c.valor || 0).toLocaleString('es-ES')}€</strong></span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-circle"></i> Estado</span>
//                 <span class="detail-info-value"><span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado}</span></span>
//             </div>
//         </div>
//         <div class="detail-notes-box">
//             <div class="detail-notes-label"><i class="fas fa-sticky-note"></i> Notas</div>
//             <div class="detail-notes-content">${c.notas || '<em style="color:var(--gray)">Sin nota</em>'}</div>
//         </div>`;
//     document.getElementById('contractDetailModal').style.display = 'flex';
// }

// ============================================
// DETALLE — FACTURA (DESACTIVADO)
// ============================================
// function viewInvoiceDetail(id) {
//     const f = invoices.find(x => x.id === id);
//     if (!f) return;
//     document.getElementById('invoiceDetailBody').innerHTML = `
//         <div class="detail-info-grid">
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-hashtag"></i> Nº Factura</span>
//                 <span class="detail-info-value"><strong>${f.numero}</strong></span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-building"></i> Empresa</span>
//                 <span class="detail-info-value">${f.empresas?.nombre || '—'}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-calendar-alt"></i> Fecha Emisión</span>
//                 <span class="detail-info-value">${formatDate(f.fecha)}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-calendar-times"></i> Vencimiento</span>
//                 <span class="detail-info-value">${formatDate(f.fecha_vencimiento)}</span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-euro-sign"></i> Importe</span>
//                 <span class="detail-info-value"><strong>${parseFloat(f.importe || 0).toFixed(2)}€</strong></span>
//             </div>
//             <div class="detail-info-item">
//                 <span class="detail-info-label"><i class="fas fa-circle"></i> Estado</span>
//                 <span class="detail-info-value"><span class="status ${f.estado}">${f.estado}</span></span>
//             </div>
//         </div>
//         <div class="detail-notes-box">
//             <div class="detail-notes-label"><i class="fas fa-sticky-note"></i> Notas</div>
//             <div class="detail-notes-content">${f.notas || '<em style="color:var(--gray)">Sin nota</em>'}</div>
//         </div>`;
//     document.getElementById('invoiceDetailModal').style.display = 'flex';
// }

// ============================================
// DETALLE — TICKET
// ============================================
function viewTicketDetail(id) {
    const t = tickets.find(x => x.id === id);
    if (!t) return;
    document.getElementById('ticketDetailBody').innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-info-label"><i class="fas fa-hashtag"></i> ID</span>
                <span class="detail-info-value">#${(t.id || '').substring(0,8)}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label"><i class="fas fa-building"></i> Empresa</span>
                <span class="detail-info-value">${t.empresas?.nombre || '—'}</span>
            </div>
            <div class="detail-info-item detail-info-full">
                <span class="detail-info-label"><i class="fas fa-comment-alt"></i> Asunto</span>
                <span class="detail-info-value">${t.asunto}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label"><i class="fas fa-flag"></i> Prioridad</span>
                <span class="detail-info-value"><span class="status Prioridad-${t.prioridad}">${t.prioridad}</span></span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label"><i class="fas fa-circle"></i> Estado</span>
                <span class="detail-info-value"><span class="status ${(t.estado||'').replace(/ /g,'-')}">${t.estado}</span></span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label"><i class="fas fa-calendar-alt"></i> Fecha</span>
                <span class="detail-info-value">${formatDate(t.created_at)}</span>
            </div>
        </div>
        ${t.descripcion ? `
        <div class="detail-notes-box" style="margin-top:12px">
            <div class="detail-notes-label"><i class="fas fa-align-left"></i> Descripción</div>
            <div class="detail-notes-content">${t.descripcion}</div>
        </div>` : ''}
        <div class="detail-notes-box" style="margin-top:12px">
            <div class="detail-notes-label"><i class="fas fa-sticky-note"></i> Notas</div>
            <div class="detail-notes-content">${t.notas || '<em style="color:var(--gray)">Sin nota</em>'}</div>
        </div>`;
    document.getElementById('ticketDetailModal').style.display = 'flex';
}

// ============================================
// ESTADÍSTICAS
// ============================================
function updateStats() {
    document.getElementById('totalEmpresas').textContent   = companies.length;
    document.getElementById('empresasActivas').textContent = companies.filter(c => c.estado === 'Activo').length;
}

// DESACTIVADO — Estadísticas de Contratos
// function updateContractStats() {
//     document.getElementById('totalContratos').textContent   = contracts.length;
//     document.getElementById('contratosActivos').textContent = contracts.filter(c => c.estado === 'Activo').length;
//     const d30 = new Date(); d30.setDate(d30.getDate() + 30);
//     document.getElementById('contratosPorVencer').textContent = contracts.filter(c =>
//         c.estado === 'Activo' && new Date(c.fecha_fin) <= d30).length;
//     const total = contracts.reduce((s, c) => s + parseFloat(c.valor || 0), 0);
//     document.getElementById('facturacionTotal').textContent = total.toLocaleString('es-ES') + '€';
// }

// DESACTIVADO — Estadísticas de Facturas
// function updateInvoiceStats() {
//     document.getElementById('totalFacturas').textContent      = invoices.length;
//     document.getElementById('facturasPagadas').textContent    = invoices.filter(i => i.estado === 'Pagada').length;
//     document.getElementById('facturasPendientes').textContent = invoices.filter(i => i.estado === 'Pendiente').length;
//     document.getElementById('facturasVencidas').textContent   = invoices.filter(i => i.estado === 'Vencida').length;
// }

function updateTicketStats() {
    document.getElementById('totalTickets').textContent    = tickets.length;
    document.getElementById('ticketsAbiertos').textContent = tickets.filter(t => t.estado === 'Abierto').length;
    document.getElementById('ticketsCerrados').textContent = tickets.filter(t => t.estado === 'Cerrado').length;
    document.getElementById('ticketsUrgentes').textContent = tickets.filter(t => t.prioridad === 'Urgente' && t.estado !== 'Cerrado').length;
}

// ============================================
// EXPORTAR / IMPORTAR EXCEL
// ============================================
function exportToExcel() {
    if (!companies || companies.length === 0) {
        showToast('warning', 'Sin datos', 'No hay empresas para exportar');
        return;
    }
    const data = companies.map(c => ({
        Nombre: c.nombre || '', CIF: c.cif || '', Email: c.email || '',
        Teléfono: c.telefono || '', Dirección: c.direccion || '',
        Estado: c.estado || '',
        Servicios: Array.isArray(c.servicios) ? c.servicios.join(', ') : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob  = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('success', 'Exportado', `${companies.length} empresas exportadas`);
}

function importExcel() {
    document.getElementById('excelFileInput').click();
}

document.getElementById('excelFileInput').addEventListener('change', handleExcelImport);

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            if (!jsonData.length) { showToast('warning', 'Vacío', 'El archivo no contiene datos'); return; }
            showLoading(true);
            for (const row of jsonData) {
                const payload = {
                    nombre: row['Nombre'] || '', cif: row['CIF'] || '',
                    email: row['Email'] || null, telefono: row['Teléfono'] || null,
                    direccion: row['Dirección'] || null, estado: row['Estado'] || 'Activo',
                    servicios: row['Servicios'] ? row['Servicios'].split(',').map(s => s.trim()) : []
                };
                if (!payload.nombre || !payload.cif) continue;
                await apiFetch('/api/empresas', { method: 'POST', body: JSON.stringify(payload) });
            }
            showToast('success', 'Importado', `${jsonData.length} empresas importadas`);
            await loadEmpresas(); renderCompanies();
        } catch (err) {
            console.error(err);
            showToast('error', 'Error', 'No se pudo importar el archivo');
        } finally {
            showLoading(false); event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

// ============================================
// EMPRESAS — CRUD
// ============================================
function openCompanyModal(company = null) {
    const modal = document.getElementById('companyModal');
    document.getElementById('companyModalTitle').textContent = company ? 'Editar Empresa' : 'Nueva Empresa';
    document.getElementById('companyForm').reset();
    document.getElementById('editCompanyIndex').value = company ? company.id : '';

    if (company) {
        document.getElementById('newName').value    = company.nombre    || '';
        document.getElementById('newCif').value     = company.cif       || '';
        document.getElementById('newEmail').value   = company.email     || '';
        document.getElementById('newPhone').value   = company.telefono  || '';
        document.getElementById('newAddress').value = company.direccion || '';
        document.getElementById('newStatus').value  = company.estado    || 'Activo';
        document.getElementById('newNotes').value   = company.notas     || '';
        document.querySelectorAll('input[name="services"]').forEach(cb => {
            cb.checked = (company.servicios || []).includes(cb.value);
        });
        const container = document.getElementById('contactsContainer');
        container.innerHTML = '';
        (company.contactos || []).forEach(c => addContactRow(c));
        if (!(company.contactos || []).length) addContactRow();
    } else {
        document.getElementById('contactsContainer').innerHTML = '';
        addContactRow();
        document.querySelectorAll('input[name="services"]').forEach(cb => cb.checked = false);
    }

    document.querySelectorAll('#companyForm .form-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('#companyForm .form-tab-content').forEach((t, i) => t.classList.toggle('active', i === 0));
    modal.style.display = 'flex';
}

function closeCompanyModal() {
    document.getElementById('companyModal').style.display = 'none';
}

async function saveCompany() {
    const id     = document.getElementById('editCompanyIndex').value;
    const nombre = document.getElementById('newName').value.trim();
    const cif    = document.getElementById('newCif').value.trim();
    if (!nombre || !cif) { showToast('error', 'Error', 'Nombre y CIF son obligatorios'); return; }

    const servicios = [...document.querySelectorAll('input[name="services"]:checked')].map(cb => cb.value);
    const contactos = [...document.querySelectorAll('.contact-row')].map(row => ({
        nombre:   row.querySelector('.contact-name')?.value.trim()  || '',
        telefono: row.querySelector('.contact-phone')?.value.trim() || '',
        email:    row.querySelector('.contact-email')?.value.trim() || '',
        cargo:    row.querySelector('.contact-role')?.value.trim()  || '',
    })).filter(c => c.nombre);

    const payload = {
        nombre, cif,
        email:     document.getElementById('newEmail').value.trim()   || null,
        telefono:  document.getElementById('newPhone').value.trim()   || null,
        direccion: document.getElementById('newAddress').value.trim() || null,
        estado:    document.getElementById('newStatus').value,
        notas:     document.getElementById('newNotes').value.trim()   || null,
        servicios, contactos,
    };

    showLoading(true);
    try {
        if (id) {
            await apiFetch(`/api/empresas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('success', 'Actualizado', 'Empresa actualizada');
        } else {
            await apiFetch('/api/empresas', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Creado', 'Empresa creada correctamente');
        }
        closeCompanyModal();
        await loadEmpresas();
        renderCompanies();
        if (id && currentCompanyId === id) {
            renderEmpresaDetalle(id);
        }
    } catch (e) {
        showToast('error', 'Error', e.message);
    } finally {
        showLoading(false);
    }
}

function editCompany(id) {
    const company = companies.find(c => c.id === id);
    if (company) openCompanyModal(company);
}

async function deleteCompany(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    if (!confirm(`¿Eliminar "${company.nombre}"? Se borrarán todos sus datos.`)) return;
    showLoading(true);
    try {
        await apiFetch(`/api/empresas/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Empresa eliminada');
        await loadEmpresas();
        renderCompanies();
        if (currentCompanyId === id) volverAEmpresas();
    } catch (e) {
        showToast('error', 'Error', e.message);
    } finally {
        showLoading(false);
    }
}

// ============================================
// CONTACTOS
// ============================================
function addContactRow(c = null) {
    const container = document.getElementById('contactsContainer');
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML = `
        <input type="text"  placeholder="Nombre"   class="contact-name"  value="${c?.nombre   || ''}">
        <input type="tel"   placeholder="Teléfono" class="contact-phone" value="${c?.telefono || ''}">
        <input type="email" placeholder="Email"    class="contact-email" value="${c?.email    || ''}">
        <input type="text"  placeholder="Cargo"    class="contact-role"  value="${c?.cargo    || ''}">
        <button type="button" class="btn-remove-contact" onclick="removeContactRow(this)">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(row);
}

function removeContactRow(button) {
    const row = button.parentElement;
    const container = row.parentElement;
    if (container.children.length > 1) row.remove();
    else row.querySelectorAll('input').forEach(i => i.value = '');
}

// ============================================
// CONTRATOS — CRUD (DESACTIVADO)
// ============================================
// function openContractModal() {
//     document.getElementById('contractCompany').innerHTML =
//         companies.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
//     const today = new Date().toISOString().split('T')[0];
//     const next  = new Date(); next.setFullYear(next.getFullYear() + 1);
//     document.getElementById('contractStart').value  = today;
//     document.getElementById('contractEnd').value    = next.toISOString().split('T')[0];
//     document.getElementById('contractValue').value  = '';
//     document.getElementById('contractNotes').value  = '';
//     document.getElementById('contractModal').style.display = 'flex';
// }
//
// function closeContractModal() { document.getElementById('contractModal').style.display = 'none'; }
//
// async function saveContract() {
//     const empresa_id   = document.getElementById('contractCompany').value;
//     const tipo         = document.getElementById('contractType').value;
//     const fecha_inicio = document.getElementById('contractStart').value;
//     const fecha_fin    = document.getElementById('contractEnd').value;
//     const valor        = parseFloat(document.getElementById('contractValue').value);
//     if (!empresa_id || !tipo || !fecha_inicio || !fecha_fin || isNaN(valor)) {
//         showToast('error', 'Error', 'Completa todos los campos obligatorios'); return;
//     }
//     showLoading(true);
//     try {
//         await apiFetch('/api/contratos', { method: 'POST', body: JSON.stringify({
//             empresa_id, tipo, fecha_inicio, fecha_fin, valor, estado: 'Activo',
//             notas: document.getElementById('contractNotes').value || null,
//         })});
//         showToast('success', 'Creado', 'Contrato creado correctamente');
//         closeContractModal();
//         await loadContratos(); renderContracts();
//     } catch (e) { showToast('error', 'Error', e.message); }
//     finally { showLoading(false); }
// }
//
// async function deleteContract(id) {
//     if (!confirm('¿Eliminar este contrato?')) return;
//     showLoading(true);
//     try {
//         await apiFetch(`/api/contratos/${id}`, { method: 'DELETE' });
//         showToast('success', 'Eliminado', 'Contrato eliminado');
//         await loadContratos(); renderContracts();
//     } catch (e) { showToast('error', 'Error', e.message); }
//     finally { showLoading(false); }
// }

// ============================================
// FACTURAS — CRUD (DESACTIVADO)
// ============================================
// function openInvoiceModal() {
//     document.getElementById('invoiceCompany').innerHTML =
//         companies.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
//     const today = new Date().toISOString().split('T')[0];
//     const t30 = new Date(); t30.setDate(t30.getDate() + 30);
//     document.getElementById('invoiceNumber').value  = '';
//     document.getElementById('invoiceAmount').value  = '';
//     document.getElementById('invoiceDate').value    = today;
//     document.getElementById('invoiceDueDate').value = t30.toISOString().split('T')[0];
//     document.getElementById('invoiceStatus').value  = 'Pendiente';
//     document.getElementById('invoiceModal').style.display = 'flex';
// }
//
// function closeInvoiceModal() { document.getElementById('invoiceModal').style.display = 'none'; }
//
// async function saveInvoice() {
//     const numero    = document.getElementById('invoiceNumber').value.trim();
//     const empresa_id= document.getElementById('invoiceCompany').value;
//     const fecha     = document.getElementById('invoiceDate').value;
//     const fecha_vencimiento = document.getElementById('invoiceDueDate').value;
//     const importe   = parseFloat(document.getElementById('invoiceAmount').value);
//     if (!numero || !empresa_id || !fecha || !fecha_vencimiento || isNaN(importe)) {
//         showToast('error', 'Error', 'Completa todos los campos obligatorios'); return;
//     }
//     showLoading(true);
//     try {
//         await apiFetch('/api/facturas', { method: 'POST', body: JSON.stringify({
//             numero, empresa_id, fecha, fecha_vencimiento, importe,
//             estado: document.getElementById('invoiceStatus').value,
//         })});
//         showToast('success', 'Creada', 'Factura creada correctamente');
//         closeInvoiceModal(); await loadFacturas(); renderInvoices();
//     } catch (e) { showToast('error', 'Error', e.message); }
//     finally { showLoading(false); }
// }
//
// async function deleteInvoice(id) {
//     if (!confirm('¿Eliminar esta factura?')) return;
//     showLoading(true);
//     try {
//         await apiFetch(`/api/facturas/${id}`, { method: 'DELETE' });
//         showToast('success', 'Eliminado', 'Factura eliminada');
//         await loadFacturas(); renderInvoices();
//     } catch (e) { showToast('error', 'Error', e.message); }
//     finally { showLoading(false); }
// }

// ============================================
// TICKETS — CRUD
// ============================================
function openTicketModal() {
    document.getElementById('ticketCompany').innerHTML =
        companies.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    document.getElementById('ticketSubject').value     = '';
    document.getElementById('ticketDescription').value = '';
    document.getElementById('ticketPriority').value    = 'Media';
    document.getElementById('ticketStatus').value      = 'Abierto';
    document.getElementById('ticketModal').style.display = 'flex';
}

function closeTicketModal() { document.getElementById('ticketModal').style.display = 'none'; }

async function saveTicket() {
    const empresa_id = document.getElementById('ticketCompany').value;
    const asunto     = document.getElementById('ticketSubject').value.trim();
    if (!empresa_id || !asunto) { showToast('error', 'Error', 'Empresa y asunto son obligatorios'); return; }
    showLoading(true);
    try {
        await apiFetch('/api/tickets', { method: 'POST', body: JSON.stringify({
            empresa_id, asunto,
            descripcion: document.getElementById('ticketDescription').value || null,
            prioridad:   document.getElementById('ticketPriority').value,
            estado:      document.getElementById('ticketStatus').value,
        })});
        showToast('success', 'Creado', 'Ticket creado correctamente');
        closeTicketModal(); await loadTickets(); renderTickets();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

async function changeTicketStatus(id, currentStatus) {
    const statuses = ['Abierto', 'En proceso', 'Cerrado'];
    const next = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    if (!confirm(`¿Cambiar estado a "${next}"?`)) return;
    showLoading(true);
    try {
        await apiFetch(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify({ estado: next }) });
        showToast('success', 'Actualizado', `Estado → ${next}`);
        await loadTickets(); renderTickets();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

async function deleteTicket(id) {
    if (!confirm('¿Eliminar este ticket?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Ticket eliminado');
        await loadTickets(); renderTickets();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

// ============================================
// EMPRESA DETALLE — PÁGINA COMPLETA
// ============================================
function viewCompany(id) {
    currentCompanyId = id;
    const company = companies.find(c => c.id === id);
    if (!company) return;

    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id !== 'empresa-detalle') {
        previousSection = activeSection.id;
    }

    renderEmpresaDetalle(id);
    navigateToDetalle();
}

function renderEmpresaDetalle(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;

    document.getElementById('empresaDetalleTitulo').innerHTML =
        `<i class="fas fa-building"></i> ${company.nombre}`;

    document.getElementById('empresaDetalleEditBtn').onclick = () => editCompany(id);

    const grid = document.getElementById('empresaInfoGrid');
    const serviciosHtml = (company.servicios || []).length
        ? `<div class="services-tags">${(company.servicios).map(s => `<span class="service-tag">${s}</span>`).join('')}</div>`
        : '<em style="color:var(--gray);font-size:0.85rem">Sin servicios</em>';

    grid.innerHTML = `
        <div class="empresa-info-card">
            <label>CIF</label>
            <span>${company.cif || '—'}</span>
        </div>
        <div class="empresa-info-card">
            <label>Email</label>
            <span>${company.email || '—'}</span>
        </div>
        <div class="empresa-info-card">
            <label>Teléfono</label>
            <span>${company.telefono || '—'}</span>
        </div>
        <div class="empresa-info-card">
            <label>Estado</label>
            <span class="status ${(company.estado||'').replace(/ /g,'-')}">${company.estado || '—'}</span>
        </div>
        <div class="empresa-info-card">
            <label>Dirección</label>
            <span>${company.direccion || '—'}</span>
        </div>
        <div class="empresa-info-card">
            <label>Servicios</label>
            ${serviciosHtml}
        </div>
    `;

    document.querySelectorAll('#itTabsPage .it-tab').forEach(t => t.classList.remove('active'));
    const firstTab = document.querySelector('#itTabsPage .it-tab[data-tab="equipos"]');
    if (firstTab) firstTab.classList.add('active');

    renderEquipos(id);
}

function navigateToDetalle() {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('empresa-detalle').classList.add('active');
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(l => l.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAEmpresas() {
    currentCompanyId = null;
    navigateTo(previousSection || 'empresas');
}

// ============================================
// INFRAESTRUCTURA IT — tabs de la página detalle
// ============================================
function setupITTabs() {
    document.querySelectorAll('#itTabsPage .it-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('#itTabsPage .it-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            if (!currentCompanyId) return;
            const map = {
                equipos:    () => renderEquipos(currentCompanyId),
                servidores: () => renderServidores(currentCompanyId),
                nas:        () => renderNAS(currentCompanyId),
                redes:      () => renderRedes(currentCompanyId),
                correos:    () => renderCorreos(currentCompanyId),
                otros:      () => renderOtros(currentCompanyId),
            };
            const fn = map[this.getAttribute('data-tab')];
            if (fn) fn();
        });
    });
}

async function getDispositivos(empresaId, categoria) {
    return apiFetch(`/api/dispositivos?empresa_id=${empresaId}&categoria=${categoria}`);
}

async function renderDispositivos(empresaId, categoria, icon, fields) {
    const container = document.getElementById('itContent');
    container.innerHTML = `<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary)"></i><p style="margin-top:12px;color:var(--gray)">Cargando...</p></div>`;

    let items;
    try { items = await getDispositivos(empresaId, categoria); }
    catch (e) {
        container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> ${e.message}</div>`;
        return;
    }

    itItemsCache = items;
    const labelMap = { equipo: 'Equipos', servidor: 'Servidores', nas: 'NAS', red: 'Dispositivos de Red', correo: 'Correos', otro: 'Elementos' };
    buildITContent(items, categoria, icon, fields, labelMap[categoria] || categoria);
}

function buildITContent(items, categoria, icon, fields, label, searchTerm = '') {
    const container = document.getElementById('itContent');

    const filtered = searchTerm
        ? items.filter(item =>
            (item.nombre_cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.correo_cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.numero_serie || '').toLowerCase().includes(searchTerm.toLowerCase()))
        : items;

    const searchPlaceholder = categoria === 'correo'
        ? 'Buscar por nombre de cliente o correo...'
        : categoria === 'equipo'
            ? 'Buscar por nombre o número de serie...'
            : 'Buscar por nombre...';

    const searchBar = `
        <div class="it-search-bar">
            <div class="it-search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="itSearchInput"
                    placeholder="${searchPlaceholder}"
                    value="${searchTerm}"
                    oninput="handleITSearch(event,'${categoria}','${icon}','${label}')">
            </div>
        </div>`;

    if (!filtered.length && !searchTerm) {
        container.innerHTML = `
            <div style="text-align:center;padding:50px 20px;color:var(--gray)">
                <i class="fas ${icon}" style="font-size:3rem;opacity:0.25;display:block;margin-bottom:16px"></i>
                <p style="font-size:1.05rem;font-weight:500;margin-bottom:20px">No hay ${label} registrados</p>
                <button class="btn-primary" onclick="openAddDispositivoModal('${categoria}')">
                    <i class="fas fa-plus"></i> Añadir ${label}
                </button>
            </div>`;
        return;
    }

    if (!filtered.length) {
        container.innerHTML = searchBar + `
            <div style="text-align:center;padding:40px;color:var(--gray)">
                <i class="fas fa-search" style="font-size:2.5rem;opacity:0.2;display:block;margin-bottom:12px"></i>
                <p>Sin resultados para "<strong>${searchTerm}</strong>"</p>
            </div>`;
        setTimeout(() => { const el = document.getElementById('itSearchInput'); if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);} }, 0);
        return;
    }

    let html = searchBar + `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h3 style="font-size:1rem;color:var(--dark);display:flex;align-items:center;gap:8px">
                <i class="fas ${icon}" style="color:var(--primary)"></i> ${label}
                <span style="background:#e0f2fe;color:#0369a1;padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">${filtered.length}${searchTerm ? ` de ${items.length}` : ''}</span>
            </h3>
            <button class="btn-primary btn-sm" onclick="openAddDispositivoModal('${categoria}')">
                <i class="fas fa-plus"></i> Añadir
            </button>
        </div>
        <div class="it-items-grid">`;

    filtered.forEach(item => {
        const extra = item.campos_extra || {};
        let bodyHtml = '';

        if (categoria === 'equipo' && item.numero_serie) {
            bodyHtml += `
                <div class="it-item-row">
                    <span class="it-label">Nº Serie:</span>
                    <span style="font-family:monospace;font-size:0.85rem;color:#0369a1;font-weight:600">${item.numero_serie}</span>
                </div>`;
        }

        bodyHtml += fields.map(f => {
            const val = item[f.key];
            if (f.password) return `
                <div class="it-item-row">
                    <span class="it-label">${f.label}:</span>
                    <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
                        <span id="pwd-${f.key}-${item.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pwd-${f.key}-${item.id}',\`${(val||'').replace(/`/g,'\\`').replace(/\$/g,'\\$')}\`)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>`;
            return `
                <div class="it-item-row">
                    <span class="it-label">${f.label}:</span>
                    <span>${val || '<em style="color:var(--gray);font-style:italic;font-size:0.82rem">—</em>'}</span>
                </div>`;
        }).join('');

        Object.entries(extra).forEach(([k, v]) => {
            bodyHtml += `<div class="it-item-row"><span class="it-label">${k}:</span><span>${v}</span></div>`;
        });

        const cardTitle = categoria === 'correo'
            ? `<i class="fas ${icon}"></i> ${item.nombre_cliente || item.correo_cliente || '—'}`
            : `<i class="fas ${icon}"></i> ${item.nombre}${item.tipo ? ` <small style="font-weight:400;opacity:0.65;font-size:0.82rem">(${item.tipo})</small>` : ''}`;

        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4>${cardTitle}</h4>
                    <div style="display:flex;gap:4px;flex-shrink:0">
                        <button class="btn-action btn-edit" onclick="openEditDispositivoModal('${item.id}','${categoria}')" title="Editar" style="margin:0;padding:7px 10px">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteDispositivo('${item.id}','${categoria}')" title="Eliminar" style="margin:0;padding:7px 10px">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="it-item-body">${bodyHtml}</div>
            </div>`;
    });

    container.innerHTML = html + '</div>';
    if (searchTerm) {
        setTimeout(() => { const el = document.getElementById('itSearchInput'); if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);} }, 0);
    }
}

function handleITSearch(event, categoria, icon, label) {
    buildITContent(itItemsCache, categoria, icon, CAMPOS[categoria] || [], label, event.target.value);
}

// ============================================
// CONFIGURACIÓN DE CAMPOS POR CATEGORÍA
// ============================================
const CAMPOS = {
    equipo: [
        { key:'tipo',      label:'Tipo' },
        { key:'usuario',   label:'Usuario' },
        { key:'password',  label:'Contraseña', password:true },
        { key:'ip',        label:'IP' },
        { key:'anydesk_id',label:'AnyDesk ID' },
    ],
    servidor: [
        { key:'tipo',              label:'Tipo' },
        { key:'ip',                label:'IP' },
        { key:'usuario',           label:'Usuario' },
        { key:'password',          label:'Contraseña', password:true },
        { key:'sistema_operativo', label:'S.O.' },
    ],
    nas: [
        { key:'tipo',     label:'Tipo' },
        { key:'ip',       label:'IP' },
        { key:'usuario',  label:'Usuario' },
        { key:'password', label:'Contraseña', password:true },
        { key:'capacidad',label:'Capacidad' },
    ],
    red: [
        { key:'tipo',     label:'Tipo' },
        { key:'ip',       label:'IP' },
        { key:'usuario',  label:'Usuario' },
        { key:'password', label:'Contraseña', password:true },
        { key:'modelo',   label:'Modelo' },
    ],
    correo: [
        { key:'correo_cliente',   label:'Correo' },
        { key:'password_cliente', label:'Contraseña', password:true },
    ],
};

const ICONOS = {
    equipo:   'fa-desktop',
    servidor: 'fa-server',
    nas:      'fa-hdd',
    red:      'fa-network-wired',
    correo:   'fa-envelope',
};

function renderEquipos(id)    { renderDispositivos(id, 'equipo',   ICONOS.equipo,   CAMPOS.equipo); }
function renderServidores(id) { renderDispositivos(id, 'servidor', ICONOS.servidor, CAMPOS.servidor); }
function renderNAS(id)        { renderDispositivos(id, 'nas',      ICONOS.nas,      CAMPOS.nas); }
function renderRedes(id)      { renderDispositivos(id, 'red',      ICONOS.red,      CAMPOS.red); }
function renderCorreos(id)    { renderDispositivos(id, 'correo',   ICONOS.correo,   CAMPOS.correo); }
function renderOtros(id)      { renderDispositivos(id, 'otro',     'fa-boxes',      []); }

// ============================================
// AÑADIR DISPOSITIVO
// ============================================
function openAddDispositivoModal(categoria) {
    const labelMap = { equipo:'Equipo', servidor:'Servidor', nas:'NAS', red:'Dispositivo de Red', correo:'Correo', otro:'Elemento' };
    document.getElementById('itItemModalTitle').textContent = `Añadir ${labelMap[categoria] || categoria}`;
    document.getElementById('itItemModal').dataset.categoria = categoria;
    delete document.getElementById('itItemModal').dataset.editId;

    const sugerencias = (TIPO_SUGERENCIAS[categoria] || []).map(s => `<option value="${s}">`).join('');

    const camposEspecificos = {
        equipo: `
            <div class="form-group">
                <label>Número de Serie *</label>
                <input type="text" id="fi-serie" placeholder="Ej: SN-2024-ABC123" required>
            </div>
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.10"></div>
                <div class="form-group"><label>AnyDesk ID</label><input type="text" id="fi-anydesk" placeholder="123456789"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••"></div>
            </div>`,
        servidor: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.5"></div>
                <div class="form-group"><label>S.O.</label><input type="text" id="fi-so" placeholder="Windows Server 2022"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••"></div>
            </div>`,
        nas: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.20"></div>
                <div class="form-group"><label>Capacidad</label><input type="text" id="fi-capacidad" placeholder="4TB"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••"></div>
            </div>`,
        red: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.1"></div>
                <div class="form-group"><label>Modelo</label><input type="text" id="fi-modelo" placeholder="Cisco RV340"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••"></div>
            </div>`,
        correo: `
            <div class="form-group">
                <label>Nombre del cliente</label>
                <input type="text" id="fi-nombre-correo-cliente" placeholder="Juan García">
            </div>
            <div class="form-row">
                <div class="form-group"><label>Correo</label><input type="email" id="fi-correo-cliente" placeholder="juan@empresa.com"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password-correo-cliente" placeholder="••••••••"></div>
            </div>`,
    };

    const headerFields = categoria !== 'correo' ? `
        <div class="form-row">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="fi-nombre" placeholder="Nombre del dispositivo" required>
            </div>
            <div class="form-group">
                <label>Tipo</label>
                <input type="text" id="fi-tipo" placeholder="Selecciona o escribe..." list="fi-tipo-list">
                <datalist id="fi-tipo-list">${sugerencias}</datalist>
            </div>
        </div>` : `<input type="hidden" id="fi-nombre" value="correo">`;

    const modalBody = document.querySelector('#itItemModal .modal-body');
    modalBody.innerHTML = `
        <form id="itItemForm" onsubmit="return false;">
            ${headerFields}
            ${camposEspecificos[categoria] || ''}
            <div style="border-top:1px dashed #e2e8f0;margin:12px 0 14px;padding-top:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <label style="margin:0;font-weight:600;font-size:0.85rem;color:#475569">
                        <i class="fas fa-plus-circle" style="color:var(--primary);margin-right:5px"></i>Campos personalizados
                    </label>
                    <button type="button" onclick="addExtraFieldRow()" style="background:none;border:1px solid #e2e8f0;color:var(--primary);cursor:pointer;font-weight:600;font-size:0.8rem;padding:5px 10px;border-radius:6px;display:flex;align-items:center;gap:5px;font-family:inherit">
                        <i class="fas fa-plus"></i> Añadir
                    </button>
                </div>
                <div id="extraFieldsContainer"></div>
            </div>
        </form>`;

    document.getElementById('itItemModal').style.display = 'flex';
}

// ============================================
// EDITAR DISPOSITIVO
// ============================================
async function openEditDispositivoModal(itemId, categoria) {
    let allItems;
    try {
        allItems = await getDispositivos(currentCompanyId, categoria);
    } catch (e) {
        showToast('error', 'Error', 'No se pudo cargar el dispositivo');
        return;
    }
    const item = allItems.find(i => i.id === itemId);
    if (!item) { showToast('error', 'Error', 'Dispositivo no encontrado'); return; }

    const labelMap = { equipo:'Equipo', servidor:'Servidor', nas:'NAS', red:'Dispositivo de Red', correo:'Correo', otro:'Elemento' };
    document.getElementById('itItemModalTitle').textContent = `Editar ${labelMap[categoria] || categoria}`;
    document.getElementById('itItemModal').dataset.categoria = categoria;
    document.getElementById('itItemModal').dataset.editId = itemId;

    const sugerencias = (TIPO_SUGERENCIAS[categoria] || []).map(s => `<option value="${s}">`).join('');

    const camposEspecificos = {
        equipo: `
            <div class="form-group">
                <label>Número de Serie *</label>
                <input type="text" id="fi-serie" placeholder="Ej: SN-2024-ABC123" value="${item.numero_serie||''}">
            </div>
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.10" value="${item.ip||''}"></div>
                <div class="form-group"><label>AnyDesk ID</label><input type="text" id="fi-anydesk" placeholder="123456789" value="${item.anydesk_id||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin" value="${item.usuario||''}"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••" value="${item.password||''}"></div>
            </div>`,
        servidor: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.5" value="${item.ip||''}"></div>
                <div class="form-group"><label>S.O.</label><input type="text" id="fi-so" placeholder="Windows Server 2022" value="${item.sistema_operativo||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin" value="${item.usuario||''}"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••" value="${item.password||''}"></div>
            </div>`,
        nas: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.20" value="${item.ip||''}"></div>
                <div class="form-group"><label>Capacidad</label><input type="text" id="fi-capacidad" placeholder="4TB" value="${item.capacidad||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin" value="${item.usuario||''}"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••" value="${item.password||''}"></div>
            </div>`,
        red: `
            <div class="form-row">
                <div class="form-group"><label>IP</label><input type="text" id="fi-ip" placeholder="192.168.1.1" value="${item.ip||''}"></div>
                <div class="form-group"><label>Modelo</label><input type="text" id="fi-modelo" placeholder="Cisco RV340" value="${item.modelo||''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Usuario</label><input type="text" id="fi-usuario" placeholder="admin" value="${item.usuario||''}"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password" placeholder="••••••••" value="${item.password||''}"></div>
            </div>`,
        correo: `
            <div class="form-group">
                <label>Nombre del cliente</label>
                <input type="text" id="fi-nombre-correo-cliente" placeholder="Juan García" value="${item.nombre_cliente||''}">
            </div>
            <div class="form-row">
                <div class="form-group"><label>Correo</label><input type="email" id="fi-correo-cliente" placeholder="juan@empresa.com" value="${item.correo_cliente||''}"></div>
                <div class="form-group"><label>Contraseña</label><input type="text" id="fi-password-correo-cliente" placeholder="••••••••" value="${item.password_cliente||''}"></div>
            </div>`,
    };

    const extraEntries = Object.entries(item.campos_extra || {});
    const extraHtml = extraEntries.map(([k, v]) => `
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center">
            <input type="text" class="extra-key" value="${k}" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.88rem">
            <input type="text" class="extra-val" value="${v}" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.88rem">
            <button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2;color:#b91c1c;border:none;width:34px;height:34px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center">
                <i class="fas fa-times"></i>
            </button>
        </div>`).join('');

    const headerFields = categoria !== 'correo' ? `
        <div class="form-row">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="fi-nombre" placeholder="Nombre del dispositivo" value="${item.nombre||''}" required>
            </div>
            <div class="form-group">
                <label>Tipo</label>
                <input type="text" id="fi-tipo" placeholder="Selecciona o escribe..." list="fi-tipo-list" value="${item.tipo||''}">
                <datalist id="fi-tipo-list">${sugerencias}</datalist>
            </div>
        </div>` : `<input type="hidden" id="fi-nombre" value="${item.nombre||'correo'}">`;

    const modalBody = document.querySelector('#itItemModal .modal-body');
    modalBody.innerHTML = `
        <form id="itItemForm" onsubmit="return false;">
            ${headerFields}
            ${camposEspecificos[categoria] || ''}
            <div style="border-top:1px dashed #e2e8f0;margin:12px 0 14px;padding-top:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <label style="margin:0;font-weight:600;font-size:0.85rem;color:#475569">
                        <i class="fas fa-plus-circle" style="color:var(--primary);margin-right:5px"></i>Campos personalizados
                    </label>
                    <button type="button" onclick="addExtraFieldRow()" style="background:none;border:1px solid #e2e8f0;color:var(--primary);cursor:pointer;font-weight:600;font-size:0.8rem;padding:5px 10px;border-radius:6px;display:flex;align-items:center;gap:5px;font-family:inherit">
                        <i class="fas fa-plus"></i> Añadir
                    </button>
                </div>
                <div id="extraFieldsContainer">${extraHtml}</div>
            </div>
        </form>`;

    document.getElementById('itItemModal').style.display = 'flex';
}

function togglePassword(elementId, password) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const btn  = el.nextElementSibling;
    const icon = btn?.querySelector('i');
    if (el.classList.contains('password-hidden')) {
        el.textContent = password || '(vacío)';
        el.classList.replace('password-hidden', 'password-visible');
        if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        el.textContent = '••••••••';
        el.classList.replace('password-visible', 'password-hidden');
        if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

const TIPO_SUGERENCIAS = {
    equipo:   ['PC', 'Portátil', 'Cámara de Seguridad', 'Impresora', 'Tablet', 'All-in-One'],
    servidor: ['Servidor Físico', 'Servidor Virtual', 'Servidor de Archivos'],
    nas:      ['NAS Synology', 'NAS QNAP'],
    red:      ['Router', 'Switch', 'Access Point', 'Firewall', 'Modem'],
};

function addExtraFieldRow() {
    const container = document.getElementById('extraFieldsContainer');
    const div = document.createElement('div');
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
    div.innerHTML = `
        <input type="text" class="extra-key" placeholder="Campo" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.88rem">
        <input type="text" class="extra-val" placeholder="Valor" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.88rem">
        <button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2;color:#b91c1c;border:none;width:34px;height:34px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(div);
}

function closeITItemModal() { document.getElementById('itItemModal').style.display = 'none'; }

async function saveITItem() {
    const categoria = document.getElementById('itItemModal').dataset.categoria;
    const editId    = document.getElementById('itItemModal').dataset.editId || '';
    const nombre    = document.getElementById('fi-nombre')?.value?.trim();
    if (!nombre) { showToast('error', 'Error', 'El nombre es obligatorio'); return; }

    if (categoria === 'equipo') {
        const serie = document.getElementById('fi-serie')?.value?.trim();
        if (!serie) { showToast('error', 'Error', 'El número de serie es obligatorio'); return; }
    }

    const g = id => document.getElementById(id)?.value?.trim() || null;
    const campos_extra = {};
    document.querySelectorAll('#extraFieldsContainer > div').forEach(row => {
        const k = row.querySelector('.extra-key')?.value?.trim();
        const v = row.querySelector('.extra-val')?.value?.trim();
        if (k && v) campos_extra[k] = v;
    });

    const payload = {
        empresa_id:        currentCompanyId,
        categoria,
        nombre,
        tipo:              g('fi-tipo'),
        ip:                g('fi-ip'),
        numero_serie:      g('fi-serie'),
        usuario:           g('fi-usuario'),
        password:          g('fi-password'),
        anydesk_id:        g('fi-anydesk'),
        sistema_operativo: g('fi-so'),
        capacidad:         g('fi-capacidad'),
        modelo:            g('fi-modelo'),
        nombre_cliente:    g('fi-nombre-correo-cliente'),
        correo_cliente:    g('fi-correo-cliente'),
        password_cliente:  g('fi-password-correo-cliente'),
        campos_extra:      Object.keys(campos_extra).length ? campos_extra : {},
    };

    showLoading(true);
    try {
        if (editId) {
            await apiFetch(`/api/dispositivos/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('success', 'Actualizado', 'Dispositivo actualizado correctamente');
        } else {
            await apiFetch('/api/dispositivos', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Guardado', 'Dispositivo añadido correctamente');
        }
        closeITItemModal();
        refreshCurrentITTab();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

function refreshCurrentITTab() {
    const activeTab = document.querySelector('#itTabsPage .it-tab.active')?.dataset?.tab;
    const map = {
        equipos:    renderEquipos,
        servidores: renderServidores,
        nas:        renderNAS,
        redes:      renderRedes,
        correos:    renderCorreos,
        otros:      renderOtros,
    };
    if (activeTab && map[activeTab]) map[activeTab](currentCompanyId);
}

async function deleteDispositivo(id, categoria) {
    if (!confirm('¿Eliminar este dispositivo?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/dispositivos/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Dispositivo eliminado');
        refreshCurrentITTab();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

// ============================================
// UTILS
// ============================================
function showLoading(show) {
    document.body.style.cursor = show ? 'wait' : 'default';
}

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success:'check-circle', error:'times-circle', warning:'exclamation-circle', info:'info-circle' };
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>

        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('searchInput').addEventListener('input',   () => { currentPage = 1; renderCompanies(); });
document.getElementById('statusFilter').addEventListener('change', () => { currentPage = 1; renderCompanies(); });
document.getElementById('serviceFilter').addEventListener('change',() => { currentPage = 1; renderCompanies(); });

document.getElementById('addCompanyBtn').addEventListener('click', () => openCompanyModal());
// document.getElementById('addContractBtn').addEventListener('click', openContractModal); // DESACTIVADO — Contratos
// document.getElementById('addInvoiceBtn').addEventListener('click',  openInvoiceModal);  // DESACTIVADO — Facturas
document.getElementById('addTicketBtn').addEventListener('click',   openTicketModal);

// Cerrar modal al hacer clic en el fondo
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

// ============================================
// USUARIOS — CRUD (solo admin)
// ============================================
let usuarios = [];

async function loadUsuarios() {
    if (!isAdmin()) return;
    usuarios = await apiFetch('/api/usuarios');
    renderUsuarios();
}

function renderUsuarios() {
    const table = document.getElementById('usersTable');
    const cards = document.getElementById('usersCards');

    document.getElementById('totalUsuarios').textContent    = usuarios.length;
    document.getElementById('totalAdmins').textContent      = usuarios.filter(u => u.rol === 'admin').length;
    document.getElementById('totalTrabajadores').textContent = usuarios.filter(u => u.rol === 'trabajador').length;

    if (!usuarios.length) {
        if (table) table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--gray)">Sin usuarios registrados</td></tr>`;
        return;
    }

    const myId = sessionStorage.getItem('hola_id') || '';

    if (table) {
        table.innerHTML = usuarios.map(u => `
            <tr>
                <td><strong>${u.nombre}</strong>${u.id === myId ? ' <span style="font-size:0.72rem;background:#dbeafe;color:#2563eb;padding:2px 7px;border-radius:10px">Tú</span>' : ''}</td>
                <td>${u.email}</td>
                <td><span class="status" style="${u.rol === 'admin' ? 'background:#f3e8ff;color:#9333ea' : 'background:#dcfce7;color:#15803d'}">${u.rol === 'admin' ? 'Admin' : 'Trabajador'}</span></td>
                <td><span class="status ${u.activo ? 'Activo' : 'Suspendido'}">${u.activo ? 'Activo' : 'Desactivado'}</span></td>
                <td>${formatDate(u.created_at)}</td>
                <td>
                    <button class="btn-action btn-edit"   onclick="editUser('${u.id}')"   title="Editar"><i class="fas fa-edit"></i></button>
                    ${u.id !== myId ? `<button class="btn-action btn-delete" onclick="deleteUser('${u.id}','${u.nombre}')" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>`).join('');
    }

    if (cards) {
        cards.innerHTML = usuarios.map(u => `
            <div class="data-card">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${u.nombre}${u.id === myId ? ' <span style="font-size:0.72rem;background:#dbeafe;color:#2563eb;padding:2px 7px;border-radius:10px">Tú</span>' : ''}</div>
                        <div class="data-card-subtitle">${u.email}</div>
                    </div>
                    <span class="status ${u.activo ? 'Activo' : 'Suspendido'}">${u.activo ? 'Activo' : 'Desactivado'}</span>
                </div>
                <div class="data-card-meta">
                    <span><i class="fas fa-user-tag"></i> ${u.rol === 'admin' ? 'Administrador' : 'Trabajador'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(u.created_at)}</span>
                </div>
                <div class="data-card-actions">
                    <button class="btn-action btn-edit" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i> Editar</button>
                    ${u.id !== myId ? `<button class="btn-action btn-delete" onclick="deleteUser('${u.id}','${u.nombre}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>`).join('');
    }
}

function openUserModal() {
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('editUserId').value = '';
    document.getElementById('userNombre').value = '';
    document.getElementById('userEmail').value  = '';
    document.getElementById('userRol').value    = 'trabajador';
    document.getElementById('userEmailGroup').style.display  = '';
    document.getElementById('userActivoGroup').style.display = 'none';
    document.getElementById('userPasswordInfo').style.display = 'none';
    document.getElementById('userModal').style.display = 'flex';
}

function editUser(id) {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    document.getElementById('userModalTitle').textContent    = 'Editar Usuario';
    document.getElementById('editUserId').value              = u.id;
    document.getElementById('userNombre').value              = u.nombre;
    document.getElementById('userEmail').value               = u.email;
    document.getElementById('userRol').value                 = u.rol;
    document.getElementById('userActivo').value              = String(u.activo);
    document.getElementById('userEmailGroup').style.display  = 'none'; // no se puede cambiar el email
    document.getElementById('userActivoGroup').style.display = '';
    document.getElementById('userPasswordInfo').style.display = 'none';
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function saveUser() {
    const id     = document.getElementById('editUserId').value;
    const nombre = document.getElementById('userNombre').value.trim();
    const email  = document.getElementById('userEmail').value.trim();
    const rol    = document.getElementById('userRol').value;
    const activo = document.getElementById('userActivo').value === 'true';

    if (!nombre || (!id && !email)) {
        showToast('error', 'Error', 'Nombre y email son obligatorios');
        return;
    }

    showLoading(true);
    try {
        if (id) {
            // Editar
            await apiFetch(`/api/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nombre, rol, activo })
            });
            showToast('success', 'Actualizado', 'Usuario actualizado correctamente');
            closeUserModal();
        } else {
            // Crear — el backend devuelve _tempPassword
            const res = await apiFetch('/api/usuarios', {
                method: 'POST',
                body: JSON.stringify({ nombre, email, rol })
            });

            // Mostrar contraseña generada en el modal antes de cerrar
            document.getElementById('userPasswordText').textContent = res._tempPassword || '(ver email)';
            document.getElementById('userPasswordInfo').style.display = '';
            document.getElementById('userEmailGroup').style.display  = 'none';
            document.getElementById('userNombre').disabled = true;
            document.getElementById('userRol').disabled    = true;

            // Cambiar botón de guardar a cerrar
            showToast('success', 'Creado', `Usuario creado. Contraseña enviada a ${email}`);
        }
        await loadUsuarios();
    } catch (e) {
        showToast('error', 'Error', e.message);
    } finally {
        showLoading(false);
    }
}

async function deleteUser(id, nombre) {
    if (!confirm(`¿Eliminar el usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    showLoading(true);
    try {
        await apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', `Usuario ${nombre} eliminado`);
        await loadUsuarios();
    } catch (e) {
        showToast('error', 'Error', e.message);
    } finally {
        showLoading(false);
    }
}