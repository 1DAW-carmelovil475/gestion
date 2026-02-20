// ============================================
// CHAT INTERNO V1 — FRONTEND JS
// Página independiente tipo Microsoft Teams
// ============================================

'use strict';

let currentUserId  = null;
let currentUser    = null;
let canales        = [];
let canalActual    = null;
let operarios      = [];
let todosTickets   = [];
let chatArchivosSeleccionados  = [];
let ticketRefSeleccionado      = null;
let pollingInterval            = null;

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
    currentUser   = me;

    await Promise.all([cargarOperarios(), cargarTicketsParaRef()]);
    await cargarCanales();
});

async function cargarOperarios() {
    try {
        operarios = await apiFetch('/api/v2/operarios');
    } catch (err) {
        console.error('Error operarios:', err);
    }
}

async function cargarTicketsParaRef() {
    try {
        // Solo los últimos 100 tickets para la búsqueda de referencias
        todosTickets = await apiFetch('/api/v2/tickets?limit=100');
    } catch (err) {
        console.error('Error tickets:', err);
        todosTickets = [];
    }
}

// ============================================
// CANALES — CARGA Y RENDER
// ============================================
async function cargarCanales() {
    try {
        canales = await apiFetch('/api/v2/chat/canales');
        renderSidebarCanales();

        // Si no hay canal seleccionado, seleccionar el primero
        if (!canalActual && canales.length > 0) {
            // Intentar seleccionar "general" primero
            const general = canales.find(c => c.nombre === 'general');
            abrirCanal(general || canales[0]);
        }
    } catch (err) {
        console.error('Error canales:', err);
        showToast('Error', 'No se pudieron cargar los canales', 'error');
    }
}

function renderSidebarCanales() {
    const listaCanales  = document.getElementById('canalesList');
    const listaDirectos = document.getElementById('directosList');
    if (!listaCanales || !listaDirectos) return;

    const normales = canales.filter(c => c.tipo === 'canal');
    const directos = canales.filter(c => c.tipo === 'directo');

    listaCanales.innerHTML = normales.length
        ? normales.map(c => renderCanalItem(c)).join('')
        : '<div class="canal-empty">Sin canales</div>';

    listaDirectos.innerHTML = directos.length
        ? directos.map(c => renderCanalItem(c, true)).join('')
        : '<div class="canal-empty">Sin mensajes directos</div>';
}

function renderCanalItem(canal, esDirecto = false) {
    const activo = canalActual?.id === canal.id;
    const miembros = canal.chat_canales_miembros || [];

    let icono, nombre;
    if (esDirecto) {
        // En mensajes directos, mostrar el nombre del otro miembro
        const otro = miembros.find(m => m.user_id !== currentUserId);
        nombre = otro?.profiles?.nombre || canal.nombre;
        const color = getAvatarColor(otro?.user_id || canal.id);
        icono = `<div class="canal-avatar-sm" style="background:${color}">${getInitials(nombre)}</div>`;
    } else {
        icono = `<span class="canal-hash">#</span>`;
        nombre = canal.nombre;
    }

    return `<div class="canal-item ${activo ? 'active' : ''}" onclick="abrirCanal(${JSON.stringify(canal).replace(/"/g, '&quot;')})" data-canal-id="${canal.id}">
        ${icono}
        <span class="canal-item-nombre">${escHtml(nombre)}</span>
    </div>`;
}

