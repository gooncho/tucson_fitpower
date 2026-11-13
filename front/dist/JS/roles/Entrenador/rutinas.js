/**
 * Rutinas (Entrenador).
 *
 * Tabla de rutinas de sus socios, con buscador y paginación.
 * Modal de dos paneles para crear o editar: a la izquierda los ejercicios
 * disponibles y a la derecha los elegidos, cada uno con series, repeticiones y descanso.
 * Los elegidos se guardan en el arreglo RutSeleccionados y se envían al guardar.
 */

let TodasLasRutinas = [];
// Si tiene una rutina, el modal está editando; si es null, está creando.
let RutinaEditada = null;
let RutinaAEliminar = null;
let RutSeleccionados = [];

const PagRutinas = CrearPaginacion('pag-rutinas', 10, lista => {
    document.getElementById('listar-rutinas').replaceChildren(...lista.map(CrearFila));
});

function MostrarMensaje(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

// Fila del modal "Ver rutina".
function CrearFilaEjercicio(e) {
    const fila = document.createElement('tr');

    const descanso = e.descanso != null ? `${e.descanso} s` : '-';
    [e.nombre, e.series, e.repeticiones, descanso].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto ?? '-';
        fila.appendChild(celda);
    });
    return fila;
}

// Modal "Ver": ejercicios de la rutina con series, repeticiones y descanso.
async function AbrirRutina(r) {
    document.getElementById('rut-ver-titulo').textContent = r.rutina;
    document.getElementById('rut-ver-socio').textContent = `${r.usuario} ${r.apellido || '' }`.trim();
    const tbody = document.getElementById('rut-ver-ejercicios');
    MostrarMensaje(tbody, 'Cargando ejercicios...');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRutina')).show();
    const res = await API.request(`/rutinas/${r.id_rutina}`);

    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'No se pudieron cargar los ejercicios');
        return;
    }
    if (res.data.length === 0) {
        MostrarMensaje(tbody, 'Esta rutina no tiene ejercicios');
        return;
    }
    tbody.replaceChildren(...res.data.map(CrearFilaEjercicio));
}

// Abre el modal de confirmación para eliminar.
function EliminarRutina(r) {
    RutinaAEliminar = r;
    document.getElementById('elim-rut-nombre').textContent = r.rutina;
    document.getElementById('elim-rut-socio').textContent = `${r.usuario} ${r.apellido || ''}`.trim();
    document.getElementById('elim-rut-error').textContent = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarRutina')).show();
}

// Elimina la rutina y recarga la tabla.
async function ConfirmarEliminarRutina() {
    if (!RutinaAEliminar) return;

    const boton = document.getElementById('btn-confirmar-eliminar-rutina');
    boton.disabled = true;
    const res = await API.request(`/rutinas/${RutinaAEliminar.id_rutina}`, 'DELETE');
    boton.disabled = false;

    if (res && res.status === 'ok') {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarRutina')).hide();
        RutinaAEliminar = null;
        await CargarRutinas();
        return;
    }
    document.getElementById('elim-rut-error').textContent = res?.message || 'No se pudo eliminar la rutina';
}

// Fila de la tabla con los botones Ver, Editar y Eliminar.
function CrearFila(r) {
    const fila = document.createElement('tr');

    const socio = `${r.usuario} ${r.apellido || ''}`.trim();
    [socio, r.rutina, r.total_ejercicios].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto ?? '-';
        fila.appendChild(celda);
    });
    const acciones = document.createElement('td');
    acciones.className = 'col-acciones';

    const ver = document.createElement('button');
    ver.className = 'admin-mini';
    ver.textContent = 'Ver';
    ver.addEventListener('click', () => AbrirRutina(r));

    const editar = document.createElement('button');
    editar.className = 'admin-mini';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => AbrirNuevaRutina(r));

    const eliminar = document.createElement('button');
    eliminar.className = 'admin-mini peligro';
    eliminar.textContent = 'Eliminar';
    eliminar.addEventListener('click', () => EliminarRutina(r));

    acciones.append(ver, editar, eliminar);
    fila.appendChild(acciones);
    return fila;
}

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function MostrarRutinas(lista) {
    PagRutinas.mostrar(lista);
    if (lista.length === 0) {
        MostrarMensaje(document.getElementById('listar-rutinas'), 'No se encontraron rutinas');
    }
}

// Filtra por nombre de rutina o de socio.
function FiltrarRutinas() {
    const texto = normalizar(document.getElementById('buscar-rutina').value.trim());
    const filtradas = TodasLasRutinas.filter(r =>
        normalizar(`${r.usuario} ${r.apellido || ''} ${r.rutina}`).includes(texto)
    );
    MostrarRutinas(filtradas);
}

