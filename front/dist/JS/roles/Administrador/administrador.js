/**
 * Funciones comunes a las páginas del Administrador.
 *
 * Las usan Pagos, Productos, Ejercicios, Entrenadores e Inicio:
 * escapar texto, formatear dinero y fechas, avisos, filtros y paginación.
 */

const $ = (id) => document.getElementById(id);
// Escapa el texto antes de meterlo en innerHTML, para que nadie pueda inyectar HTML o scripts (XSS).
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Pasa a minúsculas y quita tildes, para buscar sin importar cómo se escriba.
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// Convierte un texto en nombre de clase CSS (ej: "Sin stock" -> "sin-stock").
const slug = (s) => norm(s).trim().replace(/\s+/g, "-");
// Formatea un número como dinero: 1500 -> $1.500
const dinero = (n) => "$" + Number(n ?? 0).toLocaleString("es-UY");
// Formatea una fecha 2026-11-13 como 13/11/2026.
const fecha = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? esc(iso) : d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
};
 
// (Función vieja; las páginas actuales usan API.request de api.js.)
async function api(ruta) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}
 
// Muestra un mensaje debajo de la tabla (por ejemplo, "No hay resultados").
function aviso(texto) {
  $("vacio").textContent = texto || "";
  $("vacio").classList.toggle("visible", !!texto);
}
 
// Llena un <select> de filtro con los valores únicos, ordenados.
function llenarSelect(id, valores, textoTodos) {
  const unicos = [...new Set(valores.filter(Boolean))].sort();
  $(id).innerHTML = `<option value="">${textoTodos}</option>` +
    unicos.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
 
// Hace que al escribir o cambiar un filtro se vuelva a la página 1 y se redibuje la tabla.
function conectar(idsFiltros, render) {
  idsFiltros.forEach(id => {
    const el = $(id);
        if (el) el.addEventListener("input", () => {
      paginaActual = 1;
      render();
    });
  });
}

// (Versión vieja de la tabla de socios: hoy la maneja GestionarSocio.js,
// y esa página no carga este archivo. En las demás páginas no hace nada.)
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
// --- Paginación de las tablas del admin ---
const POR_PAGINA = 10;
let paginaActual = 1;

// Recibe la lista filtrada completa, dibuja las flechas en #paginacion
// y devuelve solo los elementos de la página actual.
// render es la función que redibuja la tabla al cambiar de página.
function paginar(lista, render, porPagina = POR_PAGINA) {
  const total = Math.max(1, Math.ceil(lista.length / porPagina));

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

    const inicio = (paginaActual - 1) * porPagina;
  return lista.slice(inicio, inicio + porPagina);
}

document.addEventListener('DOMContentLoaded', cargarSocios);