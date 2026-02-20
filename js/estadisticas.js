// ============================================
// ESTADÍSTICAS — JS
// ============================================

'use strict';

let resumenData = null;
let ticketsRaw = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!sessionStorage.getItem('hola_token')) {
        window.location.replace('./index.html');
        return;
    }
    await initUserSession();
    await cargarTodo();
});

async function cargarTodo() {
    const desde = document.getElementById('globalDesde').value;
    const hasta = document.getElementById('globalHasta').value;

    await Promise.all([
        cargarResumen(),
        cargarTicketsRaw(desde, hasta),
        cargarStatsOperarios(desde, hasta),
        cargarStatsEmpresas(desde, hasta),
    ]);
}

function limpiarFechasGlobal() {
    document.getElementById('globalDesde').value = '';
    document.getElementById('globalHasta').value = '';
    cargarTodo();
}

// ============================================
// RESUMEN GENERAL
// ============================================
async function cargarResumen() {
    try {
        const data = await apiFetch('/api/v2/estadisticas/resumen');
        resumenData = data;

        document.getElementById('gTotal').textContent = data.total;
        document.getElementById('gAbiertos').textContent = data.pendientes + data.en_curso;
        document.getElementById('gCompletados').textContent = data.completados;
        document.getElementById('gFacturados').textContent = data.facturados;
        document.getElementById('gUrgentes').textContent = data.urgentes;
        document.getElementById('g7dias').textContent = data.ultimos_7_dias;
    } catch (err) {
        console.error('Error resumen:', err);
    }
}

// ============================================
// TICKETS RAW (para gráficos de la pestaña Tickets)
// ============================================
async function cargarTicketsRaw(desde, hasta) {
    try {
        const params = new URLSearchParams();
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
        ticketsRaw = await apiFetch(`/api/v2/tickets?${params}`);

        dibujarDonut('donutEstados', 'donutLegendEstados',
            contarPor(ticketsRaw, 'estado'),
            { Pendiente: '#fbbf24', 'En curso': '#3b82f6', Completado: '#22c55e', Facturado: '#a855f7' }
        );

        dibujarDonut('donutPrioridades', 'donutLegendPrioridades',
            contarPor(ticketsRaw, 'prioridad'),
            { Baja: '#22c55e', Media: '#3b82f6', Alta: '#f59e0b', Urgente: '#ef4444' }
        );

        dibujarActividadDiaria(ticketsRaw);
    } catch (err) {
        console.error('Error tickets raw:', err);
    }
}

