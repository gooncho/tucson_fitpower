const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const slug = (s) => norm(s).trim().replace(/\s+/g, "-");
const dinero = (n) => "$" + Number(n ?? 0).toLocaleString("es-UY");
const fecha = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? esc(iso) : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
};
 
async function api(ruta) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}
 
function aviso(texto) {
  $("vacio").textContent = texto || "";
  $("vacio").classList.toggle("visible", !!texto);
}
 
function llenarSelect(id, valores, textoTodos) {
  const unicos = [...new Set(valores.filter(Boolean))].sort();
  $(id).innerHTML = `<option value="">${textoTodos}</option>` +
    unicos.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
 
function conectar(idsFiltros, render) {
  idsFiltros.forEach(id => {
    const el = $(id);
        if (el) el.addEventListener("input", () => {
      paginaActual = 1;
      render();
    });
  });
}

async function cargarSocios() {
    try {
        const respuesta = await API.request('/socios', 'GET');
        
        if (respuesta.status === 'ok') {
            const tbody = document.getElementById('tablaSocios');
            if (!tbody) return;
            tbody.innerHTML = ''; 
            
            if (respuesta.data.length === 0) {
                document.getElementById('sinResultados').classList.add('visible');
                return;
            }

            document.getElementById('sinResultados').classList.remove('visible');

            respuesta.data.forEach(socio => {
                let estadoClase = 'activo';
                let estadoTexto = 'Activo';

                tbody.innerHTML += `
                    <tr data-plan="${socio.nombre_plan ? socio.nombre_plan.toLowerCase() : ''}" data-estado="${estadoClase}">
                        <td class="col-id">${socio.id_usuario}</td>
                        <td>${esc(socio.nombre_usuario)}</td>
                        <td>${esc(socio.email)}</td>
                        <td>${socio.nombre_plan ? esc(socio.nombre_plan) : '<span class="admin-nulo">—</span>'}</td>
                        <td><span class="admin-estado ${estadoClase}">${estadoTexto}</span></td>
                        <td>${socio.fecha_fin ? fecha(socio.fecha_fin) : '<span class="admin-nulo">—</span>'}</td>
                        <td class="col-acciones">
                            <a href="#" class="admin-mini">Ver</a>
                            <a href="#" class="admin-mini">Editar</a>
                        </td>
                    </tr>
                `;
            });

        } else {
            console.error("Error al cargar socios:", respuesta.message);
        }
    } catch (error) {
        console.error("Hubo un error en la petición:", error);
    }
}
const POR_PAGINA = 10;
let paginaActual = 1;

function paginar(lista, render) {
  const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (paginaActual > total) paginaActual = total;

  const controles = $("paginacion");
  if (controles) {
    if (lista.length <= POR_PAGINA) {
      controles.replaceChildren();
    } else {
      const boton = (icono, etiqueta, deshabilitado, cambio) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "admin-mini";
        b.disabled = deshabilitado;
        b.setAttribute("aria-label", etiqueta);
        b.innerHTML = `<i class="bi ${icono}"></i>`;
        b.addEventListener("click", () => {
          paginaActual += cambio;
          render();
        });
        return b;
      };
      const texto = document.createElement("span");
      texto.textContent = `Página ${paginaActual} de ${total} · ${lista.length} resultados`;
      controles.replaceChildren(
        boton("bi-chevron-left", "Página anterior", paginaActual === 1, -1),
        texto,
        boton("bi-chevron-right", "Página siguiente", paginaActual === total, 1)
      );
    }
  }

  const inicio = (paginaActual - 1) * POR_PAGINA;
  return lista.slice(inicio, inicio + POR_PAGINA);
}

document.addEventListener('DOMContentLoaded', cargarSocios);