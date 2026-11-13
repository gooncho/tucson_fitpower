/**
 * Objetivos (Socio).
 *
 * Lista de objetivos con filtros (todos, en curso, completados, pausados).
 * El mismo modal sirve para crear y editar; eliminar pide confirmación.
 */

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let listaObjetivos = [];
let filtroActual = 'todos';
let modalObjetivoInstance = null;
// Id del objetivo que se edita en el modal, o null si es uno nuevo.
let objetivoEditando = null;
// Objetivo elegido para eliminar (se confirma en el modal).
let objetivoAEliminar = null;

document.addEventListener('DOMContentLoaded', async () => {
    const modalEl = document.getElementById('modalNuevoObjetivo');
    if (modalEl) modalObjetivoInstance = new bootstrap.Modal(modalEl);
    await cargarObjetivos();

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-tab').forEach(t => {
                t.classList.remove('active', 'text-light');
                t.classList.add('text-whit');
                t.style.background = '#151515';
            });
            tab.classList.add('active', 'text-light');
            tab.classList.remove('text-whit');
            tab.style.background = '#222';
            filtroActual = tab.dataset.filtro;
            renderObjetivos();
        });
    });

    const btnNuevo = document.getElementById('btnNuevoObjetivo');
    if (btnNuevo && modalObjetivoInstance) {
        btnNuevo.addEventListener('click', () => {
            prepararFormulario();
            modalObjetivoInstance.show();
        });
    }

    document.getElementById('btnConfirmarEliminarObjetivo').addEventListener('click', eliminarObjetivo);

    const formObjetivo = document.getElementById('formNuevoObjetivo');
    if (formObjetivo) {
        formObjetivo.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarObjetivo();
        });
    }
});

// Pide los objetivos y los dibuja.
async function cargarObjetivos() {
    const respuesta = await API.request('/objetivos', 'GET');
    listaObjetivos = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
    renderObjetivos();
}

// Deja el modal listo para crear (vacío) o editar (con los datos del objetivo).
function prepararFormulario(objetivo = null) {
    objetivoEditando = objetivo ? objetivo.id_objetivo : null;
    document.getElementById('formNuevoObjetivo').reset();
    document.getElementById('modalNuevoObjetivoLabel').textContent = objetivo ? 'Editar Objetivo' : 'Nuevo Objetivo';
    document.getElementById('btnGuardarObjetivo').textContent = objetivo ? 'Guardar cambios' : 'Guardar objetivo';
    document.getElementById('mensajeObjetivo').textContent = '';
    document.getElementById('mensajeObjetivo').className = 'small';

    if (objetivo) {
        document.getElementById('inputTitulo').value = objetivo.titulo || '';
        document.getElementById('inputDescripcion').value = objetivo.descripcion || '';
        document.getElementById('inputFechaInicio').value = (objetivo.fecha_inicio || '').substring(0, 10);
        document.getElementById('inputFechaFin').value = (objetivo.fecha_fin || '').substring(0, 10);
        document.getElementById('inputEstado').value = objetivo.estado || 'En curso';
        document.getElementById('inputPorcentaje').value = objetivo.porcentaje || 0;
    }
}

// Valida fechas y progreso, y guarda: PUT si se edita, POST si es nuevo.
async function guardarObjetivo() {
    const titulo = document.getElementById('inputTitulo').value.trim();
    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const fecha_inicio = document.getElementById('inputFechaInicio').value;
    const fecha_fin = document.getElementById('inputFechaFin').value;
    const estado = document.getElementById('inputEstado').value;
    const porcentaje = Number(document.getElementById('inputPorcentaje').value);
    const mensaje = document.getElementById('mensajeObjetivo');

    if (!titulo || !fecha_inicio || !fecha_fin) {
        mensaje.textContent = 'Completá el título y las fechas.';
        mensaje.className = 'small text-danger';
        return;
    }
    if (fecha_fin < fecha_inicio) {
        mensaje.textContent = 'La fecha límite no puede ser anterior a la fecha de inicio.';
        mensaje.className = 'small text-danger';
        return;
    }

    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        mensaje.textContent = 'El progreso debe estar entre 0 y 100.';
        mensaje.className = 'small text-danger';
        return;
    }

    const payload = { titulo, descripcion, estado, fecha_inicio, fecha_fin, porcentaje };
    const metodo = objetivoEditando ? 'PUT' : 'POST';
    const ruta = objetivoEditando ? '/objetivos/' + objetivoEditando : '/objetivos';

    try {
        const respuesta = await API.request(ruta, metodo, payload);
        if (respuesta.status === 'ok' || respuesta.success || respuesta.id_objetivo) {
            if (modalObjetivoInstance) modalObjetivoInstance.hide();
            await cargarObjetivos();
        } else {
            mensaje.textContent = respuesta.message || 'No se pudo guardar el objetivo.';
            mensaje.className = 'small text-danger';
        }
    } catch (error) {
        mensaje.textContent = 'No se pudo conectar con el servidor.';
        mensaje.className = 'small text-danger';
    }
}

