let historialEntrenamientos = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarHistorial();

    const inputBuscar = document.getElementById('buscarEntrenamiento');
    const inputFecha = document.getElementById('filtroFecha');

    if (inputBuscar) {
        inputBuscar.addEventListener('input', renderTabla);
    }
    if (inputFecha) {
        inputFecha.addEventListener('change', renderTabla);
    }
});
async function cargarHistorial() {
    try {
        const respuesta = await API.request('/entrenamientos', 'GET');
        historialEntrenamientos = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
        renderTabla();
    } catch (error) {
        historialEntrenamientos = [];
        renderTabla();
    }
}

function renderTabla() {
    const texto = (document.getElementById('buscarEntrenamiento')?.value || "").toLowerCase().trim();
    const fechaFiltro = document.getElementById('filtroFecha')?.value || "";
    const tbody = document.getElementById('tablaEntrenamientos');

    const filtrados = historialEntrenamientos.filter(item => {
        const coincideTexto = !texto || (item.rutina && item.rutina.toLowerCase().includes(texto));
        const coincideFecha = !fechaFiltro || (item.fecha && item.fecha.includes(fechaFiltro));
        return coincideTexto && coincideFecha;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron entrenamientos registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(item => {
        const esCompletado = (item.estado || "").toLowerCase() === 'completado';
        const badgeStyle = esCompletado 
            ? 'background: rgba(205, 250, 63, 0.1); color: #cdfa3f; border: 1px solid #cdfa3f;' 
            : 'background: rgba(255, 100, 100, 0.1); color: #ff6464; border: 1px solid #ff6464;';

        let fechaMostrar = item.fecha;
        if (fechaMostrar.includes('-') && fechaMostrar.length === 10) {
            const partes = fechaMostrar.split('-');
            if (partes[0].length === 4) {
                fechaMostrar = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }
        return `
            <tr class="border-bottom border-secondary" style="font-size: 14px;">
                <td class="py-3 text-light">${fechaMostrar}</td>
                <td class="py-3 text-light fw-medium">${item.rutina}</td>
                <td class="py-3 text-muted">${item.duracion}</td>
                <td class="py-3 text-end">
                    <span class="px-3 py-1 rounded-pill fw-semibold" style="font-size: 12px; ${badgeStyle}">
                        ${item.estado}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}