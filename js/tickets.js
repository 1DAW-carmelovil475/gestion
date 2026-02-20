// ============================================
// TICKETS V3 — FRONTEND JS
// Incluye: comentarios con archivos + sistema
// de notas/tabs. Chat interno → chat.html
// ============================================

'use strict';

let todosLosTickets     = [];
let operarios           = [];
let empresas            = [];
let ticketActual        = null;
let currentUserId       = null;
let notasGuardadoTimer  = null;
let comentariosArchivosSeleccionados = []; // archivos pendientes de envío

const AVATAR_COLORS = ['#0066ff','#16a34a','#d97706','#dc2626','#9333ea','#0891b2','#be185d','#065f46'];

function getAvatarColor(str) {
    if (!str) return AVATAR_COLORS[0];
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

    // Inicializar avatar del autor en el formulario de comentarios
    actualizarAvatarComentarioForm(me);

    await Promise.all([cargarEmpresas(), cargarOperarios()]);
    await cargarTickets();
    await cargarStats();

    const searchInput = document.getElementById('searchTicket');
    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(cargarTickets, 400);
        });
    }
});

function actualizarAvatarComentarioForm(me) {
    const avatarEl  = document.getElementById('comentarioAutorAvatar');
    const nombreEl  = document.getElementById('comentarioAutorNombre');
    if (avatarEl && me) {
        const color = getAvatarColor(me.id);
        avatarEl.style.background = color;
        avatarEl.textContent       = getInitials(me.nombre);
    }
    if (nombreEl && me) nombreEl.textContent = me.nombre || '';
}