// Pide las rutinas a la API y las muestra.
async function CargarRutinas() {
    const tbody = document.getElementById('listar-rutinas');
    if (!tbody) return;

    const res = await API.request('/rutinas');
    
    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'Las rutinas no cargan');
        return;
    }
    if (res.data.length === 0) {
        TodasLasRutinas = [];
        PagRutinas.mostrar([]);
        MostrarMensaje(tbody, 'No hay rutinas cargadas');
        return;
    }
    TodasLasRutinas = res.data;
    MostrarRutinas(TodasLasRutinas);
}

// Llena el selector de socios del modal (sin repetidos).
async function CargarSociosSelect() {
    const select = document.getElementById('rut-socio');
    const error = document.getElementById('rut-error');

    const res = await API.request('/mis-socios');
    if (!res || res.status !== 'ok') {
        select.replaceChildren();
        error.textContent = res?.message || 'No se pudieron cargar los socios.';
        return;
    }

const unicos = new Map();
res.data.forEach(s => unicos.set(s.id_persona, s));

const vacia = document.createElement('option');
vacia.value = '';
vacia.textContent = 'Elige un socio';

const opciones = [...unicos.values()].map(s => {
    const op = document.createElement('option');
    op.value = s.id_persona;
    op.textContent = `${s.usuario} ${s.apellido || ''}`.trim();
    return op;
});

select.replaceChildren(vacia, ...opciones);
}

// Abre el modal vacío (nueva) o con los datos y ejercicios de r (editar).
async function AbrirNuevaRutina(r = null) {
    RutinaEditada = r;
    RutSeleccionados = [];

    document.getElementById('rut-modal-titulo').textContent = r ? 'Editar rutina' : 'Crear rutina';
    document.getElementById('rut-nombre').value = r ? r.rutina : '';
    document.getElementById('rut-descripcion').value = r ? (r.descripcion || '') : '';
    document.getElementById('rut-buscar-ej').value = '';
    const error = document.getElementById('rut-error');
    error.textContent = '';

    await Promise.all([CargarSociosSelect(), CargarEjerciciosDisponibles()]);

    const select = document.getElementById('rut-socio');

    if (r) {
        select.value = r.id_persona;
        select.disabled = true;

        const res = await API.request(`/rutinas/${r.id_rutina}`);
        if (res && res.status === 'ok') {
            RutSeleccionados = res.data.map(e => ({
                id_ejercicio: Number(e.id_ejercicio),
                nombre: e.nombre,
                series: e.series,
                repeticiones: e.repeticiones,
                descanso: e.descanso
            }));
        } else {
            error.textContent = 'No se pudieron cargar los ejercicios de esta rutina.';
        }
    } else {
        select.disabled = false;
    }

    RenderEjerciciosRutina();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevaRutina')).show();
}

