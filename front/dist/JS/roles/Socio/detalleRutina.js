const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idRutina = params.get('id');

    if (!idRutina) {
        document.getElementById('nombreRutina').textContent = "Rutina no especificada";
        document.getElementById('listaEjercicios').innerHTML = `<div class="text-whit">No se indicó ninguna rutina para visualizar.</div>`;
        return;
    }

    try {
        const respuesta = await API.request(`/rutinas/${idRutina}`, 'GET');
        const ejercicios = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);

        document.getElementById('nombreRutina').textContent = `Rutina #${idRutina}`;
        document.getElementById('infoEjercicios').textContent = `${ejercicios.length} ejercicios`;

        const contenedor = document.getElementById('listaEjercicios');
        if (ejercicios.length === 0) {
            contenedor.innerHTML = `<div class="card-panel text-whit py-3">No hay ejercicios registrados en esta rutina.</div>`;
            return;
        }

        contenedor.innerHTML = ejercicios.map((ej, index) => `
            <div class="card-panel d-flex align-items-center gap-3 py-3 px-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 12px;">
                <div class="d-flex align-items-center justify-content-center fw-bold rounded" style="width: 36px; height: 36px; background: #2a2a2a; color: #f4f4f2; font-size: 14px; flex-shrink: 0;">
                    ${index + 1}
                </div>
                <div>
                    <h5 class="mb-1" style="font-size: 16px; font-weight: 600; color: #f4f4f2;">${esc(ej.nombre)}</h5>
                    <p class="mb-0 text-whit" style="font-size: 13px;">${esc(ej.series)} series - ${esc(ej.repeticiones)} rep - ${esc(ej.descanso)} seg</p>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Error al cargar detalles de la rutina:", err);
        document.getElementById('nombreRutina').textContent = "Fuerza - Tren superior";
        document.getElementById('infoEjercicios').textContent = "5 ejercicios";

        const ejerciciosDemo = [
            { nombre: "Press de banca", series: 4, repeticiones: 10, descanso: 120 },
            { nombre: "Jalón al pecho", series: 4, repeticiones: 10, descanso: 120 },
            { nombre: "Press militar", series: 4, repeticiones: 10, descanso: 120 },
            { nombre: "Remo con barra", series: 4, repeticiones: 10, descanso: 120 },
            { nombre: "Fondos en paralelas", series: 4, repeticiones: 10, descanso: 120 }
        ];

        document.getElementById('listaEjercicios').innerHTML = ejerciciosDemo.map((ej, index) => `
            <div class="card-panel d-flex align-items-center gap-3 py-3 px-4" style="background: #151515; border: 1px solid #2a2a2a; border-radius: 12px;">
                <div class="d-flex align-items-center justify-content-center fw-bold rounded" style="width: 36px; height: 36px; background: #2a2a2a; color: #f4f4f2; font-size: 14px; flex-shrink: 0;">
                    ${index + 1}
                </div>
                <div>
                    <h5 class="mb-1" style="font-size: 16px; font-weight: 600; color: #f4f4f2;">${esc(ej.nombre)}</h5>
                    <p class="mb-0 text-whit" style="font-size: 13px;">${esc(ej.series)} series - ${esc(ej.repeticiones)} rep - ${esc(ej.descanso)} seg</p>
                </div>
            </div>
        `).join("");
    }
});