// Dibuja las tarjetas según el filtro. Un objetivo completado se muestra al 100%.
function renderObjetivos() {
    const contenedor = document.getElementById('listaObjetivos');
    const filtrados = listaObjetivos.filter(obj => {
        const est = (obj.estado || '').toLowerCase();
        if (filtroActual === 'todos') return true;
        if (filtroActual === 'en curso' && est.includes('curso')) return true;
        if (filtroActual === 'completados' && est.includes('completado')) return true;
        if (filtroActual === 'pausado' && est.includes('pausado')) return true;
        return false;
    });

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<div class="card-panel text-whit text-center py-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 14px;">No se encontraron objetivos en esta categoría.</div>';
        return;
    }

    contenedor.innerHTML = filtrados.map(obj => {
        const est = (obj.estado || '').toUpperCase();
        const esPausado = est.includes('PAUSADO');
        const badgeStyle = esPausado
            ? 'background: rgba(255, 180, 0, 0.1); color: #ffb400; border: 1px solid #ffb400;'
            : 'background: rgba(205, 250, 63, 0.1); color: #cdfa3f; border: 1px solid #cdfa3f;';
        const porcentaje = est.includes('COMPLETADO') ? 100 : Math.max(0, Math.min(100, Number(obj.porcentaje || 0)));
        return `
            <div class="card-panel p-4 d-flex align-items-center justify-content-between flex-wrap gap-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 14px;">
                <div class="d-flex align-items-center justify-content-center bg-dark border border-secondary rounded flex-shrink-0" style="width: 140px; height: 95px;">
                    <i class="bi bi-image text-whit fs-3"></i>
                </div>
                <div class="flex-grow-1" style="min-width: 240px;">
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                        <h4 class="mb-0 text-light" style="font-size: 18px; font-weight: 700; font-family: 'Montserrat', sans-serif;">${esc(obj.titulo)}</h4>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-outline-light btn-sm btn-editar-objetivo" data-id="${obj.id_objetivo}"><i class="bi bi-pencil"></i> Editar</button>
                            <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-objetivo" data-id="${obj.id_objetivo}"><i class="bi bi-trash"></i> Eliminar</button>
                        </div>
                    </div>
                    <p class="text-whit mb-2" style="font-size: 13.5px;">${esc(obj.descripcion || 'Sin descripción')}</p>
                    <div class="d-flex align-items-center gap-2 text-whit mb-2" style="font-size: 12.5px;">
                        <i class="bi bi-calendar-event"></i>
                        <span>Fecha límite: ${formatearFecha(obj.fecha_fin)}</span>
                    </div>
                    <div class="progress bg-dark border border-secondary" style="height: 6px; border-radius: 4px; max-width: 450px;">
                        <div class="progress-bar" role="progressbar" style="width: ${porcentaje}%; background-color: #cdfa3f; border-radius: 4px;" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
                <div class="text-end d-flex flex-column align-items-end justify-content-center" style="min-width: 120px;">
                    <span class="px-3 py-1 rounded-pill fw-bold mb-2" style="font-size: 11px; ${badgeStyle}">${esc(obj.estado || 'Sin estado').toUpperCase()}</span>
                    <span class="fw-bold text-light" style="font-size: 20px; font-family: 'Montserrat', sans-serif;">${porcentaje}%</span>
                    <span class="text-whit" style="font-size: 11.5px;">COMPLETADO</span>
                </div>
            </div>`;
    }).join('');

    document.querySelectorAll('.btn-editar-objetivo').forEach(btn => {
        btn.addEventListener('click', () => {
            const objetivo = listaObjetivos.find(obj => String(obj.id_objetivo) === btn.dataset.id);
            if (objetivo && modalObjetivoInstance) {
                prepararFormulario(objetivo);
                modalObjetivoInstance.show();
            }
        });
    });

    document.querySelectorAll('.btn-eliminar-objetivo').forEach(btn => {
        btn.addEventListener('click', () => {
            const objetivo = listaObjetivos.find(obj => String(obj.id_objetivo) === btn.dataset.id);
            if (objetivo) abrirEliminarObjetivo(objetivo);
        });
    });
}

// Abre el modal de confirmación para eliminar.
function abrirEliminarObjetivo(objetivo) {
    objetivoAEliminar = objetivo;
    document.getElementById('eliminarObjetivoTitulo').textContent = objetivo.titulo;
    document.getElementById('errorEliminarObjetivo').textContent = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarObjetivo')).show();
}

// Elimina el objetivo; si falla, el error se muestra en el modal.
async function eliminarObjetivo() {
    if (!objetivoAEliminar) return;

    const boton = document.getElementById('btnConfirmarEliminarObjetivo');
    boton.disabled = true;
    const respuesta = await API.request('/objetivos/' + objetivoAEliminar.id_objetivo, 'DELETE');
    boton.disabled = false;

    if (respuesta && respuesta.status === 'ok') {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarObjetivo')).hide();
        objetivoAEliminar = null;
        await cargarObjetivos();
        return;
    }
    document.getElementById('errorEliminarObjetivo').textContent = respuesta?.message || 'No se pudo eliminar el objetivo.';
}

// Fecha de la base a DD/MM/AAAA.
function formatearFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
