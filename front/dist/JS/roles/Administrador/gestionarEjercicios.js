let ejercicios = [];
let adminModal = null;
let modalTitle, modalBody;

const grupos = (e) => String(e.grupo_muscular ?? "").split(/[-,\\/]/).map(g => g.trim()).filter(Boolean);

function cargar() {
  const estado = $("filtroEstado").value;
  API.request(`/ejercicio?estado=${estado}`, 'GET').then(respuesta => {
    ejercicios = respuesta.status === 'ok' && Array.isArray(respuesta.data) ? respuesta.data : [];
    llenarSelect("filtroGrupo", ejercicios.flatMap(grupos), "Todos los grupos musculares");
    render();
  }).catch(() => aviso("No se pudo conectar con la API"));
}

function mostrarImagenEjercicio(img, id) {
  const extensiones = ['png', 'jpg', 'webp'];
  let intento = 0;
  img.onerror = () => {
    intento++;
    if (intento < extensiones.length) {
      img.src = `/front/dist/assets/Ejercicios/${id}.${extensiones[intento]}`;
    } else {
      img.remove();
    }
  };
  img.src = `/front/dist/assets/Ejercicios/${id}.${extensiones[0]}`;
}

function render() {
  const q = norm($("buscar").value.trim());
  const g = $("filtroGrupo").value;
  const lista = ejercicios.filter(e =>
    (!q || norm(e.nombre).includes(q)) &&
    (!g || grupos(e).includes(g)));

  const enDesactivados = $("filtroEstado").value === 'inactivos';

  $("tbody").innerHTML = lista.map((e, index) => `
    <tr>
      <td>${esc(e.nombre)}</td>
      <td>${esc(e.grupo_muscular)}</td>
      <td><span class="admin-estado ${slug(e.nivel)}">${esc(e.nivel)}</span></td>
      <td class="col-acciones">
        <a href="#" class="admin-mini btn-ver" data-index="${index}">Ver</a>
        ${enDesactivados
          ? `<a href="#" class="admin-mini btn-reactivar" data-index="${index}">Reactivar</a>`
          : `<a href="#" class="admin-mini btn-editar" data-index="${index}">Editar</a>
             <a href="#" class="admin-mini btn-eliminar" data-index="${index}">Eliminar</a>`}
      </td>
    </tr>`).join("");

  const vacio = enDesactivados ? "No hay ejercicios desactivados" : "Todavía no hay ejercicios registrados";
  aviso(lista.length ? "" : (ejercicios.length ? "No hay ejercicios que coincidan con la búsqueda" : vacio));

  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      const e = lista[btn.dataset.index];
      modalTitle.textContent = "Detalles del Ejercicio";
      modalBody.innerHTML = `
        <img id="imagenVerEjercicio" class="img-fluid rounded mb-3" alt="${esc(e.nombre)}">
        <p><strong>Nombre:</strong> ${esc(e.nombre)}</p>
        <p><strong>Grupo muscular:</strong> ${esc(e.grupo_muscular)}</p>
        <p><strong>Dificultad:</strong> ${esc(e.nivel)}</p>
        <p><strong>Descripción:</strong> ${esc(e.descripcion || 'Sin descripción')}</p>`;
        mostrarImagenEjercicio(document.getElementById('imagenVerEjercicio'), e.id_ejercicio);
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
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      cambiarEstado(btn, lista[btn.dataset.index], 'DELETE', '/ejercicio/');
    });
  });

  document.querySelectorAll('.btn-reactivar').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      const e = lista[btn.dataset.index];
      cambiarEstado(btn, e, 'PUT', '/ejercicio/', '/reactivar');
    });
  });
}

async function cambiarEstado(btn, e, metodo, ruta, sufijo = '') {
  btn.style.pointerEvents = 'none';
  try {
    const respuesta = await API.request(ruta + e.id_ejercicio + sufijo, metodo);
    if (respuesta.status === 'ok') {
      // Sale de la lista actual: al desactivar deja "Activos", al reactivar deja "Desactivados"
      ejercicios = ejercicios.filter(item => item.id_ejercicio !== e.id_ejercicio);
      render();
    } else {
      btn.style.pointerEvents = '';
      aviso(respuesta.message || 'No se pudo cambiar el estado del ejercicio');
    }
  } catch (error) {
    btn.style.pointerEvents = '';
    aviso('No se pudo conectar con la API');
  }
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
      <div class="mb-3">
        <label class="form-label">Imagen (opcional)</label>
        <input type="file" class="admin-input" id="imagenNuevoEjercicio" accept="image/png, image/jpeg, image/webp">
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
      const archivo = document.getElementById('imagenNuevoEjercicio').files[0];
      if (archivo) {
        const formulario = new FormData();
        formulario.append('imagen', archivo);
        const resImg = await API.subir(`/ejercicio/${respuesta.id}/imagen`, formulario);
        if (!resImg || resImg.status !== 'ok') {
          alert('El ejercicio se creó, pero la imagen no: ' + (resImg?.message || 'error desconocido'));
        }
      }
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
  $("filtroEstado").addEventListener('change', cargar);
  document.getElementById('btnNuevo').addEventListener('click', event => {
    event.preventDefault();
    abrirNuevo();
  });
  cargar();
});
