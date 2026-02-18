// ============================================
// HOLA INFORMÁTICA - CONFIGURACIÓN FRONTEND
// ============================================

const API_URL = 'http://localhost:3000';

// Rol del usuario actual (se carga al iniciar sesión)
let currentUserRol = null;

function apiHeaders() {
    const token = sessionStorage.getItem('hola_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: apiHeaders()
    });

    if (res.status === 401) {
        sessionStorage.clear();
        window.location.href = './index.html';
        return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
}

// Carga el perfil del usuario y aplica restricciones de rol en la UI
async function initUserSession() {
    try {
        const me = await apiFetch('/api/auth/me');
        currentUserRol = me.rol;

        // Mostrar nombre en topbar
        const el = document.getElementById('usuarioNombre');
        if (el) el.textContent = me.nombre || me.email;

        // Guardar rol en sessionStorage para uso posterior
        sessionStorage.setItem('hola_rol', me.rol);

        // Mostrar/ocultar sección de usuarios según rol
        applyRoleRestrictions(me.rol);

        return me;
    } catch (e) {
        console.error('Error cargando sesión:', e);
        sessionStorage.clear();
        window.location.href = './index.html';
    }
}

// Oculta elementos reservados para admin si el usuario es trabajador
function applyRoleRestrictions(rol) {
    const adminOnly = document.querySelectorAll('[data-admin-only]');
    adminOnly.forEach(el => {
        el.style.display = rol === 'admin' ? '' : 'none';
    });
}

function isAdmin() {
    return sessionStorage.getItem('hola_rol') === 'admin';
}