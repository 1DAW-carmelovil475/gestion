// ============================================
// TICKETS V2 — FRONTEND JS
// ============================================

'use strict';

// Estado global
let todosLosTickets = [];
let operarios = [];
let empresas = [];
let ticketActual = null;
let currentUserId = null;
let tipoMensajeActual = 'mensaje';
let archivosChatPendientes = [];
let historialAbierto = false;

// Colores para avatares
const AVATAR_COLORS = ['#0066ff','#16a34a','#d97706','#dc2626','#9333ea','#0891b2','#be185d','#065f46'];

function getAvatarColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!sessionStorage.getItem('hola_token')) {
        window.location.replace('./index.html');
        return;
    }

    const me = await initUserSession();
    if (!me) return;
    currentUserId = me.id;

    // Cargar datos iniciales en paralelo
    await Promise.all([
        cargarEmpresas(),
        cargarOperarios(),
    ]);

    await cargarTickets();
    await cargarStats();

    // Búsqueda con debounce
    const searchInput = document.getElementById('searchTicket');
    let searchTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(cargarTickets, 400);
    });

    // Valor de hoy en filtro hasta por defecto (no preseleccionado, solo disponible)
    document.getElementById('horasFecha').valueAsDate = new Date();
});

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarEmpresas() {
    try {
        empresas = await apiFetch('/api/empresas');
        // Poblar select empresa en modal
        const selEmpresa = document.getElementById('ticketEmpresa');
        const selFiltro = document.getElementById('filtroEmpresa');

        empresas.forEach(e => {
            selEmpresa.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
            selFiltro.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
        });
    } catch (err) {
        console.error('Error cargando empresas:', err);
    }
}

async function cargarOperarios() {
    try {
        operarios = await apiFetch('/api/v2/operarios');
        const selFiltro = document.getElementById('filtroOperario');

        operarios.forEach(op => {
            selFiltro.innerHTML += `<option value="${op.id}">${op.nombre}</option>`;
        });

        renderOperariosCheckboxes('operariosCheckboxes', []);
    } catch (err) {
        console.error('Error cargando operarios:', err);
    }
}

async function cargarDispositivosEmpresa() {
    const empresaId = document.getElementById('ticketEmpresa').value;
    const sel = document.getElementById('ticketDispositivo');
    sel.innerHTML = '<option value="">Sin dispositivo</option>';

    if (!empresaId) return;
    try {
        const dispositivos = await apiFetch(`/api/dispositivos?empresa_id=${empresaId}`);
        dispositivos.forEach(d => {
            sel.innerHTML += `<option value="${d.id}">[${d.tipo || d.categoria}] ${d.nombre}</option>`;
        });
    } catch (err) {
        console.error('Error cargando dispositivos:', err);
    }
}

