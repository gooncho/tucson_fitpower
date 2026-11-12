let productos = []; 
let adminModal = null;
let modalTitle, modalBody;

function render() {
  const q = norm($("buscar").value.trim());
  const cat = $("filtroCategoria").value;
  const est = $("filtroEstado").value;

    const filtrados = productos.filter(p =>
    (!q || norm(p.nombre).includes(q)) &&
    (!cat || p.categoria === cat) &&
    (!est || p.estado === est));
  const lista = paginar(filtrados, render);

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
        <a href="#" class="admin-mini btn-eliminar-lista" data-index="${index}">Eliminar</a>
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

  document.querySelectorAll('.btn-eliminar-lista').forEach(btn => {
      btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const producto = lista[btn.dataset.index];
          btn.style.pointerEvents = 'none';
          try {
              const respuesta = await API.request('/productos/' + producto.id_producto, 'DELETE');
              if (respuesta.status === 'ok') {
                  productos = productos.filter(item => item.id_producto !== producto.id_producto);
                  render();
              } else {
                  btn.style.pointerEvents = '';
                  console.error(respuesta.message || 'No se pudo eliminar el producto');
              }
          } catch (error) {
              btn.style.pointerEvents = '';
              console.error(error);
          }
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
                      <p class="text-danger" id="errorEditar"></p>
                      <button type="submit" class="admin-btn">Guardar Cambios</button>
                      <button type="button" class="admin-mini" id="btnEliminar">Eliminar</button>
                  </form>
              `;
              document.getElementById('btnEliminar').addEventListener('click', async (ev) => {
                  ev.preventDefault();
                  ev.target.disabled = true;
                  try {
                      const respuesta = await API.request('/productos/' + p.id_producto, 'DELETE');
                      if (respuesta.status === 'ok') {
                          adminModal.hide();
                          cargar();
                      } else {
                          ev.target.disabled = false;
                          console.error(respuesta.message || 'No se pudo eliminar el producto');
                      }
                  } catch (error) {
                      ev.target.disabled = false;
                      console.error(error);
                  }
              });
          }
          if (adminModal) adminModal.show();
      });
  });
}

function cargar() {
    API.request('/productos', 'GET').then(d => {
      productos = Array.isArray(d) ? d : (d.data || []);
      llenarSelect("filtroCategoria", productos.map(p => p.categoria), "Todas las categorías");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
}

function abrirNuevo() {
    modalTitle.textContent = "Nuevo Producto";
    modalBody.innerHTML = `
        <form id="formNuevo">
            <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input type="text" class="admin-input" name="nombre" maxlength="50" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Categoría</label>
                <select class="admin-select" name="id_categoria" required>
                    <option value="1">Suplementos</option>
                    <option value="2">Indumentaria</option>
                    <option value="3">Accesorios</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Descripción</label>
                <input type="text" class="admin-input" name="descripcion">
            </div>
            <div class="mb-3">
                <label class="form-label">Precio ($)</label>
                <input type="number" class="admin-input" name="precio" min="0" step="any" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Stock</label>
                <input type="number" class="admin-input" name="stock" min="0" required>
            </div>
            <p class="text-danger" id="errorNuevo"></p>
            <button type="submit" class="admin-btn">Guardar</button>
        </form>
    `;
    document.getElementById('formNuevo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.target));
        const respuesta = await API.request('/productos', 'POST', datos);
        if (respuesta.status === 'ok') {
            adminModal.hide();
            cargar();
        } else {
            document.getElementById('errorNuevo').textContent = respuesta.message || 'No se pudo guardar';
        }
    });
    adminModal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('adminModal');
    if (modalEl) {
        adminModal = new bootstrap.Modal(modalEl);
    }
    modalTitle = document.getElementById('adminModalLabel');
    modalBody = document.getElementById('adminModalBody');

    conectar(["buscar", "filtroCategoria", "filtroEstado"], render);

    document.getElementById('btnNuevo').addEventListener('click', (e) => {
        e.preventDefault();
        abrirNuevo();
    });

    cargar();
});