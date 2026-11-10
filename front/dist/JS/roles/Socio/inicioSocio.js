const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function formatearFecha(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

document.addEventListener('DOMContentLoaded', async () => {
    const respuesta = await API.request('/inicio-socio', 'GET');
    if (respuesta.status !== 'ok' || !respuesta.data) return;
    const d = respuesta.data;

    document.getElementById('valorSemana').textContent = `${d.entrenamientos_semana}/5`;
    document.getElementById('valorMes').textContent = d.asistencia_mes;
    document.getElementById('valorRacha').textContent = d.racha;
    document.getElementById('valorLogros').textContent = d.total_logros;

    document.getElementById('anilloProgreso').style.setProperty('--pct', d.progreso_general);
    document.getElementById('pctProgreso').textContent = `${d.progreso_general}%`;
    document.getElementById('msgProgreso').textContent = d.progreso_general > 0 ? "¡Vas por buen camino!" : "¡Empieza ahora!";

    if (d.rutina) {
        document.getElementById('nombreRutina').textContent = `Rutina: ${d.rutina.nombre}`;
        document.getElementById('verRutina').href = `DetalleRutina.html?id=${d.rutina.id_rutina}`;
    } else {
        document.getElementById('nombreRutina').textContent = "Rutina: Sin rutina asignada";
        document.getElementById('verRutina').style.display = "none";
    }
    document.getElementById('diaEntrenamiento').textContent = `Día de entrenamiento: ${d.dia_entrenamiento || "—"}`;
    document.getElementById('duracionEntrenamiento').textContent = d.duracion ? `Duración: ${d.duracion} min` : "Duración: —";

    document.getElementById('planMembresia').textContent = d.plan || "Sin plan";
    document.getElementById('vigenciaMembresia').textContent = d.fecha_fin ? `Válida hasta: ${formatearFecha(d.fecha_fin)}` : "Sin membresía activa";

    document.getElementById('listaLogros').innerHTML = (d.logros || []).length ? d.logros.map(l => `
        <div class="col-6 col-lg-3">
            <div class="achievement-card">
                <div class="ac-icon"><i class="bi bi-trophy-fill"></i></div>
                <div class="ac-title">${esc(l.nombre)}</div>
                <div class="ac-desc">${esc(l.descripcion)}</div>
            </div>
        </div>`).join("") : `<div class="col-12"><p class="welcome-sub">Todavía no tenés logros</p></div>`;
});