async function cargarTickets() {
    const params = new URLSearchParams();
    const estado = document.getElementById('filtroEstado').value;
    const prioridad = document.getElementById('filtroPrioridad').value;
    const operario = document.getElementById('filtroOperario').value;
    const empresa = document.getElementById('filtroEmpresa').value;
    const orden = document.getElementById('filtroOrden').value;
    const search = document.getElementById('searchTicket').value;
    const desde = document.getElementById('filtroDesde').value;
    const hasta = document.getElementById('filtroHasta').value;

    // "abiertos" es un valor especial que filtramos en frontend
    if (estado !== 'all' && estado !== 'abiertos') params.set('estado', estado);
    if (prioridad !== 'all') params.set('prioridad', prioridad);
    if (operario !== 'all') params.set('operario_id', operario);
    if (empresa !== 'all') params.set('empresa_id', empresa);
    if (orden) params.set('orden', orden);
    if (search) params.set('search', search);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);

    try {
        let tickets = await apiFetch(`/api/v2/tickets?${params}`);

        // Filtro "abiertos" en frontend
        if (estado === 'abiertos') {
            tickets = tickets.filter(t => t.estado === 'Pendiente' || t.estado === 'En curso');
        }

        todosLosTickets = tickets;
        document.getElementById('totalFiltrado').textContent = `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;

        renderTablaTickets(tickets);
        renderCardsTickets(tickets);
    } catch (err) {
        console.error('Error cargando tickets:', err);
        showToast('Error', 'No se pudieron cargar los tickets', 'error');
    }
}

async function cargarStats() {
    try {
        const data = await apiFetch('/api/v2/estadisticas/resumen');
        document.getElementById('statTotal').textContent = data.total;
        document.getElementById('statPendientes').textContent = data.pendientes;
        document.getElementById('statEnCurso').textContent = data.en_curso;
        document.getElementById('statCompletados').textContent = data.completados;
        document.getElementById('statFacturados').textContent = data.facturados;
        document.getElementById('statUrgentes').textContent = data.urgentes;
    } catch (err) {
        console.error('Error cargando stats:', err);
    }
}

// ============================================
// RENDER TABLA (desktop)
// ============================================
function renderTablaTickets(tickets) {
    const tbody = document.getElementById('ticketsTableBody');

    if (!tickets.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">
            <i class="fas fa-inbox" style="display:block;font-size:2rem;color:#cbd5e1;margin-bottom:12px"></i>
            No hay tickets con los filtros actuales
        </td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => {
        const asignados = t.ticket_asignaciones || [];
        const avatares = asignados.map((a, i) => {
            const nombre = a.profiles?.nombre || '?';
            const color = getAvatarColor(a.user_id);
            return `<div class="avatar-operario" style="background:${color}" title="${nombre}">${getInitials(nombre)}</div>`;
        }).join('');

        return `<tr onclick="abrirTicket('${t.id}')" style="cursor:pointer">
            <td><span class="ticket-numero">#${t.numero}</span></td>
            <td>${t.empresas?.nombre || '—'}</td>
            <td>
                <div class="ticket-asunto-cell">
                    <span class="ticket-asunto-text">${escHtml(t.asunto)}</span>
                    ${t.dispositivos ? `<span class="ticket-empresa-sub"><i class="fas fa-desktop" style="font-size:0.7rem"></i> ${escHtml(t.dispositivos.nombre)}</span>` : ''}
                </div>
            </td>
            <td>
                <div class="avatares-operarios">${avatares || '<span style="color:var(--gray);font-size:0.8rem">Sin asignar</span>'}</div>
            </td>
            <td><span class="prioridad-badge prioridad-${t.prioridad}">${prioridadIcon(t.prioridad)} ${t.prioridad}</span></td>
            <td><span class="estado-badge estado-${escHtml(t.estado)}">${estadoIcon(t.estado)} ${t.estado}</span></td>
            <td style="font-weight:600;color:var(--primary)">${t.horas_totales > 0 ? t.horas_totales.toFixed(1) + 'h' : '—'}</td>
            <td style="color:var(--gray);font-size:0.82rem">${formatFecha(t.created_at)}</td>
            <td onclick="event.stopPropagation()">
                <button class="btn-action btn-edit" onclick="abrirModalEditarTicketDesdeLista('${t.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${isAdmin() ? `<button class="btn-action btn-delete" onclick="eliminarTicketLista('${t.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

// ============================================
// RENDER CARDS (mobile)
// ============================================
function renderCardsTickets(tickets) {
    const container = document.getElementById('ticketsCardsList');

    if (!tickets.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><br>Sin tickets</div>`;
        return;
    }

    container.innerHTML = tickets.map(t => {
        const asignados = t.ticket_asignaciones || [];
        const nombresOps = asignados.map(a => a.profiles?.nombre).filter(Boolean).join(', ');
        return `<div class="ticket-card-mobile prio-${t.prioridad}" onclick="abrirTicket('${t.id}')">
            <div class="ticket-card-top">
                <div>
                    <span class="ticket-numero">#${t.numero}</span>
                    <div class="ticket-card-asunto">${escHtml(t.asunto)}</div>
                </div>
                <span class="estado-badge estado-${escHtml(t.estado)}">${t.estado}</span>
            </div>
            <div class="ticket-card-meta">
                <span><i class="fas fa-building"></i> ${t.empresas?.nombre || '—'}</span>
                ${nombresOps ? `<span><i class="fas fa-user"></i> ${escHtml(nombresOps)}</span>` : ''}
                <span class="prioridad-badge prioridad-${t.prioridad}" style="margin-left:auto">${t.prioridad}</span>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// ABRIR / CERRAR DETALLE TICKET
// ============================================
async function abrirTicket(id) {
    document.getElementById('vistaLista').style.display = 'none';
    document.getElementById('vistaDetalle').style.display = 'flex';

    // Limpiar estado previo
    document.getElementById('chatMessages').innerHTML = '<div class="chat-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    document.getElementById('detalleInfoRows').innerHTML = '';
    document.getElementById('detalleOperarios').innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Cargando...</div>';

    try {
        ticketActual = await apiFetch(`/api/v2/tickets/${id}`);
        renderDetalleTicket(ticketActual);
        renderChat(ticketActual.ticket_mensajes || []);
    } catch (err) {
        showToast('Error', 'No se pudo cargar el ticket', 'error');
        volverALista();
    }
}

function volverALista() {
    document.getElementById('vistaDetalle').style.display = 'none';
    document.getElementById('vistaLista').style.display = 'block';
    ticketActual = null;
    archivosChatPendientes = [];
    cargarTickets();
    cargarStats();
}

function renderDetalleTicket(ticket) {
    // Número y asunto
    document.getElementById('detalleNumero').textContent = `#${ticket.numero}`;
    document.getElementById('detalleAsunto').textContent = ticket.asunto;

    // Estado select
    const estadoSel = document.getElementById('detalleEstadoSelect');
    estadoSel.value = ticket.estado;

    // Botón eliminar solo admin
    document.getElementById('btnEliminarTicket').style.display = isAdmin() ? '' : 'none';

    // Info rows
    const infoRows = document.getElementById('detalleInfoRows');
    const empresa = ticket.empresas;
    const dispositivo = ticket.dispositivos;

    infoRows.innerHTML = `
        ${infoRow('Empresa', empresa?.nombre || '—')}
        ${infoRow('Prioridad', `<span class="prioridad-badge prioridad-${ticket.prioridad}">${prioridadIcon(ticket.prioridad)} ${ticket.prioridad}</span>`)}
        ${infoRow('Estado', `<span class="estado-badge estado-${escHtml(ticket.estado)}">${estadoIcon(ticket.estado)} ${ticket.estado}</span>`)}
        ${dispositivo ? infoRow('Equipo', `<i class="fas fa-desktop" style="color:var(--primary)"></i> ${escHtml(dispositivo.nombre)}`) : ''}
        ${ticket.descripcion ? infoRow('Descripción', `<span style="white-space:pre-wrap">${escHtml(ticket.descripcion)}</span>`) : ''}
        ${infoRow('Creado', formatFechaLarga(ticket.created_at))}
        ${ticket.started_at ? infoRow('Iniciado', formatFechaLarga(ticket.started_at)) : ''}
        ${ticket.completed_at ? infoRow('Completado', formatFechaLarga(ticket.completed_at)) : ''}
        ${ticket.invoiced_at ? infoRow('Facturado', formatFechaLarga(ticket.invoiced_at)) : ''}
    `;

    // Operarios
    renderOperariosDetalle(ticket.ticket_asignaciones || []);

    // Horas
    renderHorasDetalle(ticket.ticket_horas || []);

    // Archivos (los que no pertenecen a un mensaje)
    const archivosSueltos = (ticket.ticket_archivos || []).filter(a => !a.mensaje_id);
    renderArchivosDetalle(archivosSueltos);

    // Historial
    renderHistorialDetalle(ticket.ticket_historial || []);
}

function infoRow(label, value) {
    return `<div class="info-row">
        <span class="info-row-label">${label}</span>
        <span class="info-row-value">${value}</span>
    </div>`;
}

function renderOperariosDetalle(asignaciones) {
    const container = document.getElementById('detalleOperarios');
    if (!asignaciones.length) {
        container.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Sin operarios asignados</div>';
        return;
    }
    container.innerHTML = asignaciones.map(a => {
        const nombre = a.profiles?.nombre || 'Desconocido';
        const color = getAvatarColor(a.user_id);
        const esSoloYo = a.user_id === currentUserId;
        return `<div class="operario-chip">
            <div class="avatar" style="background:${color}">${getInitials(nombre)}</div>
            <span class="operario-chip-nombre">${escHtml(nombre)}</span>
            ${isAdmin() || esSoloYo ? `
                <button class="btn-remove-operario" onclick="quitarOperario('${a.user_id}')" title="Quitar">
                    <i class="fas fa-times"></i>
                </button>` : ''}
        </div>`;
    }).join('');
}

function renderHorasDetalle(horas) {
    const container = document.getElementById('detalleHoras');
    const totalEl = document.getElementById('detalleHorasTotal');

    if (!horas.length) {
        container.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Sin horas registradas</div>';
        totalEl.textContent = '';
        return;
    }

    const total = horas.reduce((sum, h) => sum + Number(h.horas), 0);
    totalEl.textContent = `Total: ${total.toFixed(2)}h`;

    container.innerHTML = horas.map(h => `
        <div class="hora-item">
            <div class="hora-item-info">
                <span class="hora-item-quien">${escHtml(h.profiles?.nombre || 'Desconocido')}</span>
                <span class="hora-item-desc">${escHtml(h.descripcion || h.fecha || '')}</span>
            </div>
            <span class="hora-item-cantidad">${Number(h.horas).toFixed(1)}h</span>
            ${isAdmin() || h.user_id === currentUserId ? `
                <button class="btn-delete-hora" onclick="eliminarHora('${h.id}')" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>` : ''}
        </div>
    `).join('');
}

function renderArchivosDetalle(archivos) {
    const container = document.getElementById('detalleArchivos');
    if (!archivos.length) {
        container.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Sin archivos adjuntos</div>';
        return;
    }
    container.innerHTML = archivos.map(a => `
        <div class="archivo-item" onclick="descargarArchivo('${a.id}', '${escHtml(a.nombre_original)}')">
            <span class="archivo-icon">${iconoArchivo(a.mime_type)}</span>
            <div class="archivo-info">
                <div class="archivo-nombre">${escHtml(a.nombre_original)}</div>
                <div class="archivo-meta">${formatBytes(a.tamanio)} · ${formatFecha(a.created_at)}</div>
            </div>
            ${isAdmin() ? `<button class="btn-delete-archivo" onclick="event.stopPropagation();eliminarArchivo('${a.id}')" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>` : ''}
        </div>
    `).join('');
}

function renderHistorialDetalle(historial) {
    const container = document.getElementById('detalleHistorial');
    const sortedH = [...historial].reverse(); // más reciente primero
    container.innerHTML = sortedH.map(h => {
        const icon = historialTipoIcon(h.tipo);
        return `<div class="historial-item">
            <div class="historial-icon"><i class="fas fa-${icon}"></i></div>
            <div class="historial-texto">
                ${escHtml(h.descripcion)}
                <div class="historial-fecha">${h.profiles?.nombre ? escHtml(h.profiles.nombre) + ' · ' : ''}${formatFechaLarga(h.created_at)}</div>
            </div>
        </div>`;
    }).join('') || '<div style="color:var(--gray);font-size:0.82rem;padding:8px 0">Sin historial</div>';
}

function toggleHistorial() {
    historialAbierto = !historialAbierto;
    document.getElementById('detalleHistorial').style.display = historialAbierto ? 'flex' : 'none';
    document.getElementById('historialChevron').className = historialAbierto
        ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

// ============================================
// CHAT
// ============================================
function setTipoMensaje(tipo) {
    tipoMensajeActual = tipo;
    document.querySelectorAll('.chat-tipo-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tipo === tipo);
    });
    const input = document.getElementById('chatInput');
    if (tipo === 'nota_interna') {
        input.classList.add('nota-interna');
        input.placeholder = 'Escribe una nota interna (no visible para el cliente)...';
    } else {
        input.classList.remove('nota-interna');
        input.placeholder = 'Escribe un mensaje...';
    }
}

function renderChat(mensajes) {
    const container = document.getElementById('chatMessages');
    if (!mensajes.length) {
        container.innerHTML = `<div class="chat-empty">
            <i class="fas fa-comments"></i>
            Aún no hay mensajes. ¡Inicia la conversación!
        </div>`;
        return;
    }

    container.innerHTML = mensajes.map(m => {
        const esPropio = m.user_id === currentUserId;
        const esNota = m.tipo === 'nota_interna';
        const nombre = m.profiles?.nombre || 'Desconocido';
        const color = getAvatarColor(m.user_id);
        const archivos = m.ticket_archivos || [];

        return `<div class="chat-message ${esPropio ? 'own' : ''} ${esNota ? 'nota' : ''}">
            ${!esNota ? `<div class="msg-avatar" style="background:${color}">${getInitials(nombre)}</div>` : ''}
            <div class="msg-bubble">
                ${esNota ? `<div class="msg-nota-label"><i class="fas fa-lock"></i> Nota interna</div>` : ''}
                <div class="msg-header">
                    <span class="msg-autor">${escHtml(nombre)}</span>
                    <span class="msg-fecha">${formatFechaLarga(m.created_at)}</span>
                </div>
                ${m.mensaje ? `<div class="msg-texto">${escHtml(m.mensaje)}</div>` : ''}
                ${archivos.length ? `<div class="msg-archivos">
                    ${archivos.map(a => `
                        <span class="msg-archivo-link" onclick="descargarArchivo('${a.id}', '${escHtml(a.nombre_original)}')">
                            ${iconoArchivo(a.mime_type)} ${escHtml(a.nombre_original)} <span style="font-size:0.7rem;color:var(--gray)">${formatBytes(a.tamanio)}</span>
                        </span>
                    `).join('')}
                </div>` : ''}
            </div>
        </div>`;
    }).join('');

    // Scroll al final
    container.scrollTop = container.scrollHeight;
}

async function enviarMensaje() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();

    if (!texto && archivosChatPendientes.length === 0) return;
    if (!ticketActual) return;

    let mensajeId = null;

    try {
        // Enviar mensaje si hay texto
        if (texto) {
            const msg = await apiFetch(`/api/v2/tickets/${ticketActual.id}/mensajes`, {
                method: 'POST',
                body: JSON.stringify({ mensaje: texto, tipo: tipoMensajeActual })
            });
            mensajeId = msg.id;
        }

        // Subir archivos pendientes
        if (archivosChatPendientes.length > 0) {
            const formData = new FormData();
            archivosChatPendientes.forEach(f => formData.append('files', f));
            if (mensajeId) formData.append('mensaje_id', mensajeId);

            await fetch(`${API_URL}/api/v2/tickets/${ticketActual.id}/archivos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hola_token')}` },
                body: formData
            });
        }

        input.value = '';
        input.style.height = 'auto';
        archivosChatPendientes = [];
        document.getElementById('archivosPreview').style.display = 'none';
        document.getElementById('archivosPreview').innerHTML = '';

        // Recargar ticket completo
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderChat(ticketActual.ticket_mensajes || []);

    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
    }
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function triggerUploadChat() {
    document.getElementById('chatArchivoInput').click();
}

function previewArchivosChat() {
    const input = document.getElementById('chatArchivoInput');
    const files = Array.from(input.files);
    archivosChatPendientes = [...archivosChatPendientes, ...files];
    input.value = '';

    const preview = document.getElementById('archivosPreview');
    preview.style.display = 'flex';
    preview.innerHTML = archivosChatPendientes.map((f, i) => `
        <div class="preview-chip">
            <span>${iconoArchivo(f.type)} ${f.name.length > 20 ? f.name.substring(0,18)+'...' : f.name}</span>
            <button onclick="quitarArchivoChat(${i})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

function quitarArchivoChat(idx) {
    archivosChatPendientes.splice(idx, 1);
    if (!archivosChatPendientes.length) {
        document.getElementById('archivosPreview').style.display = 'none';
    }
    previewArchivosChat();
}

// ============================================
// ACCIONES SOBRE EL TICKET
// ============================================
async function cambiarEstado(nuevoEstado) {
    if (!ticketActual) return;
    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        ticketActual.estado = nuevoEstado;
        showToast('Estado actualizado', `Ticket marcado como "${nuevoEstado}"`, 'success');

        // Recargar
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderDetalleTicket(ticketActual);
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function quitarOperario(userId) {
    if (!ticketActual) return;
    if (!confirm('¿Quitar este operario del ticket?')) return;
    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}/asignaciones/${userId}`, { method: 'DELETE' });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderOperariosDetalle(ticketActual.ticket_asignaciones || []);
        showToast('Operario eliminado', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function eliminarHora(horaId) {
    if (!confirm('¿Eliminar este registro de horas?')) return;
    try {
        await apiFetch(`/api/v2/horas/${horaId}`, { method: 'DELETE' });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderHorasDetalle(ticketActual.ticket_horas || []);
        showToast('Horas eliminadas', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function descargarArchivo(archivoId, nombre) {
    try {
        const { url } = await apiFetch(`/api/v2/archivos/${archivoId}/url`);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        showToast('Error', 'No se pudo descargar el archivo', 'error');
    }
}

async function eliminarArchivo(archivoId) {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
        await apiFetch(`/api/v2/archivos/${archivoId}`, { method: 'DELETE' });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        const archivosSueltos = (ticketActual.ticket_archivos || []).filter(a => !a.mensaje_id);
        renderArchivosDetalle(archivosSueltos);
        showToast('Archivo eliminado', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function triggerUploadArchivo() {
    document.getElementById('archivoInput').click();
}

async function subirArchivos() {
    const input = document.getElementById('archivoInput');
    if (!input.files.length || !ticketActual) return;

    const formData = new FormData();
    Array.from(input.files).forEach(f => formData.append('files', f));

    try {
        const res = await fetch(`${API_URL}/api/v2/tickets/${ticketActual.id}/archivos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hola_token')}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        input.value = '';
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        const archivosSueltos = (ticketActual.ticket_archivos || []).filter(a => !a.mensaje_id);
        renderArchivosDetalle(archivosSueltos);
        showToast('Archivos subidos', `${data.length} archivo(s) añadido(s)`, 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function eliminarTicket() {
    if (!ticketActual) return;
    if (!confirm(`¿Eliminar el ticket #${ticketActual.numero}? Esta acción no se puede deshacer.`)) return;
    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}`, { method: 'DELETE' });
        showToast('Ticket eliminado', '', 'success');
        volverALista();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function eliminarTicketLista(id) {
    if (!confirm('¿Eliminar este ticket?')) return;
    try {
        await apiFetch(`/api/v2/tickets/${id}`, { method: 'DELETE' });
        showToast('Ticket eliminado', '', 'success');
        cargarTickets();
        cargarStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MODAL: NUEVO / EDITAR TICKET
// ============================================
function abrirModalNuevoTicket() {
    document.getElementById('editTicketId').value = '';
    document.getElementById('ticketModalTitle').innerHTML = '<i class="fas fa-ticket-alt"></i> Nuevo Ticket';
    document.getElementById('ticketEmpresa').value = '';
    document.getElementById('ticketDispositivo').innerHTML = '<option value="">Sin dispositivo</option>';
    document.getElementById('ticketAsunto').value = '';
    document.getElementById('ticketDescripcion').value = '';
    document.getElementById('ticketPrioridad').value = 'Media';
    document.getElementById('ticketEstado').value = 'Pendiente';
    renderOperariosCheckboxes('operariosCheckboxes', []);
    document.getElementById('ticketModal').style.display = 'flex';
}

async function abrirModalEditarTicket() {
    if (!ticketActual) return;
    const t = ticketActual;
    document.getElementById('editTicketId').value = t.id;
    document.getElementById('ticketModalTitle').innerHTML = `<i class="fas fa-edit"></i> Editar Ticket #${t.numero}`;
    document.getElementById('ticketEmpresa').value = t.empresa_id;
    await cargarDispositivosEmpresa();
    document.getElementById('ticketDispositivo').value = t.dispositivo_id || '';
    document.getElementById('ticketAsunto').value = t.asunto;
    document.getElementById('ticketDescripcion').value = t.descripcion || '';
    document.getElementById('ticketPrioridad').value = t.prioridad;
    document.getElementById('ticketEstado').value = t.estado;

    const asignadosIds = (t.ticket_asignaciones || []).map(a => a.user_id);
    renderOperariosCheckboxes('operariosCheckboxes', asignadosIds);
    document.getElementById('ticketModal').style.display = 'flex';
}

async function abrirModalEditarTicketDesdeLista(id) {
    try {
        ticketActual = await apiFetch(`/api/v2/tickets/${id}`);
        abrirModalEditarTicket();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function cerrarModalTicket() {
    document.getElementById('ticketModal').style.display = 'none';
    ticketActual = null;
}

async function guardarTicket() {
    const id = document.getElementById('editTicketId').value;
    const empresa_id = document.getElementById('ticketEmpresa').value;
    const dispositivo_id = document.getElementById('ticketDispositivo').value;
    const asunto = document.getElementById('ticketAsunto').value.trim();
    const descripcion = document.getElementById('ticketDescripcion').value.trim();
    const prioridad = document.getElementById('ticketPrioridad').value;
    const estado = document.getElementById('ticketEstado').value;

    if (!empresa_id || !asunto) {
        showToast('Error', 'Empresa y asunto son obligatorios', 'error');
        return;
    }

    // Operarios seleccionados
    const operariosSeleccionados = Array.from(
        document.querySelectorAll('#operariosCheckboxes .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    try {
        if (id) {
            // Editar
            await apiFetch(`/api/v2/tickets/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ asunto, descripcion, prioridad, estado, dispositivo_id: dispositivo_id || null })
            });

            // Actualizar asignaciones: borrar las actuales y reasignar
            // (Simplificado: solo añadir nuevas. El backend usa upsert)
            if (operariosSeleccionados.length > 0) {
                await apiFetch(`/api/v2/tickets/${id}/asignaciones`, {
                    method: 'POST',
                    body: JSON.stringify({ operarios: operariosSeleccionados })
                });
            }

            showToast('Ticket actualizado', '', 'success');
        } else {
            // Crear
            await apiFetch('/api/v2/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    empresa_id, dispositivo_id: dispositivo_id || null,
                    asunto, descripcion, prioridad, estado,
                    operarios: operariosSeleccionados
                })
            });
            showToast('Ticket creado', asunto, 'success');
        }

        cerrarModalTicket();
        cargarTickets();
        cargarStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MODAL: ASIGNAR OPERARIOS
// ============================================
function abrirModalAsignar() {
    const asignadosIds = (ticketActual?.ticket_asignaciones || []).map(a => a.user_id);
    renderOperariosCheckboxes('asignarOperariosLista', asignadosIds);
    document.getElementById('asignarModal').style.display = 'flex';
}

function cerrarModalAsignar() {
    document.getElementById('asignarModal').style.display = 'none';
}

async function guardarAsignaciones() {
    const seleccionados = Array.from(
        document.querySelectorAll('#asignarOperariosLista .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    if (!seleccionados.length) {
        showToast('Info', 'Selecciona al menos un operario', 'warning');
        return;
    }

    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}/asignaciones`, {
            method: 'POST',
            body: JSON.stringify({ operarios: seleccionados })
        });

        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderOperariosDetalle(ticketActual.ticket_asignaciones || []);
        cerrarModalAsignar();
        showToast('Operarios asignados', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function renderOperariosCheckboxes(containerId, selectedIds) {
    const container = document.getElementById(containerId);
    container.innerHTML = operarios.map((op, idx) => {
        const color = getAvatarColor(op.id);
        const checked = selectedIds.includes(op.id);
        return `<div class="operario-check-item ${checked ? 'checked' : ''}" data-user-id="${op.id}"
                     onclick="toggleOperarioCheck(this)">
            <div class="operario-check-avatar" style="background:${color}">${getInitials(op.nombre)}</div>
            <span class="operario-check-nombre">${escHtml(op.nombre)}</span>
            <span class="operario-check-rol" style="font-size:0.75rem;color:var(--gray)">${op.rol}</span>
            <div class="operario-check-tick">${checked ? '<i class="fas fa-check"></i>' : ''}</div>
        </div>`;
    }).join('') || '<p style="color:var(--gray);font-size:0.88rem">No hay operarios disponibles.</p>';
}

function toggleOperarioCheck(el) {
    el.classList.toggle('checked');
    const tick = el.querySelector('.operario-check-tick');
    tick.innerHTML = el.classList.contains('checked') ? '<i class="fas fa-check"></i>' : '';
}

// ============================================
// MODAL: HORAS
// ============================================
function abrirModalHoras() {
    document.getElementById('horasInput').value = '';
    document.getElementById('horasFecha').valueAsDate = new Date();
    document.getElementById('horasDescripcion').value = '';
    document.getElementById('horasModal').style.display = 'flex';
}

function cerrarModalHoras() {
    document.getElementById('horasModal').style.display = 'none';
}

async function guardarHoras() {
    const horas = parseFloat(document.getElementById('horasInput').value);
    const fecha = document.getElementById('horasFecha').value;
    const descripcion = document.getElementById('horasDescripcion').value.trim();

    if (!horas || horas <= 0) {
        showToast('Error', 'Introduce un número de horas válido', 'error');
        return;
    }

    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}/horas`, {
            method: 'POST',
            body: JSON.stringify({ horas, fecha, descripcion })
        });

        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderHorasDetalle(ticketActual.ticket_horas || []);
        cerrarModalHoras();
        showToast('Horas registradas', `${horas}h añadidas`, 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// FILTROS RÁPIDOS (desde stats)
// ============================================
function setFiltroEstado(estado) {
    document.getElementById('filtroEstado').value = estado;
    cargarTickets();
}

function setFiltroPrioridad(prioridad) {
    document.getElementById('filtroPrioridad').value = prioridad;
    cargarTickets();
}

function limpiarFechas() {
    document.getElementById('filtroDesde').value = '';
    document.getElementById('filtroHasta').value = '';
    cargarTickets();
}

// ============================================
// UTILIDADES
// ============================================
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatFecha(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatFechaLarga(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function prioridadIcon(p) {
    const icons = { Baja: '🟢', Media: '🔵', Alta: '🟡', Urgente: '🔴' };
    return icons[p] || '';
}

function estadoIcon(e) {
    const icons = { Pendiente: '⏳', 'En curso': '🔵', Completado: '✅', Facturado: '💜' };
    return icons[e] || '';
}

function iconoArchivo(mime) {
    if (!mime) return '📎';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📄';
    if (mime.includes('word')) return '📝';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return '📊';
    if (mime.includes('zip') || mime.includes('compressed')) return '🗜️';
    if (mime.startsWith('video/')) return '🎥';
    if (mime.startsWith('audio/')) return '🎵';
    return '📎';
}

function historialTipoIcon(tipo) {
    const icons = {
        creacion: 'star',
        estado: 'exchange-alt',
        asignacion: 'user-plus',
        desasignacion: 'user-minus',
        prioridad: 'flag',
        horas: 'clock',
        archivo: 'paperclip',
    };
    return icons[tipo] || 'circle';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.success}"></i>
        <div class="toast-content">
            <div class="toast-title">${escHtml(title)}</div>
            ${message ? `<div class="toast-message">${escHtml(message)}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Cerrar modales con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

// Cerrar modales al hacer click fuera
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});