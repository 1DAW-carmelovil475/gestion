// ============================================
// HOLA INFORMÁTICA — GESTIÓN FRONTEND
// config.js debe cargarse antes que este archivo
// xlsx se carga globalmente desde CDN en el HTML
// ============================================



let companies  = [];
let contracts  = [];
let invoices   = [];
let tickets    = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentCompanyId = null;

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
        await Promise.all([loadEmpresas(), loadContratos(), loadFacturas(), loadTickets()]);
        renderCompanies();
        renderContracts();
        renderInvoices();
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
async function loadContratos() { contracts = await apiFetch('/api/contratos'); }
async function loadFacturas()  { invoices  = await apiFetch('/api/facturas'); }
async function loadTickets()   { tickets   = await apiFetch('/api/tickets'); }

// ============================================
// NAVEGACIÓN
// ============================================
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });
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
    const table       = document.getElementById('companyTable');
    const searchTerm  = (document.getElementById('searchInput').value || '').toLowerCase();
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

    if (!paginated.length) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray)">
            <i class="fas fa-search" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px"></i>
            No se encontraron empresas</td></tr>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    table.innerHTML = paginated.map(c => `
        <tr>
            <td onclick="viewCompany('${c.id}')"><strong>${c.nombre}</strong></td>
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
// RENDERIZADO — CONTRATOS
// ============================================
function renderContracts() {
    const table = document.getElementById('contractsTable');
    if (!contracts.length) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">Sin contratos registrados</td></tr>`;
        updateContractStats();
        return;
    }
    table.innerHTML = contracts.map(c => `
        <tr>
            <td><strong>${c.empresas?.nombre || '—'}</strong></td>
            <td>${c.tipo}</td>
            <td>${formatDate(c.fecha_inicio)}</td>
            <td>${formatDate(c.fecha_fin)}</td>
            <td><strong>${parseFloat(c.valor || 0).toLocaleString('es-ES')}€</strong></td>
            <td><span class="status ${(c.estado||'').replace(/ /g,'-')}">${c.estado}</span></td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteContract('${c.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`).join('');
    updateContractStats();
}

// ============================================
// RENDERIZADO — FACTURAS
// ============================================
function renderInvoices() {
    const table = document.getElementById('invoicesTable');
    if (!invoices.length) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--gray)">Sin facturas registradas</td></tr>`;
        updateInvoiceStats();
        return;
    }
    table.innerHTML = invoices.map(f => `
        <tr>
            <td><strong>${f.numero}</strong></td>
            <td>${f.empresas?.nombre || '—'}</td>
            <td>${formatDate(f.fecha)}</td>
            <td><strong>${parseFloat(f.importe || 0).toFixed(2)}€</strong></td>
            <td><span class="status ${f.estado}">${f.estado}</span></td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteInvoice('${f.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`).join('');
    updateInvoiceStats();
}

