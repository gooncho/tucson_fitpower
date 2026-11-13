/**
 * Crear / editar rutina (Socio).
 *
 * La misma página sirve para las dos cosas:
 *   CrearRutina.html        -> crea una rutina nueva
 *   CrearRutina.html?id=5   -> edita la rutina 5 (solo si la creó el socio)
 * Los ejercicios elegidos se guardan en ejerciciosSeleccionados, cada uno
 * con series, repeticiones y descanso editables.
 */

let ejerciciosDisponibles = [];
let ejerciciosSeleccionados = [];

// Id de la rutina que se edita (sale de ?id= en la URL) o null si es nueva.
const RutinaEditada = Number(new URLSearchParams(window.location.search).get('id')) || null;

// Escapa el texto antes de meterlo en innerHTML, para que nadie pueda inyectar HTML o scripts (XSS).
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.addEventListener('DOMContentLoaded', async () => {
    await cargarEjerciciosDisponibles();

    if (RutinaEditada) {
        await cargarRutinaParaEditar();
    }

    document.getElementById('buscarEjercicio')?.addEventListener('input', renderEjerciciosDisponibles);
    document.getElementById('btnGuardarRutina')?.addEventListener('click', guardarRutina);
});

// Pide la lista de ejercicios activos.
async function cargarEjerciciosDisponibles() {
    const respuesta = await API.request('/ejercicios', 'GET');
    ejerciciosDisponibles = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
    renderEjerciciosDisponibles();
}

// Modo edición: trae el nombre (de /mis-rutinas) y los ejercicios (de /rutinas/:id).
// Si la rutina no es del socio, vuelve a la lista.
async function cargarRutinaParaEditar() {
    const [lista, detalle] = await Promise.all([
        API.request('/mis-rutinas', 'GET'),
        API.request(`/rutinas/${RutinaEditada}`, 'GET')
    ]);

    const rutina = (lista?.data || []).find(r => Number(r.id_rutina) === RutinaEditada);
    if (!rutina || Number(rutina.es_propia) !== 1 || detalle?.status !== 'ok') {
        alert('Solo podés editar las rutinas que creaste.');
        window.location.href = 'Rutinas.html';
        return;
    }

    document.getElementById('tituloRutina').textContent = 'Editar rutina';
    document.title = 'Editar rutina';
    document.getElementById('nombreRutina').value = rutina.nombre;

    ejerciciosSeleccionados = detalle.data.map(e => ({
        id_ejercicio: Number(e.id_ejercicio),
        nombre: e.nombre,
        series: Number(e.series),
        repeticiones: Number(e.repeticiones),
        descanso: Number(e.descanso)
    }));

    renderEjerciciosDisponibles();
    renderEjerciciosSeleccionados();
}

