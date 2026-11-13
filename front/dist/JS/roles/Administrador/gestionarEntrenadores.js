/**
 * Gestión de entrenadores (Administrador).
 *
 * Tabla de entrenadores y modales de Ver, Editar, Nuevo y Eliminar.
 * En Editar también se asignan socios con día y horario: la lista de asignados
 * se guarda en un arreglo y se envía completa al presionar Guardar.
 */

let entrenadores = []; 
let adminModal = null;
let modalTitle, modalBody;

// Filtra y dibuja la tabla de entrenadores.
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
        <a href="#" class="admin-mini btn-estado" data-index="${index}">${e.estado === 'Activo' ? 'Desactivar' : 'Activar'}</a>
        <a href="#" class="admin-mini btn-eliminar" data-index="${index}">Eliminar</a>
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

document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', ev => {
        ev.preventDefault();
        confirmarEliminarEntrenador(lista[btn.dataset.index]);
    });
});

document.querySelectorAll('.btn-estado').forEach(btn => {
    btn.addEventListener('click', async ev => {
        ev.preventDefault();
        const entrenador = lista[btn.dataset.index];
        const activo = entrenador.estado === 'Activo' ? 0 : 1;
        const respuesta = await API.request('/entrenadores/' + entrenador.id_usuario + '/estado', 'PUT', { activo });
        if (respuesta.status === 'ok') {
            await cargar();
        } else {
            if (modalTitle) modalTitle.textContent = 'No se pudo cambiar el estado';
            if (modalBody) modalBody.textContent = respuesta.message || 'Intentá nuevamente.';
            if (adminModal) adminModal.show();
        }
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
                        <h6 class="mt-4">Socios asignados <span id="totalAsignados" class="admin-nulo"></span></h6>
                        <div id="listaAsignados" class="mb-3 pe-2" style="max-height: 320px; overflow-y: auto;">Cargando socios...</div>
                      <h6 class="mt-3">Agregar socios</h6>
                      <div class="admin-campo mb-2">
                          <i class="bi bi-search"></i>
                          <input type="search" class="admin-input" id="buscarSocioAsignado" placeholder="Buscar socio por nombre...">
                      </div>
                      <div id="resultadosSocios"></div>
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

// Modal de confirmación; avisa cuántos socios quedarán sin entrenador.
function confirmarEliminarEntrenador(entrenador) {
    const cantidad = Number(entrenador.socios_asignados) || 0;
    const avisoSocios = cantidad > 0
        ? `Sus ${cantidad} socio${cantidad === 1 ? '' : 's'} asignado${cantidad === 1 ? '' : 's'} van a quedar sin entrenador.`
        : 'No tiene socios asignados.';

    modalTitle.textContent = 'Eliminar entrenador';
    modalBody.innerHTML = `
        <p>¿Seguro que querés eliminar a <strong>${esc(entrenador.nombre_usuario)}</strong>?</p>
        <p class="small" style="color: #9c9c98;">
            Se borran para siempre su cuenta y sus horarios. ${avisoSocios}
            Las rutinas que les armó siguen asignadas a los socios. Esta acción no se puede deshacer.
        </p>
        <p id="errorEliminar" class="text-danger small mb-3"></p>
        <button type="button" class="admin-btn peligro" id="btnConfirmarEliminar">Sí, eliminar</button>`;

    document.getElementById('btnConfirmarEliminar').addEventListener('click', async (ev) => {
        const boton = ev.currentTarget;
        boton.disabled = true;

        const respuesta = await API.request('/entrenadores/' + entrenador.id_usuario, 'DELETE');
        if (respuesta.status === 'ok') {
            entrenadores = entrenadores.filter(item => item.id_usuario !== entrenador.id_usuario);
            adminModal.hide();
            render();
        } else {
            boton.disabled = false;
            document.getElementById('errorEliminar').textContent = respuesta.message || 'No se pudo eliminar el entrenador';
        }
    });

    adminModal.show();
}

// Opciones del selector de día para cada socio asignado.
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Arma la sección de socios asignados del modal Editar.
// "asignados" es la lista con la que se trabaja: agregar, quitar o cambiar
// día/horario modifica el arreglo y se vuelve a dibujar.
async function cargarAsignaciones(e) {
    const [socios, asignaciones] = await Promise.all([
        API.request('/socios', 'GET'),
        API.request('/entrenadores/' + e.id_persona + '/socios', 'GET')
    ]);
    const listaSocios = (socios.data || []).filter(s => Number(s.activo) === 1);
    const nombreDe = s => `${s.nombre_usuario || ''} ${s.apellido || ''}`.trim();

   
    let asignados = (asignaciones.data || []).map(a => {
        const s = (socios.data || []).find(x => Number(x.id_persona) === Number(a.id_persona));
        return {
            id_persona: Number(a.id_persona),
            nombre: s ? nombreDe(s) : 'Socio #' + a.id_persona,
            dia_semana: a.dia_semana || '',
            hora_inicio: a.hora_inicio || '',
            hora_fin: a.hora_fin || ''
        };
    });

    const contAsignados = document.getElementById('listaAsignados');
    const contResultados = document.getElementById('resultadosSocios');
    const buscar = document.getElementById('buscarSocioAsignado');

    // Dibuja los socios asignados, con su día y horario editables.
    function dibujarAsignados() {
        document.getElementById('totalAsignados').textContent = `(${asignados.length})`;

        if (asignados.length === 0) {
            contAsignados.innerHTML = '<p class="admin-nulo mb-0">Este entrenador no tiene socios asignados.</p>';
            return;
        }

        contAsignados.innerHTML = asignados.map((a, i) => `
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="flex-grow-1">${esc(a.nombre)}</span>
                <select class="admin-select sel-dia" data-i="${i}" style="width: 130px;">
                    <option value="">Día</option>
                    ${diasSemana.map(d => `<option value="${d}" ${a.dia_semana === d ? 'selected' : ''}>${d}</option>`).join("")}
                </select>
                <input type="time" class="admin-input inp-inicio" data-i="${i}" style="width: 120px;" value="${esc(a.hora_inicio)}">
                <input type="time" class="admin-input inp-fin" data-i="${i}" style="width: 120px;" value="${esc(a.hora_fin)}">
                <button type="button" class="admin-mini peligro btn-quitar" data-i="${i}" aria-label="Quitar">✕</button>
            </div>`).join("");

        contAsignados.querySelectorAll('.sel-dia').forEach(el =>
            el.addEventListener('change', () => { asignados[el.dataset.i].dia_semana = el.value; }));
        contAsignados.querySelectorAll('.inp-inicio').forEach(el =>
            el.addEventListener('input', () => { asignados[el.dataset.i].hora_inicio = el.value; }));
        contAsignados.querySelectorAll('.inp-fin').forEach(el =>
            el.addEventListener('input', () => { asignados[el.dataset.i].hora_fin = el.value; }));
        contAsignados.querySelectorAll('.btn-quitar').forEach(el =>
            el.addEventListener('click', () => {
                asignados.splice(Number(el.dataset.i), 1);
                dibujarAsignados();
                dibujarResultados();
            }));
    }

    // Resultados del buscador para agregar socios (máximo 8, sin los ya asignados).
    function dibujarResultados() {
        const texto = norm(buscar.value.trim());
        if (texto === '') {
            contResultados.innerHTML = '<p class="admin-nulo mb-0">Escribí un nombre para buscar socios.</p>';
            return;
        }

        const usados = new Set(asignados.map(a => a.id_persona));
        const encontrados = listaSocios
            .filter(s => !usados.has(Number(s.id_persona)) && norm(nombreDe(s)).includes(texto))
            .slice(0, 8);

        if (encontrados.length === 0) {
            contResultados.innerHTML = '<p class="admin-nulo mb-0">No se encontraron socios.</p>';
            return;
        }

        contResultados.innerHTML = encontrados.map(s => {
            const otro = s.entrenador && Number(s.id_entrenador) !== Number(e.id_persona);
            const detalle = otro ? `con ${esc(s.entrenador)} (se le quitará)` : 'sin entrenador';
            return `
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="flex-grow-1">${esc(nombreDe(s))} <small class="admin-nulo">· ${detalle}</small></span>
                    <button type="button" class="admin-mini btn-asignar" data-id="${s.id_persona}">+ Asignar</button>
                </div>`;
        }).join("");

        contResultados.querySelectorAll('.btn-asignar').forEach(btn =>
            btn.addEventListener('click', () => {
                const s = listaSocios.find(x => Number(x.id_persona) === Number(btn.dataset.id));
                asignados.push({ id_persona: Number(s.id_persona), nombre: nombreDe(s), dia_semana: '', hora_inicio: '', hora_fin: '' });
                dibujarAsignados();
                dibujarResultados();
            }));
    }

    buscar.addEventListener('input', dibujarResultados);
    dibujarAsignados();
    dibujarResultados();

    document.getElementById('formEditar').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const datos = Object.fromEntries(new FormData(ev.target));
        const error = document.getElementById('errorEditar');
        error.textContent = '';

        const malHorario = asignados.find(a => a.hora_inicio && a.hora_fin && a.hora_fin <= a.hora_inicio);
        if (malHorario) {
            error.textContent = `La hora de fin de ${malHorario.nombre} tiene que ser después de la de inicio.`;
            return;
        }

        const respuesta = await API.request('/entrenadores/' + e.id_usuario, 'PUT', datos);
        if (respuesta.status !== 'ok') {
            error.textContent = respuesta.message || 'No se pudo guardar';
            return;
        }

        const lista = asignados.map(a => ({
            id_persona: a.id_persona,
            dia_semana: a.dia_semana,
            hora_inicio: a.hora_inicio,
            hora_fin: a.hora_fin
        }));
        const resp2 = await API.request('/entrenadores/' + e.id_persona + '/socios', 'PUT', { asignaciones: lista });
        if (resp2.status !== 'ok') {
            error.textContent = resp2.message || 'No se pudieron guardar las asignaciones';
            return;
        }

        adminModal.hide();
        cargar();
    });
}

// Pide los entrenadores a la API y dibuja la tabla.
function cargar() {
    API.request('/entrenadores', 'GET').then(d => {
      entrenadores = Array.isArray(d) ? d : (d.data || []);
      const esp = [...new Set(entrenadores.map(e => e.especialidad).filter(Boolean))].sort();
      $("filtroEspecialidad").innerHTML = `<option value="">Todas las especialidades</option>` +
        esp.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join("");
      render();
    }).catch(() => aviso("No se pudo conectar con la API"));
}

// Modal para crear un entrenador nuevo.
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