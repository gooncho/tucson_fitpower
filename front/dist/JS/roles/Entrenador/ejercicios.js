let Todoslosejercicios = [];
let EjercicioEditado = null;
let EjercicioAEliminar = null;

const PagEjercicios = CrearPaginacion('pag-ejercicios', 10, lista => {
    document.getElementById('listar-ejercicios').replaceChildren(...lista.map(CrearFila));
});

function MostrarMensaje(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

const EXTENSIONES = ['png', 'jpg', 'webp'];

function MostrarImagen(img, id) {
    let intento = 0;
    img.classList.remove('d-none');
    img.onerror = () => {
        intento++;
        if (intento < EXTENSIONES.length) {
            img.src = `/front/dist/assets/Ejercicios/${id}.${EXTENSIONES[intento]}`;
        } else {
            img.classList.add('d-none');
        }
    };
    img.src = `/front/dist/assets/Ejercicios/${id}.${EXTENSIONES[0]}`;
}

function AbrirEjercicio(e) {
    document.getElementById('ej-ver-nombre').textContent = e.nombre;
    document.getElementById('ej-ver-descripcion').textContent = e.descripcion || 'Sin descripcion';

    const img = document.getElementById('ej-ver-imagen');
    img.alt = e.nombre;
    MostrarImagen(img, e.id_ejercicio);

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

        const enDesactivados = document.getElementById('estado-ejercicio').value === 'inactivos';

    if (enDesactivados) {
        const reactivar = document.createElement('button');
        reactivar.className = 'admin-mini';
        reactivar.textContent = 'Reactivar';
        reactivar.addEventListener('click', () => ReactivarEjercicio(e));
        acciones.append(ver, reactivar);
    } else {
        const editar = document.createElement('button');
        editar.className = 'admin-mini';
        editar.textContent = 'Editar';
        editar.addEventListener('click', () => AbrirFormularioEjercicio(e));

        const eliminar = document.createElement('button');
        eliminar.className = 'admin-mini peligro';
        eliminar.textContent = 'Eliminar';
        eliminar.addEventListener('click', () => AbrirEliminarEjercicio(e));

        acciones.append(ver, editar, eliminar);
    }
    
    fila.appendChild(acciones);
    return fila;
}

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function Mostrarejercicios(lista) {
    PagEjercicios.mostrar(lista);
    if (lista.length === 0) {
        MostrarMensaje(document.getElementById('listar-ejercicios'), 'No se encontraron ejercicios');
    }
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

    const estado = document.getElementById('estado-ejercicio').value;
    const res = await API.request(`/ejercicio?estado=${estado}`);

    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'Los ejercicios no cargan');
        return;
    }
    if (res.data.length === 0) {
        Todoslosejercicios = [];
        PagEjercicios.mostrar([]);
        MostrarMensaje(tbody, estado === 'inactivos' ? 'No hay ejercicios desactivados' : 'No hay ejercicios cargados');
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
    document.getElementById('ej-imagen').value = '';
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
    
    if (res && res.status === 'ok') {
        const archivo = document.getElementById('ej-imagen').files[0];

        if (!EjercicioEditado && archivo) {
            const formulario = new FormData();
            formulario.append('imagen', archivo);
            const resImg = await API.subir(`/ejercicio/${res.id}/imagen`, formulario);

            if (!resImg || resImg.status !== 'ok') {
                alert('El ejercicio se creó, pero la imagen no: ' + (resImg?.message || 'error desconocido'));
            }
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoEjercicio')).hide();
        await CargarEjercicios();
        return;
    }
    error.textContent = res?.message || 'No se pudo guardar el ejercicio.';
}

function AbrirEliminarEjercicio(e) {
    EjercicioAEliminar = e;
    document.getElementById('elim-ej-nombre').textContent = e.nombre;
    document.getElementById('elim-ej-error').textContent = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarEjercicio')).show();
}

async function ConfirmarEliminarEjercicio() {
    if (!EjercicioAEliminar) return;

    const boton = document.getElementById('btn-confirmar-eliminar');
    boton.disabled = true;
    const res = await API.request(`/ejercicio/${EjercicioAEliminar.id_ejercicio}`, 'DELETE');
    boton.disabled = false;

    if (res && res.status === 'ok') {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarEjercicio')).hide();
        EjercicioAEliminar = null;
        await CargarEjercicios();
        return;
    }
    document.getElementById('elim-ej-error').textContent = res?.message || 'No se pudo eliminar el ejercicio';
}

async function ReactivarEjercicio(e) {
    const res = await API.request(`/ejercicio/${e.id_ejercicio}/reactivar`, 'PUT');

    if (!res || res.status !== 'ok') {
        alert(res?.message || 'No se pudo reactivar el ejercicio');
        return;
    }
    await CargarEjercicios();
}

function AbrirFormularioEjercicio(e = null) {
    LimpiarFormularioEjercicio();
    EjercicioEditado = e;

    document.getElementById('ej-modal-titulo').textContent = e ? 'Editar ejercicio' : 'Nuevo ejercicio';
    document.getElementById('ej-imagen-grupo').classList.toggle('d-none', e !== null);

    if(e) {
        document.getElementById('ej-nombre').value = e.nombre;
        document.getElementById('ej-grupo').value = e.grupo_muscular;
        document.getElementById('ej-nivel').value = e.nivel;
        document.getElementById('ej-descripcion').value = e.descripcion || '';
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoEjercicio')).show();
}

document.addEventListener('DOMContentLoaded', () => {
    CargarEjercicios();
    
    document.getElementById('buscar-ejercicio').addEventListener('input', () => {
        PagEjercicios.reiniciar();
        FiltrarEjercicios();
    });
    document.getElementById('estado-ejercicio').addEventListener('change', () => {
        PagEjercicios.reiniciar();
        CargarEjercicios();
    });
    document.getElementById('btn-nuevo-ejercicio').addEventListener('click', () => AbrirFormularioEjercicio());
    document.getElementById('btn-guardar-ejercicio').addEventListener('click', GuardarEjercicio);
    document.getElementById('estado-ejercicio').addEventListener('change', CargarEjercicios);
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', ConfirmarEliminarEjercicio);
});