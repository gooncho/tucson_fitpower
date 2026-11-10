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
                  <form id="formEditar">
                      <div class="mb-3">
                          <label class="form-label">Nombre de Usuario</label>
                          <input type="text" class="admin-input" name="nombre_usuario" value="${esc(e.nombre_usuario)}" required>
                      </div>
                      <div class="mb-3">
                          <label class="form-label">Email</label>
                          <input type="email" class="admin-input" name="email" value="${esc(e.email)}" required>
                      </div>
                      <div class="mb-3">
                          <label class="form-label">Especialidad</label>
                          <input type="text" class="admin-input" name="especialidad" value="${esc(e.especialidad || '')}">
                      </div>
                      <h6 class="mt-4">Asignar socios y horarios</h6>
                      <div id="listaAsignar">Cargando socios...</div>
                      <p class="text-danger" id="errorEditar"></p>
                      <button type="submit" class="admin-btn">Guardar Cambios</button>
                  </form>
              `;
              cargarAsignaciones(e);
          }
          if (adminModal) adminModal.show();
      });
  });
}

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

async function cargarAsignaciones(e) {
    const [socios, asignaciones] = await Promise.all([
        API.request('/socios', 'GET'),
        API.request('/entrenadores/' + e.id_persona + '/socios', 'GET')
    ]);
    const listaSocios = socios.data || [];
    const actuales = asignaciones.data || [];
    const contenedor = document.getElementById('listaAsignar');

    contenedor.innerHTML = listaSocios.length ? listaSocios.map(s => {
        const a = actuales.find(x => x.id_persona == s.id_persona);
        return `
            <div class="d-flex align-items-center gap-2 mb-2 fila-asignar" data-id="${s.id_persona}">
                <label class="flex-grow-1">
                    <input type="checkbox" class="chk-asignar" ${a ? 'checked' : ''}> ${esc(s.nombre_usuario)} ${esc(s.apellido || '')}
                </label>
                <select class="admin-select sel-dia" style="width: 130px;">
                    <option value="">Día</option>
                    ${diasSemana.map(d => `<option value="${d}" ${a && a.dia_semana === d ? 'selected' : ''}>${d}</option>`).join("")}
                </select>
                <input type="time" class="admin-input inp-inicio" style="width: 120px;" value="${a && a.hora_inicio ? a.hora_inicio : ''}">
                <input type="time" class="admin-input inp-fin" style="width: 120px;" value="${a && a.hora_fin ? a.hora_fin : ''}">
            </div>`;
    }).join("") : "No hay socios registrados";

    document.getElementById('formEditar').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const datos = Object.fromEntries(new FormData(ev.target));
        const error = document.getElementById('errorEditar');

        const respuesta = await API.request('/entrenadores/' + e.id_usuario, 'PUT', datos);
        if (respuesta.status !== 'ok') {
            error.textContent = respuesta.message || 'No se pudo guardar';
            return;
        }

        if (listaSocios.length) {
            const lista = [...document.querySelectorAll('.fila-asignar')]
                .filter(f => f.querySelector('.chk-asignar').checked)
                .map(f => ({
                    id_persona: f.dataset.id,
                    dia_semana: f.querySelector('.sel-dia').value,
                    hora_inicio: f.querySelector('.inp-inicio').value,
                    hora_fin: f.querySelector('.inp-fin').value
                }));
            const resp2 = await API.request('/entrenadores/' + e.id_persona + '/socios', 'PUT', { asignaciones: lista });
            if (resp2.status !== 'ok') {
                error.textContent = resp2.message || 'No se pudieron guardar las asignaciones';
                return;
            }
        }

        adminModal.hide();
        cargar();
    });
}

function cargar() {
    API.request('/entrenadores', 'GET').then(d => {
      entrenadores = Array.isArray(d) ? d : (d.data || []);
      const esp = [...new Set(entrenadores.map(e => e.especialidad).filter(Boolean))].sort();
      $("filtroEspecialidad").innerHTML = `<option value="">Todas las especialidades</option>` +
        esp.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join("");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
}

function abrirNuevo() {
    modalTitle.textContent = "Nuevo Entrenador";
    modalBody.innerHTML = `
        <form id="formNuevo">
            <div class="mb-3">
                <label class="form-label">Nombre de Usuario</label>
                <input type="text" class="admin-input" name="nombre_usuario" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Apellido</label>
                <input type="text" class="admin-input" name="apellido" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="admin-input" name="email" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Contraseña</label>
                <input type="password" class="admin-input" name="password" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Especialidad</label>
                <input type="text" class="admin-input" name="especialidad">
            </div>
            <p class="text-danger" id="errorNuevo"></p>
            <button type="submit" class="admin-btn">Guardar</button>
        </form>
    `;
    document.getElementById('formNuevo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.target));
        const respuesta = await API.request('/entrenadores', 'POST', datos);
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

    conectar(["buscar", "filtroEspecialidad", "filtroEstado"], render);

    document.getElementById('btnNuevo').addEventListener('click', (e) => {
        e.preventDefault();
        abrirNuevo();
    });

    cargar();
});