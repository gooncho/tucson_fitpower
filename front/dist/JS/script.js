const contenedor = document.getElementById('contenedorDeslizable');

const irARegistro = document.getElementById('irARegistro');
const irALogin = document.getElementById('irALogin');

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

    if (document.getElementById('form-login')) {
        return;
    }

    const sesion = await API.request('/sesion');

    if (sesion.status !== 'ok') {
        window.location.href = '/';
        return;
    }
    
    iniciarControlInactividad(TIEMPO_INACTIVIDAD[sesion.data.rol]);

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

const TIEMPO_INACTIVIDAD = {
    Socio: 10 * 60,            
    Entrenador: 20 * 60,       
    Administrador: null   
};
const SEGUNDOS_AVISO = 60; 

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