// ============================================
// TABS: NOTAS / COMENTARIOS
// ============================================
function switchTab(tab, btn) {
    // Desactivar todos los tabs
    document.querySelectorAll('.detalle-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });

    btn.classList.add('active');

    if (tab === 'notas') {
        const panel = document.getElementById('panelNotas');
        if (panel) { panel.style.display = 'flex'; panel.classList.add('active'); }
    } else if (tab === 'comentarios') {
        const panel = document.getElementById('panelComentarios');
        if (panel) { panel.style.display = 'flex'; panel.classList.add('active'); }
        cargarComentarios();
    }
}

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarEmpresas() {
    try {
        empresas = await apiFetch('/api/empresas');
        const selEmpresa = document.getElementById('ticketEmpresa');
        const selFiltro  = document.getElementById('filtroEmpresa');
        if (selEmpresa) empresas.forEach(e => { selEmpresa.innerHTML += `<option value="${e.id}">${escHtml(e.nombre)}</option>`; });
        if (selFiltro)  empresas.forEach(e => { selFiltro.innerHTML  += `<option value="${e.id}">${escHtml(e.nombre)}</option>`; });
    } catch (err) {
        console.error('Error empresas:', err);
        showToast('Error', 'No se pudieron cargar las empresas', 'error');
    }
}

async function cargarOperarios() {
    try {
        operarios = await apiFetch('/api/v2/operarios');
        const selFiltro = document.getElementById('filtroOperario');
        if (selFiltro) operarios.forEach(op => { selFiltro.innerHTML += `<option value="${op.id}">${escHtml(op.nombre)}</option>`; });
        renderOperariosCheckboxes('operariosCheckboxes', []);
    } catch (err) {
        console.error('Error operarios:', err);
    }
}

async function cargarDispositivosEmpresa() {
    const empresaId = document.getElementById('ticketEmpresa')?.value;
    const sel = document.getElementById('ticketDispositivo');
    if (!sel) return;
    sel.innerHTML = '<option value="">Sin dispositivo</option>';
    if (!empresaId) return;
    try {
        const dispositivos = await apiFetch(`/api/dispositivos?empresa_id=${empresaId}`);
        dispositivos
            .filter(d => d.categoria !== 'correo')
            .forEach(d => { sel.innerHTML += `<option value="${d.id}">[${d.tipo || d.categoria}] ${escHtml(d.nombre)}</option>`; });
    } catch (err) {
        console.error('Error dispositivos:', err);
    }
}

async function cargarTickets() {
    const params = new URLSearchParams();
    const estado    = document.getElementById('filtroEstado')?.value    || 'all';
    const prioridad = document.getElementById('filtroPrioridad')?.value || 'all';
    const operario  = document.getElementById('filtroOperario')?.value  || 'all';
    const empresa   = document.getElementById('filtroEmpresa')?.value   || 'all';
    const search    = document.getElementById('searchTicket')?.value    || '';
    const desde     = document.getElementById('filtroDesde')?.value     || '';
    const hasta     = document.getElementById('filtroHasta')?.value     || '';

    if (estado !== 'all' && estado !== 'abiertos') params.set('estado', estado);
    if (prioridad !== 'all') params.set('prioridad', prioridad);
    if (operario  !== 'all') params.set('operario_id', operario);
    if (empresa   !== 'all') params.set('empresa_id', empresa);
    if (search)  params.set('search', search);
    if (desde)   params.set('desde', desde);
    if (hasta)   params.set('hasta', hasta);

    const tbody = document.getElementById('ticketsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;

    try {
        let tickets = await apiFetch(`/api/v2/tickets?${params}`);
        if (estado === 'abiertos') tickets = tickets.filter(t => t.estado === 'Pendiente' || t.estado === 'En curso');
        todosLosTickets = tickets;
        const totalEl = document.getElementById('totalFiltrado');
        if (totalEl) totalEl.textContent = `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;
        renderTablaTickets(tickets);
        renderCardsTickets(tickets);
    } catch (err) {
        console.error('Error cargando tickets:', err);
        showToast('Error', err.message, 'error');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="empty-state" style="color:#dc2626"><i class="fas fa-exclamation-circle"></i> ${escHtml(err.message)}</td></tr>`;
    }
}

async function cargarStats() {
    try {
        let data = null;
        if (isAdmin()) data = await apiFetch('/api/v2/estadisticas/resumen').catch(() => null);

        const all = todosLosTickets;
        const stats = data || {
            total:       all.length,
            pendientes:  all.filter(t => t.estado === 'Pendiente').length,
            en_curso:    all.filter(t => t.estado === 'En curso').length,
            completados: all.filter(t => t.estado === 'Completado').length,
            facturados:  all.filter(t => t.estado === 'Facturado').length,
            urgentes:    all.filter(t => t.prioridad === 'Urgente').length,
        };

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statTotal',       stats.total);
        set('statPendientes',  stats.pendientes);
        set('statEnCurso',     stats.en_curso);
        set('statCompletados', stats.completados);
        set('statFacturados',  stats.facturados);
        set('statUrgentes',    stats.urgentes);
    } catch (err) {
        console.error('Error stats:', err);
    }
}

// ============================================
// RENDER TABLA (desktop)
// ============================================
function renderTablaTickets(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    if (!tickets.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">
            <i class="fas fa-inbox" style="display:block;font-size:2rem;color:#cbd5e1;margin-bottom:12px"></i>
            No hay tickets con los filtros actuales
        </td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => {
        const asignados = t.ticket_asignaciones || [];
        const avatares = asignados.map(a => {
            const nombre = a.profiles?.nombre || '?';
            const color  = getAvatarColor(a.user_id);
            return `<div class="avatar-operario" style="background:${color}" title="${escHtml(nombre)}">${getInitials(nombre)}</div>`;
        }).join('');

        const tiempoStr    = formatHorasTranscurridas(t.horas_transcurridas || 0);
        const estadoCerrado = t.estado === 'Completado' || t.estado === 'Facturado';

        return `<tr onclick="abrirTicket('${t.id}')" style="cursor:pointer">
            <td><span class="ticket-numero">#${t.numero}</span></td>
            <td>${escHtml(t.empresas?.nombre || '—')}</td>
            <td>
                <div class="ticket-asunto-cell">
                    <span class="ticket-asunto-text">${escHtml(t.asunto)}</span>
                    ${t.dispositivos ? `<span class="ticket-empresa-sub"><i class="fas fa-desktop" style="font-size:0.7rem"></i> ${escHtml(t.dispositivos.nombre)}</span>` : ''}
                </div>
            </td>
            <td><div class="avatares-operarios">${avatares || '<span style="color:var(--gray);font-size:0.8rem">Sin asignar</span>'}</div></td>
            <td><span class="prioridad-badge prioridad-${t.prioridad}">${prioridadIcon(t.prioridad)} ${t.prioridad}</span></td>
            <td><span class="estado-badge estado-${escHtml(t.estado)}">${estadoIcon(t.estado)} ${t.estado}</span></td>
            <td style="font-weight:600;color:${estadoCerrado ? 'var(--gray)' : 'var(--primary)'};font-size:0.82rem">
                ${tiempoStr}${estadoCerrado ? ' <i class="fas fa-lock" style="font-size:0.7rem;opacity:0.5" title="Tiempo cerrado"></i>' : ''}
            </td>
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
    if (!container) return;

    if (!tickets.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><br>Sin tickets</div>`;
        return;
    }
    container.innerHTML = tickets.map(t => {
        const asignados  = t.ticket_asignaciones || [];
        const nombresOps = asignados.map(a => a.profiles?.nombre).filter(Boolean).join(', ');
        const tiempoStr  = formatHorasTranscurridas(t.horas_transcurridas || 0);
        const estadoCerrado = t.estado === 'Completado' || t.estado === 'Facturado';
        return `<div class="ticket-card-mobile prio-${t.prioridad}" onclick="abrirTicket('${t.id}')">
            <div class="ticket-card-top">
                <div>
                    <span class="ticket-numero">#${t.numero}</span>
                    <div class="ticket-card-asunto">${escHtml(t.asunto)}</div>
                </div>
                <span class="estado-badge estado-${escHtml(t.estado)}">${t.estado}</span>
            </div>
            <div class="ticket-card-meta">
                <span><i class="fas fa-building"></i> ${escHtml(t.empresas?.nombre || '—')}</span>
                ${nombresOps ? `<span><i class="fas fa-user"></i> ${escHtml(nombresOps)}</span>` : ''}
                <span><i class="fas fa-clock"></i> ${tiempoStr}${estadoCerrado ? ' <i class="fas fa-lock" style="font-size:0.7rem;opacity:0.5"></i>' : ''}</span>
                <span class="prioridad-badge prioridad-${t.prioridad}" style="margin-left:auto">${t.prioridad}</span>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// ABRIR / CERRAR DETALLE TICKET
// ============================================
async function abrirTicket(id) {
    document.getElementById('vistaLista').style.display  = 'none';
    document.getElementById('vistaDetalle').style.display = 'flex';

    // Resetear a tab notas
    document.querySelectorAll('.detalle-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
    const tabNotas  = document.querySelector('.detalle-tab:first-child');
    const panelNotas = document.getElementById('panelNotas');
    if (tabNotas)  tabNotas.classList.add('active');
    if (panelNotas) { panelNotas.style.display = 'flex'; panelNotas.classList.add('active'); }

    const detalleInfo = document.getElementById('detalleInfoRows');
    if (detalleInfo) detalleInfo.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Cargando...</div>';

    try {
        ticketActual = await apiFetch(`/api/v2/tickets/${id}`);
        renderDetalleTicket(ticketActual);
    } catch (err) {
        showToast('Error', 'No se pudo cargar el ticket', 'error');
        volverALista();
    }
}

function volverALista() {
    document.getElementById('vistaDetalle').style.display = 'none';
    document.getElementById('vistaLista').style.display   = 'block';
    ticketActual = null;
    comentariosArchivosSeleccionados = [];
    cargarTickets();
    cargarStats();
}

function renderDetalleTicket(ticket) {
    const setEl  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setEl('detalleNumero',  `#${ticket.numero}`);
    setEl('detalleAsunto',  ticket.asunto);
    setVal('detalleEstadoSelect', ticket.estado);

    const btnEliminar = document.getElementById('btnEliminarTicket');
    if (btnEliminar) btnEliminar.style.display = isAdmin() ? '' : 'none';

    const tiempoStr    = formatHorasTranscurridas(ticket.horas_transcurridas || 0);
    const estadoCerrado = ticket.estado === 'Completado' || ticket.estado === 'Facturado';
    const tiempoLabel  = estadoCerrado
        ? `<strong style="color:var(--gray)">${tiempoStr}</strong> <i class="fas fa-lock" style="font-size:0.75rem;color:var(--gray)"></i>`
        : `<strong style="color:var(--primary)">${tiempoStr}</strong>`;

    const infoRows = document.getElementById('detalleInfoRows');
    if (infoRows) {
        infoRows.innerHTML = `
            ${infoRow('Empresa',   escHtml(ticket.empresas?.nombre || '—'))}
            ${infoRow('Prioridad', `<span class="prioridad-badge prioridad-${ticket.prioridad}">${prioridadIcon(ticket.prioridad)} ${ticket.prioridad}</span>`)}
            ${infoRow('Estado',    `<span class="estado-badge estado-${escHtml(ticket.estado)}">${estadoIcon(ticket.estado)} ${ticket.estado}</span>`)}
            ${ticket.dispositivos ? infoRow('Equipo', `<i class="fas fa-desktop" style="color:var(--primary)"></i> ${escHtml(ticket.dispositivos.nombre)}`) : ''}
            ${infoRow('⏱ Tiempo',  tiempoLabel)}
            ${ticket.descripcion   ? infoRow('Descripción', `<span style="white-space:pre-wrap">${escHtml(ticket.descripcion)}</span>`) : ''}
            ${infoRow('Creado',    formatFechaLarga(ticket.created_at))}
            ${ticket.started_at    ? infoRow('Iniciado',   formatFechaLarga(ticket.started_at))   : ''}
            ${ticket.completed_at  ? infoRow('Completado', formatFechaLarga(ticket.completed_at)) : ''}
            ${ticket.invoiced_at   ? infoRow('Facturado',  formatFechaLarga(ticket.invoiced_at))  : ''}
        `;
    }

    renderOperariosDetalle(ticket.ticket_asignaciones || []);
    renderArchivosDetalle(ticket.ticket_archivos || []);
    renderHistorialDetalle(ticket.ticket_historial || []);

    const notasArea = document.getElementById('detalleNotas');
    if (notasArea) notasArea.value = ticket.notas || '';
}

function infoRow(label, value) {
    return `<div class="info-row">
        <span class="info-row-label">${label}</span>
        <span class="info-row-value">${value}</span>
    </div>`;
}

function renderOperariosDetalle(asignaciones) {
    const container = document.getElementById('detalleOperarios');
    if (!container) return;
    if (!asignaciones.length) {
        container.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px">Sin operarios asignados</div>';
        return;
    }
    container.innerHTML = asignaciones.map(a => {
        const nombre  = a.profiles?.nombre || 'Desconocido';
        const color   = getAvatarColor(a.user_id);
        const esMio   = a.user_id === currentUserId;
        return `<div class="operario-chip">
            <div class="avatar" style="background:${color}">${getInitials(nombre)}</div>
            <span class="operario-chip-nombre">${escHtml(nombre)}</span>
            ${isAdmin() || esMio ? `<button class="btn-remove-operario" onclick="quitarOperario('${a.user_id}')" title="Quitar"><i class="fas fa-times"></i></button>` : ''}
        </div>`;
    }).join('');
}

function renderArchivosDetalle(archivos) {
    const container = document.getElementById('detalleArchivos');
    if (!container) return;
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
            ${isAdmin() || a.subido_by === currentUserId ? `
                <button class="btn-delete-archivo" onclick="event.stopPropagation();eliminarArchivo('${a.id}')" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>` : ''}
        </div>
    `).join('');
}

function renderHistorialDetalle(historial) {
    const container = document.getElementById('detalleHistorial');
    if (!container) return;

    if (!historial.length) {
        container.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 0">Sin historial</div>';
        return;
    }

    const sorted = [...historial].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const colorMap = {
        creacion: '#22c55e', estado: '#3b82f6', asignacion: '#9333ea',
        desasignacion: '#f59e0b', prioridad: '#f59e0b', archivo: '#0891b2',
        horas: '#16a34a', comentario: '#0066ff',
    };

    container.innerHTML = sorted.map(h => {
        if (h.tipo === 'nota_interna') return '';
        const icon  = historialTipoIcon(h.tipo);
        const color = colorMap[h.tipo] || '#94a3b8';
        return `<div class="historial-item">
            <div class="historial-icon" style="background:${color}20;color:${color}"><i class="fas fa-${icon}"></i></div>
            <div class="historial-texto">
                ${escHtml(h.descripcion)}
                <div class="historial-fecha">${h.profiles?.nombre ? escHtml(h.profiles.nombre) + ' · ' : ''}${formatFechaLarga(h.created_at)}</div>
            </div>
        </div>`;
    }).filter(Boolean).join('') || '<div style="color:var(--gray);font-size:0.82rem;padding:8px 0">Sin historial</div>';
}

function toggleHistorial() {
    const el      = document.getElementById('detalleHistorial');
    const chevron = document.getElementById('historialChevron');
    if (!el) return;
    const visible = el.style.display !== 'none';
    el.style.display = visible ? 'none' : 'flex';
    if (chevron) chevron.className = visible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

// ============================================
// NOTAS — AUTOGUARDADO
// ============================================
function onNotasChange() {
    clearTimeout(notasGuardadoTimer);
    const indicator = document.getElementById('notasIndicador');
    if (indicator) indicator.textContent = 'Guardando...';

    notasGuardadoTimer = setTimeout(async () => {
        if (!ticketActual) return;
        const notasEl = document.getElementById('detalleNotas');
        if (!notasEl) return;
        const notas = notasEl.value;
        try {
            await apiFetch(`/api/v2/tickets/${ticketActual.id}/notas`, {
                method: 'PUT',
                body: JSON.stringify({ notas }),
            });
            ticketActual.notas = notas;
            if (indicator) {
                indicator.textContent = 'Guardado ✓';
                setTimeout(() => { if (indicator) indicator.textContent = ''; }, 2000);
            }
        } catch (err) {
            if (indicator) indicator.textContent = 'Error al guardar';
        }
    }, 1200);
}

// ============================================
// COMENTARIOS — CARGA Y RENDER
// ============================================
async function cargarComentarios() {
    if (!ticketActual) return;

    const lista = document.getElementById('comentariosLista');
    if (lista) lista.innerHTML = '<div class="comentarios-loading"><i class="fas fa-spinner fa-spin"></i> Cargando comentarios...</div>';

    try {
        const comentarios = await apiFetch(`/api/v2/tickets/${ticketActual.id}/comentarios`);
        renderComentarios(comentarios);

        // Actualizar badge del tab
        const badge = document.getElementById('comentariosBadge');
        if (badge) {
            badge.textContent = comentarios.length;
            badge.style.display = comentarios.length > 0 ? 'inline-flex' : 'none';
        }
    } catch (err) {
        if (lista) lista.innerHTML = `<div class="comentarios-loading" style="color:#dc2626"><i class="fas fa-exclamation-circle"></i> Error al cargar comentarios</div>`;
    }
}

function renderComentarios(comentarios) {
    const lista = document.getElementById('comentariosLista');
    if (!lista) return;

    if (!comentarios.length) {
        lista.innerHTML = `
            <div class="comentarios-empty">
                <i class="fas fa-comments"></i>
                <p>Sin comentarios aún</p>
                <span>Sé el primero en añadir un comentario a este ticket</span>
            </div>`;
        return;
    }

    lista.innerHTML = comentarios.map(c => renderComentarioItem(c)).join('');
}

function renderComentarioItem(c) {
    const nombre    = c.profiles?.nombre || 'Desconocido';
    const color     = getAvatarColor(c.user_id);
    const esMio     = c.user_id === currentUserId;
    const archivos  = c.ticket_comentarios_archivos || [];

    const archivosHtml = archivos.length ? `
        <div class="comentario-archivos">
            ${archivos.map(a => `
                <div class="comentario-archivo-chip" onclick="descargarArchivoComentario('${a.id}', '${escHtml(a.nombre_original)}')" title="${escHtml(a.nombre_original)}">
                    ${iconoArchivo(a.mime_type)}
                    <span>${escHtml(a.nombre_original)}</span>
                    <small>${formatBytes(a.tamanio)}</small>
                </div>
            `).join('')}
        </div>` : '';

    return `<div class="comentario-item" id="comentario-${c.id}">
        <div class="comentario-avatar" style="background:${color}">${getInitials(nombre)}</div>
        <div class="comentario-cuerpo">
            <div class="comentario-meta">
                <span class="comentario-autor">${escHtml(nombre)}</span>
                <span class="comentario-fecha">${formatFechaLarga(c.created_at)}</span>
                ${c.editado ? '<span class="comentario-editado">(editado)</span>' : ''}
                ${esMio || isAdmin() ? `
                    <div class="comentario-acciones">
                        <button onclick="eliminarComentario('${c.id}')" title="Eliminar" class="btn-comentario-accion btn-comentario-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>` : ''}
            </div>
            <div class="comentario-texto">${escHtml(c.contenido)}</div>
            ${archivosHtml}
        </div>
    </div>`;
}

// ============================================
// COMENTARIOS — NUEVO COMENTARIO
// ============================================
function triggerComentarioArchivo() {
    const input = document.getElementById('comentarioArchivoInput');
    if (input) input.click();
}

function onComentarioArchivosSeleccionados() {
    const input = document.getElementById('comentarioArchivoInput');
    if (!input?.files?.length) return;

    // Añadir a la lista de pendientes
    Array.from(input.files).forEach(f => {
        comentariosArchivosSeleccionados.push(f);
    });
    input.value = ''; // Limpiar para permitir re-selección
    actualizarPreviewArchivosComentario();
}

function actualizarPreviewArchivosComentario() {
    const preview   = document.getElementById('comentarioArchivosPreview');
    const countEl   = document.getElementById('comentarioArchivosCount');
    if (!preview) return;

    if (!comentariosArchivosSeleccionados.length) {
        preview.style.display = 'none';
        if (countEl) countEl.textContent = '';
        return;
    }

    preview.style.display = 'flex';
    if (countEl) countEl.textContent = `${comentariosArchivosSeleccionados.length} archivo(s)`;

    preview.innerHTML = comentariosArchivosSeleccionados.map((f, i) => `
        <div class="archivo-preview-chip">
            ${iconoArchivo(f.type)}
            <span>${escHtml(f.name)}</span>
            <small>${formatBytes(f.size)}</small>
            <button onclick="quitarArchivoComentario(${i})" title="Quitar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function quitarArchivoComentario(index) {
    comentariosArchivosSeleccionados.splice(index, 1);
    actualizarPreviewArchivosComentario();
}

function handleComentarioKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarComentario();
    }
}

async function enviarComentario() {
    if (!ticketActual) return;
    const textarea = document.getElementById('nuevoComentarioTexto');
    if (!textarea) return;

    const texto    = textarea.value.trim();
    const archivos = comentariosArchivosSeleccionados;

    if (!texto && !archivos.length) {
        showToast('Aviso', 'Escribe algo o adjunta un archivo', 'warning');
        return;
    }

    const btn = document.querySelector('.comentario-nuevo .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'; }

    try {
        const formData = new FormData();
        formData.append('contenido', texto);
        archivos.forEach(f => formData.append('files', f));

        const res = await fetch(`${API_URL}/api/v2/tickets/${ticketActual.id}/comentarios`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hola_token')}` },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `Error ${res.status}` }));
            throw new Error(err.error);
        }

        // Limpiar formulario
        textarea.value = '';
        comentariosArchivosSeleccionados = [];
        actualizarPreviewArchivosComentario();

        // Recargar comentarios
        await cargarComentarios();

        // Scroll al final
        const lista = document.getElementById('comentariosLista');
        if (lista) lista.scrollTop = lista.scrollHeight;

        showToast('Comentario añadido', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Comentar'; }
    }
}

async function eliminarComentario(comentarioId) {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
        await apiFetch(`/api/v2/comentarios/${comentarioId}`, { method: 'DELETE' });
        showToast('Comentario eliminado', '', 'success');
        await cargarComentarios();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function descargarArchivoComentario(archivoId, nombre) {
    try {
        const { url } = await apiFetch(`/api/v2/comentarios/archivos/${archivoId}/url`);
        const a = document.createElement('a');
        a.href = url; a.download = nombre; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
        showToast('Error', 'No se pudo descargar el archivo', 'error');
    }
}

// ============================================
// ACCIONES
// ============================================
async function cambiarEstado(nuevoEstado) {
    if (!ticketActual) return;
    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado }),
        });
        showToast('Estado actualizado', `Ticket marcado como "${nuevoEstado}"`, 'success');
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderDetalleTicket(ticketActual);
    } catch (err) {
        showToast('Error', err.message, 'error');
        const sel = document.getElementById('detalleEstadoSelect');
        if (sel && ticketActual) sel.value = ticketActual.estado;
    }
}

