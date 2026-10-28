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

document.addEventListener('DOMContentLoaded', CargarPerfil);