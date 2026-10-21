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

function CrearFila(s) {
    const fila = document.createElement('tr');
    const nombre = `${s.usuario} ${s.apellido || ''}` .trim();
    [nombre, s.objetivo, s.membresia, EstadoMembresia(s.fecha_fin)].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto || '-';
        fila.appendChild(celda);
    });

const acciones = document.createElement('td');
const ver = document.createElement('button');
ver.className = 'details-btn';
ver.textContent = 'Ver';

const editar = document.createElement('button');
editar.className = 'details-btn';
editar.textContent = 'Editar';
acciones.append(ver, editar);
fila.appendChild(acciones);
return fila;
}

async function CargarSocios() {
    const tbody = document.getElementById('listar-socios');
    if(!tbody) return;
    const res = await API.request('/socios');
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