let entrenadores = [];
let adminModal = null;
let modalTitle, modalBody;

function render() {
  const q = norm($("buscar").value.trim());
  const esp = $("filtroEspecialidad").value;
  const est = $("filtroEstado").value;

  const lista = entrenadores.filter(e =>
    (!q || norm(e.nombre_usuario).includes(q) || norm(e.email).includes(q)) &&
    (!esp || e.especialidad === esp) &&
    (!est || e.estado === est));

  $("tbody").innerHTML = lista.map((e, index) => `
    <tr>
      <td>${esc(e.nombre_usuario)}<small class="d-block admin-nulo">${esc(e.email)}</small></td>
      <td>${e.especialidad ? esc(e.especialidad) : '<span class="admin-nulo">—</span>'}</td>
      <td class="text-center">${esc(e.socios_asignados ?? 0)}</td>
      <td>${e.hora_inicio && e.dias
        ? `${esc(e.dias)}<small class="d-block admin-nulo">${esc(e.hora_inicio)} - ${esc(e.hora_fin)}</small>`
        : '<span class="admin-nulo">—</span>'}</td>
      <td><span class="admin-estado ${slug(e.estado)}">${esc(e.estado)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        <a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
      </td>
    </tr>`).join("");

  aviso(lista.length ? "" : (entrenadores.length
    ? "No hay entrenadores que coincidan con la búsqueda"
    : "Todavía no hay entrenadores registrados"));

  document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const e = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Detalles del Entrenador";
          if (modalBody) {
              modalBody.innerHTML = `
                  <p><strong>Nombre:</strong> ${esc(e.nombre_usuario)}</p>
                  <p><strong>Email:</strong> ${esc(e.email)}</p>
                  <p><strong>Especialidad:</strong> ${esc(e.especialidad || '—')}</p>
                  <p><strong>Socios asignados:</strong> ${esc(e.socios_asignados ?? 0)}</p>
                  <p><strong>Estado:</strong> ${esc(e.estado)}</p>
              `;
          }
          if (adminModal) adminModal.show();
      });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const e = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Editar Entrenador";
          if (modalBody) {
              modalBody.innerHTML = `
                  <form onsubmit="event.preventDefault();">
                      <div class="mb-3">
                          <label class="form-label">Especialidad</label>
                          <input type="text" class="admin-input" value="${esc(e.especialidad || '')}">
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

    conectar(["buscar", "filtroEspecialidad", "filtroEstado"], render);

    API.request('/entrenadores', 'GET').then(d => {
      entrenadores = Array.isArray(d) ? d : (d.data || []);
      const esp = [...new Set(entrenadores.map(e => e.especialidad).filter(Boolean))].sort();
      $("filtroEspecialidad").innerHTML = `<option value="">Todas las especialidades</option>` +
        esp.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join("");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
});