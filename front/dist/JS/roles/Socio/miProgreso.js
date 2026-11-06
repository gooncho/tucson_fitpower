document.addEventListener('DOMContentLoaded', async () => {
    await cargarProgresoSocio();

    const btnDetalles = document.getElementById('btnVerDetalles');
    if (btnDetalles) {
        btnDetalles.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = "Objetivos.html";
        });
    }
});

async function cargarProgresoSocio() {
    try {
        const respuesta = await API.request('/progreso', 'GET');
        console.log("Datos de progreso:", respuesta);

        const data = respuesta.data || respuesta;

        if (data) {
            document.getElementById('valorPeso').textContent = `${data.peso_actual || 72} kg`;
            document.getElementById('fechaPeso').textContent = `Última medición: ${data.fecha_medicion || '12/09/2026'}`;
            document.getElementById('valorRutinas').textContent = `${data.rutinas_completadas || 4}/${data.rutinas_totales || 5}`;
            document.getElementById('valorAsistencia').textContent = `${data.asistencia_dias || 12} días`;
            
            if (data.objetivo) {
                document.getElementById('nombreObjetivo').textContent = data.objetivo.nombre || "Bajar de peso";
                document.getElementById('metaObjetivo').textContent = `${data.objetivo.meta || 70} kg`;
                document.getElementById('labelMin').textContent = `${data.peso_actual || 72} kg`;
                document.getElementById('labelMax').textContent = `${data.objetivo.meta || 70} kg`;
            }

            const porcentaje = data.porcentaje_cumplimiento || 0;
            document.getElementById('porcentajeObjetivos').textContent = `${porcentaje}%`;
            document.getElementById('mensajeObjetivos').textContent = porcentaje > 0 ? "¡Vas por buen camino!" : "¡Empieza ahora!";
            
            const barra = document.getElementById('barraProgreso');
            if (barra) {
                barra.style.width = `${porcentaje}%`;
                barra.setAttribute('aria-valuenow', porcentaje);
            }
        }
    } catch (err) {
        console.warn("Usando datos de respaldo para el progreso:", err);
        document.getElementById('valorPeso').textContent = "72 kg";
        document.getElementById('fechaPeso').textContent = "Última medición: 12/09/2026";
        document.getElementById('valorRutinas').textContent = "4/5";
        document.getElementById('valorAsistencia').textContent = "12 días";
        document.getElementById('nombreObjetivo').textContent = "Bajar de peso";
        document.getElementById('metaObjetivo').textContent = "70 kg";
        document.getElementById('porcentajeObjetivos').textContent = "0%";
        document.getElementById('mensajeObjetivos').textContent = "¡Empieza ahora!";
        document.getElementById('barraProgreso').style.width = "25%";
    }
}