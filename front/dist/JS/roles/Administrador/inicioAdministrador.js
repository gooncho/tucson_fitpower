const escAdmin = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

document.addEventListener('DOMContentLoaded', async () => {
    const respuesta = await API.request('/inicio-administrador', 'GET');
    if (respuesta.status !== 'ok' || !respuesta.data) return;

    const d = respuesta.data;
    document.getElementById('totalSocios').textContent = d.socios;
    document.getElementById('totalEntrenadores').textContent = d.entrenadores;
    document.getElementById('totalMembresias').textContent = d.membresias_activas;
    document.getElementById('ingresosMes').textContent = `$${Number(d.ingresos_mes).toLocaleString('es-UY')}`;

    document.getElementById('distribucionMembresias').innerHTML = d.planes.length ? d.planes.map(p => `<p>${escAdmin(p.nombre)}: ${p.cantidad}</p>`).join('') : '<p>No hay membresías registradas.</p>';
    document.getElementById('productosBajoStock').innerHTML = d.productos_bajo_stock.length ? d.productos_bajo_stock.map(p => `<div class="admin-producto"><div><strong>${escAdmin(p.nombre)}</strong><small>Stock actual: ${escAdmin(p.stock)}</small></div><span>${p.stock <= 3 ? 'Crítico' : 'Bajo'}</span></div>`).join('') : '<p>No hay productos con stock bajo.</p>';
    document.getElementById('membresiasPorVencer').innerHTML = d.por_vencer.length ? d.por_vencer.map(p => `<div class="col-md-4 col-lg-2"><div class="admin-membresia"><strong>${escAdmin(p.nombre_usuario)} ${escAdmin(p.apellido || '')}</strong><small>${escAdmin(p.plan || 'Sin plan')} · ${escAdmin(p.dias)} días</small></div></div>`).join('') : '<p>No hay membresías próximas a vencer.</p>';
});
