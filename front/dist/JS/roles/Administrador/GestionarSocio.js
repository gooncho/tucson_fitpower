/**
 * Gestión de socios (Administrador).
 *
 * Tabla de socios con buscador, filtros por plan y estado, paginación,
 * y los modales de Ver, Editar, Nuevo y Eliminar (con confirmación).
 * Esta página no carga administrador.js, por eso tiene sus propias funciones.
 */

const buscar = document.getElementById('buscar');
const filtroPlan = document.getElementById('filtroPlan');
const filtroEstado = document.getElementById('filtroEstado');
const sinResultados = document.getElementById('sinResultados');
    
let adminModal = null;
let modalTitle, modalBody;

// Escapa el texto antes de meterlo en innerHTML, para que nadie pueda inyectar HTML o scripts (XSS).
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fecha = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? esc(iso) : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
};

let listaSocios = [];

// --- Paginación (copia de la de administrador.js, con otra cantidad por página) ---
const POR_PAGINA = 15;
let paginaActual = 1;

function paginar(lista, render) {
    const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (paginaActual > total) paginaActual = total;

    const controles = document.getElementById('paginacion');
    if (controles) {
        if (lista.length <= POR_PAGINA) {
            controles.replaceChildren();
        } else {
            const boton = (icono, etiqueta, deshabilitado, cambio) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'admin-mini';
                b.disabled = deshabilitado;
                b.setAttribute('aria-label', etiqueta);
                b.innerHTML = `<i class="bi ${icono}"></i>`;
                b.addEventListener('click', () => {
                    paginaActual += cambio;
                    render();
                });
                return b;
            };
            const texto = document.createElement('span');
            texto.textContent = `Página ${paginaActual} de ${total} · ${lista.length} resultados`;
            controles.replaceChildren(
                boton('bi-chevron-left', 'Página anterior', paginaActual === 1, -1),
                texto,
                boton('bi-chevron-right', 'Página siguiente', paginaActual === total, 1)
            );
        }
    }

    const inicio = (paginaActual - 1) * POR_PAGINA;
    return lista.slice(inicio, inicio + POR_PAGINA);
}

// Pide los socios a la API y dibuja la tabla.
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

// Un socio está "activo" si su cuenta está activa y tiene una membresía vigente.
function obtenerEstado(socio) {
    const tieneMembresia = Boolean(socio.nombre_plan && socio.fecha_fin);
    const vigente = socio.fecha_fin && new Date(socio.fecha_fin + 'T23:59:59') >= new Date();
    return Number(socio.activo) === 1 && tieneMembresia && vigente ? 'activo' : 'inactivo';
}

// Filtra por texto, plan y estado, pagina y dibuja la tabla.
// Los botones guardan el id del socio (data-id) para buscarlo en la lista completa.
function render() {
    const texto = buscar.value.trim().toLowerCase();
    const plan = filtroPlan.value.toLowerCase();
    const estado = filtroEstado.value.toLowerCase();
    const tbody = document.getElementById('tablaSocios');
        
        const listaFiltrada = listaSocios.filter(socio => {
        const estadoClase = obtenerEstado(socio);
        const coincide =
            (socio.id_usuario.toString().includes(texto) || socio.nombre_usuario.toLowerCase().includes(texto) || socio.email.toLowerCase().includes(texto)) &&
            (!plan || (socio.nombre_plan && socio.nombre_plan.toLowerCase().includes(plan))) &&
            (!estado || estadoClase === estado);
        return coincide;
    });

    const pagina = paginar(listaFiltrada, render);

    if (listaFiltrada.length === 0) {
        sinResultados.classList.add('visible');
        tbody.innerHTML = '';
        return;
    }

    sinResultados.classList.remove('visible');

    tbody.innerHTML = pagina.map((socio) => {
        const estadoClase = obtenerEstado(socio);
        const estadoTexto = estadoClase === 'activo' ? 'Activo' : 'Inactivo';
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
                    <a href="#" class="admin-mini btn-eliminar" data-id="${socio.id_usuario}">Eliminar</a>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const socio = listaSocios.find(s => s.id_usuario == btn.dataset.id);
            const estadoTexto = obtenerEstado(socio) === 'activo' ? 'Activo' : 'Inactivo';
            if (modalTitle) modalTitle.textContent = "Detalles del Socio";
            if (modalBody) {
                modalBody.innerHTML = `
                    <p><strong>ID:</strong> ${socio.id_usuario}</p>
                    <p><strong>Usuario:</strong> ${esc(socio.nombre_usuario)}</p>
                    <p><strong>Email:</strong> ${esc(socio.email)}</p>
                    <p><strong>Plan:</strong> ${esc(socio.nombre_plan || '—')}</p>
                    <p><strong>Vencimiento:</strong> ${socio.fecha_fin ? fecha(socio.fecha_fin) : '—'}</p>
                    <p><strong>Estado:</strong> ${estadoTexto}</p>
                `;
            }
            if (adminModal) adminModal.show();
        });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const socio = listaSocios.find(s => s.id_usuario == btn.dataset.id);
            if (socio) confirmarEliminarSocio(socio);
        });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const socio = listaSocios.find(s => s.id_usuario == btn.dataset.id);
            if (modalTitle) modalTitle.textContent = "Editar Socio";
            if (modalBody) {
                modalBody.innerHTML = `
                    <form id="formEditar">
                        <div class="mb-3">
                            <label class="form-label">Nombre de Usuario</label>
                            <input type="text" class="admin-input" name="nombre_usuario" value="${esc(socio.nombre_usuario)}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="admin-input" name="email" value="${esc(socio.email)}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Estado del socio</label>
                            <select class="admin-select" name="activo" required>
                                <option value="1" ${obtenerEstado(socio) === 'activo' ? 'selected' : ''}>Activo</option>
                                <option value="0" ${obtenerEstado(socio) !== 'activo' ? 'selected' : ''}>Inactivo / En suspenso</option>
                            </select>
                        </div>
                        <p class="text-danger" id="errorEditar"></p>
                        <button type="submit" class="admin-btn">Guardar Cambios</button>
                    </form>
                `;
                document.getElementById('formEditar').addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const datos = Object.fromEntries(new FormData(ev.target));
                    const boton = ev.target.querySelector('button[type="submit"]');
                    boton.disabled = true;
                    try {
                        const respuesta = await API.request('/socios/' + socio.id_usuario, 'PUT', datos);
                        if (respuesta.status === 'ok') {
                            await cargarSocios();
                            adminModal.hide();
                        } else {
                            document.getElementById('errorEditar').textContent = respuesta.message || 'No se pudo guardar';
                        }
                    } catch (error) {
                        document.getElementById('errorEditar').textContent = 'No se pudo conectar con el servidor';
                    } finally {
                        boton.disabled = false;
                    }
                });
            }
            if (adminModal) adminModal.show();
        });
    });
}

