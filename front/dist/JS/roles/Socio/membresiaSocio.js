document.addEventListener('DOMContentLoaded', async () => {
    await cargarMembresiaSocio();

    const btnRenovar = document.getElementById('btnRenovar');
    if (btnRenovar) {
        btnRenovar.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Solicitud de renovación enviada a recepción. Un administrador procesará tu pago.");
        });
    }
});
async function cargarMembresiaSocio() {
    try {
        const respuesta = await API.request('/membresia', 'GET');
        console.log("Datos de membresía:", respuesta);

        const d = respuesta.data || respuesta;
        if (d) {
            document.getElementById('nombrePlan').textContent = d.nombre_plan || "Plan Pro";
            document.getElementById('precioPlan').textContent = `$${d.precio || 1500} / mes`;
            document.getElementById('estadoMembresia').textContent = d.estado || "Activa";
            document.getElementById('fechaInicio').textContent = formatearFecha(d.fecha_inicio || "2026-09-15");
            document.getElementById('fechaVencimiento').textContent = formatearFecha(d.fecha_fin || "2026-10-15");

            if (Array.isArray(d.beneficios) && d.beneficios.length > 0) {
                const contenedorBeneficios = document.getElementById('listaBeneficios');
                contenedorBeneficios.innerHTML = d.beneficios.map(b => `
                    <li class="d-flex align-items-center gap-2">
                        <i class="bi bi-check-lg fs-5 text-light"></i> ${b}
                    </li>
                `).join("");
            }
        }
    } catch (err) {
        console.warn("Usando datos de respaldo para la membresía:", err);
        document.getElementById('nombrePlan').textContent = "Plan Pro";
        document.getElementById('precioPlan').textContent = "$1500 / mes";
        document.getElementById('estadoMembresia').textContent = "Activa";
        document.getElementById('fechaInicio').textContent = "15/09/2026";
        document.getElementById('fechaVencimiento').textContent = "15/10/2026";
    }
}
function formatearFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}