// ============================================
// RENDERIZADO — TICKETS
// ============================================
function renderTickets() {
    const table = document.getElementById('ticketsTable');
    if (!tickets.length) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">Sin tickets registrados</td></tr>`;
        updateTicketStats();
        return;
    }
    table.innerHTML = tickets.map(t => `
        <tr>
            <td><strong>#${(t.id || '').substring(0,8)}</strong></td>
            <td>${t.empresas?.nombre || '—'}</td>
            <td>${t.asunto}</td>
            <td><span class="status Prioridad-${t.prioridad}">${t.prioridad}</span></td>
            <td><span class="status ${(t.estado||'').replace(/ /g,'-')}">${t.estado}</span></td>
            <td>${formatDate(t.created_at)}</td>
            <td>
                <button class="btn-action btn-edit"   onclick="changeTicketStatus('${t.id}','${t.estado}')" title="Cambiar estado"><i class="fas fa-exchange-alt"></i></button>
                <button class="btn-action btn-delete" onclick="deleteTicket('${t.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    updateTicketStats();
}

// ============================================
// ESTADÍSTICAS
// ============================================
function updateStats() {
    document.getElementById('totalEmpresas').textContent   = companies.length;
    document.getElementById('empresasActivas').textContent = companies.filter(c => c.estado === 'Activo').length;
}

function updateContractStats() {
    document.getElementById('totalContratos').textContent   = contracts.length;
    document.getElementById('contratosActivos').textContent = contracts.filter(c => c.estado === 'Activo').length;
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    document.getElementById('contratosPorVencer').textContent = contracts.filter(c =>
        c.estado === 'Activo' && new Date(c.fecha_fin) <= d30).length;
    const total = contracts.reduce((s, c) => s + parseFloat(c.valor || 0), 0);
    document.getElementById('facturacionTotal').textContent = total.toLocaleString('es-ES') + '€';
}

function updateInvoiceStats() {
    document.getElementById('totalFacturas').textContent      = invoices.length;
    document.getElementById('facturasPagadas').textContent    = invoices.filter(i => i.estado === 'Pagada').length;
    document.getElementById('facturasPendientes').textContent = invoices.filter(i => i.estado === 'Pendiente').length;
    document.getElementById('facturasVencidas').textContent   = invoices.filter(i => i.estado === 'Vencida').length;
}

function updateTicketStats() {
    document.getElementById('totalTickets').textContent    = tickets.length;
    document.getElementById('ticketsAbiertos').textContent = tickets.filter(t => t.estado === 'Abierto').length;
    document.getElementById('ticketsCerrados').textContent = tickets.filter(t => t.estado === 'Cerrado').length;
    document.getElementById('ticketsUrgentes').textContent = tickets.filter(t => t.prioridad === 'Urgente' && t.estado !== 'Cerrado').length;
}

// ============================================
// EXPORTAR EXCEL
// ============================================
function exportToExcel() {
    if (!companies || companies.length === 0) {
        showToast('warning', 'Sin datos', 'No hay empresas para exportar');
        return;
    }

    const data = companies.map(c => ({
        Nombre: c.nombre || '',
        CIF: c.cif || '',
        Email: c.email || '',
        Teléfono: c.telefono || '',
        Dirección: c.direccion || '',
        Estado: c.estado || '',
        Servicios: Array.isArray(c.servicios)
            ? c.servicios.join(', ')
            : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");

    const wbout = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
    });

    const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Exportado', `${companies.length} empresas exportadas`);
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

    // Reset pestañas a la primera
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
            showToast('success', 'Actualizado', 'Empresa actualizada correctamente');
        } else {
            await apiFetch('/api/empresas', { method: 'POST', body: JSON.stringify(payload) });
            showToast('success', 'Creado', 'Empresa creada correctamente');
        }
        closeCompanyModal();
        await loadEmpresas();
        renderCompanies();
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
// CONTRATOS — CRUD
// ============================================
function openContractModal() {
    document.getElementById('contractCompany').innerHTML =
        companies.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    const next  = new Date(); next.setFullYear(next.getFullYear() + 1);
    document.getElementById('contractStart').value  = today;
    document.getElementById('contractEnd').value    = next.toISOString().split('T')[0];
    document.getElementById('contractValue').value  = '';
    document.getElementById('contractNotes').value  = '';
    document.getElementById('contractModal').style.display = 'flex';
}

function closeContractModal() {
    document.getElementById('contractModal').style.display = 'none';
}

async function saveContract() {
    const empresa_id   = document.getElementById('contractCompany').value;
    const tipo         = document.getElementById('contractType').value;
    const fecha_inicio = document.getElementById('contractStart').value;
    const fecha_fin    = document.getElementById('contractEnd').value;
    const valor        = parseFloat(document.getElementById('contractValue').value);

    if (!empresa_id || !tipo || !fecha_inicio || !fecha_fin || isNaN(valor)) {
        showToast('error', 'Error', 'Completa todos los campos obligatorios'); return;
    }

    showLoading(true);
    try {
        await apiFetch('/api/contratos', {
            method: 'POST',
            body: JSON.stringify({
                empresa_id, tipo, fecha_inicio, fecha_fin, valor, estado: 'Activo',
                notas: document.getElementById('contractNotes').value || null,
            })
        });
        showToast('success', 'Creado', 'Contrato creado correctamente');
        closeContractModal();
        await loadContratos();
        renderContracts();
    } catch (e) {
        showToast('error', 'Error', e.message);
    } finally {
        showLoading(false);
    }
}

async function deleteContract(id) {
    if (!confirm('¿Eliminar este contrato?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/contratos/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Contrato eliminado');
        await loadContratos();
        renderContracts();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

// ============================================
// FACTURAS — CRUD
// ============================================
function openInvoiceModal() {
    document.getElementById('invoiceCompany').innerHTML =
        companies.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    const t30 = new Date(); t30.setDate(t30.getDate() + 30);
    document.getElementById('invoiceNumber').value  = '';
    document.getElementById('invoiceAmount').value  = '';
    document.getElementById('invoiceDate').value    = today;
    document.getElementById('invoiceDueDate').value = t30.toISOString().split('T')[0];
    document.getElementById('invoiceStatus').value  = 'Pendiente';
    document.getElementById('invoiceModal').style.display = 'flex';
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').style.display = 'none';
}

async function saveInvoice() {
    const numero    = document.getElementById('invoiceNumber').value.trim();
    const empresa_id= document.getElementById('invoiceCompany').value;
    const fecha     = document.getElementById('invoiceDate').value;
    const fecha_vencimiento = document.getElementById('invoiceDueDate').value;
    const importe   = parseFloat(document.getElementById('invoiceAmount').value);

    if (!numero || !empresa_id || !fecha || !fecha_vencimiento || isNaN(importe)) {
        showToast('error', 'Error', 'Completa todos los campos obligatorios'); return;
    }

    showLoading(true);
    try {
        await apiFetch('/api/facturas', {
            method: 'POST',
            body: JSON.stringify({
                numero, empresa_id, fecha, fecha_vencimiento, importe,
                estado: document.getElementById('invoiceStatus').value,
            })
        });
        showToast('success', 'Creada', 'Factura creada correctamente');
        closeInvoiceModal();
        await loadFacturas();
        renderInvoices();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

async function deleteInvoice(id) {
    if (!confirm('¿Eliminar esta factura?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/facturas/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Factura eliminada');
        await loadFacturas();
        renderInvoices();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

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

function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
}

async function saveTicket() {
    const empresa_id = document.getElementById('ticketCompany').value;
    const asunto     = document.getElementById('ticketSubject').value.trim();
    if (!empresa_id || !asunto) { showToast('error', 'Error', 'Empresa y asunto son obligatorios'); return; }

    showLoading(true);
    try {
        await apiFetch('/api/tickets', {
            method: 'POST',
            body: JSON.stringify({
                empresa_id, asunto,
                descripcion: document.getElementById('ticketDescription').value || null,
                prioridad:   document.getElementById('ticketPriority').value,
                estado:      document.getElementById('ticketStatus').value,
            })
        });
        showToast('success', 'Creado', 'Ticket creado correctamente');
        closeTicketModal();
        await loadTickets();
        renderTickets();
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
        await loadTickets();
        renderTickets();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

async function deleteTicket(id) {
    if (!confirm('¿Eliminar este ticket?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Ticket eliminado');
        await loadTickets();
        renderTickets();
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

// ============================================
// INFRAESTRUCTURA IT
// ============================================
function viewCompany(id) {
    currentCompanyId = id;
    const company = companies.find(c => c.id === id);
    if (!company) return;

    document.getElementById('itModalCompanyName').textContent = `🖥️ ${company.nombre}`;
    document.getElementById('itInfraModal').style.display = 'flex';
    document.querySelectorAll('.it-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.it-tab[data-tab="equipos"]').classList.add('active');
    renderEquipos(id);
}

function closeITModal() {
    document.getElementById('itInfraModal').style.display = 'none';
    currentCompanyId = null;
}

function setupITTabs() {
    document.querySelectorAll('.it-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.it-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            if (!currentCompanyId) return;
            const map = {
                equipos:    () => renderEquipos(currentCompanyId),
                servidores: () => renderServidores(currentCompanyId),
                nas:        () => renderNAS(currentCompanyId),
                redes:      () => renderRedes(currentCompanyId),
                licencias:  () => renderLicencias(currentCompanyId),
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
    catch (e) { container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> ${e.message}</div>`; return; }

    const labelMap = { equipo: 'Equipo', servidor: 'Servidor', nas: 'NAS', red: 'Dispositivo de Red', licencia: 'Licencia' };
    const label = labelMap[categoria] || categoria;

    if (!items.length) {
        container.innerHTML = `
            <div style="text-align:center;padding:50px 20px;color:var(--gray)">
                <i class="fas ${icon}" style="font-size:3rem;opacity:0.25;display:block;margin-bottom:16px"></i>
                <p style="font-size:1.1rem;font-weight:500;margin-bottom:20px">No hay ${label}s registrados</p>
                <button class="btn-primary" onclick="openAddDispositivoModal('${categoria}')">
                    <i class="fas fa-plus"></i> Añadir ${label}
                </button>
            </div>`;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h3 style="font-size:1.05rem;color:var(--dark);display:flex;align-items:center;gap:8px">
                <i class="fas ${icon}" style="color:var(--primary)"></i> ${label}s
                <span style="background:#e0f2fe;color:#0369a1;padding:2px 10px;border-radius:20px;font-size:0.8rem;font-weight:600">${items.length}</span>
            </h3>
            <button class="btn-primary" onclick="openAddDispositivoModal('${categoria}')">
                <i class="fas fa-plus"></i> Añadir
            </button>
        </div>
        <div class="it-items-grid">`;

    items.forEach(item => {
        const extra = item.campos_extra || {};
        let bodyHtml = fields.map(f => {
            const val = item[f.key];
            if (f.password) return `
                <div class="it-item-row">
                    <span class="it-label">${f.label}:</span>
                    <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
                        <span id="pwd-${f.key}-${item.id}" class="password-hidden">••••••••</span>
                        <button class="btn-icon" onclick="togglePassword('pwd-${f.key}-${item.id}', \`${(val||'').replace(/`/g,'\\`').replace(/\$/g,'\\$')}\`)">
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

        html += `
            <div class="it-item-card">
                <div class="it-item-header">
                    <h4><i class="fas ${icon}"></i> ${item.nombre}${item.tipo ? ` <small style="font-weight:400;opacity:0.65;font-size:0.85rem">(${item.tipo})</small>` : ''}</h4>
                    <button class="btn-action btn-delete" onclick="deleteDispositivo('${item.id}','${categoria}')" title="Eliminar" style="margin:0">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="it-item-body">${bodyHtml}</div>
            </div>`;
    });

    container.innerHTML = html + '</div>';
}

