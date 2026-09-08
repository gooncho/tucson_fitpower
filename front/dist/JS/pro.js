document.addEventListener('DOMContentLoaded', () => {
    const btnCargarMas = document.getElementById('MasProductos');
    if (btnCargarMas) {
        btnCargarMas.addEventListener('click', () => {
            const productosOcultos = document.querySelectorAll('.producto-tarjeta.d-none');
            productosOcultos.forEach(producto => {
                producto.classList.remove('d-none');
            });
            btnCargarMas.style.display = 'none';
            
        });
    }
});