const PRODUCTOS_VISIBLES = 6;
let ProductoActual = null;

const IMAGENES = [
    { clave: 'proteina', archivo: 'Prote.png' },
    { clave: 'creatina', archivo: 'Crea.png' },
    { clave: 'remera',   archivo: 'Remera.png' },
    { clave: 'short', archivo: 'Short.png' },
    { clave: 'shaker',   archivo: 'Bote.png' },
    { clave: 'toalla',  archivo: 'Toalla.png' },
    { clave: 'barra',    archivo: 'mancu.png' },
];

const IMAGEN_POR_DEFECTO = 'FITPOWER.png';

function imagenDe(nombre) {
    const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hallada = IMAGENES.find(i => n.includes(i.clave));
    return '/front/dist/assets/' + (hallada ? hallada.archivo : IMAGEN_POR_DEFECTO);
}

function formatearPrecio(valor) {
    return '$ ' + Number(valor).toLocaleString();
}

function crearTarjeta(p, oculta) {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-xl-4 producto-tarjeta' + (oculta ? ' d-none' : '');

    const card = document.createElement('div');
    card.className = 'card p-4 h-100';

    const img = document.createElement('img');
    img.className = 'img-producto';
    img.src = imagenDe(p.nombre);
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

function abrirModal(p) {
    document.getElementById('modal-imagen').src = imagenDe(p.nombre);
    document.getElementById('modal-imagen').alt = p.nombre;
    document.getElementById('modal-nombre').textContent = p.nombre;
    document.getElementById('modal-categoria').textContent = p.categoria || '';
    document.getElementById('modal-precio').textContent = formatearPrecio(p.precio);
    document.getElementById('modal-descripcion').textContent = p.descripcion || '';

    document.getElementById('modalProducto').dataset.idProducto = p.id_producto;
    
    ProductoActual = p;
    PrepararCompra();

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalProducto')).show();
}

function MaximoCompra() {
    return Math.min(10, Number(ProductoActual.stock));
}

function ActualizarTotal() {
    const cantidad = Number(document.getElementById('compra-cantidad').value) || 0;
    document.getElementById('compra-total').textContent = formatearPrecio(cantidad * Number(ProductoActual.precio));
}

function MostrarStock() {
    const stock = document.getElementById('modal-stock');
    const hayStock = Number(ProductoActual.stock) > 0;
    stock.textContent = hayStock ? `${ProductoActual.stock} unidades disponibles` : 'Sin stock';
    stock.className = 'fw-semibold ' + (hayStock ? 'text-success' : 'text-danger');
}

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