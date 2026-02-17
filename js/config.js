// ============================================
// HOLA INFORMÁTICA - CONFIGURACIÓN FRONTEND
// Solo cambia API_URL según tu entorno
// ============================================

// URL de tu backend (cambia cuando despliegues)
const API_URL = 'http://localhost:3000';

// Helper: devuelve siempre los headers con el token JWT
function apiHeaders() {
    const token = sessionStorage.getItem('hola_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Helper genérico para fetch con manejo de errores
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: apiHeaders()
    });

    // Si el token expiró, redirigir al login
    if (res.status === 401) {
        sessionStorage.removeItem('hola_token');
        sessionStorage.removeItem('hola_usuario');
        window.location.href = './index.html';
        return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
}
