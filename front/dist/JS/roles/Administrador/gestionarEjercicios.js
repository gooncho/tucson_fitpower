let ejercicios = [];
let adminModal = null;
let modalTitle, modalBody;

const grupos = (e) => String(e.grupo_muscular ?? "").split(/[-,\\/]/).map(g => g.trim()).filter(Boolean);

function cargar() {
  API.request('/ejercicio', 'GET').then(respuesta => {
    ejercicios = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
    llenarSelect("filtroGrupo", ejercicios.flatMap(grupos), "Todos los grupos musculares");
    render();
  }).catch(() => aviso("No se pudo conectar con la API"));
}

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
      <td><span class="admin-estado ${slug(e.nivel)}">${esc(e.nivel)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        <a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
        <a href="#" class="admin-mini btn-eliminar" data-index="${index}">Eliminar</a>
      </td>
    </tr>`).join("");

  aviso(lista.length ? "" : (ejercicios.length ? "No hay ejercicios que coincidan con la búsqueda" : "Todavía no hay ejercicios registrados"));

  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      const e = lista[btn.dataset.index];
      modalTitle.textContent = "Detalles del Ejercicio";
      modalBody.innerHTML = `
        <p><strong>Nombre:</strong> ${esc(e.nombre)}</p>
        <p><strong>Grupo muscular:</strong> ${esc(e.grupo_muscular)}</p>
        <p><strong>Dificultad:</strong> ${esc(e.nivel)}</p>
        <p><strong>Descripción:</strong> ${esc(e.descripcion || 'Sin descripción')}</p>`;
      adminModal.show();
    });
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      abrirEditar(lista[btn.dataset.index]);
    });
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async ev => {
      ev.preventDefault();
      const e = lista[btn.dataset.index];
      btn.style.pointerEvents = 'none';
      try {
        const respuesta = await API.request('/ejercicio/' + e.id_ejercicio, 'DELETE');
        if (respuesta.status === 'ok') {
          ejercicios = ejercicios.filter(item => item.id_ejercicio !== e.id_ejercicio);
          render();
        } else {
          btn.style.pointerEvents = '';
          console.error(respuesta.message || 'No se pudo eliminar el ejercicio');
        }
      } catch (error) {
        btn.style.pointerEvents = '';
        console.error(error);
      }
    });
  });
}

function abrirEditar(e) {
  modalTitle.textContent = "Editar Ejercicio";
  modalBody.innerHTML = `
    <form id="formEditarEjercicio">
      <div class="mb-3">
        <label class="form-label">Nombre del ejercicio</label>
        <input type="text" class="admin-input" name="nombre" value="${esc(e.nombre)}" required maxlength="50">
      </div>
      <div class="mb-3">
        <label class="form-label">Grupo muscular</label>
        <input type="text" class="admin-input" name="grupo_muscular" value="${esc(e.grupo_muscular)}" required maxlength="70">
      </div>
      <div class="mb-3">
        <label class="form-label">Dificultad</label>
        <select class="admin-select" name="nivel" required>
          <option value="Principiante" ${e.nivel === 'Principiante' ? 'selected' : ''}>Principiante</option>
          <option value="Intermedio" ${e.nivel === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
          <option value="Avanzado" ${e.nivel === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="admin-input" name="descripcion" rows="3">${esc(e.descripcion || '')}</textarea>
      </div>
      <p id="errorEjercicio" class="text-danger"></p>
      <button type="submit" class="admin-btn">Guardar Cambios</button>
    </form>`;
  document.getElementById('formEditarEjercicio').addEventListener('submit', async event => {
    event.preventDefault();
    const datos = Object.fromEntries(new FormData(event.target));
    const respuesta = await API.request('/ejercicio/' + e.id_ejercicio, 'PUT', datos);
    if (respuesta.status === 'ok') {
      adminModal.hide();
      cargar();
    } else {
      document.getElementById('errorEjercicio').textContent = respuesta.message || 'No se pudo actualizar el ejercicio';
    }
  });
  adminModal.show();
}

function abrirNuevo() {
  modalTitle.textContent = "Nuevo Ejercicio";
  modalBody.innerHTML = `
    <form id="formNuevoEjercicio">
      <div class="mb-3">
        <label class="form-label">Nombre del ejercicio</label>
        <input type="text" class="admin-input" name="nombre" maxlength="50" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Grupo muscular</label>
        <input type="text" class="admin-input" name="grupo_muscular" maxlength="70" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Dificultad</label>
        <select class="admin-select" name="nivel" required>
          <option value="">Seleccionar dificultad</option>
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="admin-input" name="descripcion" rows="3"></textarea>
      </div>
      <p id="errorNuevoEjercicio" class="text-danger"></p>
      <button type="submit" class="admin-btn">Guardar ejercicio</button>
    </form>`;
  document.getElementById('formNuevoEjercicio').addEventListener('submit', async event => {
    event.preventDefault();
    const datos = Object.fromEntries(new FormData(event.target));
    const boton = event.target.querySelector('button[type="submit"]');
    boton.disabled = true;
    const respuesta = await API.request('/ejercicio', 'POST', datos);
    boton.disabled = false;
    if (respuesta.status === 'ok') {
      adminModal.hide();
      cargar();
    } else {
      document.getElementById('errorNuevoEjercicio').textContent = respuesta.message || 'No se pudo guardar el ejercicio';
    }
  });
  adminModal.show();
}

document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('adminModal');
  if (modalEl) adminModal = new bootstrap.Modal(modalEl);
  modalTitle = document.getElementById('adminModalLabel');
  modalBody = document.getElementById('adminModalBody');
  conectar(["buscar", "filtroGrupo"], render);
  document.getElementById('btnNuevo').addEventListener('click', event => {
    event.preventDefault();
    abrirNuevo();
  });
  cargar();
});
