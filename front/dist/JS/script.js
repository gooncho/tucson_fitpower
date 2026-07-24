const contenedor = document.getElementById('contenedorDeslizable');
const irARegistro = document.getElementById('irARegistro');
const irALogin = document.getElementById('irALogin');
irARegistro.addEventListener('click', (e) => {
    e.preventDefault();
    contenedor.classList.add('activar-registro');
});
irALogin.addEventListener('click', (e) => {
    e.preventDefault();
    contenedor.classList.remove('activar-registro');
});
document.addEventListener('DOMContentLoaded', function () {
    const btnRegistro = document.getElementById('irARegistro');
    const btnLogin = document.getElementById('irALogin');

    const contenedorDeslizable = document.getElementById('contenedorDeslizable');

    const panelGuardado = sessionStorage.getItem('vistaActiva');

    if (panelGuardado === 'registro') {
       
        contenedorDeslizable.style.transition = 'none';

        btnRegistro.click();

        void contenedorDeslizable.offsetHeight;
      
        setTimeout(() => {
            contenedorDeslizable.style.transition = '';
        }, 10);
    }

    if (btnRegistro) {
        btnRegistro.addEventListener('click', function () {
            sessionStorage.setItem('vistaActiva', 'registro');
        });
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', function () {
            sessionStorage.setItem('vistaActiva', 'login');
        });
    }
});