// Modal de confirmación: eliminar un socio borra todos sus datos para siempre.
function confirmarEliminarSocio(socio) {
    modalTitle.textContent = 'Eliminar socio';
    modalBody.innerHTML = `
        <p>¿Seguro que querés eliminar a <strong>${esc(socio.nombre_usuario)}</strong>?</p>
        <p class="small" style="color: #9c9c98;">
            Se borran para siempre su cuenta, rutinas, progreso, asistencias, reseñas y compras.
            Si solo querés que no pueda entrar, usá <strong>Editar</strong> y ponelo como Inactivo.
        </p>
        <p id="errorEliminar" class="text-danger small mb-3"></p>
        <button type="button" class="admin-btn peligro" id="btnConfirmarEliminar">Sí, eliminar</button>`;

    document.getElementById('btnConfirmarEliminar').addEventListener('click', async (ev) => {
        const boton = ev.currentTarget;
        boton.disabled = true;

        const respuesta = await API.request('/socios/' + socio.id_usuario, 'DELETE');
        if (respuesta.status === 'ok') {
            listaSocios = listaSocios.filter(s => s.id_usuario != socio.id_usuario);
            adminModal.hide();
            render();
        } else {
            boton.disabled = false;
            document.getElementById('errorEliminar').textContent = respuesta.message || 'No se pudo eliminar al socio';
        }
    });

    adminModal.show();
}

// Modal para crear un socio nuevo.
function abrirNuevo() {
    modalTitle.textContent = "Nuevo Socio";
    modalBody.innerHTML = `
        <form id="formNuevo">
            <div class="mb-3">
                <label class="form-label">Nombre de Usuario</label>
                <input type="text" class="admin-input" name="nombre_usuario" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Apellido</label>
                <input type="text" class="admin-input" name="apellido" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="admin-input" name="email" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Contraseña</label>
                <input type="password" class="admin-input" name="password" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Plan</label>
                <select class="admin-select" name="id_plan">
                    <option value="">Sin plan</option>
                    <option value="1">Básico</option>
                    <option value="2">Premium</option>
                    <option value="3">Trimestral</option>
                </select>
            </div>
            <p class="text-danger" id="errorNuevo"></p>
            <button type="submit" class="admin-btn">Guardar</button>
        </form>
    `;
    document.getElementById('formNuevo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.target));
        const respuesta = await API.request('/socios', 'POST', datos);
        if (respuesta.status === 'ok') {
            adminModal.hide();
            cargarSocios();
        } else {
            document.getElementById('errorNuevo').textContent = respuesta.message || 'No se pudo guardar';
        }
    });
    adminModal.show();
}

[buscar, filtroPlan, filtroEstado].forEach(el => el.addEventListener('input', () => {
    paginaActual = 1;
    render();
}));
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('adminModal');
    if (modalEl) {
        adminModal = new bootstrap.Modal(modalEl);
    }
    modalTitle = document.getElementById('adminModalLabel');
    modalBody = document.getElementById('adminModalBody');

    document.getElementById('btnNuevo').addEventListener('click', (e) => {
        e.preventDefault();
        abrirNuevo();
    });

    cargarSocios();
});