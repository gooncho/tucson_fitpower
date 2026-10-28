let Todoslosejercicios = [];
let EjercicioEditado = null;

function MostrarMensaje(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

function AbrirEjercicio(e) {
    document.getElementById('ej-ver-nombre').textContent = e.nombre;
    document.getElementById('ej-ver-descripcion').textContent = e.descripcion || 'Sin descripcion';

    const img = document.getElementById('ej-ver-imagen');
    img.alt = e.nombre;
    img.onerror = () => img.classList.add('d-none');
    img.classList.remove('d-none');
    img.src = `/front/dist/assets/Ejercicios/${e.id_ejercicio}.png`;

    const chips = (e.grupo_muscular || '')
        .split(',')
        .map(g => g.trim())
        .filter(g => g !== '')
        .map(g => {
            const chip = document.createElement('span');
            chip.className = 'badge rounded-pill text-bg-secondary';
            chip.textContent = g;
            return chip;
        });
        document.getElementById('ej-ver-grupos').replaceChildren(...chips);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEjercicio')).show();
}

function CrearFila(e) {
    const fila = document.createElement('tr');

    [e.nombre, e.grupo_muscular, e.nivel].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto || '-';
        fila.appendChild(celda);
    });
    
    const acciones = document.createElement('td');
    acciones.className = 'col-acciones';

    const ver = document.createElement('button');
    ver.className = 'admin-mini';
    ver.textContent = 'Ver';
    ver.addEventListener('click', () => AbrirEjercicio(e));

    const editar = document.createElement('button');
    editar.className = 'admin-mini';
    editar.textContent = 'Editar';
    acciones.append(ver, editar);
    editar.addEventListener('click', () => AbrirFormularioEjercicio(e));
    

    fila.appendChild(acciones);
    return fila;
}

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function Mostrarejercicios(lista) {
    const tbody = document.getElementById('listar-ejercicios');
    if (lista.length === 0) {
        MostrarMensaje(tbody, 'No se encontraron ejercicios');
        return;
    }
    tbody.replaceChildren(...lista.map(CrearFila));
}

function FiltrarEjercicios() {
    const texto = normalizar(document.getElementById('buscar-ejercicio').value.trim());
    const filtrandos = Todoslosejercicios.filter(e =>
        normalizar(`${e.nombre} ${e.grupo_muscular || ''}`).includes(texto)
    );
    Mostrarejercicios(filtrandos);
}

async function CargarEjercicios() {
    const tbody = document.getElementById('listar-ejercicios');
    if (!tbody) return;

    const res = await API.request('/ejercicio');

    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'Los ejercicios no cargan');
        return;
    }
    if (res.data.length === 0) {
        MostrarMensaje(tbody, 'No hay ejercicios cargados');
        return;
    }
    Todoslosejercicios = res.data;
    FiltrarEjercicios();
}
function LimpiarFormularioEjercicio() {
    document.getElementById('ej-nombre').value = '';
    document.getElementById('ej-grupo').value = '';
    document.getElementById('ej-nivel').value = 'Principiante';
    document.getElementById('ej-descripcion').value = '';
    document.getElementById('ej-error').textContent = '';
}
async function GuardarEjercicio() {
    const error = document.getElementById('ej-error');
    error.textContent = '';

    const datos = {
        nombre: document.getElementById('ej-nombre').value.trim(),
        grupo_muscular: document.getElementById('ej-grupo').value.trim(),
        nivel: document.getElementById('ej-nivel').value,
        descripcion: document.getElementById('ej-descripcion').value.trim()
    };

    if (datos.nombre === '' || datos.grupo_muscular === '') {
        error.textContent = 'Completá el nombre y el grupo muscular.';
        return;
    }

    const boton = document.getElementById('btn-guardar-ejercicio');
    boton.disabled = true;

    const res = EjercicioEditado
        ? await API.request(`/ejercicio/${EjercicioEditado.id_ejercicio}`, 'PUT', datos)
        : await API.request('/ejercicio', 'POST', datos);
    
    boton.disabled = false;
    
    if (res && res.status === 'ok')  {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoEjercicio')).hide();
        await CargarEjercicios();
        return;
    }
    error.textContent = res?.message || 'No se pudo guardar el ejercicio.';
}

document.addEventListener('DOMContentLoaded', () => {
    CargarEjercicios();

    document.getElementById('btn-nuevo-ejercicio').addEventListener('click', () => AbrirFormularioEjercicio());
    document.getElementById('btn-guardar-ejercicio').addEventListener('click', GuardarEjercicio);
    document.getElementById('buscar-ejercicio').addEventListener('input', FiltrarEjercicios);
});

function AbrirFormularioEjercicio(e = null) {
    LimpiarFormularioEjercicio();
    EjercicioEditado = e;

    document.getElementById('ej-modal-titulo').textContent = e ? 'Editar ejercicio' : 'Nuevo ejercicio';

    if(e) {
        document.getElementById('ej-nombre').value = e.nombre;
        document.getElementById('ej-grupo').value = e.grupo_muscular;
        document.getElementById('ej-nivel').value = e.nivel;
        document.getElementById('ej-descripcion').value = e.descripcion || '';
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoEjercicio')).show();
}