const CAMPOS = {
    equipo:   [
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
    licencia: [
        { key:'tipo',           label:'Tipo' },
        { key:'software',       label:'Software' },
        { key:'num_usuarios',   label:'Usuarios' },
        { key:'vencimiento',    label:'Vencimiento' },
        { key:'clave_licencia', label:'Clave', password:true },
    ],
};

const ICONOS = { equipo:'fa-desktop', servidor:'fa-server', nas:'fa-hdd', red:'fa-network-wired', licencia:'fa-key' };

function renderEquipos(id)    { renderDispositivos(id, 'equipo',   ICONOS.equipo,   CAMPOS.equipo); }
function renderServidores(id) { renderDispositivos(id, 'servidor', ICONOS.servidor, CAMPOS.servidor); }
function renderNAS(id)        { renderDispositivos(id, 'nas',      ICONOS.nas,      CAMPOS.nas); }
function renderRedes(id)      { renderDispositivos(id, 'red',      ICONOS.red,      CAMPOS.red); }
function renderLicencias(id)  { renderDispositivos(id, 'licencia', ICONOS.licencia, CAMPOS.licencia); }

function togglePassword(elementId, password) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const btn  = el.nextElementSibling;
    const icon = btn?.querySelector('i');
    if (el.classList.contains('password-hidden')) {
        el.textContent = password || '(vacío)';
        el.classList.replace('password-hidden', 'password-visible');
        if (icon) { icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    } else {
        el.textContent = '••••••••';
        el.classList.replace('password-visible', 'password-hidden');
        if (icon) { icon.classList.replace('fa-eye-slash', 'fa-eye'); }
    }
}

const TIPO_SUGERENCIAS = {
    equipo:   ['PC', 'Portátil', 'Cámara de Seguridad', 'Impresora', 'Tablet', 'All-in-One'],
    servidor: ['Servidor Físico', 'Servidor Virtual', 'Servidor de Archivos'],
    nas:      ['NAS Synology', 'NAS QNAP'],
    red:      ['Router', 'Switch', 'Access Point', 'Firewall', 'Modem'],
    licencia: ['Microsoft', 'Adobe', 'Antivirus', 'ERP', 'CRM'],
};

function openAddDispositivoModal(categoria) {
    const labelMap = { equipo:'Equipo', servidor:'Servidor', nas:'NAS', red:'Dispositivo de Red', licencia:'Licencia' };
    document.getElementById('itItemModalTitle').textContent = `Añadir ${labelMap[categoria] || categoria}`;
    document.getElementById('itItemModal').dataset.categoria = categoria;

    const sugerencias = (TIPO_SUGERENCIAS[categoria] || []).map(s => `<option value="${s}">`).join('');

    const camposEspecificos = {
        equipo: `
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
        licencia: `
            <div class="form-row">
                <div class="form-group"><label>Software</label><input type="text" id="fi-software" placeholder="Microsoft 365 Business"></div>
                <div class="form-group"><label>Nº Usuarios</label><input type="number" id="fi-num-usuarios" placeholder="15"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Vencimiento</label><input type="date" id="fi-vencimiento"></div>
                <div class="form-group"><label>Clave de Licencia</label><input type="text" id="fi-clave" placeholder="XXXXX-XXXXX-XXXXX"></div>
            </div>`,
    };

    // FIX: el formulario va dentro de .modal-body para scroll correcto
    const modalBody = document.querySelector('#itItemModal .modal-body');
    modalBody.innerHTML = `
        <form id="itItemForm" onsubmit="return false;">
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
            </div>
            ${camposEspecificos[categoria] || ''}
            <div style="border-top:1px dashed #e2e8f0;margin:12px 0 14px;padding-top:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <label style="margin:0;font-weight:600;font-size:0.88rem;color:#475569">
                        <i class="fas fa-plus-circle" style="color:var(--primary);margin-right:5px"></i>Campos personalizados
                    </label>
                    <button type="button" onclick="addExtraFieldRow()" style="background:none;border:1px solid #e2e8f0;color:var(--primary);cursor:pointer;font-weight:600;font-size:0.82rem;padding:5px 10px;border-radius:6px;display:flex;align-items:center;gap:5px">
                        <i class="fas fa-plus"></i> Añadir campo
                    </button>
                </div>
                <div id="extraFieldsContainer"></div>
            </div>
        </form>`;

    document.getElementById('itItemModal').style.display = 'flex';
}

function addExtraFieldRow() {
    const container = document.getElementById('extraFieldsContainer');
    const div = document.createElement('div');
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
    div.innerHTML = `
        <input type="text" class="extra-key" placeholder="Nombre del campo" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.9rem">
        <input type="text" class="extra-val" placeholder="Valor" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.9rem">
        <button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2;color:#b91c1c;border:none;width:34px;height:34px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(div);
}

function closeITItemModal() {
    document.getElementById('itItemModal').style.display = 'none';
}

async function saveITItem() {
    const categoria = document.getElementById('itItemModal').dataset.categoria;
    const nombre    = document.getElementById('fi-nombre')?.value?.trim();
    if (!nombre) { showToast('error', 'Error', 'El nombre es obligatorio'); return; }

    const g = id => document.getElementById(id)?.value?.trim() || null;

    const campos_extra = {};
    document.querySelectorAll('#extraFieldsContainer > div').forEach(row => {
        const k = row.querySelector('.extra-key')?.value?.trim();
        const v = row.querySelector('.extra-val')?.value?.trim();
        if (k && v) campos_extra[k] = v;
    });

    const payload = {
        empresa_id: currentCompanyId,
        categoria, nombre,
        tipo:              g('fi-tipo'),
        ip:                g('fi-ip'),
        usuario:           g('fi-usuario'),
        password:          g('fi-password'),
        anydesk_id:        g('fi-anydesk'),
        sistema_operativo: g('fi-so'),
        capacidad:         g('fi-capacidad'),
        modelo:            g('fi-modelo'),
        software:          g('fi-software'),
        num_usuarios:      g('fi-num-usuarios') ? parseInt(g('fi-num-usuarios')) : null,
        vencimiento:       g('fi-vencimiento'),
        clave_licencia:    g('fi-clave'),
        campos_extra:      Object.keys(campos_extra).length ? campos_extra : {},
    };

    showLoading(true);
    try {
        await apiFetch('/api/dispositivos', { method: 'POST', body: JSON.stringify(payload) });
        showToast('success', 'Guardado', 'Dispositivo añadido correctamente');
        closeITItemModal();
        const activeTab = document.querySelector('.it-tab.active')?.dataset?.tab;
        const map = { equipos: renderEquipos, servidores: renderServidores, nas: renderNAS, redes: renderRedes, licencias: renderLicencias };
        if (activeTab && map[activeTab]) map[activeTab](currentCompanyId);
    } catch (e) { showToast('error', 'Error', e.message); }
    finally { showLoading(false); }
}

async function deleteDispositivo(id, categoria) {
    if (!confirm('¿Eliminar este dispositivo?')) return;
    showLoading(true);
    try {
        await apiFetch(`/api/dispositivos/${id}`, { method: 'DELETE' });
        showToast('success', 'Eliminado', 'Dispositivo eliminado');
        const activeTab = document.querySelector('.it-tab.active')?.dataset?.tab;
        const map = { equipos: renderEquipos, servidores: renderServidores, nas: renderNAS, redes: renderRedes, licencias: renderLicencias };
        if (activeTab && map[activeTab]) map[activeTab](currentCompanyId);
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
document.getElementById('searchInput').addEventListener('input',  () => { currentPage = 1; renderCompanies(); });
document.getElementById('statusFilter').addEventListener('change', () => { currentPage = 1; renderCompanies(); });
document.getElementById('serviceFilter').addEventListener('change',() => { currentPage = 1; renderCompanies(); });

document.getElementById('addCompanyBtn').addEventListener('click',  () => openCompanyModal());
document.getElementById('addContractBtn').addEventListener('click', openContractModal);
document.getElementById('addInvoiceBtn').addEventListener('click',  openInvoiceModal);
document.getElementById('addTicketBtn').addEventListener('click',   openTicketModal);

// Cerrar modal al hacer clic en el fondo
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});