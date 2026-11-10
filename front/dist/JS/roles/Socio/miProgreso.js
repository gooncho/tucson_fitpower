document.addEventListener('DOMContentLoaded', async () => {
    await cargarProgresoSocio();

    const btnDetalles = document.getElementById('btnVerDetalles');
    if (btnDetalles) {
        btnDetalles.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = "Objetivos.html";
        });
    }
});

async function cargarProgresoSocio() {
    const respuesta = await API.request('/progreso', 'GET');
    const data = respuesta.status === 'ok' ? respuesta.data : null;
    if (!data) return;

    document.getElementById('valorPeso').textContent = data.peso_actual !== null ? `${data.peso_actual} kg` : 'Sin mediciones';
    document.getElementById('fechaPeso').textContent = data.fecha_medicion ? `Última medición: ${formatearFecha(data.fecha_medicion)}` : 'Sin mediciones registradas';
    document.getElementById('valorRutinas').textContent = `${data.asistencias_semana} días`;
    document.getElementById('valorAsistencia').textContent = `${data.asistencias_mes} días`;
    document.getElementById('nombreObjetivo').textContent = data.objetivo ? data.objetivo.titulo : 'Sin objetivo activo';
    document.getElementById('metaObjetivo').textContent = data.objetivo ? data.objetivo.descripcion || data.objetivo.estado : '—';
    document.getElementById('labelMin').textContent = data.peso_actual !== null ? `${data.peso_actual} kg` : '—';
    document.getElementById('labelMax').textContent = data.objetivo ? data.objetivo.estado : '—';
    const porcentaje = Number(data.porcentaje_cumplimiento || 0);
    document.getElementById('porcentajeObjetivos').textContent = `${porcentaje}%`;
    document.getElementById('mensajeObjetivos').textContent = data.objetivo ? data.objetivo.estado : 'Todavía no tenés objetivos';
    const barra = document.getElementById('barraProgreso');
    barra.style.width = `${porcentaje}%`;
    barra.setAttribute('aria-valuenow', porcentaje);
}

function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return isNaN(d) ? fecha : d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