// ============================================
// ABRIR CANAL
// ============================================
async function abrirCanal(canal) {
    canalActual = canal;

    // Actualizar sidebar
    document.querySelectorAll('.canal-item').forEach(el => {
        el.classList.toggle('active', el.dataset.canalId === canal.id);
    });

    // Mostrar área de canal
    document.getElementById('chatEmpty').style.display          = 'none';
    document.getElementById('chatCanalActivo').style.display    = 'flex';

    // En mobile, ocultar sidebar
    document.getElementById('chatSidebar').classList.remove('visible');

    // Actualizar header
    const miembros = canal.chat_canales_miembros || [];
    const esDirecto = canal.tipo === 'directo';

    if (esDirecto) {
        const otro = miembros.find(m => m.user_id !== currentUserId);
        const nombre = otro?.profiles?.nombre || canal.nombre;
        const color  = getAvatarColor(otro?.user_id);
        document.getElementById('canalIcono').innerHTML  = `<div class="canal-avatar-md" style="background:${color}">${getInitials(nombre)}</div>`;
        document.getElementById('canalNombre').textContent = nombre;
        document.getElementById('canalDesc').textContent   = 'Mensaje directo';
    } else {
        document.getElementById('canalIcono').innerHTML  = '<i class="fas fa-hashtag"></i>';
        document.getElementById('canalNombre').textContent = canal.nombre;
        document.getElementById('canalDesc').textContent   = canal.descripcion || `${miembros.length} miembro(s)`;
    }

    document.getElementById('canalMiembrosCount').textContent = miembros.length;

    const btnEliminar = document.getElementById('btnEliminarCanal');
    if (btnEliminar) btnEliminar.style.display = isAdmin() && canal.nombre !== 'general' ? '' : 'none';

    // Limpiar input
    const input = document.getElementById('chatInputTexto');
    if (input) { input.value = ''; autoResizeTextarea(input); }
    chatArchivosSeleccionados = [];
    ticketRefSeleccionado     = null;
    actualizarPreviewArchivosChat();
    quitarTicketRef();

    // Cargar mensajes
    await cargarMensajes();

    // Polling cada 5 segundos para nuevos mensajes
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(polgarNuevosMensajes, 5000);
}

// ============================================
// MENSAJES — CARGA Y RENDER
// ============================================
let ultimoMensajeId = null;

async function cargarMensajes() {
    if (!canalActual) return;
    const area = document.getElementById('chatMensajesArea');
    if (!area) return;
    area.innerHTML = '<div class="chat-mensajes-loading"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes...</div>';

    try {
        const mensajes = await apiFetch(`/api/v2/chat/canales/${canalActual.id}/mensajes`);
        renderMensajes(mensajes);
        if (mensajes.length) ultimoMensajeId = mensajes[mensajes.length - 1].id;
        // Scroll al final
        setTimeout(() => { area.scrollTop = area.scrollHeight; }, 50);
    } catch (err) {
        area.innerHTML = `<div class="chat-mensajes-loading" style="color:#dc2626"><i class="fas fa-exclamation-circle"></i> Error al cargar mensajes</div>`;
    }
}

async function polgarNuevosMensajes() {
    if (!canalActual) return;
    try {
        // Cargar los últimos mensajes y añadir solo los nuevos
        const mensajes = await apiFetch(`/api/v2/chat/canales/${canalActual.id}/mensajes?limit=20`);
        if (!mensajes.length) return;

        const nuevoUltimo = mensajes[mensajes.length - 1].id;
        if (nuevoUltimo === ultimoMensajeId) return; // No hay nuevos

        // Renderizar solo los nuevos
        const area = document.getElementById('chatMensajesArea');
        if (!area) return;

        // Encontrar mensajes nuevos
        const existingIds = new Set(
            [...area.querySelectorAll('[data-mensaje-id]')].map(el => el.dataset.mensajeId)
        );
        const nuevos = mensajes.filter(m => !existingIds.has(m.id));

        const eraAlFinal = area.scrollHeight - area.scrollTop - area.clientHeight < 80;

        nuevos.forEach(m => {
            const div = document.createElement('div');
            div.innerHTML = renderMensajeItem(m);
            const el = div.firstElementChild;
            if (el) area.appendChild(el);
        });

        if (nuevos.length) {
            ultimoMensajeId = nuevoUltimo;
            if (eraAlFinal) area.scrollTop = area.scrollHeight;
        }
    } catch (err) {
        // Silencioso en polling
    }
}

function renderMensajes(mensajes) {
    const area = document.getElementById('chatMensajesArea');
    if (!area) return;

    if (!mensajes.length) {
        area.innerHTML = `<div class="chat-vacio">
            <i class="fas fa-comment-slash"></i>
            <p>Sin mensajes aún</p>
            <span>¡Sé el primero en escribir algo!</span>
        </div>`;
        return;
    }

    let html = '';
    let fechaAnterior = null;

    mensajes.forEach(m => {
        const fechaMsg = new Date(m.created_at).toDateString();
        if (fechaMsg !== fechaAnterior) {
            html += `<div class="chat-fecha-divider"><span>${formatFechaChat(m.created_at)}</span></div>`;
            fechaAnterior = fechaMsg;
        }
        html += renderMensajeItem(m);
    });

    area.innerHTML = html;
}