// Lista de la izquierda: ejercicios que coinciden con el buscador y todavía no se eligieron.
function renderEjerciciosDisponibles() {
    const q = (document.getElementById('buscarEjercicio')?.value || "").toLowerCase().trim();
    const contenedor = document.getElementById('listaEjerciciosDisponibles');

    const filtrados = ejerciciosDisponibles.filter(e =>
        e.nombre.toLowerCase().includes(q) &&
        !ejerciciosSeleccionados.some(sel => sel.id_ejercicio === Number(e.id_ejercicio))
    );

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="text-secondary text-center py-3 fs-6">No hay ejercicios disponibles</div>`;
        return;
    }

    contenedor.innerHTML = filtrados.map(e => `
        <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded border border-secondary bg-dark text-light">
            <span style="font-size: 14.5px; font-weight: 500;">${esc(e.nombre)}</span>
            <button class="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center p-1 rounded-circle btn-agregar" data-id="${e.id_ejercicio}" style="width: 28px; height: 28px; border-color: #555;">
                <i class="bi bi-plus-lg text-light"></i>
            </button>
        </div>
    `).join("");

    contenedor.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', () => {
            const ejercicio = ejerciciosDisponibles.find(e => Number(e.id_ejercicio) === Number(btn.dataset.id));
            if (!ejercicio) return;
            ejerciciosSeleccionados.push({
                id_ejercicio: Number(ejercicio.id_ejercicio),
                nombre: ejercicio.nombre,
                series: 4,
                repeticiones: 10,
                descanso: 60
            });
            renderEjerciciosDisponibles();
            renderEjerciciosSeleccionados();
        });
    });
}

// Input numérico que guarda su valor directamente en el ejercicio elegido.
function crearCampo(item, campo, etiqueta, min) {
    const label = document.createElement('label');
    label.className = 'rut-campo';

    const texto = document.createElement('span');
    texto.textContent = etiqueta;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.className = 'form-control form-control-sm bg-dark text-light border-secondary';
    input.value = item[campo] ?? '';
    input.addEventListener('input', () => {
        item[campo] = input.value;
    });

    label.append(texto, input);
    return label;
}

// Lista de la derecha: ejercicios elegidos con sus campos y el botón para quitar.
function renderEjerciciosSeleccionados() {
    const contenedor = document.getElementById('listaEjerciciosSeleccionados');
    const cantidad = ejerciciosSeleccionados.length;
    document.getElementById('totalEjercicios').textContent =
        `Total: ${cantidad} ejercicio${cantidad === 1 ? '' : 's'}`;

    if (cantidad === 0) {
        contenedor.innerHTML = `<div class="text-secondary text-center py-4 fs-6">No hay ejercicios seleccionados</div>`;
        return;
    }

    contenedor.replaceChildren(...ejerciciosSeleccionados.map(s => {
        const item = document.createElement('div');
        item.className = 'p-2 px-3 rounded border border-secondary bg-dark text-light';

        const fila = document.createElement('div');
        fila.className = 'd-flex align-items-center justify-content-between';

        const nombre = document.createElement('span');
        nombre.style.fontSize = '14.5px';
        nombre.style.fontWeight = '500';
        nombre.textContent = s.nombre;

        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'btn btn-sm text-danger p-0';
        quitar.title = 'Quitar';
        quitar.innerHTML = '<i class="bi bi-x-lg"></i>';
        quitar.addEventListener('click', () => {
            ejerciciosSeleccionados = ejerciciosSeleccionados.filter(e => e.id_ejercicio !== s.id_ejercicio);
            renderEjerciciosDisponibles();
            renderEjerciciosSeleccionados();
        });

        fila.append(nombre, quitar);

        const campos = document.createElement('div');
        campos.className = 'rut-campos';
        campos.append(
            crearCampo(s, 'series', 'Series', 1),
            crearCampo(s, 'repeticiones', 'Repeticiones', 1),
            crearCampo(s, 'descanso', 'Descanso (s)', 0)
        );

        item.append(fila, campos);
        return item;
    }));
}

// Valida los datos y guarda: PUT si se está editando, POST si es nueva.
async function guardarRutina() {
    const error = document.getElementById('errorRutina');
    const nombre = document.getElementById('nombreRutina').value.trim();
    error.textContent = '';

    if (!nombre) {
        error.textContent = 'Ingresá un nombre para la rutina.';
        return;
    }
    if (ejerciciosSeleccionados.length === 0) {
        error.textContent = 'Agregá al menos un ejercicio.';
        return;
    }

    const ejercicios = [];
    for (const s of ejerciciosSeleccionados) {
        const item = {
            id_ejercicio: s.id_ejercicio,
            series: Number(s.series),
            repeticiones: Number(s.repeticiones),
            descanso: Number(s.descanso)
        };
        if (!Number.isInteger(item.series) || item.series < 1 ||
            !Number.isInteger(item.repeticiones) || item.repeticiones < 1 ||
            !Number.isInteger(item.descanso) || item.descanso < 0) {
            error.textContent = `Revisá las series, repeticiones y descanso de "${s.nombre}".`;
            return;
        }
        ejercicios.push(item);
    }

    const boton = document.getElementById('btnGuardarRutina');
    boton.disabled = true;

    const datos = { nombre, descripcion: 'Creada por el socio', ejercicios };
    const respuesta = RutinaEditada
        ? await API.request(`/rutinas/${RutinaEditada}`, 'PUT', datos)
        : await API.request('/rutinas', 'POST', datos);

    if (respuesta?.status === 'ok') {
        window.location.href = 'Rutinas.html';
        return;
    }

    boton.disabled = false;
    error.textContent = respuesta?.message || 'No se pudo guardar la rutina.';
}