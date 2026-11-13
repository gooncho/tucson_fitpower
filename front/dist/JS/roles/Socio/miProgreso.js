/**
 * Mi progreso (Socio).
 * Peso actual, racha, asistencias, objetivo actual y un calendario semanal
 * que marca los días que fue al gimnasio. También registra peso y asistencia.
 */

// Semana que se ve en el calendario (se mueve con las flechas).
let semanaActual = new Date();
let fechasAsistencia = [];
let edadSocio = null;
let alturaSocio = null;

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
    document.getElementById('inputPeso')?.addEventListener('input', actualizarCalculos);
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
    edadSocio = data.edad !== null ? Number(data.edad) : null;
    alturaSocio = data.altura !== null ? Number(data.altura) : null;
    renderCalendario();
    actualizarCalculos();

    document.getElementById('valorPeso').textContent = data.peso_actual !== null ? `${data.peso_actual} kg` : 'Sin mediciones';
    renderHistorialProgreso(data.historial_progreso || []);
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

function actualizarCalculos() {
    const peso = Number(document.getElementById('inputPeso')?.value || 0);
    const campoIMC = document.getElementById('inputIMC');
    const campoGrasa = document.getElementById('inputGrasa');
    const campoMasa = document.getElementById('inputMasaMagra');
    const mensaje = document.getElementById('mensajeCalculo');

    if (!peso || !edadSocio || !alturaSocio) {
        campoIMC.value = '';
        campoGrasa.value = '';
        campoMasa.value = '';
        mensaje.textContent = !edadSocio || !alturaSocio ? 'Completá tu fecha de nacimiento y altura en Perfil para calcular estos valores.' : 'Ingresá tu peso para ver los cálculos.';
        return;
    }

    const alturaMetros = alturaSocio / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    const grasa = (1.2 * imc) + (0.23 * edadSocio) - 10.8 - 5.4;
    const masaMagra = peso * (1 - grasa / 100);

    campoIMC.value = imc.toFixed(2);
    if (grasa < 0 || grasa > 100) {
        campoGrasa.value = 'No válido';
        campoMasa.value = 'No válido';
        mensaje.textContent = 'Revisá los datos del perfil y el peso ingresado.';
        return;
    }

    campoGrasa.value = `${grasa.toFixed(2)} %`;
    campoMasa.value = `${masaMagra.toFixed(2)} kg`;
    mensaje.textContent = 'Porcentaje de grasa y masa magra estimados automáticamente.';
}

async function guardarPeso(e) {
    e.preventDefault();
    const peso = document.getElementById('inputPeso').value;
    const observaciones = document.getElementById('inputObservaciones').value.trim();
    const mensaje = document.getElementById('mensajePeso');

    if (!peso) {
        mensaje.textContent = 'Ingresá tu peso para calcular la medición.';
        mensaje.className = 'small mt-2 mb-0 text-danger';
        return;
    }

    const respuesta = await API.request('/progreso/medicion', 'POST', {
        peso,
        observaciones
    });

    mensaje.textContent = respuesta.message || (respuesta.status === 'ok' ? 'Medición guardada.' : 'No se pudo guardar la medición.');
    mensaje.className = 'small mt-2 mb-0 ' + (respuesta.status === 'ok' ? 'text-success' : 'text-danger');
    if (respuesta.status === 'ok') {
        document.getElementById('formPeso').reset();
        actualizarCalculos();
        await cargarProgresoSocio();
    }
}

function renderHistorialProgreso(registros) {
    const tbody = document.getElementById('tbodyProgreso');
    if (!tbody) return;
    if (!registros.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-with">Todavía no hay mediciones.</td></tr>';
        return;
    }
    tbody.innerHTML = registros.map(registro => `
        <tr>
            <td>${formatearFecha(registro.fecha)}</td>
            <td>${registro.peso !== null ? `${registro.peso} kg` : '—'}</td>
            <td>${registro.masa_magra !== null ? `${registro.masa_magra} kg` : '—'}</td>
            <td>${registro.grasa !== null ? `${registro.grasa}%` : '—'}</td>
            <td>${escTexto(registro.observaciones || '—')}</td>
        </tr>
    `).join('');
}

function escTexto(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter]));
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