function renderMensajeItem(m) {
    const esPropio  = m.user_id === currentUserId;
    const nombre    = m.profiles?.nombre || 'Desconocido';
    const color     = getAvatarColor(m.user_id);
    const archivos  = m.chat_mensajes_archivos || [];
    const ticket    = m.tickets;

    const archivosHtml = archivos.map(a => `
        <div class="chat-archivo-chip" onclick="descargarArchivoChat('${a.id}', '${escHtml(a.nombre_original)}')">
            ${iconoArchivo(a.mime_type)}
            <span>${escHtml(a.nombre_original)}</span>
            <small>${formatBytes(a.tamanio)}</small>
        </div>
    `).join('');

    const ticketRefHtml = ticket ? `
        <a href="./tickets.html" class="chat-ticket-preview" onclick="irATicket('${m.ticket_ref_id}')">
            <div class="chat-ticket-preview-icon"><i class="fas fa-ticket-alt"></i></div>
            <div class="chat-ticket-preview-info">
                <span class="chat-ticket-preview-num">#${ticket.numero}</span>
                <span class="chat-ticket-preview-asunto">${escHtml(ticket.asunto)}</span>
                <span class="estado-badge estado-${escHtml(ticket.estado)}" style="font-size:0.7rem">${ticket.estado}</span>
            </div>
        </a>` : '';

    return `<div class="chat-mensaje ${esPropio ? 'propio' : ''}" data-mensaje-id="${m.id}">
        ${!esPropio ? `<div class="chat-msg-avatar" style="background:${color}" title="${escHtml(nombre)}">${getInitials(nombre)}</div>` : ''}
        <div class="chat-msg-contenido">
            ${!esPropio ? `<div class="chat-msg-autor">${escHtml(nombre)} <span class="chat-msg-hora">${formatHoraChat(m.created_at)}</span></div>` : ''}
            ${m.contenido ? `<div class="chat-msg-texto">${escHtml(m.contenido)}</div>` : ''}
            ${archivosHtml ? `<div class="chat-msg-archivos">${archivosHtml}</div>` : ''}
            ${ticketRefHtml}
            ${esPropio ? `<div class="chat-msg-hora-propio">${formatHoraChat(m.created_at)}</div>` : ''}
        </div>
        ${esPropio || isAdmin() ? `
            <button class="btn-eliminar-mensaje" onclick="eliminarMensaje('${m.id}')" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>` : ''}
    </div>`;
}

// ============================================
// ENVIAR MENSAJE
// ============================================
function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensajeChat();
    }
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function enviarMensajeChat() {
    if (!canalActual) return;

    const input   = document.getElementById('chatInputTexto');
    const texto   = input?.value.trim() || '';
    const archivos = chatArchivosSeleccionados;

    if (!texto && !archivos.length) return;

    const btn = document.getElementById('chatSendBtn');
    if (btn) btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('contenido', texto);
        if (ticketRefSeleccionado) formData.append('ticket_ref_id', ticketRefSeleccionado.id);
        archivos.forEach(f => formData.append('files', f));

        const res = await fetch(`${API_URL}/api/v2/chat/canales/${canalActual.id}/mensajes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hola_token')}` },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `Error ${res.status}` }));
            throw new Error(err.error);
        }

        const nuevoMensaje = await res.json();

        // Limpiar
        if (input) { input.value = ''; autoResizeTextarea(input); }
        chatArchivosSeleccionados = [];
        ticketRefSeleccionado     = null;
        actualizarPreviewArchivosChat();
        quitarTicketRef();

        // Añadir al DOM inmediatamente
        const area = document.getElementById('chatMensajesArea');
        if (area) {
            const vacio = area.querySelector('.chat-vacio');
            if (vacio) vacio.remove();

            const div = document.createElement('div');
            div.innerHTML = renderMensajeItem(nuevoMensaje);
            area.appendChild(div.firstElementChild);
            area.scrollTop = area.scrollHeight;
            ultimoMensajeId = nuevoMensaje.id;
        }
    } catch (err) {
        showToast('Error', err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
        input?.focus();
    }
}

async function eliminarMensaje(mensajeId) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    try {
        await apiFetch(`/api/v2/chat/mensajes/${mensajeId}`, { method: 'DELETE' });
        const el = document.querySelector(`[data-mensaje-id="${mensajeId}"]`);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.95)';
            setTimeout(() => el.remove(), 200);
        }
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// ARCHIVOS EN CHAT
// ============================================
function triggerChatArchivo() {
    document.getElementById('chatArchivoInput')?.click();
}

