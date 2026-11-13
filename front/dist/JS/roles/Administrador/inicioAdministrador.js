/**
 * Inicio del Administrador.
 *
 * Muestra los totales del sistema, la distribución de membresías,
 * los productos con poco stock y las membresías que vencen pronto (paginadas de a 6).
 */

// Escapa el texto antes de meterlo en innerHTML, para que nadie pueda inyectar HTML o scripts (XSS).
const escAdmin = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

document.addEventListener('DOMContentLoaded', async () => {
    const respuesta = await API.request('/inicio-administrador', 'GET');
    if (respuesta.status !== 'ok' || !respuesta.data) {
        const mensaje = document.getElementById('errorDashboard');
        if (mensaje) mensaje.textContent = respuesta.message || 'No se pudo cargar la información del panel.';
        console.error('No se pudo cargar el inicio del administrador:', respuesta.message);
        return;
    }

    const d = respuesta.data;
    document.getElementById('totalSocios').textContent = d.socios ?? 0;
    document.getElementById('totalEntrenadores').textContent = d.entrenadores ?? 0;
    document.getElementById('totalMembresias').textContent = d.membresias_activas ?? 0;
    document.getElementById('ejerciciosDisponibles').textContent = d.ejercicios_disponibles ?? 0;

    const planes = Array.isArray(d.planes) ? d.planes : [];
    const productos = Array.isArray(d.productos_bajo_stock) ? d.productos_bajo_stock : [];
    const porVencer = Array.isArray(d.por_vencer) ? d.por_vencer : [];

    // Porcentaje de socios en cada plan.
    const totalPlanes = planes.reduce((total, plan) => total + Number(plan.cantidad || 0), 0);
    document.getElementById('distribucionMembresias').innerHTML = planes.length ? planes.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const porcentaje = totalPlanes ? Math.round(cantidad * 100 / totalPlanes) : 0;
        return `<div class="admin-membresia-resumen">
            <strong>${escAdmin(p.nombre)}</strong>
            <span>${cantidad}</span>
            <small>${porcentaje}% de las membresías</small>
        </div>`;
    }).join('') : '<p>No hay membresías registradas.</p>';
    document.getElementById('productosBajoStock').innerHTML = productos.length ? productos.map(p => {
        const stock = Number(p.stock);
        let estado = 'Bajo';
        if (stock === 0) {
            estado = 'Sin stock';
        } else if (stock < 10) {
            estado = 'Crítico';
        }
        return `<div class="admin-producto"><div><strong>${escAdmin(p.nombre)}</strong><small>Stock actual: ${escAdmin(p.stock)}</small></div><span>${estado}</span></div>`;
    }).join('') : '<p>No hay productos con stock bajo.</p>';
            // Membresías por vencer, 6 por página, con la paginación de administrador.js.
            function renderPorVencer() {
        const contenedor = document.getElementById('membresiasPorVencer');
        if (porVencer.length === 0) {
            contenedor.innerHTML = '<p>No hay membresías próximas a vencer.</p>';
            return;
        }
        const pagina = paginar(porVencer, renderPorVencer, 6);
        contenedor.innerHTML = pagina.map(p => `<div class="col-md-4 col-lg-2"><div class="admin-membresia"><strong>${escAdmin(p.nombre_usuario)} ${escAdmin(p.apellido || '')}</strong><small>${escAdmin(p.plan || 'Sin plan')} · ${escAdmin(p.dias)} días</small></div></div>`).join('');
    }
    renderPorVencer();
});
