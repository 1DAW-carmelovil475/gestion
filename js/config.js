// ============================================
// HOLA INFORMÁTICA — CONFIG GLOBAL
// ============================================

'use strict';

// ⚠️ CAMBIA ESTO por tu URL real del backend en producción
// En desarrollo: 'http://localhost:3000'
// En producción: 'https://tu-backend.railway.app' (o donde tengas el backend)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://TU_BACKEND_URL_AQUI'; // ← IMPORTANTE: cambia esto

// ============================================
// FETCH WRAPPER
// ============================================
async function apiFetch(path, options = {}) {
    const token = sessionStorage.getItem('hola_token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    };

    // Si el body ya es string (JSON.stringify), no sobreescribir Content-Type
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    let url;
    if (path.startsWith('http')) {
        url = path;
    } else {
        url = `${API_URL}${path}`;
    }

    let res;
    try {
        res = await fetch(url, config);
    } catch (networkError) {
        // Error de red (servidor caído, CORS bloqueado, etc.)
        throw new Error(`Error de conexión con el servidor. ¿Está el backend corriendo en ${API_URL}?`);
    }

    // Si la respuesta NO es JSON, es el error "Unexpected token '<'"
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('El servidor devolvió HTML en vez de JSON:', text.substring(0, 200));
        throw new Error(`El servidor devolvió una respuesta inesperada (${res.status}). Comprueba que el backend esté corriendo en ${API_URL}`);
    }

    const data = await res.json();

    if (res.status === 401) {
        // Token expirado → redirigir al login
        sessionStorage.clear();
        window.location.replace('./index.html');
        throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
    }

    if (!res.ok) {
        throw new Error(data.error || data.message || `Error ${res.status}`);
    }

    return data;
}

// ============================================
// GESTIÓN DE SESIÓN / ROL
// ============================================
async function initUserSession() {
    const token = sessionStorage.getItem('hola_token');
    if (!token) {
        window.location.replace('./index.html');
        return null;
    }

    try {
        const me = await apiFetch('/api/auth/me');
        sessionStorage.setItem('hola_usuario', me.nombre || me.email);
        sessionStorage.setItem('hola_rol', me.rol);
        sessionStorage.setItem('hola_id', me.id);

        // Actualizar nombre en UI
        const nameEl = document.getElementById('usuarioNombre');
        if (nameEl) nameEl.textContent = me.nombre || me.email;

        // Mostrar/ocultar elementos solo-admin
        applyRoleRestrictions(me.rol);

        return me;
    } catch (err) {
        console.error('Error inicializando sesión:', err);
        sessionStorage.clear();
        window.location.replace('./index.html');
        return null;
    }
}

function applyRoleRestrictions(rol) {
    const isAdminUser = rol === 'admin';

    // Elementos con data-admin-only → ocultar si no es admin
    document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = isAdminUser ? '' : 'none';
    });
}

function isAdmin() {
    return sessionStorage.getItem('hola_rol') === 'admin';
}

function getCurrentUserId() {
    return sessionStorage.getItem('hola_id');
}