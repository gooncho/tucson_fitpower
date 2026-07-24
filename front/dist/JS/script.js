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

    // Atrapamos el contenedor que se desliza
    const contenedorDeslizable = document.getElementById('contenedorDeslizable');

    const panelGuardado = sessionStorage.getItem('vistaActiva');

    if (panelGuardado === 'registro') {
        // 1. Apagamos temporalmente la animación CSS
        contenedorDeslizable.style.transition = 'none';

        // 2. Ejecutamos el clic para cambiar de panel
        btnRegistro.click();

        // 3. Forzamos al navegador a aplicar el cambio al instante (Reflow)
        void contenedorDeslizable.offsetHeight;

        // 4. Volvemos a encender la animación (restaura el CSS original)
        setTimeout(() => {
            contenedorDeslizable.style.transition = '';
        }, 10);
    }

    // --- Lógica para guardar la posición al hacer clic ---
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