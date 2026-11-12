let idProductoActual = null;
let sesionActiva = false;
let puntuacionElegida = 0;

function porId(id) {
    return document.getElementById(id);
}

function numero(n, singular, plural) {
    return `${n} ${n === 1 ? singular : plural}`;
}

function tiempo(fechaTexto) {
    const [anio, mes, dia] = String(fechaTexto).split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.round((hoy - fecha) / 86400000);

    if (isNaN(dias)) return '';
    if (dias <= 0) return 'Hoy';
    if (dias < 7) return 'Hace ' + numero(dias, 'día', 'días');
    if (dias < 30) return 'Hace ' + numero(Math.floor(dias / 7), 'semana', 'semanas');
    if (dias < 365) return 'Hace ' + numero(Math.floor(dias / 30), 'mes', 'meses');
    return 'Hace ' + numero(Math.floor(dias / 365), 'año', 'años');
}

function crearEstrellas(valor) {
    const contenedor = document.createElement('div');
    contenedor.className = 'text-warning';
    const llenas = Math.round(valor);

    for (let i = 1; i <= 5; i++) {
        const estrella = document.createElement('i');
        estrella.className = 'bi ' + (i <= llenas ? 'bi-star-fill' : 'bi-star');
        contenedor.appendChild(estrella);
    }
    return contenedor;
}

function pintarResumen(data) {
    const promedio = Number(data.promedio);

    porId('resumen-promedio').textContent = data.total > 0 ? promedio.toFixed(1) : '–';
    porId('resumen-estrellas').replaceChildren(crearEstrellas(promedio));
    porId('resumen-total').textContent = numero(data.total, 'reseña', 'reseñas');

    const barras = porId('resumen-barras');
    barras.replaceChildren();

    for (let n = 5; n >= 1; n--) {
        const cantidad = data.distribucion[n] || 0;
        const porcentaje = data.total > 0 ? (cantidad / data.total) * 100 : 0;

        const fila = document.createElement('div');
        fila.className = 'd-flex align-items-center gap-2 small mb-1';

        const etiqueta = document.createElement('span');
        etiqueta.style.width = '2.2rem';
        etiqueta.textContent = n + ' ★';

        const progreso = document.createElement('div');
        progreso.className = 'progress flex-grow-1';
        progreso.style.height = '10px';

        const relleno = document.createElement('div');
        relleno.className = 'progress-bar bg-dark';
        relleno.style.width = porcentaje + '%';
        progreso.appendChild(relleno);

        const cuenta = document.createElement('span');
        cuenta.className = 'text-muted text-end';
        cuenta.style.width = '2rem';
        cuenta.textContent = cantidad;

        fila.append(etiqueta, progreso, cuenta);
        barras.appendChild(fila);
    }
}

function crearResena(r) {
    const fila = document.createElement('div');
    fila.className = 'd-flex gap-3 py-3 border-top';

    const avatar = document.createElement('div');
    avatar.className = 'rounded-circle bg-light border d-flex align-items-center justify-content-center fw-bold flex-shrink-0';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.textContent = (r.usuario || '?').charAt(0).toUpperCase();

    const cuerpo = document.createElement('div');
    cuerpo.className = 'flex-grow-1';

    const cabecera = document.createElement('div');
    cabecera.className = 'd-flex justify-content-between';

    const nombre = document.createElement('span');
    nombre.className = 'fw-semibold';
    nombre.textContent = r.usuario;

    const fecha = document.createElement('span');
    fecha.className = 'text-muted small';
    fecha.textContent = tiempo(r.fecha);

    cabecera.append(nombre, fecha);

    const comentario = document.createElement('p');
    comentario.className = 'm-0 mt-1 small text-secondary';
    comentario.textContent = r.comentario;

    cuerpo.append(cabecera, crearEstrellas(r.puntuacion), comentario);
    fila.append(avatar, cuerpo);
    return fila;
}

function pintarLista(resenas) {
    const lista = porId('lista-resenas');

    if (resenas.length === 0) {
        lista.textContent = 'Todavía no hay reseñas. ¡Sé el primero en opinar!';
        return;
    }
    lista.replaceChildren(...resenas.map(crearResena));
}

async function cargarResenas(id) {
    porId('lista-resenas').textContent = 'Cargando reseñas...';

    const res = await API.request(`/producto/${id}/resenas`);

    if (id !== idProductoActual) return;

    if (!res || res.status !== 'ok') {
        porId('lista-resenas').textContent = 'No se pudieron cargar las reseñas.';
        return;
    }
    pintarResumen(res.data);
    pintarLista(res.data.resenas);
}

function pintarSelector() {
    porId('resena-selector').querySelectorAll('button').forEach((boton, i) => {
        boton.firstElementChild.className = 'bi ' + (i < puntuacionElegida ? 'bi-star-fill' : 'bi-star');
    });
}

function reiniciarFormulario() {
    puntuacionElegida = 0;
    porId('resena-comentario').value = '';
    porId('resena-error').textContent = '';
    porId('form-resena').classList.add('d-none');
    pintarSelector();
}

function mostrarAccionesSegunSesion() {
    porId('btn-escribir-resena').classList.toggle('d-none', !sesionActiva);
    porId('resena-login').classList.toggle('d-none', sesionActiva);
}

async function publicarResena() {
    const error = porId('resena-error');
    const comentario = porId('resena-comentario').value.trim();
    error.textContent = '';

    if (puntuacionElegida === 0) {
        error.textContent = 'Elegí una puntuación de 1 a 5 estrellas.';
        return;
    }
    if (comentario === '') {
        error.textContent = 'Escribí un comentario.';
        return;
    }

    const boton = porId('btn-publicar-resena');
    boton.disabled = true;

    const res = await API.request(
        `/producto/${idProductoActual}/resenas`,
        'POST',
        { puntuacion: puntuacionElegida, comentario: comentario }
    );

    boton.disabled = false;

    if (res.status === 'ok') {
        reiniciarFormulario();
        await cargarResenas(idProductoActual);
        return;
    }
    error.textContent = res.message || 'No se pudo publicar la reseña.';
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = porId('modalProducto');
    if (!modal) return;

    const selector = porId('resena-selector');
    for (let n = 1; n <= 5; n++) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-link text-warning fs-3 p-0 me-1';
        boton.setAttribute('aria-label', `${n} de 5 estrellas`);
        boton.appendChild(document.createElement('i'));
        boton.addEventListener('click', () => {
            puntuacionElegida = n;
            pintarSelector();
        });
        selector.appendChild(boton);
    }
    pintarSelector();

    porId('btn-escribir-resena').addEventListener('click', () => {
        porId('form-resena').classList.toggle('d-none');
    });
    porId('btn-cancelar-resena').addEventListener('click', reiniciarFormulario);
    porId('btn-publicar-resena').addEventListener('click', publicarResena);

    modal.addEventListener('show.bs.modal', async () => {
        const id = Number(modal.dataset.idProducto);
        idProductoActual = id;
        reiniciarFormulario();

        const [sesion] = await Promise.all([API.request('/sesion'), cargarResenas(id)]);

        sesionActiva = sesion.status === 'ok';
        mostrarAccionesSegunSesion();
    });
});