let ejerciciosDisponibles = [];
let ejerciciosSeleccionados = [];

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.addEventListener('DOMContentLoaded', async () => {
    await cargarEjerciciosDisponibles();

    const inputBuscar = document.getElementById('buscarEjercicio');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', renderEjerciciosDisponibles);
    }

    const btnGuardar = document.getElementById('btnGuardarRutina');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarRutina);
    }
});

async function cargarEjerciciosDisponibles() {
    try {
        const respuesta = await API.request('/ejercicios', 'GET');
        ejerciciosDisponibles = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
        renderEjerciciosDisponibles();
    } catch (err) {
        ejerciciosDisponibles = [
            { id_ejercicio: 1, nombre: "Press de banca" },
            { id_ejercicio: 2, nombre: "Jalón al pecho" },
            { id_ejercicio: 3, nombre: "Press militar" },
            { id_ejercicio: 4, nombre: "Remo con barra" },
            { id_ejercicio: 5, nombre: "Fondos en paralelas" },
            { id_ejercicio: 6, nombre: "Sentadillas con barra" }
        ];
        renderEjerciciosDisponibles();
    }
}

function renderEjerciciosDisponibles() {
    const q = (document.getElementById('buscarEjercicio')?.value || "").toLowerCase().trim();
    const contenedor = document.getElementById('listaEjerciciosDisponibles');

    const filtrados = ejerciciosDisponibles.filter(e => 
        e.nombre.toLowerCase().includes(q) && 
        !ejerciciosSeleccionados.some(sel => sel.id_ejercicio === e.id_ejercicio)
    );

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="text-whit text-center py-3 fs-6">No hay ejercicios disponibles</div>`;
        return;
    }

    contenedor.innerHTML = filtrados.map(e => `
        <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded border border-secondary bg-dark text-light">
            <span style="font-size: 14.5px; font-weight: 500;">${esc(e.nombre)}</span>
            <button class="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center p-1 rounded-circle btn-agregar" data-id="${e.id_ejercicio}" style="width: 28px; height: 28px; border-color: #555;">
                <i class="bi bi-plus-lg text-light"></i>
            </button>
        </div>
    `).join("");

    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const ejercicio = ejerciciosDisponibles.find(e => e.id_ejercicio === id);
            if (ejercicio) {
                ejerciciosSeleccionados.push(ejercicio);
                renderEjerciciosDisponibles();
                renderEjerciciosSeleccionados();
            }
        });
    });
}

function renderEjerciciosSeleccionados() {
    const contenedor = document.getElementById('listaEjerciciosSeleccionados');
    const totalSpan = document.getElementById('totalEjercicios');

    totalSpan.textContent = `Total: ${ejerciciosSeleccionados.length} ejercicio${ejerciciosSeleccionados.length === 1 ? '' : 's'}`;

    if (ejerciciosSeleccionados.length === 0) {
        contenedor.innerHTML = `<div class="text-whit text-center py-4 fs-6">No hay ejercicios seleccionados</div>`;
        return;
    }

    contenedor.innerHTML = ejerciciosSeleccionados.map((e, index) => `
        <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded border border-secondary bg-dark text-light">
            <span style="font-size: 14.5px; font-weight: 500;">${esc(e.nombre)}</span>
            <button class="btn btn-sm text-danger p-0 btn-quitar" data-index="${index}" title="Quitar">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `).join("");

    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            ejerciciosSeleccionados.splice(index, 1);
            renderEjerciciosDisponibles();
            renderEjerciciosSeleccionados();
        });
    });
}

async function guardarRutina() {
    const nombre = document.getElementById('nombreRutina').value.trim();

    if (!nombre) {
        alert("Por favor, ingresa un nombre para la rutina.");
        return;
    }

    if (ejerciciosSeleccionados.length === 0) {
        alert("Debes seleccionar al menos un ejercicio para la rutina.");
        return;
    }

    try {
        const perfilRes = await API.request('/perfil', 'GET');
        const idPersona = perfilRes.id_persona || perfilRes.data?.id_persona || 1;

        const payload = {
            nombre: nombre,
            descripcion: "Creada por el socio",
            id_persona: idPersona,
            ejercicios: ejerciciosSeleccionados.map(e => ({
                id_ejercicio: e.id_ejercicio,
                series: 4,
                repeticiones: 10,
                descanso: 120
            }))
        };

        const respuesta = await API.request('/rutinas', 'POST', payload);
        if (respuesta.status === 'ok' || respuesta.success || respuesta.id) {
            alert("¡Rutina creada con éxito!");
            window.location.href = "Rutinas.html";
        } else {
            alert("Error al guardar la rutina: " + (respuesta.message || "Desconocido"));
        }
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Hubo un error al conectar con el servidor para guardar la rutina.");
    }
}