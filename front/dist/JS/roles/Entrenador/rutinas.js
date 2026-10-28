let TodasLasRutinas = [];

function MostrarMensaje(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

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

async function AbrirRutina(r) {
    document.getElementById('rut-ver-titulo').textContent = r.rutina;
    document.getElementById('rut-ver-socio').textContent = `${r.usuario} ${r.apellido || '' }`.trim();
    const tbody = document.getElementById('rut-ver-ejercicios');
    MostrarMensaje(tbody, 'Cargando ejercicios...');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRutina')).show();
    const res = await API.request(`/rutinas/${r.id_rutina}`);

    if (!res || res.status !== 'ok'){
        MostrarMensaje(tbody, res?.message || 'No se pudieron cargar los ejercicios');
        return;
    }
    if (res.data.length === 0) {
        MostrarMensaje(tbody, 'Esta rutina no tiene ejercicios');
        return;
    }
    tbody.replaceChildren(...res.data.map(CrearFilaEjercicio));
}

async function EliminarRutina(r) {

    const res = await API.request(`/rutinas/${r.id_rutina}`, 'DELETE');

    if (!res || res.status !== 'ok') {
        alert(res?.message || 'No se pudo eliminar la rutina');
        return;
    }
    await CargarRutinas();
}

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
    const tbody = document.getElementById('listar-rutinas');
    if (lista.length === 0) {
        MostrarMensaje(tbody, 'No se encontraron rutinas');
        return;
    }
    tbody.replaceChildren(...lista.map(CrearFila));
}

function FiltrarRutinas() {
    const texto = normalizar(document.getElementById('buscar-rutina').value.trim());
    const filtradas = TodasLasRutinas.filter(r =>
        normalizar(`${r.usuario} ${r.apellido || ''} ${r.rutina}`).includes(texto)
    );
    MostrarRutinas(filtradas);
}

async function CargarRutinas() {
    const tbody = document.getElementById('listar-rutinas');
    if (!tbody) return;

    const res = await API.request('/rutinas');
    
    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'Las rutinas no cargan');
        return;
    }
    if (res.data.length === 0) {
        MostrarMensaje(tbody, 'No hay rutinas cargadas');
        return;
    }
    TodasLasRutinas = res.data;
    MostrarRutinas(TodasLasRutinas);
}

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

async function AbrirNuevaRutina() {
    document.getElementById('rut-nombre').value = '';
    document.getElementById('rut-descripcion').value = '';
    document.getElementById('rut-error').textContent = '';
    document.getElementById('rut-ejercicios').replaceChildren();

    await Promise.all([CargarSociosSelect(), CargarEjerciciosDisponibles()]);

    AgregarFilaEjercicio();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevaRutina')).show();
}

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

    const filas = document.querySelectorAll('#rut-ejercicios .rut-ejercicio-fila');
    const ejercicios = [];
    const usados = new Set();

    for (const fila of filas) {
        const item = {
            id_ejercicio: Number(fila.querySelector('.rut-ej-id').value),
            series: Number(fila.querySelector('.rut-ej-series').value),
            repeticiones: Number(fila.querySelector('.rut-ej-reps').value),
            descanso: Number(fila.querySelector('.rut-ej-descanso').value)
        };

    if (!item.id_ejercicio || item.series < 1 || item.repeticiones < 1 || item.descanso < 0) {
        error.textContent = 'Revisa los ejercicios, elige uno y completa la rutina';
        return;
    }

    if(usados.has(item.id_ejercicio)) {
        error.textContent = 'No repitas un ejercicio en la misma rutina';
        return;
    }
    usados.add(item.id_ejercicio);
    ejercicios.push(item);
}
   if (ejercicios.length === 0) {
        error.textContent = 'Agrega al menos un ejercicio.';
        return;
   }

   const boton = document.getElementById('btn-guardar-rutina');
   boton.disabled = true;

   const res = await API.request('/rutinas', 'POST', {
    nombre,
    descripcion,
    id_persona: idSocio,
    ejercicios
   });

   boton.disabled = false;

   if (res && res.status === 'ok') {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevaRutina')).hide();
    await CargarRutinas();
    return;
   }
   error.textContent = res?.message || 'No se pudo guardar la rutina';
}

let EjerciciosDisponible = [];

async function CargarEjerciciosDisponibles() {
    const res = await API.request('/ejercicio');
    EjerciciosDisponible = (res && res.status === 'ok') ? res.data : [];
}

function CrearFilaFormulario() {
    const fila = document.createElement('div');
    fila.className = 'row g-2 align-items-center mb-2 rut-ejercicio-fila';

    const colSelect = document.createElement('div');
    colSelect.className = 'col-5';
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm rut-ej-id';

    const vacia = document.createElement('option');
    vacia.value = '';
    vacia.textContent = 'Elige un ejercicio';

    const opciones = EjerciciosDisponible.map(e => {
        const op = document.createElement('option');
        op.value = e.id_ejercicio
        op.textContent = e.nombre;
        return op;   
    });
    select.append(vacia, ...opciones);
    colSelect.appendChild(select);

    const campos = [
        { clase: 'rut-ej-series', placeholder: 'Series', min: 1},
        { clase: 'rut-ej-reps', placeholder: 'Repeticiones', min: 1},
        { clase: 'rut-ej-descanso', placeholder: 'Descando (s)', min: 0},
    ];

    const columnas = campos.map(c => {
        const col = document.createElement('div');
        col.className = 'col-2';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = c.min;
        input.placeholder = c.placeholder;
        input.className = `form-control form-control-sm ${c.clase}`;
        col.appendChild(input);
        return col;
    });

    const colQuitar = document.createElement('div');
    colQuitar.className ='col-1';
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn btn-sm btn-outline-danger';
    quitar.textContent = 'x';
    quitar.addEventListener('click', () => fila.remove());
    colQuitar.appendChild(quitar);

    fila.append(colSelect, ...columnas, colQuitar);
    return fila
}

function AgregarFilaEjercicio() {
    document.getElementById('rut-ejercicios').appendChild(CrearFilaFormulario());
}

document.addEventListener('DOMContentLoaded', () => {
    CargarRutinas();
    document.getElementById('buscar-rutina').addEventListener('input', FiltrarRutinas);
    document.getElementById('btn-nueva-rutina').addEventListener('click', AbrirNuevaRutina);
    document.getElementById('btn-guardar-rutina').addEventListener('click', GuardarRutina);
    document.getElementById('btn-agregar-ejercicio').addEventListener('click', AgregarFilaEjercicio);
});