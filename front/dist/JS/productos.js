const PRODUCTOS_VISIBLES = 6;

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
    return '../assets/' + (hallada ? hallada.archivo : IMAGEN_POR_DEFECTO);
}

function formatearPrecio(valor) {
    return '$ ' + Number(valor).toLocaleString();
}

function crearTarjeta(p, oculta) {
    const col = document.createElement('div');
    col.className = 'col-md-4 producto-tarjeta' + (oculta ? ' d-none' : '');

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

    const stock = document.getElementById('modal-stock');
    const hayStock = Number(p.stock) > 0;
    stock.textContent = hayStock ? `${p.stock} unidades disponibles` : 'Sin stock';
    stock.className = 'fw-semibold ' + (hayStock ? 'text-success' : 'text-danger');

    document.getElementById('modalProducto').dataset.idProducto = p.id_producto;
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalProducto')).show();
}

document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('lista-productos');
    const botonMas = document.getElementById('MasProductos');
    if (!lista) return;

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