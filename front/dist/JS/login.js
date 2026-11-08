document.addEventListener('DOMContentLoaded', async () => {
    const sesion = await API.request('/sesion');
    if (sesion.status === 'ok') {
        redirigirSegunRol(sesion.data.rol_id);
        return;
    }
    const form = document.getElementById('form-login');
    const alerta = document.getElementById('alerta-login');
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        alerta.classList.add('d-none');
        alerta.textContent = '';
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        const respuesta = await API.request('/acceso', 'POST', {
            usuario: usuario,
            password: password
        });
        if (respuesta.status === 'ok') {
            redirigirSegunRol(respuesta.data.rol_id);
            return;
        }
        alerta.textContent =
            respuesta.message || 'Usuario o contraseña incorrectos';
        alerta.classList.remove('d-none');
    });

    const formRegistro = document.getElementById('form-registro');
    const alertaRegistro = document.getElementById('alerta-registro');

    formRegistro.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        alertaRegistro.classList.add('d-none');
        alertaRegistro.textContent = '';

        const boton = formRegistro.querySelector('button[type="submit"]');
        boton.disabled = true;

        const respuesta = await API.request('/registro', 'POST', {
            usuario: document.getElementById('reg-usuario').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        });

        boton.disabled = false;

        if (respuesta.status === 'ok') {
            sessionStorage.setItem('vistaActiva', 'login');
            redirigirSegunRol(respuesta.data.rol_id);
            return;
        }

        alertaRegistro.textContent =
            respuesta.message || 'No se pudo crear el usuario';
        alertaRegistro.classList.remove('d-none');
        });
    });

    function redirigirSegunRol(rol) {
        if (rol == 1) {
            window.location.href = './roles/administrador/inicioAdministrador.html';
        } else if (rol == 2) {
            window.location.href = './roles/entrenador/inicioEntrenador.html';
        } else if (rol == 3) {
            window.location.href = './roles/socio/inicioSocio.html';
        } else {
            alert('Tipo de usuario no válido');
        }
}