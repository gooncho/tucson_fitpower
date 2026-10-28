let pagos = [];
let adminModal = null;
let modalTitle, modalBody;

function render() {
  const q = norm($("buscar").value.trim());
  const razon = norm($("filtroRazon").value);
  const est = $("filtroEstado").value;

  const lista = pagos.filter(p =>
    (!q || norm(p.nombre_usuario).includes(q)) &&
    (!razon || norm(p.razon).startsWith(razon)) &&
    (!est || p.estado === est));

  $("tbody").innerHTML = lista.map((p, index) => `
    <tr>
      <td>${esc(p.nombre_usuario)}</td>
      <td>${fecha(p.fecha)}</td>
      <td>${esc(p.razon)}</td>
      <td>${dinero(p.monto)}</td>
      <td><span class="admin-estado ${slug(p.estado)}">${esc(p.estado)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        <a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
      </td>
    </tr>`).join("");

  aviso(lista.length ? "" : (pagos.length ? "No hay pagos que coincidan con la búsqueda" : "Todavía no hay pagos registrados"));

  document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          const p = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Detalles del Pago";
          if (modalBody) {
              modalBody.innerHTML = `
                  <p><strong>Socio/Nombre:</strong> ${esc(p.nombre_usuario)}</p>
                  <p><strong>Fecha:</strong> ${fecha(p.fecha)}</p>
                  <p><strong>Razón:</strong> ${esc(p.razon)}</p>
                  <p><strong>Monto:</strong> ${dinero(p.monto)}</p>
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
          if (modalTitle) modalTitle.textContent = "Editar Estado de Pago";
          if (modalBody) {
              modalBody.innerHTML = `
                  <form onsubmit="event.preventDefault();">
                      <div class="mb-3">
                          <label class="form-label">Estado</label>
                          <select class="admin-select">
                              <option value="Pagada" ${p.estado === 'Pagada' ? 'selected' : ''}>Pagada</option>
                              <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                          </select>
                      </div>
                      <button type="submit" class="admin-btn">Actualizar</button>
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

    conectar(["buscar", "filtroRazon", "filtroEstado"], render);

    API.request('/pagos', 'GET').then(d => {
      pagos = Array.isArray(d) ? d : (d.data || []);
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
});