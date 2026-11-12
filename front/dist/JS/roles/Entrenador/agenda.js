const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function NombreDeHoy() {
    // getDay(): 0 = domingo, 1 = lunes... Lo pasamos a 0 = lunes
    return DIAS[(new Date().getDay() + 6) % 7];
}

function Elemento(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function NombreSocio(s) {
    return `${s.usuario} ${s.apellido || ''}`.trim();
}

function CrearSesion(s) {
    const fila = Elemento('div', 'agenda-sesion');

    const hora = s.hora_fin ? `${s.hora_inicio} – ${s.hora_fin}` : (s.hora_inicio || 'Sin hora');
    fila.appendChild(Elemento('span', 'agenda-hora', hora));
    fila.appendChild(Elemento('span', 'agenda-socio', NombreSocio(s)));

    const rutina = Elemento('span', 'agenda-rutina', s.rutina || 'Sin rutina asignada');
    if (!s.rutina) rutina.classList.add('agenda-apagado');
    fila.appendChild(rutina);

    return fila;
}

function CrearDia(dia, sesiones, esHoy) {
    const bloque = Elemento('div', 'agenda-dia' + (esHoy ? ' agenda-hoy' : ''));

    const etiqueta = Elemento('div', 'agenda-dia-nombre');
    etiqueta.appendChild(Elemento('strong', '', dia.slice(0, 3)));
    if (esHoy) etiqueta.appendChild(Elemento('small', '', 'Hoy'));

    const lista = Elemento('div', 'agenda-sesiones');
    lista.append(...sesiones.map(CrearSesion));

    bloque.append(etiqueta, lista);
    return bloque;
}

function MostrarAgenda(datos) {
    const semana = document.getElementById('agenda-semana');
    const hoy = NombreDeHoy();

    const conHorario = datos.filter(s => DIAS.includes(s.dia_semana));
    const sinHorario = datos.filter(s => !DIAS.includes(s.dia_semana));

    if (conHorario.length === 0) {
        semana.replaceChildren(Elemento('p', 'agenda-vacio', 'No tenés sesiones programadas esta semana.'));
    } else {
        const dias = DIAS
            .map(dia => ({ dia, sesiones: conHorario.filter(s => s.dia_semana === dia) }))
            .filter(d => d.sesiones.length > 0);

        semana.replaceChildren(...dias.map(d => CrearDia(d.dia, d.sesiones, d.dia === hoy)));
    }

    const tarjeta = document.getElementById('agenda-sin-horario-card');
    tarjeta.hidden = sinHorario.length === 0;
    document.getElementById('agenda-sin-horario').replaceChildren(
        ...sinHorario.map(s => Elemento('span', 'agenda-chip', NombreSocio(s)))
    );
}

async function CargarAgenda() {
    const semana = document.getElementById('agenda-semana');
    semana.replaceChildren(Elemento('p', 'agenda-vacio', 'Cargando agenda...'));

    const res = await API.request('/mi-agenda');
    if (!res || res.status !== 'ok') {
        semana.replaceChildren(Elemento('p', 'agenda-vacio', res?.message || 'No se pudo cargar la agenda'));
        return;
    }
    MostrarAgenda(res.data);
}

document.addEventListener('DOMContentLoaded', CargarAgenda);