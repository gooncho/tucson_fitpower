/**
 * Mi progreso (Socio).
 * Peso actual, racha, asistencias, objetivo actual y un calendario semanal
 * que marca los días que fue al gimnasio. También registra peso y asistencia.
 */

// Semana que se ve en el calendario (se mueve con las flechas).
let semanaActual = new Date();
let fechasAsistencia = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProgresoSocio();
    document.getElementById('semanaAnterior')?.addEventListener('click', () => {
        semanaActual.setDate(semanaActual.getDate() - 7);
        renderCalendario();
    });
    document.getElementById('semanaSiguiente')?.addEventListener('click', () => {
        semanaActual.setDate(semanaActual.getDate() + 7);
        renderCalendario();
    });

    document.getElementById('formPeso')?.addEventListener('submit', guardarPeso);
    document.getElementById('btnMarcarAsistencia')?.addEventListener('click', marcarAsistencia);

    const btnDetalles = document.getElementById('btnVerDetalles');
    if (btnDetalles) {
        btnDetalles.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = "Objetivos.html";
        });
    }
});

// Pide los datos de progreso y llena las tarjetas.
async function cargarProgresoSocio() {
    const respuesta = await API.request('/progreso', 'GET');
    const data = respuesta.status === 'ok' ? respuesta.data : null;
    if (!data) return;

    fechasAsistencia = Array.isArray(data.fechas_asistencia) ? data.fechas_asistencia : [];
    renderCalendario();

    document.getElementById('valorPeso').textContent = data.peso_actual !== null ? `${data.peso_actual} kg` : 'Sin mediciones';
    document.getElementById('fechaPeso').textContent = data.fecha_medicion ? `Última medición: ${formatearFecha(data.fecha_medicion)}` : 'Sin mediciones registradas';
    document.getElementById('valorRutinas').textContent = `${data.asistencias_semana} días`;
    document.getElementById('valorAsistencia').textContent = `${data.asistencias_mes} días`;
    document.getElementById('valorRacha').textContent = `${Number(data.racha || 0)} días`;
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

    const hoy = fechaLocal(new Date());
    const btnAsistencia = document.getElementById('btnMarcarAsistencia');
    if (btnAsistencia && fechasAsistencia.includes(hoy)) {
        btnAsistencia.disabled = true;
        btnAsistencia.textContent = 'Asistencia registrada';
    }
}

// Registra el peso de hoy.
async function guardarPeso(e) {
    e.preventDefault();
    const input = document.getElementById('inputPeso');
    const mensaje = document.getElementById('mensajePeso');
    const peso = Number(input.value);
    if (!peso || peso <= 0 || peso > 500) {
        mensaje.textContent = 'Ingresá un peso válido.';
        mensaje.className = 'small mt-2 mb-0 text-danger';
        return;
    }
    const respuesta = await API.request('/progreso/peso', 'POST', { peso });
    mensaje.textContent = respuesta.message || (respuesta.status === 'ok' ? 'Peso guardado.' : 'No se pudo guardar el peso.');
    mensaje.className = 'small mt-2 mb-0 ' + (respuesta.status === 'ok' ? 'text-success' : 'text-danger');
    if (respuesta.status === 'ok') {
        input.value = '';
        await cargarProgresoSocio();
    }
}

// Marca la asistencia de hoy (una vez por día).
async function marcarAsistencia() {
    const boton = document.getElementById('btnMarcarAsistencia');
    const mensaje = document.getElementById('mensajeAsistencia');
    boton.disabled = true;
    const respuesta = await API.request('/asistencia', 'POST', {});
    mensaje.textContent = respuesta.message || (respuesta.status === 'ok' ? 'Asistencia registrada.' : 'No se pudo registrar la asistencia.');
    mensaje.className = 'small mb-2 ' + (respuesta.status === 'ok' ? 'text-success' : 'text-danger');
    if (respuesta.status === 'ok') {
        await cargarProgresoSocio();
    } else {
        boton.disabled = false;
    }
}

// Fecha como AAAA-MM-DD en hora local (toISOString usaría UTC y podría cambiar el día).
function fechaLocal(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

// Fecha de la base a DD/MM/AAAA.
function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return isNaN(d) ? fecha : d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

// Dibuja de lunes a domingo la semana actual y marca los días con asistencia.
function renderCalendario() {
    const contenedor = document.getElementById('calendarioSemana');
    if (!contenedor) return;
    const inicio = new Date(semanaActual);
    const dia = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - dia);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const formato = d => d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' });
    document.getElementById('rangoSemana').textContent = `${formato(inicio)} - ${formato(fin)}`;
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    contenedor.innerHTML = dias.map((nombre, i) => {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + i);
        const iso = fechaLocal(fecha);
        const asistio = fechasAsistencia.includes(iso);
        return `<div class="calendario-dia ${asistio ? 'asistio' : ''}"><small>${nombre}</small><strong>${fecha.getDate()}</strong><small>${asistio ? 'Asistió' : 'Sin registro'}</small></div>`;
    }).join('');
}
