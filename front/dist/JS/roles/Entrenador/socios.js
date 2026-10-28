function MostrarMensaje(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 5;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

function EstadoMembresia(fechaFin) {
    if (!fechaFin) return 'Sin plan';
        const fin = new Date(fechaFin + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fin >= hoy ? 'Activo' : 'Vencido';
    }

function AbrirSocio(s) {
    const nombre = `${s.usuario} ${s.apellido || ''}`.trim();

    document.getElementById('soc-ver-nombre').textContent = nombre;
    document.getElementById('soc-ver-objetivo').textContent = s.objetivo || '-';
    document.getElementById('soc-ver-estado-objetivo').textContent = s.estado_objetivo || '-';
    document.getElementById('soc-ver-membresia').textContent = s.membresia ||'Sin plan';
    document.getElementById('soc-ver-estado').textContent = EstadoMembresia(s.fecha_fin);
    document.getElementById('soc-ver-vence').textContent = s.fecha_fin || '-';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSocio')).show();
}

function CrearFila(s) {
    const fila = document.createElement('tr');
    const socio = `${s.usuario} ${s.apellido || ''}` .trim();
    [socio, s.objetivo, s.membresia].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto || '-';
        fila.appendChild(celda);
    });

const estado = EstadoMembresia(s.fecha_fin);
const celdaEstado = document.createElement('td');
const etiqueta = document.createElement('span');
etiqueta.className = 'admin-estado';
if (estado === 'Activo') etiqueta.classList.add('activo');
if (estado === 'Vencido') etiqueta.classList.add('vencido');
etiqueta.textContent = estado;
celdaEstado.appendChild(etiqueta);
fila.appendChild(celdaEstado);

const acciones = document.createElement('td');
acciones.className = 'col-acciones';

const ver = document.createElement('button');
ver.className = 'admin-mini';
ver.textContent = 'Ver';
ver.addEventListener('click', () => AbrirSocio(s));

acciones.append(ver);
fila.appendChild(acciones);
return fila;
}

async function CargarSocios() {
    const tbody = document.getElementById('listar-socios');
    if(!tbody) return;
    const res = await API.request('/mis-socios');
    if (!res || res.status !== 'ok') {
        MostrarMensaje(tbody, res?.message || 'Los socios no cargan');
        return;
    }
    if (res.data.length === 0) {
        MostrarMensaje(tbody, 'No hay socios Cargados');
        return;
    }
    TodoslosSocios = res.data;
    MostrarSocios(TodoslosSocios);
}

let TodoslosSocios = [];
function Normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function MostrarSocios(lista) {
    const tbody = document.getElementById('listar-socios');
    if (lista.length === 0) {
        MostrarMensaje(tbody, 'No se encontraron socios');
        return;
    }
    tbody.replaceChildren(...lista.map(CrearFila));
}

function FiltrarSocios() {
    const texto = Normalizar(document.getElementById('buscar-socio').value.trim());
    const filtrados = TodoslosSocios.filter(s =>
        Normalizar(`${s.usuario} ${s.apellido || ''}`).includes(texto)
    );
    MostrarSocios(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
    CargarSocios();
    document.getElementById('buscar-socio').addEventListener('input', FiltrarSocios);
});