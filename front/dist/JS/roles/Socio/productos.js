/**
 * Tienda (Socio).
 *
 * Tarjetas de productos (6 visibles y el resto con "Ver más").
 * El modal de cada producto muestra los datos, el stock y el formulario
 * para reservar la compra (se paga y retira en recepción).
 * Las reseñas del mismo modal las maneja resenas.js.
 */

// Cuántos productos se muestran antes de apretar "Ver más productos".
const PRODUCTOS_VISIBLES = 6;
const CARPETA_PRODUCTOS = '/front/dist/assets/productos/';
const IMAGEN_POR_DEFECTO = '/front/dist/assets/FITPOWER.png';
// Producto abierto en el modal.
let ProductoActual = null;

// La base no guarda imágenes: la foto se elige por una palabra del nombre.
// Se usa la PRIMERA coincidencia, por eso las claves más específicas van arriba
// (si no, "Proteina Isolate" agarraría la foto de "proteina").
const IMAGENES = [
    { clave: 'isolate',     archivo: 'ProteIsolate.png' },
    { clave: 'micronizada', archivo: 'CreaMicro.png' },
    { clave: 'dry fit',     archivo: 'RemeraDry.png' },
    { clave: 'compresion',  archivo: 'ShortCompresion.png' },
    { clave: 'metalico',    archivo: 'ShakerMetal.png' },
    { clave: 'microfibra',  archivo: 'ToallaMicro.png' },
    { clave: 'proteina',    archivo: 'Prote.png' },
    { clave: 'creatina',    archivo: 'Crea.png' },
    { clave: 'remera',      archivo: 'Remera.png' },
    { clave: 'short',       archivo: 'Short.png' },
    { clave: 'shaker',      archivo: 'Bote.png' },
    { clave: 'toalla',      archivo: 'Toalla.png' },
];

// Busca la imagen según el nombre, sin importar mayúsculas ni tildes.
// Si no hay coincidencia, usa el logo.
function imagenDe(nombre) {
    const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hallada = IMAGENES.find(i => n.includes(i.clave));
    return hallada ? CARPETA_PRODUCTOS + hallada.archivo : IMAGEN_POR_DEFECTO;
}

function formatearPrecio(valor) {
    return '$ ' + Number(valor).toLocaleString();
}

// Tarjeta de un producto. "oculta" la esconde hasta apretar "Ver más".
function crearTarjeta(p, oculta) {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-xl-4 producto-tarjeta' + (oculta ? ' d-none' : '');

    const card = document.createElement('div');
    card.className = 'card p-4 h-100';

    const img = document.createElement('img');
    img.className = 'img-producto';
    img.src = imagenDe(p.nombre);
    img.onerror = () => {
        img.onerror = null;
        img.src = IMAGEN_POR_DEFECTO;
    };
    img.alt = p.nombre;

    const titulo = document.createElement('h3');
    titulo.textContent = p.nombre;

    const precio = document.createElement('h2');
    precio.textContent = formatearPrecio(p.precio);

    const boton = document.createElement('button');
    boton.className = 'btn btn-fit rounded-pill w-100 mt-auto';
    boton.textContent = 'Comprar';
    boton.addEventListener('click', () => abrirModal(p));

    card.append(img, titulo, precio, boton);
    col.appendChild(card);
    return col;
}

