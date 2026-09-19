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
});
function redirigirSegunRol(rol) {
    if (rol == 1) {
        window.location.href = './PanelAdministrador.html';
    } else if (rol == 2) {
        window.location.href = './Entrenador.html';
    } else if (rol == 3) {
        window.location.href = './Socio.html';
    } else {
        alert('Tipo de usuario no válido');
    }
}