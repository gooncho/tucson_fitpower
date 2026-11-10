function CrearPaginacion(idControles, porPagina, dibujar) {
    let lista = [];
    let pagina = 1;

    function crearBoton(icono, etiqueta, deshabilitado, alHacerClic) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'admin-mini';
        boton.disabled = deshabilitado;
        boton.setAttribute('aria-label', etiqueta);
        const i = document.createElement('i');
        i.className = `bi ${icono}`;
        boton.appendChild(i);
        boton.addEventListener('click', alHacerClic);
        return boton;
    }

    function render() {
        const total = Math.max(1, Math.ceil(lista.length / porPagina));
        if (pagina > total) pagina = total;

        if (lista.length > 0) {
            const inicio = (pagina - 1) * porPagina;
            dibujar(lista.slice(inicio, inicio + porPagina));
        }

        const controles = document.getElementById(idControles);
        if (!controles) return;

        if (lista.length <= porPagina) {
            controles.replaceChildren();
            return;
        }

        const anterior = crearBoton('bi-chevron-left', 'Página anterior', pagina === 1, () => {
            pagina--;
            render();
        });
        const siguiente = crearBoton('bi-chevron-right', 'Página siguiente', pagina === total, () => {
            pagina++;
            render();
        });
        const texto = document.createElement('span');
        texto.textContent = `Página ${pagina} de ${total} · ${lista.length} resultados`;

        controles.replaceChildren(anterior, texto, siguiente);
    }

    return {
        mostrar(nuevaLista) {
            lista = nuevaLista;
            render();
        },
        reiniciar() {
            pagina = 1;
        }
    };
}