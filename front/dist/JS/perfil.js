let PerfilActual = null;

function  CrearFilaDato(etiqueta, valor) {
    const fila = document.createElement('div');
    fila.className = 'perfil-dato';
    
    const izquierda = document.createElement('span');
    izquierda.textContent = etiqueta;

    const derecha = document.createElement('span');
    derecha.textContent = valor;

    fila.append(izquierda, derecha);
    return fila;
}

function PintarPerfil(p) {
    PerfilActual = p;
    const nombre = `${p.usuario} ${p.apellido || ''}`.trim();

    document.getElementById('perfil-nombre').textContent = nombre;
    document.getElementById('perfil-email').textContent = p.email;
    document.getElementById('perfil-avatar').textContent = nombre.charAt(0).toUpperCase();
    document.getElementById('perfil-sobre-mi').textContent = p.sobre_mi || 'Coloca una descripcion tuya.';

    const filas = [
        CrearFilaDato('Edad', p.edad != null ? `${p.edad} años` : '-'),
        CrearFilaDato('Altura', p.altura != null ? `${p.altura} cm` : '-')
    ];

    if (p.rol === 'Socio') {
        filas.push(CrearFilaDato('Peso', p.peso != null ? `${p.peso} Kg` : '-'));
        filas.push(CrearFilaDato('Objetivo', p.objetivo || '-'));
    }
    if (p.rol === 'Entrenador') {
        filas.push(CrearFilaDato('Especialidad', p.especialidad || '-'));
    }

    document.getElementById('perfil-datos').replaceChildren(...filas);
}

async function CargarPerfil() {
    const error = document.getElementById('perfil-error');
    const res = await API.request('/perfil');

    if (!res || res.status !== 'ok') {
        error.textContent = res?.message || 'No se pudo cargar el perfil.';
        return;
    }
    PintarPerfil(res.data);
}

function AbrirEditarPerfil() {
    if (!PerfilActual) return;

    document.getElementById('pf-apellido').value = PerfilActual.apellido || '';
    document.getElementById('pf-fecha').value = PerfilActual.fecha_nacimiento || '';
    document.getElementById('pf-altura').value = PerfilActual.altura ?? '';
    document.getElementById('pf-especialidad').value = PerfilActual.especialidad || '';
    document.getElementById('pf-sobre-mi').value = PerfilActual.sobre_mi || '';
    document.getElementById('pf-error').textContent = '';

    document.getElementById('pf-especialidad-grupo')
        .classList.toggle('d-none', PerfilActual.rol !== 'Entrenador');

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerfil')).show();
}

async function GuardarPerfil() {
    const error = document.getElementById('pf-error');
    error.textContent = '';

    const apellido = document.getElementById('pf-apellido').value.trim();
    if (apellido === '') {
        error.textContent = 'El apellido es obligatorio.';
        return;
    }

    const altura = document.getElementById('pf-altura').value;

    const datos = {
        apellido,
        fecha_nacimiento: document.getElementById('pf-fecha').value,
        altura: altura === '' ? null : Number(altura),
        especialidad: document.getElementById('pf-especialidad').value.trim(),
        sobre_mi: document.getElementById('pf-sobre-mi').value.trim()
    };

    const boton = document.getElementById('btn-guardar-perfil');
    boton.disabled = true;
    const res = await API.request('/perfil', 'PUT', datos);
    boton.disabled = false;

    if (res && res.status === 'ok') {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerfil')).hide();
        await CargarPerfil();
        return;
    }
    error.textContent = res?.message || 'No se pudo guardar el perfil.';
}

document.addEventListener('DOMContentLoaded', () => {
    CargarPerfil();
    document.getElementById('btn-editar-perfil')?.addEventListener('click', AbrirEditarPerfil);
    document.getElementById('btn-guardar-perfil')?.addEventListener('click', GuardarPerfil);
});