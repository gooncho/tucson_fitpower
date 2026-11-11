document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('listaPlanes');
    const respuesta = await API.request('/planes', 'GET');
    if (respuesta.status !== 'ok' || !Array.isArray(respuesta.data) || respuesta.data.length === 0) {
        contenedor.innerHTML = '<p class="text-light text-center">No hay planes disponibles.</p>';
        return;
    }
    contenedor.innerHTML = respuesta.data.map((plan, indice) => {
        const destacado = indice === 1;
        const descripcion = String(plan.descripcion || '').split(/[.;\n]/).map(x => x.trim()).filter(Boolean);
        const lista = descripcion.length ? descripcion : [plan.duracion || 'Acceso al gimnasio'];
        return `<div class="col-lg-4 col-md-6"><div class="card caja-plan h-100 ${destacado ? 'destacado position-relative shadow-lg' : ''}">${destacado ? '<span class="preferido">MÁS ELEGIDO</span>' : ''}<div class="card-body text-center d-flex flex-column"><h3 class="mb-3 ${destacado ? 'texto-fitpower' : ''}">${escPlan(plan.nombre)}</h3><h2 class="precio mb-4">$${Number(plan.precio).toLocaleString('es-UY')}<small>/mes</small></h2><ul class="lista-plan flex-grow-1 text-start mx-auto">${lista.map(item => `<li>${escPlan(item)}</li>`).join('')}</ul><a href="dist/Paginas/acceso.html" class="boton-login mt-4">Elegir plan</a></div></div></div>`;
    }).join('');
});
function escPlan(valor) { return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