function onChatArchivosSeleccionados() {
    const input = document.getElementById('chatArchivoInput');
    if (!input?.files?.length) return;
    Array.from(input.files).forEach(f => chatArchivosSeleccionados.push(f));
    input.value = '';
    actualizarPreviewArchivosChat();
}

function actualizarPreviewArchivosChat() {
    const preview = document.getElementById('chatArchivosPreview');
    if (!preview) return;
    if (!chatArchivosSeleccionados.length) { preview.style.display = 'none'; return; }

    preview.style.display = 'flex';
    preview.innerHTML = chatArchivosSeleccionados.map((f, i) => `
        <div class="archivo-preview-chip">
            ${iconoArchivo(f.type)}
            <span>${escHtml(f.name)}</span>
            <small>${formatBytes(f.size)}</small>
            <button onclick="quitarArchivoChat(${i})" title="Quitar"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

function quitarArchivoChat(index) {
    chatArchivosSeleccionados.splice(index, 1);
    actualizarPreviewArchivosChat();
}

async function descargarArchivoChat(archivoId, nombre) {
    try {
        const { url } = await apiFetch(`/api/v2/chat/archivos/${archivoId}/url`);
        const a = document.createElement('a');
        a.href = url; a.download = nombre; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
        showToast('Error', 'No se pudo descargar el archivo', 'error');
    }
}

// ============================================
// REFERENCIA A TICKET
// ============================================
function abrirModalReferenciarTicket() {
    filtrarTicketsRef();
    const modal = document.getElementById('modalReferenciarTicket');
    if (modal) modal.style.display = 'flex';
    document.getElementById('buscarTicketRef')?.focus();
}

function cerrarModalReferenciarTicket() {
    const modal = document.getElementById('modalReferenciarTicket');
    if (modal) modal.style.display = 'none';
}

function filtrarTicketsRef() {
    const buscar = document.getElementById('buscarTicketRef')?.value.toLowerCase() || '';
    const lista  = document.getElementById('ticketRefLista');
    if (!lista) return;

    const filtrados = todosTickets.filter(t =>
        !buscar ||
        `#${t.numero}`.includes(buscar) ||
        t.asunto.toLowerCase().includes(buscar)
    ).slice(0, 15);

    if (!filtrados.length) {
        lista.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;padding:12px;text-align:center">Sin resultados</div>';
        return;
    }

    lista.innerHTML = filtrados.map(t => `
        <div class="ticket-ref-item" onclick="seleccionarTicketRef(${JSON.stringify(t).replace(/"/g, '&quot;')})">
            <span class="ticket-numero">#${t.numero}</span>
            <span class="ticket-ref-asunto">${escHtml(t.asunto)}</span>
            <span class="estado-badge estado-${escHtml(t.estado)}" style="font-size:0.72rem">${t.estado}</span>
        </div>
    `).join('');
}

function seleccionarTicketRef(ticket) {
    ticketRefSeleccionado = ticket;
    const refDiv  = document.getElementById('chatTicketRef');
    const refText = document.getElementById('chatTicketRefText');
    if (refDiv)  refDiv.style.display = 'flex';
    if (refText) refText.textContent  = `#${ticket.numero} — ${ticket.asunto}`;
    cerrarModalReferenciarTicket();
    document.getElementById('chatInputTexto')?.focus();
}

function quitarTicketRef() {
    ticketRefSeleccionado = null;
    const refDiv = document.getElementById('chatTicketRef');
    if (refDiv) refDiv.style.display = 'none';
}

function irATicket(ticketId) {
    // Guardar el id en sessionStorage para que tickets.html lo abra directamente
    sessionStorage.setItem('abrirTicketId', ticketId);
    window.location.href = './tickets.html';
}

// ============================================
// PANEL MIEMBROS
// ============================================
function abrirPanelMiembros() {
    const panel = document.getElementById('panelMiembros');
    if (!panel) return;
    panel.style.display = 'flex';

    const miembros = canalActual?.chat_canales_miembros || [];
    const lista    = document.getElementById('panelMiembrosLista');
    const footer   = document.getElementById('panelMiembrosFooter');

    if (lista) {
        lista.innerHTML = miembros.map(m => {
            const nombre = m.profiles?.nombre || 'Desconocido';
            const color  = getAvatarColor(m.user_id);
            return `<div class="miembro-item">
                <div class="avatar-sm" style="background:${color}">${getInitials(nombre)}</div>
                <span>${escHtml(nombre)}</span>
                ${m.rol === 'admin' ? '<span class="rol-badge">admin</span>' : ''}
            </div>`;
        }).join('') || '<div style="color:var(--gray);font-size:0.85rem;padding:12px">Sin miembros</div>';
    }

    if (footer) footer.style.display = isAdmin() ? 'block' : 'none';
}