async function quitarOperario(userId) {
    if (!ticketActual) return;
    if (!confirm('¿Quitar este operario del ticket?')) return;
    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}/asignaciones/${userId}`, { method: 'DELETE' });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderOperariosDetalle(ticketActual.ticket_asignaciones || []);
        renderHistorialDetalle(ticketActual.ticket_historial || []);
        showToast('Operario eliminado', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function descargarArchivo(archivoId, nombre) {
    try {
        const { url } = await apiFetch(`/api/v2/archivos/${archivoId}/url`);
        const a = document.createElement('a');
        a.href = url; a.download = nombre; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
        showToast('Error', 'No se pudo descargar el archivo', 'error');
    }
}

async function eliminarArchivo(archivoId) {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
        await apiFetch(`/api/v2/archivos/${archivoId}`, { method: 'DELETE' });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderArchivosDetalle(ticketActual.ticket_archivos || []);
        showToast('Archivo eliminado', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function triggerUploadArchivo() {
    const input = document.getElementById('archivoInput');
    if (input) input.click();
}

async function subirArchivos() {
    const input = document.getElementById('archivoInput');
    if (!input?.files?.length || !ticketActual) return;

    const archivosContainer = document.getElementById('detalleArchivos');
    if (archivosContainer) archivosContainer.innerHTML = '<div style="color:var(--gray);font-size:0.82rem;padding:8px 14px"><i class="fas fa-spinner fa-spin"></i> Subiendo...</div>';

    const formData = new FormData();
    Array.from(input.files).forEach(f => formData.append('files', f));

    try {
        const res = await fetch(`${API_URL}/api/v2/tickets/${ticketActual.id}/archivos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hola_token')}` },
            body: formData,
        });
        if (!res.ok) { const e = await res.json().catch(() => ({ error: `Error ${res.status}` })); throw new Error(e.error); }
        const data = await res.json();
        input.value = '';
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderArchivosDetalle(ticketActual.ticket_archivos || []);
        renderHistorialDetalle(ticketActual.ticket_historial || []);
        showToast('Archivos subidos', `${data.length} archivo(s) añadido(s)`, 'success');
    } catch (err) {
        showToast('Error al subir archivos', err.message, 'error');
        if (ticketActual) renderArchivosDetalle(ticketActual.ticket_archivos || []);
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
        await cargarTickets();
        await cargarStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MODAL: NUEVO / EDITAR TICKET
// ============================================
function abrirModalNuevoTicket() {
    const idEl = document.getElementById('editTicketId');
    if (idEl) idEl.value = '';
    const titleEl = document.getElementById('ticketModalTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-ticket-alt"></i> Nuevo Ticket';

    ['ticketEmpresa','ticketAsunto','ticketDescripcion'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    const dispSel = document.getElementById('ticketDispositivo');
    if (dispSel) dispSel.innerHTML = '<option value="">Sin dispositivo</option>';
    const prioEl  = document.getElementById('ticketPrioridad');
    if (prioEl) prioEl.value = 'Media';
    const estadoEl = document.getElementById('ticketEstado');
    if (estadoEl) estadoEl.value = 'Pendiente';

    renderOperariosCheckboxes('operariosCheckboxes', []);
    const modal = document.getElementById('ticketModal');
    if (modal) modal.style.display = 'flex';
}

async function abrirModalEditarTicket() {
    if (!ticketActual) return;
    const t = ticketActual;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    setVal('editTicketId',    t.id);
    const titleEl = document.getElementById('ticketModalTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-edit"></i> Editar Ticket #${t.numero}`;
    setVal('ticketEmpresa',    t.empresa_id);
    await cargarDispositivosEmpresa();
    setVal('ticketDispositivo', t.dispositivo_id);
    setVal('ticketAsunto',     t.asunto);
    setVal('ticketDescripcion', t.descripcion);
    setVal('ticketPrioridad',  t.prioridad);
    setVal('ticketEstado',     t.estado);

    const asignadosIds = (t.ticket_asignaciones || []).map(a => a.user_id);
    renderOperariosCheckboxes('operariosCheckboxes', asignadosIds);

    const modal = document.getElementById('ticketModal');
    if (modal) modal.style.display = 'flex';
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
    const modal = document.getElementById('ticketModal');
    if (modal) modal.style.display = 'none';
}

async function guardarTicket() {
    const id             = document.getElementById('editTicketId')?.value || '';
    const empresa_id     = document.getElementById('ticketEmpresa')?.value || '';
    const dispositivo_id = document.getElementById('ticketDispositivo')?.value || '';
    const asunto         = document.getElementById('ticketAsunto')?.value.trim() || '';
    const descripcion    = document.getElementById('ticketDescripcion')?.value.trim() || '';
    const prioridad      = document.getElementById('ticketPrioridad')?.value || 'Media';
    const estado         = document.getElementById('ticketEstado')?.value || 'Pendiente';

    if (!empresa_id || !asunto) { showToast('Error', 'Empresa y asunto son obligatorios', 'error'); return; }

    const operariosSeleccionados = Array.from(
        document.querySelectorAll('#operariosCheckboxes .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    const btn = document.querySelector('#ticketModal .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }

    try {
        if (id) {
            await apiFetch(`/api/v2/tickets/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ asunto, descripcion, prioridad, estado, dispositivo_id: dispositivo_id || null }),
            });
            if (operariosSeleccionados.length > 0) {
                await apiFetch(`/api/v2/tickets/${id}/asignaciones`, {
                    method: 'POST',
                    body: JSON.stringify({ operarios: operariosSeleccionados }),
                });
            }
            showToast('Ticket actualizado', '', 'success');
            if (ticketActual?.id === id) {
                ticketActual = await apiFetch(`/api/v2/tickets/${id}`);
                renderDetalleTicket(ticketActual);
            }
        } else {
            await apiFetch('/api/v2/tickets', {
                method: 'POST',
                body: JSON.stringify({ empresa_id, dispositivo_id: dispositivo_id || null, asunto, descripcion, prioridad, estado, operarios: operariosSeleccionados }),
            });
            showToast('Ticket creado', asunto, 'success');
        }
        cerrarModalTicket();
        await cargarTickets();
        await cargarStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
    }
}

// ============================================
// MODAL: ASIGNAR OPERARIOS
// ============================================
function abrirModalAsignar() {
    const asignadosIds = (ticketActual?.ticket_asignaciones || []).map(a => a.user_id);
    renderOperariosCheckboxes('asignarOperariosLista', asignadosIds);
    const modal = document.getElementById('asignarModal');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalAsignar() {
    const modal = document.getElementById('asignarModal');
    if (modal) modal.style.display = 'none';
}

async function guardarAsignaciones() {
    const seleccionados = Array.from(
        document.querySelectorAll('#asignarOperariosLista .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    if (!seleccionados.length) { showToast('Info', 'Selecciona al menos un operario', 'warning'); return; }

    try {
        await apiFetch(`/api/v2/tickets/${ticketActual.id}/asignaciones`, {
            method: 'POST',
            body: JSON.stringify({ operarios: seleccionados }),
        });
        ticketActual = await apiFetch(`/api/v2/tickets/${ticketActual.id}`);
        renderOperariosDetalle(ticketActual.ticket_asignaciones || []);
        renderHistorialDetalle(ticketActual.ticket_historial || []);
        cerrarModalAsignar();
        showToast('Operarios asignados', '', 'success');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function renderOperariosCheckboxes(containerId, selectedIds) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = operarios.map(op => {
        const color   = getAvatarColor(op.id);
        const checked = selectedIds.includes(op.id);
        return `<div class="operario-check-item ${checked ? 'checked' : ''}" data-user-id="${op.id}" onclick="toggleOperarioCheck(this)">
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
    if (tick) tick.innerHTML = el.classList.contains('checked') ? '<i class="fas fa-check"></i>' : '';
}

// ============================================
// FILTROS RÁPIDOS
// ============================================
function setFiltroEstado(estado) {
    const el = document.getElementById('filtroEstado');
    if (el) el.value = estado;
    cargarTickets();
}

function setFiltroPrioridad(prioridad) {
    const el = document.getElementById('filtroPrioridad');
    if (el) el.value = prioridad;
    cargarTickets();
}

function limpiarFechas() {
    const d = document.getElementById('filtroDesde');
    const h = document.getElementById('filtroHasta');
    if (d) d.value = '';
    if (h) h.value = '';
    cargarTickets();
}

// ============================================
// UTILIDADES
// ============================================
function escHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatFecha(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatFechaLarga(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatHorasTranscurridas(horas) {
    if (!horas || horas <= 0) return '< 1h';
    if (horas < 1)  return `${Math.round(horas * 60)}min`;
    if (horas < 24) return `${horas.toFixed(1)}h`;
    const dias = Math.floor(horas / 24);
    const restH = Math.round(horas % 24);
    if (dias < 30) return restH > 0 ? `${dias}d ${restH}h` : `${dias}d`;
    const meses = Math.floor(dias / 30);
    const restD = dias % 30;
    return restD > 0 ? `${meses}m ${restD}d` : `${meses}m`;
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function prioridadIcon(p) {
    const icons = { Baja: '#22c55e', Media: '#3b82f6', Alta: '#f59e0b', Urgente: '#ef4444' };
    return `<i class="fas fa-circle" style="color:${icons[p]||'#94a3b8'};font-size:0.7rem"></i>`;
}

function estadoIcon(e) {
    const icons = {
        Pendiente:  '<i class="fas fa-clock" style="color:#d97706;font-size:0.75rem"></i>',
        'En curso': '<i class="fas fa-spinner" style="color:#3b82f6;font-size:0.75rem"></i>',
        Completado: '<i class="fas fa-check-circle" style="color:#22c55e;font-size:0.75rem"></i>',
        Facturado:  '<i class="fas fa-file-invoice-dollar" style="color:#9333ea;font-size:0.75rem"></i>',
    };
    return icons[e] || '';
}

function iconoArchivo(mime) {
    if (!mime) return '<i class="fas fa-paperclip"></i>';
    if (mime.startsWith('image/'))                           return '<i class="fas fa-image" style="color:#3b82f6"></i>';
    if (mime === 'application/pdf')                          return '<i class="fas fa-file-pdf" style="color:#ef4444"></i>';
    if (mime.includes('word'))                               return '<i class="fas fa-file-word" style="color:#2563eb"></i>';
    if (mime.includes('excel') || mime.includes('sheet'))    return '<i class="fas fa-file-excel" style="color:#16a34a"></i>';
    if (mime.includes('zip') || mime.includes('compressed')) return '<i class="fas fa-file-archive" style="color:#d97706"></i>';
    if (mime.startsWith('video/'))                           return '<i class="fas fa-file-video" style="color:#9333ea"></i>';
    if (mime.startsWith('audio/'))                           return '<i class="fas fa-file-audio" style="color:#0891b2"></i>';
    return '<i class="fas fa-file" style="color:#64748b"></i>';
}

function historialTipoIcon(tipo) {
    return { creacion: 'star', estado: 'exchange-alt', asignacion: 'user-plus', desasignacion: 'user-minus',
             prioridad: 'flag', horas: 'clock', archivo: 'paperclip', comentario: 'comment' }[tipo] || 'circle';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
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
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

// ============================================
// CERRAR MODALES con ESC / click fuera
// ============================================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
});