/**
 * Membresía del Socio: plan actual, precio, estado y fechas.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await cargarMembresiaSocio();
});
// Si no tiene plan, muestra "Sin membresía" en todos los campos.
async function cargarMembresiaSocio() {
    const respuesta = await API.request('/membresia', 'GET');
    const d = respuesta.status === 'ok' ? respuesta.data : null;
    if (!d || !d.nombre_plan) {
        document.getElementById('nombrePlan').textContent = 'Sin membresía';
        document.getElementById('precioPlan').textContent = '—';
        document.getElementById('estadoMembresia').textContent = 'Sin membresía';
        document.getElementById('fechaInicio').textContent = '—';
        document.getElementById('fechaVencimiento').textContent = '—';
        document.getElementById('listaBeneficios').innerHTML = '<li>No hay beneficios asociados a una membresía.</li>';
        return;
    }
    document.getElementById('nombrePlan').textContent = d.nombre_plan;
    document.getElementById('precioPlan').textContent = `$${Number(d.precio).toLocaleString('es-UY')} / ${d.duracion || 'plan'}`;
    document.getElementById('estadoMembresia').textContent = d.estado;
    document.getElementById('fechaInicio').textContent = formatearFecha(d.fecha_inicio);
    document.getElementById('fechaVencimiento').textContent = formatearFecha(d.fecha_fin);
    document.getElementById('listaBeneficios').innerHTML = d.descripcion ? `<li class="d-flex align-items-center gap-2"><i class="bi bi-check-lg fs-5 text-light"></i>${d.descripcion}</li>` : '<li>El plan no tiene beneficios descriptos.</li>';
}

// Fecha de la base a DD/MM/AAAA.
function formatearFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}