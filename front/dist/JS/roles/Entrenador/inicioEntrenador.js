const SOCIOS_RESUMEN = 4;
const RUTINAS_RESUMEN = 5;

function MensajeLista(contenedor, texto) {
    const p = document.createElement('p');    
    p.textContent = texto;
    contenedor.replaceChildren(p);
}

function MensajeTabla(tbody, texto) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 3;
    celda.textContent = texto;
    fila.appendChild(celda);
    tbody.replaceChildren(fila);
}

function CrearSocioItem(s) {
    const item = document.createElement('div');
    item.className = 'partner-item';

    const info = document.createElement('div');
    info.className = 'partner-info';

    const nombre = document.createElement('div');
    nombre.textContent = `${s.usuario} ${s.apellido || ''}`.trim();

    const objetivo = document.createElement('p');
    objetivo.append('Objetivo actual: ');
    const span = document.createElement('span');
    span.textContent = s.objetivo || 'Sin objetivo';
    objetivo.appendChild(span);

    info.append(nombre, objetivo);

    const boton = document.createElement('button');
    boton.className = 'partner-btn';
    boton.textContent = 'Ver socio';
    boton.addEventListener('click', () => {
        window.location.href = 'MisSocios.html';
    });

    item.append(info, boton);
    return item;
}

function CrearFilaRutina(r) {
    const fila = document.createElement('tr');
    const socio = `${r.usuario} ${r.apellido || ''}`.trim();

    [r.rutina, socio, r.total_ejercicios].forEach(texto => {
        const celda = document.createElement('td');
        celda.textContent = texto ?? '-';
        fila.appendChild(celda);
    });
    return fila;
}

async function CargarResumen() {
    const listaSocios = document.getElementById('lista-socios-resumen');
    const tbodyRutinas = document.getElementById('lista-rutinas-resumen');
    const totalSocios = document.getElementById('total-socios');
    const totalRutinas = document.getElementById('total-rutinas');

    const [socios, rutinas] = await Promise.all ([
        API.request('/mis-socios'),
        API.request('/rutinas')
    ]);

    if (!socios || socios.status !== 'ok'){
        totalSocios.textContent = '-';
        MensajeLista(listaSocios, socios?.message || 'Los socios no cargan');
    } else {
        totalSocios.textContent = socios.data.length;
        if (socios.data.length === 0) {
            MensajeLista(listaSocios, 'No hay socios cargados');
        } else {
            listaSocios.replaceChildren(...socios.data.slice(0, SOCIOS_RESUMEN).map(CrearSocioItem));
        }
    }

    if (!rutinas || rutinas.status !== 'ok') {
        totalRutinas.textContent = '-';
        MensajeTabla(tbodyRutinas, rutinas?.message || 'Las rutinas no cargan');
    } else {
        totalRutinas.textContent = rutinas.data.length;
        if (rutinas.data.length === 0) {
            MensajeTabla(tbodyRutinas, 'No hay rutinas cargadas');
        } else {
            tbodyRutinas.replaceChildren(...rutinas.data.slice(0, RUTINAS_RESUMEN).map(CrearFilaRutina));
        }
    }
}

document.addEventListener('DOMContentLoaded', CargarResumen);