// Valida y guarda: PUT si se está editando, POST si es nueva.
async function GuardarRutina() {
    const error = document.getElementById('rut-error');
    error.textContent = '';

    const nombre = document.getElementById('rut-nombre').value.trim();
    const descripcion = document.getElementById('rut-descripcion').value.trim();
    const idSocio = Number(document.getElementById('rut-socio').value);

    if (nombre === '' || !idSocio) {
        error.textContent = 'Completa el nombre o elige un socio';
        return;
    }

    const ejercicios = [];

    for (const s of RutSeleccionados) {
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

    if (ejercicios.length === 0) {
        error.textContent = 'Agrega al menos un ejercicio.';
        return;
    }

    const boton = document.getElementById('btn-guardar-rutina');
    boton.disabled = true;

    const res = RutinaEditada
        ? await API.request(`/rutinas/${RutinaEditada.id_rutina}`, 'PUT', { nombre, descripcion, ejercicios })
        : await API.request('/rutinas', 'POST', { nombre, descripcion, id_persona: idSocio, ejercicios });

    boton.disabled = false;

    if (res && res.status === 'ok') {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevaRutina')).hide();
        await CargarRutinas();
        return;
    }
    error.textContent = res?.message || 'No se pudo guardar la rutina';
}

// --- Panel de ejercicios del modal ---
let EjerciciosDisponible = [];

async function CargarEjerciciosDisponibles() {
    const res = await API.request('/ejercicio');
    EjerciciosDisponible = (res && res.status === 'ok') ? res.data : [];
}

function MensajeVacio(contenedor, texto) {
    const div = document.createElement('div');
    div.className = 'rut-vacio';
    div.textContent = texto;
    contenedor.replaceChildren(div);
}

// Panel izquierdo: ejercicios que todavía no se agregaron, filtrados por el buscador.
function RenderDisponibles() {
    const contenedor = document.getElementById('rut-disponibles');
    const texto = normalizar(document.getElementById('rut-buscar-ej').value.trim());
    const usados = new Set(RutSeleccionados.map(s => s.id_ejercicio));

    const lista = EjerciciosDisponible.filter(e =>
        !usados.has(Number(e.id_ejercicio)) &&
        normalizar(`${e.nombre} ${e.grupo_muscular || ''}`).includes(texto)
    );

    if (lista.length === 0) {
        MensajeVacio(contenedor, 'No hay ejercicios disponibles');
        return;
    }

    contenedor.replaceChildren(...lista.map(e => {
        const item = document.createElement('div');
        item.className = 'rut-item rut-item-fila';

        const nombre = document.createElement('span');
        nombre.textContent = e.nombre;
        if (e.grupo_muscular) {
            const grupo = document.createElement('small');
            grupo.textContent = e.grupo_muscular;
            nombre.appendChild(grupo);
        }

        const agregar = document.createElement('button');
        agregar.type = 'button';
        agregar.className = 'rut-btn-redondo';
        agregar.setAttribute('aria-label', `Agregar ${e.nombre}`);
        agregar.innerHTML = '<i class="bi bi-plus-lg"></i>';
        agregar.addEventListener('click', () => AgregarEjercicio(e));

        item.append(nombre, agregar);
        return item;
    }));
}

// Input numérico que escribe directo en el objeto del ejercicio elegido.
function CrearCampo(item, campo, etiqueta, min) {
    const label = document.createElement('label');
    label.className = 'rut-campo';

    const texto = document.createElement('span');
    texto.textContent = etiqueta;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.className = 'form-control form-control-sm';
    input.value = item[campo] ?? '';
    input.addEventListener('input', () => {
        item[campo] = input.value;
    });

    label.append(texto, input);
    return label;
}

// Panel derecho: ejercicios elegidos con sus campos y el botón para quitarlos.
function RenderSeleccionados() {
    const contenedor = document.getElementById('rut-seleccionados');
    const cantidad = RutSeleccionados.length;
    document.getElementById('rut-total').textContent =
        `Total: ${cantidad} ejercicio${cantidad === 1 ? '' : 's'}`;

    if (cantidad === 0) {
        MensajeVacio(contenedor, 'No hay ejercicios seleccionados');
        return;
    }

    contenedor.replaceChildren(...RutSeleccionados.map(s => {
        const item = document.createElement('div');
        item.className = 'rut-item';

        const fila = document.createElement('div');
        fila.className = 'rut-item-fila';

        const nombre = document.createElement('span');
        nombre.textContent = s.nombre;

        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'rut-btn-quitar';
        quitar.setAttribute('aria-label', `Quitar ${s.nombre}`);
        quitar.innerHTML = '<i class="bi bi-x-lg"></i>';
        quitar.addEventListener('click', () => QuitarEjercicio(s.id_ejercicio));

        fila.append(nombre, quitar);

        const campos = document.createElement('div');
        campos.className = 'rut-campos';
        campos.append(
            CrearCampo(s, 'series', 'Series', 1),
            CrearCampo(s, 'repeticiones', 'Repeticiones', 1),
            CrearCampo(s, 'descanso', 'Descanso (s)', 0)
        );

        item.append(fila, campos);
        return item;
    }));
}

function RenderEjerciciosRutina() {
    RenderDisponibles();
    RenderSeleccionados();
}

// Pasa un ejercicio al panel derecho con valores iniciales.
function AgregarEjercicio(e) {
    RutSeleccionados.push({
        id_ejercicio: Number(e.id_ejercicio),
        nombre: e.nombre,
        series: 4,
        repeticiones: 10,
        descanso: 60
    });
    RenderEjerciciosRutina();
}

// Lo saca de los elegidos y vuelve a aparecer a la izquierda.
function QuitarEjercicio(idEjercicio) {
    RutSeleccionados = RutSeleccionados.filter(s => s.id_ejercicio !== idEjercicio);
    RenderEjerciciosRutina();
}

document.addEventListener('DOMContentLoaded', () => {
    CargarRutinas();
    
    document.getElementById('buscar-rutina').addEventListener('input', () => {
        PagRutinas.reiniciar();
        FiltrarRutinas();
    });
    document.getElementById('btn-nueva-rutina').addEventListener('click', () => AbrirNuevaRutina());
    document.getElementById('btn-guardar-rutina').addEventListener('click', GuardarRutina);
    document.getElementById('rut-buscar-ej').addEventListener('input', RenderDisponibles);
    document.getElementById('btn-confirmar-eliminar-rutina').addEventListener('click', ConfirmarEliminarRutina);
});