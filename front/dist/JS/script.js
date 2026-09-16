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

        window.location.href = '../../index.html';

        return;
    }


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

            window.location.href = '../../index.html';
        });
    }
});