// Llena el modal con el producto y lo abre. data-id-producto le dice
// a resenas.js de qué producto cargar las reseñas.
function abrirModal(p) {
    const imagen = document.getElementById('modal-imagen');
    imagen.onerror = () => {
        imagen.onerror = null;
        imagen.src = IMAGEN_POR_DEFECTO;
    };
    imagen.src = imagenDe(p.nombre);
    imagen.alt = p.nombre;

    document.getElementById('modal-nombre').textContent = p.nombre;
    document.getElementById('modal-categoria').textContent = p.categoria || '';
    document.getElementById('modal-precio').textContent = formatearPrecio(p.precio);
    document.getElementById('modal-descripcion').textContent = p.descripcion || '';

    const modal = document.getElementById('modalProducto');
    modal.dataset.idProducto = p.id_producto;

    ProductoActual = p;
    MostrarStock();
    PrepararCompra();

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

// Máximo por compra: 10 o el stock disponible, lo que sea menor.
function MaximoCompra() {
    return Math.min(10, Number(ProductoActual.stock));
}

// Total = cantidad x precio (solo para mostrar; el real lo calcula el servidor).
function ActualizarTotal() {
    const cantidad = Number(document.getElementById('compra-cantidad').value) || 0;
    document.getElementById('compra-total').textContent = formatearPrecio(cantidad * Number(ProductoActual.precio));
}

// "X unidades disponibles" en verde o "Sin stock" en rojo.
function MostrarStock() {
    const stock = document.getElementById('modal-stock');
    const hayStock = Number(ProductoActual.stock) > 0;
    stock.textContent = hayStock ? `${ProductoActual.stock} unidades disponibles` : 'Sin stock';
    stock.className = 'fw-semibold ' + (hayStock ? 'text-success' : 'text-danger');
}

// Reinicia el formulario de compra; sin stock, el botón queda desactivado.
function PrepararCompra() {
    const cantidad = document.getElementById('compra-cantidad');
    const boton = document.getElementById('btn-confirmar-compra');
    const mensaje = document.getElementById('compra-mensaje');
    const hayStock = Number(ProductoActual.stock) > 0;

    cantidad.value = 1;
    cantidad.max = Math.max(1, MaximoCompra());
    cantidad.disabled = !hayStock;
    boton.disabled = !hayStock;
    boton.textContent = hayStock ? 'Reservar compra' : 'Sin stock';
    mensaje.textContent = '';
    mensaje.className = 'small mt-2 mb-0';
    ActualizarTotal();
}

// Envía la compra. Con la respuesta se actualiza el stock en pantalla,
// también si otro socio compró mientras el modal estaba abierto.
async function ConfirmarCompra() {
    const cantidad = Number(document.getElementById('compra-cantidad').value);
    const mensaje = document.getElementById('compra-mensaje');
    const boton = document.getElementById('btn-confirmar-compra');
    mensaje.className = 'small mt-2 mb-0 text-danger';

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MaximoCompra()) {
        mensaje.textContent = `Elegí una cantidad entre 1 y ${MaximoCompra()}.`;
        return;
    }

    boton.disabled = true;
    const res = await API.request('/compras', 'POST', {
        id_producto: ProductoActual.id_producto,
        cantidad,
        metodo_pago: document.getElementById('compra-metodo').value
    });

    if (res && res.status === 'ok') {
        ProductoActual.stock = res.data.stock;
        MostrarStock();
        PrepararCompra();
        mensaje.className = 'small mt-2 mb-0 text-success fw-semibold';
        mensaje.textContent = '¡Reserva hecha! Pagá y retirá tu producto en recepción.';
        return;
    }

    if (res && res.stock !== undefined) {
        ProductoActual.stock = res.stock;
        MostrarStock();
    }
    boton.disabled = Number(ProductoActual.stock) <= 0;
    mensaje.textContent = res?.message || 'No se pudo registrar la compra.';
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('compra-cantidad').addEventListener('input', ActualizarTotal);
    document.getElementById('btn-confirmar-compra').addEventListener('click', ConfirmarCompra);
    const lista = document.getElementById('lista-productos');
    const botonMas = document.getElementById('MasProductos');
    const cuenta = document.getElementById('navCuenta');
    if (!lista) return;

    if (cuenta) {
        const sesion = await API.request('/sesion');
        if (sesion.status === 'ok' && sesion.data?.rol === 'Socio') {
            cuenta.href = 'roles/socio/Perfil.html';
            cuenta.textContent = 'Mi perfil';
            cuenta.className = 'btn btn-outline';
        }
    }

    const productos = await API.request('/producto');
  if (!Array.isArray(productos)) {
        lista.textContent = 'No se pudieron cargar los productos.';
        if (botonMas) botonMas.style.display = 'none';
        return;
    }
    if (productos.length === 0) {
        lista.textContent = 'Todavía no hay productos disponibles.';
        if (botonMas) botonMas.style.display = 'none';
        return;
    }

    lista.replaceChildren(
        ...productos.map((p, i) => crearTarjeta(p, i >= PRODUCTOS_VISIBLES))
    );

    if (botonMas) {
        if (productos.length <= PRODUCTOS_VISIBLES) {
            botonMas.style.display = 'none';
        } else {
            botonMas.addEventListener('click', () => {
                lista.querySelectorAll('.producto-tarjeta.d-none')
                    .forEach(el => el.classList.remove('d-none'));
                botonMas.style.display = 'none';
            });
        }
    }
});