let productos = [];
let adminModal = null;
let modalTitle, modalBody;

function render() {
  const q = norm($("buscar").value.trim());
  const cat = $("filtroCategoria").value;
  const est = $("filtroEstado").value;

  const lista = productos.filter(p =>
    (!q || norm(p.nombre).includes(q)) &&
    (!cat || p.categoria === cat) &&
    (!est || p.estado === est));

  $("tbody").innerHTML = lista.map((p, index) => `
    <tr>
      <td>${esc(p.nombre)}</td>
      <td>${esc(p.categoria)}</td>
      <td>${esc(p.stock)}</td>
      <td>${dinero(p.precio)}</td>
      <td><span class="admin-estado ${slug(p.estado)}">${esc(p.estado)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        <a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
      </td>
    </tr>`).join("");

  aviso(lista.length ? "" : (productos.length ? "No hay productos que coincidan con la búsqueda" : "Todavía no hay productos registrados"));

  document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          const p = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Detalles del Producto";
          if (modalBody) {
              modalBody.innerHTML = `
                  <p><strong>Nombre:</strong> ${esc(p.nombre)}</p>
                  <p><strong>Categoría:</strong> ${esc(p.categoria)}</p>
                  <p><strong>Stock:</strong> ${esc(p.stock)}</p>
                  <p><strong>Precio:</strong> ${dinero(p.precio)}</p>
                  <p><strong>Estado:</strong> ${esc(p.estado)}</p>
              `;
          }
          if (adminModal) adminModal.show();
      });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          const p = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Editar Producto";
          if (modalBody) {
              modalBody.innerHTML = `
                  <form onsubmit="event.preventDefault();">
                      <div class="mb-3">
                          <label class="form-label">Nombre</label>
                          <input type="text" class="admin-input" value="${esc(p.nombre)}">
                      </div>
                      <div class="mb-3">
                          <label class="form-label">Precio ($)</label>
                          <input type="number" class="admin-input" value="${esc(p.precio)}">
                      </div>
                      <div class="mb-3">
                          <label class="form-label">Stock</label>
                          <input type="number" class="admin-input" value="${esc(p.stock)}">
                      </div>
                      <button type="submit" class="admin-btn">Guardar Cambios</button>
                  </form>
              `;
          }
          if (adminModal) adminModal.show();
      });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('adminModal');
    if (modalEl) {
        adminModal = new bootstrap.Modal(modalEl);
    }
    modalTitle = document.getElementById('adminModalLabel');
    modalBody = document.getElementById('adminModalBody');

    conectar(["buscar", "filtroCategoria", "filtroEstado"], render);

    API.request('/productos', 'GET').then(d => {
      productos = Array.isArray(d) ? d : (d.data || []);
      llenarSelect("filtroCategoria", productos.map(p => p.categoria), "Todas las categorías");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
});