function cerrarPanelMiembros() {
    const panel = document.getElementById('panelMiembros');
    if (panel) panel.style.display = 'none';
}

// ============================================
// MODAL: NUEVO CANAL
// ============================================
function abrirModalNuevoCanal() {
    renderMiembrosCheckbox('nuevoCanal_miembros', []);
    document.getElementById('canalNombreInput').value = '';
    document.getElementById('canalDescInput').value   = '';
    const modal = document.getElementById('modalNuevoCanal');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalNuevoCanal() {
    const modal = document.getElementById('modalNuevoCanal');
    if (modal) modal.style.display = 'none';
}

async function crearCanal() {
    const nombre      = document.getElementById('canalNombreInput')?.value.trim();
    const descripcion = document.getElementById('canalDescInput')?.value.trim();

    if (!nombre) { showToast('Error', 'El nombre es obligatorio', 'error'); return; }

    const miembrosIds = Array.from(
        document.querySelectorAll('#nuevoCanal_miembros .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    try {
        const canal = await apiFetch('/api/v2/chat/canales', {
            method: 'POST',
            body: JSON.stringify({ nombre, descripcion, miembros: miembrosIds }),
        });
        showToast('Canal creado', `#${nombre}`, 'success');
        cerrarModalNuevoCanal();
        await cargarCanales();
        // Abrir el canal recién creado
        const nuevo = canales.find(c => c.id === canal.id) || canal;
        abrirCanal(nuevo);
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MODAL: NUEVO MENSAJE DIRECTO
// ============================================
function abrirModalNuevoDirecto() {
    // Excluir al propio usuario
    const otros = operarios.filter(op => op.id !== currentUserId);
    renderMiembrosCheckbox('nuevoDirecto_operarios', [], otros, true);
    const modal = document.getElementById('modalNuevoDirecto');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalNuevoDirecto() {
    const modal = document.getElementById('modalNuevoDirecto');
    if (modal) modal.style.display = 'none';
}

async function crearMensajeDirecto() {
    const seleccionados = Array.from(
        document.querySelectorAll('#nuevoDirecto_operarios .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    if (!seleccionados.length) { showToast('Aviso', 'Selecciona un compañero', 'warning'); return; }
    if (seleccionados.length > 1) { showToast('Aviso', 'Los mensajes directos son de uno a uno', 'warning'); return; }

    const destinatarioId = seleccionados[0];
    const destinatario   = operarios.find(op => op.id === destinatarioId);

    try {
        // Verificar si ya existe un canal directo con esa persona
        const existente = canales.find(c =>
            c.tipo === 'directo' &&
            c.chat_canales_miembros?.some(m => m.user_id === destinatarioId)
        );

        if (existente) {
            cerrarModalNuevoDirecto();
            abrirCanal(existente);
            return;
        }

        const canal = await apiFetch('/api/v2/chat/canales', {
            method: 'POST',
            body: JSON.stringify({
                nombre:   `dm_${currentUserId}_${destinatarioId}`,
                tipo:     'directo',
                miembros: [destinatarioId],
            }),
        });
        showToast('Conversación iniciada', destinatario?.nombre || '', 'success');
        cerrarModalNuevoDirecto();
        await cargarCanales();
        const nuevo = canales.find(c => c.id === canal.id) || canal;
        abrirCanal(nuevo);
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MODAL: AÑADIR MIEMBROS
// ============================================
function abrirModalAnadirMiembros() {
    const actualesIds = (canalActual?.chat_canales_miembros || []).map(m => m.user_id);
    renderMiembrosCheckbox('anadirMiembros_lista', actualesIds);
    const modal = document.getElementById('modalAnadirMiembros');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalAnadirMiembros() {
    const modal = document.getElementById('modalAnadirMiembros');
    if (modal) modal.style.display = 'none';
}

async function guardarNuevosMiembros() {
    const seleccionados = Array.from(
        document.querySelectorAll('#anadirMiembros_lista .operario-check-item.checked')
    ).map(el => el.dataset.userId);

    if (!seleccionados.length) { showToast('Aviso', 'Selecciona al menos un miembro', 'warning'); return; }

    try {
        await apiFetch(`/api/v2/chat/canales/${canalActual.id}/miembros`, {
            method: 'POST',
            body: JSON.stringify({ miembros: seleccionados }),
        });
        showToast('Miembros añadidos', '', 'success');
        cerrarModalAnadirMiembros();
        await cargarCanales();
        // Actualizar canal actual con los nuevos miembros
        canalActual = canales.find(c => c.id === canalActual.id) || canalActual;
        document.getElementById('canalMiembrosCount').textContent =
            (canalActual?.chat_canales_miembros || []).length;
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// ELIMINAR CANAL
// ============================================
async function eliminarCanalActual() {
    if (!canalActual || !isAdmin()) return;
    if (!confirm(`¿Eliminar el canal "#${canalActual.nombre}"? Se borrarán todos los mensajes.`)) return;

    try {
        await apiFetch(`/api/v2/chat/canales/${canalActual.id}`, { method: 'DELETE' });
        showToast('Canal eliminado', '', 'success');
        canalActual = null;
        if (pollingInterval) clearInterval(pollingInterval);
        document.getElementById('chatCanalActivo').style.display = 'none';
        document.getElementById('chatEmpty').style.display       = 'flex';
        await cargarCanales();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================
// MOBILE: VOLVER AL SIDEBAR
// ============================================
function volverASidebar() {
    document.getElementById('chatSidebar').classList.add('visible');
}

// ============================================
// HELPERS DE RENDER
// ============================================
function renderMiembrosCheckbox(containerId, selectedIds, lista = null, soloUno = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const fuente = lista || operarios;
    container.innerHTML = fuente.map(op => {
        const color   = getAvatarColor(op.id);
        const checked = selectedIds.includes(op.id);
        return `<div class="operario-check-item ${checked ? 'checked' : ''}" data-user-id="${op.id}"
                     onclick="toggleOperarioCheck(this, ${soloUno})">
            <div class="operario-check-avatar" style="background:${color}">${getInitials(op.nombre)}</div>
            <span class="operario-check-nombre">${escHtml(op.nombre)}</span>
            <span style="font-size:0.75rem;color:var(--gray)">${op.rol || ''}</span>
            <div class="operario-check-tick">${checked ? '<i class="fas fa-check"></i>' : ''}</div>
        </div>`;
    }).join('') || '<p style="color:var(--gray);font-size:0.88rem">Sin operarios disponibles</p>';
}

function toggleOperarioCheck(el, soloUno = false) {
    if (soloUno) {
        // Solo un elemento seleccionado a la vez
        const container = el.parentElement;
        container.querySelectorAll('.operario-check-item').forEach(item => {
            item.classList.remove('checked');
            const t = item.querySelector('.operario-check-tick');
            if (t) t.innerHTML = '';
        });
    }
    el.classList.toggle('checked');
    const tick = el.querySelector('.operario-check-tick');
    if (tick) tick.innerHTML = el.classList.contains('checked') ? '<i class="fas fa-check"></i>' : '';
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

function formatFechaChat(isoStr) {
    if (!isoStr) return '';
    const d   = new Date(isoStr);
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())  return 'Hoy';
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatHoraChat(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function iconoArchivo(mime) {
    if (!mime) return '<i class="fas fa-paperclip"></i>';
    if (mime.startsWith('image/'))                           return '<i class="fas fa-image" style="color:#3b82f6"></i>';
    if (mime === 'application/pdf')                          return '<i class="fas fa-file-pdf" style="color:#ef4444"></i>';
    if (mime.includes('word'))                               return '<i class="fas fa-file-word" style="color:#2563eb"></i>';
    if (mime.includes('excel') || mime.includes('sheet'))    return '<i class="fas fa-file-excel" style="color:#16a34a"></i>';
    if (mime.includes('zip') || mime.includes('compressed')) return '<i class="fas fa-file-archive" style="color:#d97706"></i>';
    return '<i class="fas fa-file" style="color:#64748b"></i>';
}

// ============================================
// TOAST
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

// Limpiar polling al salir
window.addEventListener('beforeunload', () => {
    if (pollingInterval) clearInterval(pollingInterval);
});