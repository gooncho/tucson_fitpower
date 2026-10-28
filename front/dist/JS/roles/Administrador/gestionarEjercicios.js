let ejercicios = [];
let adminModal = null;
let modalTitle, modalBody;

const grupos = (e) => String(e.grupo_muscular ?? "").split(/[-,\/]/).map(g => g.trim()).filter(Boolean);

function render() {
  const q = norm($("buscar").value.trim());
  const g = $("filtroGrupo").value;

  const lista = ejercicios.filter(e =>
    (!q || norm(e.nombre).includes(q)) &&
    (!g || grupos(e).includes(g)));

  $("tbody").innerHTML = lista.map((e, index) => `
    <tr>
      <td>${esc(e.nombre)}</td>
      <td>${esc(e.grupo_muscular)}</td>
      <td><span class="admin-estado ${slug(e.dificultad)}">${esc(e.dificultad)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        <a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
      </td>
    </tr>`).join("");

  aviso(lista.length ? "" : (ejercicios.length ? "No hay ejercicios que coincidan con la búsqueda" : "Todavía no hay ejercicios registrados"));

  document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const e = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Detalles del Ejercicio";
          if (modalBody) {
              modalBody.innerHTML = `
                  <p><strong>Nombre:</strong> ${esc(e.nombre)}</p>
                  <p><strong>Grupo Muscular:</strong> ${esc(e.grupo_muscular)}</p>
                  <p><strong>Dificultad:</strong> ${esc(e.dificultad)}</p>
                  <p><strong>Descripción:</strong> ${esc(e.descripcion || 'Sin descripción')}</p>
              `;
          }
          if (adminModal) adminModal.show();
      });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const e = lista[btn.dataset.index];
          if (modalTitle) modalTitle.textContent = "Editar Ejercicio";
          if (modalBody) {
              modalBody.innerHTML = `
                  <form onsubmit="event.preventDefault();">
                      <div class="mb-3">
                          <label class="form-label">Nombre del Ejercicio</label>
                          <input type="text" class="admin-input" value="${esc(e.nombre)}">
                      </div>
                      <div class="mb-3">
                          <label class="form-label">Grupo Muscular</label>
                          <input type="text" class="admin-input" value="${esc(e.grupo_muscular)}">
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

    conectar(["buscar", "filtroGrupo"], render);

    API.request('/ejercicios', 'GET').then(d => {
      ejercicios = Array.isArray(d) ? d : (d.data || []);
      llenarSelect("filtroGrupo", ejercicios.flatMap(grupos), "Todos los grupos musculares");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
});