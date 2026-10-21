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

function CrearFila(r) {
    const fila = document.createElement('tr');

    const socio = `${r.usuario} ${r.apellido || ''}`.trim();
    [socio, r.rutina, r.total_ejercicios].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto ?? '-';
        fila.appendChild(celda);
    });
    const acciones = document.createElement('td');

    const ver = document.createElement('button');
    ver.className = 'details-btn';
    ver.textContent = 'Ver';
    ver.addEventListener('click', () => AbrirRutina(r));

    const editar = document.createElement('button');
    editar.className = 'details-btn';
    editar.textContent = 'Editar';

    acciones.append(ver, editar);
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

document.addEventListener('DOMContentLoaded', () => {
    CargarRutinas();
    document.getElementById('buscar-rutina').addEventListener('input', FiltrarRutinas);
});