/**
 * Código común a varias páginas.
 *
 *  - Animación entre "Iniciar sesión" y "Registrarse" en acceso.html.
 *  - Botón "Ver más productos" de la página pública.
 *  - En los paneles: comprueba la sesión, muestra el nombre del usuario,
 *    conecta "Cerrar sesión" e inicia el cierre de sesión por inactividad.
 */

// --- Login / registro: el panel se desliza entre los dos formularios ---
const contenedor = document.getElementById('contenedorDeslizable');

const irARegistro = document.getElementById('irARegistro');
const irALogin = document.getElementById('irALogin');

// sessionStorage recuerda qué formulario estaba abierto si se recarga la página.
if (irARegistro && irALogin && contenedor) {

    irARegistro.addEventListener('click', (e) => {

        e.preventDefault();

        contenedor.classList.add('activar-registro');

        sessionStorage.setItem('vistaActiva', 'registro');
    });


    irALogin.addEventListener('click', (e) => {

        e.preventDefault();

        contenedor.classList.remove('activar-registro');

        sessionStorage.setItem('vistaActiva', 'login');
    });


    document.addEventListener('DOMContentLoaded', function () {

        const panelGuardado = sessionStorage.getItem('vistaActiva');

        if (panelGuardado === 'registro') {

            contenedor.style.transition = 'none';

            irARegistro.click();

            void contenedor.offsetHeight;

            setTimeout(() => {
                contenedor.style.transition = '';
            }, 10);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {

    // --- "Ver más productos": muestra las tarjetas que estaban ocultas ---
    const btnCargarMas = document.getElementById('MasProductos');

    if (btnCargarMas) {

        btnCargarMas.addEventListener('click', () => {

            const productosOcultos =
                document.querySelectorAll('.producto-tarjeta.d-none');

            productosOcultos.forEach(producto => {
                producto.classList.remove('d-none');
            });

            btnCargarMas.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {

    // --- Paneles (todas las páginas con sesión) ---
    // En el login no se controla la sesión (ahí todavía no hay).
    if (document.getElementById('form-login')) {
        return;
    }

    // Si no hay sesión, vuelve al inicio: así no se puede entrar a un panel escribiendo la URL.
    const sesion = await API.request('/sesion');

    if (sesion.status !== 'ok') {
        window.location.href = '/';
        return;
    }
    
    const ruta = window.location.pathname.toLowerCase();
    const rol = sesion.data.rol;
    let rolPermitido = '';

    if (ruta.includes('/roles/administrador/')) rolPermitido = 'Administrador';
    if (ruta.includes('/roles/entrenador/')) rolPermitido = 'Entrenador';
    if (ruta.includes('/roles/socio/')) rolPermitido = 'Socio';

    if (rolPermitido && rol !== rolPermitido) {
        if (rol === 'Administrador') {
            window.location.href = '/front/dist/Paginas/roles/administrador/inicioAdministrador.html';
        } else if (rol === 'Entrenador') {
            window.location.href = '/front/dist/Paginas/roles/entrenador/inicioEntrenador.html';
        } else if (rol === 'Socio') {
            window.location.href = '/front/dist/Paginas/roles/socio/inicioSocio.html';
        }
        return;
    }

    iniciarControlInactividad(TIEMPO_INACTIVIDAD[rol]);

    const nombre = document.getElementById('nombre-usuario');

    if (nombre && sesion.data) {
        nombre.textContent =
            sesion.data.nombre || sesion.data.usuario;
    }

    const botonSalir = document.getElementById('btn-logout');

    if (botonSalir) {
        botonSalir.addEventListener('click', async (e) => {
            e.preventDefault();

            await API.request('/logout', 'POST');

            window.location.href = '/';
        });
    }

});

// --- Cierre de sesión por inactividad ---
// Segundos sin actividad antes de cerrar la sesión, según el rol (null = sin límite).
const TIEMPO_INACTIVIDAD = {
    Socio: 10 * 60,            
    Entrenador: 20 * 60,       
    Administrador: null   
};
// Cuántos segundos antes de cerrar aparece el aviso con la cuenta regresiva.
const SEGUNDOS_AVISO = 60; 

// Vigila clics, teclas, mouse, scroll y toques. La hora de la última actividad
// se guarda en localStorage para que todas las pestañas abiertas la compartan:
// si usás una pestaña, las otras no te cierran la sesión.
function iniciarControlInactividad(segundos) {
    if (!segundos) return;

    const limite = segundos * 1000;
    let ultimaEscritura = 0;
    let cerrando = false;

    const aviso = document.createElement('div');
    aviso.className = 'd-none';
    aviso.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2000;' +
        'max-width:90vw;padding:12px 18px;border-radius:12px;background:#151515;color:#f4f4f2;' +
        'border:1px solid #cdfa3f;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.5);';
    document.body.appendChild(aviso);

    // Guarda la hora actual (como mucho una vez por segundo) y oculta el aviso.
    function marcarActividad() {
        const ahora = Date.now();
        aviso.classList.add('d-none');
        if (ahora - ultimaEscritura < 1000) return;
        ultimaEscritura = ahora;
        try {
            localStorage.setItem('ultimaActividad', String(ahora));
        } catch (e) {}
    }

    function ultimaActividad() {
        try {
            return Number(localStorage.getItem('ultimaActividad')) || Date.now();
        } catch (e) {
            return Date.now();
        }
    }

    // Cierra la sesión en el servidor y lleva al login con el motivo en la URL.
    async function cerrarPorInactividad() {
        if (cerrando) return;
        cerrando = true;
        await API.request('/logout', 'POST');
        window.location.href = '/front/dist/Paginas/acceso.html?motivo=inactividad';
    }

    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evento => {
        document.addEventListener(evento, marcarActividad, { passive: true });
    });

    marcarActividad();

    // Cada segundo calcula cuánto falta: muestra el aviso al final y cierra al llegar a 0.
    setInterval(() => {
        const restante = limite - (Date.now() - ultimaActividad());
        if (restante <= 0) {
            cerrarPorInactividad();
        } else if (restante <= SEGUNDOS_AVISO * 1000) {
            aviso.textContent = `Tu sesión se cerrará en ${Math.ceil(restante / 1000)} segundos por inactividad. Mové el mouse o tocá una tecla para seguir.`;
            aviso.classList.remove('d-none');
        }
    }, 1000);
}