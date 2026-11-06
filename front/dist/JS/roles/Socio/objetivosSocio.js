let listaObjetivos = [];
let filtroActual = 'todos';
let modalObjetivoInstance = null;
document.addEventListener('DOMContentLoaded', async () => {
    const modalEl = document.getElementById('modalNuevoObjetivo');
    if (modalEl) {
        modalObjetivoInstance = new bootstrap.Modal(modalEl);
    }
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
        btnNuevo.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('formNuevoObjetivo').reset();
            modalObjetivoInstance.show();
        });
    }
    const formObjetivo = document.getElementById('formNuevoObjetivo');
    if (formObjetivo) {
        formObjetivo.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarNuevoObjetivo();
        });
    }
});
async function cargarObjetivos() {
    try {
        const respuesta = await API.request('/objetivos', 'GET');
        listaObjetivos = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
        
        if (listaObjetivos.length === 0) {
            throw new Error("Sin objetivos en API");
        }
        renderObjetivos();
    } catch (err) {
        console.warn("Usando datos de respaldo de la base de datos para objetivos:", err);
        listaObjetivos = [
            { id_objetivo: 1, titulo: "Ganar masa muscular", descripcion: "Aumentar la masa muscular mediante entrenamiento de fuerza.", estado: "En curso", fecha_inicio: "2026-08-01", fecha_fin: "2026-12-01", porcentaje: 65 },
            { id_objetivo: 2, titulo: "Bajar de peso", descripcion: "Reducir el porcentaje de grasa corporal.", estado: "En curso", fecha_inicio: "2026-08-05", fecha_fin: "2026-11-05", porcentaje: 40 },
            { id_objetivo: 3, titulo: "Aumentar fuerza", descripcion: "Mejorar los niveles de fuerza en ejercicios básicos.", estado: "En curso", fecha_inicio: "2026-08-01", fecha_fin: "2026-12-01", porcentaje: 80 },
            { id_objetivo: 4, titulo: "Mejorar resistencia", descripcion: "Aumentar la resistencia cardiovascular y muscular.", estado: "Pausado", fecha_inicio: "2026-08-10", fecha_fin: "2026-11-10", porcentaje: 20 }
        ];
        renderObjetivos();
    }
}

async function guardarNuevoObjetivo() {
    const titulo = document.getElementById('inputTitulo').value.trim();
    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const fecha_inicio = document.getElementById('inputFechaInicio').value;
    const fecha_fin = document.getElementById('inputFechaFin').value;
    const estado = document.getElementById('inputEstado').value;
    const porcentaje = parseInt(document.getElementById('inputPorcentaje').value) || 0;

    if (!titulo || !fecha_inicio || !fecha_fin) {
        alert("Por favor, completa los campos obligatorios.");
        return;
    }

    try {
        const perfilRes = await API.request('/perfil', 'GET');
        const idPersona = perfilRes.id_persona || perfilRes.data?.id_persona || 1;

        const payload = {
            id_persona: idPersona,
            titulo: titulo,
            descripcion: descripcion,
            estado: estado,
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            porcentaje: porcentaje
        };
        const respuesta = await API.request('/objetivos', 'POST', payload);
        if (respuesta.status === 'ok' || respuesta.success || respuesta.id_objetivo) {
            alert("¡Objetivo creado con éxito!");
            if (modalObjetivoInstance) modalObjetivoInstance.hide();
            await cargarObjetivos();
        } else {
            alert("Error al guardar el objetivo: " + (respuesta.message || "Desconocido"));
        }
    } catch (err) {
        console.error("Error al conectar con el servidor:", err);
        const nuevoLocal = {
            id_objetivo: Date.now(),
            titulo,
            descripcion,
            estado,
            fecha_inicio,
            fecha_fin,
            porcentaje
        };
        listaObjetivos.unshift(nuevoLocal);
        renderObjetivos();
        
        if (modalObjetivoInstance) modalObjetivoInstance.hide();
        alert("¡Objetivo registrado localmente (simulación offline)!");
    }
}
function renderObjetivos() {
    const contenedor = document.getElementById('listaObjetivos');
    const filtrados = listaObjetivos.filter(obj => {
        const est = (obj.estado || "").toLowerCase();
        if (filtroActual === 'todos') return true;
        if (filtroActual === 'en curso' && est.includes('curso')) return true;
        if (filtroActual === 'completados' && est.includes('completado')) return true;
        if (filtroActual === 'pausado' && est.includes('pausado')) return true;
        return false;
    });
    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="card-panel text-whit text-center py-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 14px;">No se encontraron objetivos en esta categoría.</div>`;
        return;
    }
    contenedor.innerHTML = filtrados.map(obj => {
        const est = (obj.estado || "").toUpperCase();
        const esPausado = est.includes('PAUSADO');
        const badgeStyle = esPausado 
            ? 'background: rgba(255, 180, 0, 0.1); color: #ffb400; border: 1px solid #ffb400;' 
            : 'background: rgba(205, 250, 63, 0.1); color: #cdfa3f; border: 1px solid #cdfa3f;';
        const porcentaje = obj.porcentaje || (est.includes('COMPLETADO') ? 100 : 50);
        const fechaFinFormateada = formatearFecha(obj.fecha_fin);
        return `
            <div class="card-panel p-4 d-flex align-items-center justify-content-between flex-wrap gap-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 14px;">
                <div class="d-flex align-items-center justify-content-center bg-dark border border-secondary rounded flex-shrink-0" style="width: 140px; height: 95px;">
                    <i class="bi bi-image text-whit fs-3"></i>
                </div>
                <div class="flex-grow-1" style="min-width: 240px;">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                        <h4 class="mb-0 text-light" style="font-size: 18px; font-weight: 700; font-family: 'Montserrat', sans-serif;">${obj.titulo}</h4>
                    </div>
                    <p class="text-whit mb-2" style="font-size: 13.5px;">${obj.descripcion || "Sin descripción"}</p>
                    <div class="d-flex align-items-center gap-2 text-whit mb-2" style="font-size: 12.5px;">
                        <i class="bi bi-calendar-event"></i>
                        <span>Fecha límite: ${fechaFinFormateada}</span>
                    </div>
                    <div class="progress bg-dark border border-secondary" style="height: 6px; border-radius: 4px; max-width: 450px;">
                        <div class="progress-bar" role="progressbar" style="width: ${porcentaje}%; background-color: #cdfa3f; border-radius: 4px;" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
                <div class="text-end d-flex flex-column align-items-end justify-content-center" style="min-width: 120px;">
                    <span class="px-3 py-1 rounded-pill fw-bold mb-2" style="font-size: 11px; ${badgeStyle}">
                        ${obj.estado.toUpperCase()}
                    </span>
                    <span class="fw-bold text-light" style="font-size: 20px; font-family: 'Montserrat', sans-serif;">${porcentaje}%</span>
                    <span class="text-whit" style="font-size: 11.5px;">COMPLETADO</span>
                </div>

            </div>
        `;
    }).join("");
}
function formatearFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}