function contarPor(arr, campo) {
    return arr.reduce((acc, item) => {
        const key = item[campo] || 'Desconocido';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

// ============================================
// OPERARIOS STATS
// ============================================
async function cargarStatsOperarios(desde, hasta) {
    try {
        const params = new URLSearchParams();
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
        const data = await apiFetch(`/api/v2/estadisticas/operarios?${params}`);
        renderOperariosStats(data);
    } catch (err) {
        console.error('Error operarios stats:', err);
    }
}

function renderOperariosStats(operarios) {
    const container = document.getElementById('operariosStatsContainer');

    if (!operarios.length) {
        container.innerHTML = '<div class="empty-state">Sin datos de operarios</div>';
        return;
    }

    // Ordenar por tickets completados desc
    operarios.sort((a, b) => b.tickets_completados - a.tickets_completados);

    container.innerHTML = operarios.map(op => {
        const avgHoras = op.tiempo_promedio_horas != null
            ? formatHoras(op.tiempo_promedio_horas)
            : '—';

        const tasaCompletado = op.tickets_totales > 0
            ? Math.round((op.tickets_completados / op.tickets_totales) * 100)
            : 0;

        const color = getOperarioColor(op.id);
        const initials = getInitials(op.nombre);

        return `<div class="operario-stat-card">
            <div class="operario-stat-header">
                <div class="operario-stat-avatar" style="background:${color}">${initials}</div>
                <div class="operario-stat-nombre">
                    <h3>${esc(op.nombre)}</h3>
                    <span>${op.tickets_pendientes} pendientes</span>
                </div>
            </div>
            <div class="operario-stat-metrics">
                <div class="metric">
                    <div class="metric-value">${op.tickets_totales}</div>
                    <div class="metric-label">Tickets totales</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color:#22c55e">${op.tickets_completados}</div>
                    <div class="metric-label">Completados</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color:#0066ff">${op.horas_totales.toFixed(1)}h</div>
                    <div class="metric-label">Horas totales</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color:#d97706">${avgHoras}</div>
                    <div class="metric-label">Tiempo medio resolución</div>
                </div>
            </div>
            <div class="operario-stat-bar">
                <div class="bar-label">
                    <span>Tasa de resolución</span>
                    <span style="font-weight:700;color:${color}">${tasaCompletado}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${tasaCompletado}%;background:${color}"></div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// EMPRESAS STATS
// ============================================
async function cargarStatsEmpresas(desde, hasta) {
    try {
        const params = new URLSearchParams();
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
        const data = await apiFetch(`/api/v2/estadisticas/empresas?${params}`);
        renderEmpresasStats(data);
    } catch (err) {
        console.error('Error empresas stats:', err);
    }
}

function renderEmpresasStats(empresas) {
    const container = document.getElementById('empresasStatsBody');

    if (!empresas.length) {
        container.innerHTML = '<div class="empty-state">Sin datos de empresas</div>';
        return;
    }

    const maxTotal = Math.max(...empresas.map(e => e.total));

    container.innerHTML = `<div class="empresa-stats-list">
        ${empresas.map((e, idx) => {
            const pct = maxTotal > 0 ? Math.round((e.total / maxTotal) * 100) : 0;
            const rankColor = idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : idx === 2 ? '#22c55e' : '#64748b';
            return `<div class="empresa-stat-row">
                <div class="empresa-stat-rank" style="color:${rankColor};font-weight:800">#${idx + 1}</div>
                <div class="empresa-stat-info">
                    <div class="empresa-stat-nombre">${esc(e.nombre)}</div>
                    <div class="empresa-stat-bar-wrap">
                        <div class="empresa-progress-bar">
                            <div class="empresa-progress-fill" style="width:${pct}%;background:${rankColor}"></div>
                        </div>
                    </div>
                </div>
                <div class="empresa-stat-badges">
                    <span class="mini-badge" style="background:#fef3c7;color:#92400e" title="Pendientes">${e.pendientes}P</span>
                    <span class="mini-badge" style="background:#dbeafe;color:#1d4ed8" title="En curso">${e.en_curso}C</span>
                    <span class="mini-badge" style="background:#dcfce7;color:#15803d" title="Completados">${e.completados}✓</span>
                    ${e.urgentes > 0 ? `<span class="mini-badge" style="background:#fee2e2;color:#b91c1c"><i class="fas fa-exclamation-circle"></i> ${e.urgentes}</span>` : ''}
                </div>
                <div class="empresa-stat-total">${e.total}</div>
            </div>`;
        }).join('')}
    </div>`;
}

// ============================================
// GRÁFICOS — Canvas puro (sin Chart.js)
// ============================================

function dibujarDonut(canvasId, legendId, datos, coloresMap) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 10;
    const r = R * 0.55; // agujero interior

    const entries = Object.entries(datos);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    ctx.clearRect(0, 0, W, H);

    if (!total) {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    let startAngle = -Math.PI / 2;

    entries.forEach(([key, val]) => {
        const angle = (val / total) * Math.PI * 2;
        const color = coloresMap[key] || '#94a3b8';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += angle;
    });

    // Agujero blanco
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Total en el centro
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold 26px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy);

    // Leyenda
    const legend = document.getElementById(legendId);
    legend.innerHTML = entries.map(([key, val]) => {
        const color = coloresMap[key] || '#94a3b8';
        const pct = Math.round((val / total) * 100);
        return `<div class="legend-item">
            <span class="legend-dot" style="background:${color}"></span>
            <span class="legend-key">${esc(key)}</span>
            <span class="legend-val">${val} (${pct}%)</span>
        </div>`;
    }).join('');
}

function dibujarActividadDiaria(tickets) {
    const container = document.getElementById('actividadChart');
    // Generar array de los últimos 28 días
    const dias = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dias.push(d.toISOString().split('T')[0]);
    }

    // Contar tickets creados por día
    const countByDay = {};
    dias.forEach(d => countByDay[d] = 0);
    tickets.forEach(t => {
        const dia = t.created_at?.split('T')[0];
        if (dia && countByDay[dia] !== undefined) countByDay[dia]++;
    });

    const maxVal = Math.max(...Object.values(countByDay), 1);

    container.innerHTML = `<div class="bar-chart-wrapper">
        ${dias.map((d, i) => {
            const val = countByDay[d];
            const h = Math.max((val / maxVal) * 100, val > 0 ? 4 : 0);
            const label = i % 7 === 0 ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
            return `<div class="bar-col">
                <div class="bar-val-label">${val > 0 ? val : ''}</div>
                <div class="bar-bar-wrap">
                    <div class="bar-bar" style="height:${h}%;background:${val > 0 ? '#0066ff' : '#e2e8f0'}"
                         title="${d}: ${val} ticket(s)"></div>
                </div>
                <div class="bar-day-label">${label}</div>
            </div>`;
        }).join('')}
    </div>`;
}

// ============================================
// TABS
// ============================================
function mostrarTab(tabName) {
    document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.stats-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.stats-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ============================================
// UTILIDADES
// ============================================
const COLORS = ['#0066ff','#16a34a','#d97706','#dc2626','#9333ea','#0891b2','#be185d','#065f46'];

function getOperarioColor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatHoras(horas) {
    if (horas == null) return '—';
    if (horas < 1) return `${Math.round(horas * 60)}min`;
    if (horas < 24) return `${horas.toFixed(1)}h`;
    const dias = Math.floor(horas / 24);
    const restH = Math.round(horas % 24);
    return `${dias}d ${restH}h`;
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.success}"></i>
        <div class="toast-content">
            <div class="toast-title">${esc(title)}</div>
            ${message ? `<div class="toast-message">${esc(message)}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}