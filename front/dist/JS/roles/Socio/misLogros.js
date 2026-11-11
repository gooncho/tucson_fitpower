document.addEventListener('DOMContentLoaded', cargarLogros);

async function cargarLogros() {
    const contenedor = document.getElementById('listaLogros');
    const respuesta = await API.request('/logros', 'GET');
    if (respuesta.status !== 'ok' || !Array.isArray(respuesta.data) || respuesta.data.length === 0) {
        contenedor.innerHTML = '<p class="text-with">Todavía no obtuviste logros. Seguí entrenando para desbloquearlos.</p>';
        return;
    }
    contenedor.innerHTML = respuesta.data.map(logro => {
        const icono = String(logro.icono || '').trim();
        const esBootstrap = icono.startsWith('bi-');
        const fecha = logro.fecha_obtenido ? new Date(logro.fecha_obtenido + 'T00:00:00').toLocaleDateString('es-UY') : 'Fecha no disponible';
        return `<article class="logro-card"><div class="logro-icono">${esBootstrap ? `<i class="bi ${escLogro(icono)}"></i>` : '<i class="bi bi-trophy-fill"></i>'}</div><h3>${escLogro(logro.nombre)}</h3><p>${escLogro(logro.descripcion || 'Logro desbloqueado por tu esfuerzo')}</p><small>Fecha obtenido<br>${fecha}</small></article>`;
    }).join('');
}

function escLogro(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
