let rutinas = [];
let rutinaModal = null;
let modalTitle, modalBody;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderRutinas() {
    const q = (document.getElementById('buscar-rutina')?.value || "").toLowerCase().trim();
    const contenedor = document.getElementById('lista-rutinas');

    const filtradas = rutinas.filter(r =>
        !q || (r.nombre && r.nombre.toLowerCase().includes(q)) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(q))
    );

    if (filtradas.length === 0) {
        contenedor.innerHTML = `<div class="card-panel text-whit text-center py-4">No se encontraron rutinas registradas.</div>`;
        return;
    }

    contenedor.innerHTML = filtradas.map((r, index) => `
        <div class="card-panel d-flex justify-content-between align-items-center flex-wrap gap-3" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 14px; padding: 20px;">
            <div>
                <h3 class="mb-1" style="font-size: 19px; font-weight: 700; color: #f4f4f2;">${esc(r.nombre)}</h3>
                <p class="mb-0 text-whit" style="font-size: 13.5px;">${esc(r.cantidad_ejercicios || r.ejercicios?.length || 0)} ejercicios</p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn-lime btn-iniciar" data-index="${index}"><i class="bi bi-play-fill"></i> Iniciar</button>
                <button class="admin-mini btn-ver" data-index="${index}" style="padding: 9px 16px; font-size: 13.5px; font-weight: 700; border-radius: 10px;">Ver rutina</button>
                ${Number(r.es_propia) === 1 ? `<button class="admin-mini btn-editar" data-index="${index}" style="padding: 9px 16px; font-size: 13.5px; font-weight: 700; border-radius: 10px; margin-left: 0;">Editar</button>` : ''}
            </div>
        </div>
    `).join("");

    document.querySelectorAll('.btn-iniciar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const r = filtradas[btn.dataset.index];
            window.location.href = `EntrenamientoCurso.html?id=${r.id_rutina || r.id}`;
        });
    });

    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const r = filtradas[btn.dataset.index];
            window.location.href = `DetalleRutina.html?id=${r.id_rutina || r.id}`;
        });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = filtradas[btn.dataset.index];
            window.location.href = `CrearRutina.html?id=${r.id_rutina}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('rutinaModal');
    if (modalEl) {
        rutinaModal = new bootstrap.Modal(modalEl);
    }
    modalTitle = document.getElementById('rutinaModalLabel');
    modalBody = document.getElementById('rutinaModalBody');

    const inputBuscar = document.getElementById('buscar-rutina');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', renderRutinas);
    }

    const btnCrear = document.getElementById('btn-crear-rutina');
    if (btnCrear) {
        btnCrear.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'CrearRutina.html';
        });
    }

    cargarRutinas();
});

async function cargarRutinas() {
    try {
        const respuesta = await API.request('/mis-rutinas', 'GET');
        rutinas = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
        renderRutinas();
    } catch (error) {
        rutinas = [];
        renderRutinas();
    }
}