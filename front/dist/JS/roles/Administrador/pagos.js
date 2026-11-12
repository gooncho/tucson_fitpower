let pagos = [];
let adminModal = null;
let modalTitle, modalBody;

function render() {
  const q = norm($("buscar").value.trim());
  const razon = norm($("filtroRazon").value);
  const est = $("filtroEstado").value;
  const filtrados = pagos.filter(p =>
    (!q || norm(p.nombre_usuario).includes(q)) &&
    (!razon || norm(p.razon).startsWith(razon)) &&
    (!est || p.estado === est));
  const lista = paginar(filtrados, render);

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
      modalTitle.textContent = "Detalles del Pago";
      modalBody.innerHTML = `
        <p><strong>Socio/Nombre:</strong> ${esc(p.nombre_usuario)}</p>
        <p><strong>Fecha:</strong> ${fecha(p.fecha)}</p>
        <p><strong>Razón:</strong> ${esc(p.razon)}</p>
        <p><strong>Monto:</strong> ${dinero(p.monto)}</p>
        <p><strong>Estado:</strong> ${esc(p.estado)}</p>`;
      adminModal.show();
    });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const p = lista[btn.dataset.index];
      modalTitle.textContent = "Editar Estado de Pago";
      modalBody.innerHTML = `
        <form id="formEditarPago">
          <div class="mb-3">
            <label class="form-label">Estado</label>
            <select class="admin-select" name="estado" required>
              <option value="Pagada" ${p.estado === 'Pagada' ? 'selected' : ''}>Pagada</option>
              <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            </select>
          </div>
          <p id="errorPago" class="text-danger"></p>
          <button type="submit" class="admin-btn">Actualizar</button>
        </form>`;
      document.getElementById('formEditarPago').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const respuesta = await API.request('/pagos/' + p.id_pago, 'PUT', { estado: ev.target.estado.value });
        if (respuesta.status === 'ok') {
          const actualizado = pagos.find(item => Number(item.id_pago) === Number(p.id_pago));
          if (actualizado) actualizado.estado = ev.target.estado.value;
          adminModal.hide();
          render();
        } else {
          document.getElementById('errorPago').textContent = respuesta.message || 'No se pudo actualizar el pago';
        }
      });
      adminModal.show();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('adminModal');
  if (modalEl) adminModal = new bootstrap.Modal(modalEl);
  modalTitle = document.getElementById('adminModalLabel');
  modalBody = document.getElementById('adminModalBody');
  conectar(["buscar", "filtroRazon", "filtroEstado"], render);
  API.request('/pagos', 'GET').then(respuesta => {
    pagos = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
    render();
  }).catch(() => aviso("No se pudo conectar con la API"));
});
