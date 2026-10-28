const buscar = document.getElementById('buscar');
const filtroPlan = document.getElementById('filtroPlan');
const filtroEstado = document.getElementById('filtroEstado');
const sinResultados = document.getElementById('sinResultados');
    
let adminModal = null;
let modalTitle, modalBody;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fecha = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? esc(iso) : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
};

let listaSocios = [];

async function cargarSocios() {
    try {
        const respuesta = await API.request('/socios', 'GET');
        if (respuesta.status === 'ok') {
            listaSocios = respuesta.data || [];
            render();
        } else {
                console.error("Error al cargar socios:", respuesta.message);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

function render() {
    const texto = buscar.value.trim().toLowerCase();
    const plan = filtroPlan.value.toLowerCase();
    const estado = filtroEstado.value.toLowerCase();
    const tbody = document.getElementById('tablaSocios');
        
    const listaFiltrada = listaSocios.filter(socio => {
        let estadoClase = 'activo';
        const coincide =
            (socio.id_usuario.toString().includes(texto) || socio.nombre_usuario.toLowerCase().includes(texto) || socio.email.toLowerCase().includes(texto)) &&
            (!plan || (socio.nombre_plan && socio.nombre_plan.toLowerCase().includes(plan))) &&
            (!estado || estadoClase === estado);
        return coincide;
    });

    if (listaFiltrada.length === 0) {
        sinResultados.classList.add('visible');
        tbody.innerHTML = '';
        return;
    }

    sinResultados.classList.remove('visible');

    tbody.innerHTML = listaFiltrada.map((socio) => {
        let estadoClase = 'activo';
        let estadoTexto = 'Activo';
        return `
            <tr data-plan="${socio.nombre_plan ? socio.nombre_plan.toLowerCase() : ''}" data-estado="${estadoClase}">
                <td class="col-id">${socio.id_usuario}</td>
                <td>${esc(socio.nombre_usuario)}</td>
                <td>${esc(socio.email)}</td>
                <td>${socio.nombre_plan ? esc(socio.nombre_plan) : '<span class="admin-nulo">—</span>'}</td>
                <td><span class="admin-estado ${estadoClase}">${estadoTexto}</span></td>
                <td>${socio.fecha_fin ? fecha(socio.fecha_fin) : '<span class="admin-nulo">—</span>'}</td>
                <td class="col-acciones">
                    <a href="#" class="admin-mini btn-ver" data-id="${socio.id_usuario}">Ver</a>
                    <a href="#" class="admin-mini btn-editar" data-id="${socio.id_usuario}">Editar</a>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const socio = listaSocios.find(s => s.id_usuario == btn.dataset.id);
            if (modalTitle) modalTitle.textContent = "Detalles del Socio";
            if (modalBody) {
                modalBody.innerHTML = `
                    <p><strong>ID:</strong> ${socio.id_usuario}</p>
                    <p><strong>Usuario:</strong> ${esc(socio.nombre_usuario)}</p>
                    <p><strong>Email:</strong> ${esc(socio.email)}</p>
                    <p><strong>Plan:</strong> ${esc(socio.nombre_plan || '—')}</p>
                    <p><strong>Vencimiento:</strong> ${socio.fecha_fin ? fecha(socio.fecha_fin) : '—'}</p>
                `;
            }
            if (adminModal) adminModal.show();
        });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const socio = listaSocios.find(s => s.id_usuario == btn.dataset.id);
            if (modalTitle) modalTitle.textContent = "Editar Socio";
            if (modalBody) {
                modalBody.innerHTML = `
                    <form onsubmit="event.preventDefault();">
                        <div class="mb-3">
                            <label class="form-label">Nombre de Usuario</label>
                            <input type="text" class="admin-input" value="${esc(socio.nombre_usuario)}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="admin-input" value="${esc(socio.email)}">
                        </div>
                        <button type="submit" class="admin-btn">Guardar Cambios</button>
                    </form>
                `;
            }
            if (adminModal) adminModal.show();
        });
    });
}

[buscar, filtroPlan, filtroEstado].forEach(el => el.addEventListener('input', render));
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('adminModal');
    if (modalEl) {
        adminModal = new bootstrap.Modal(modalEl);
    }
    modalTitle = document.getElementById('adminModalLabel');
    modalBody = document.getElementById('adminModalBody');

    cargarSocios();
});