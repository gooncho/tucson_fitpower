/**
 * Entrenamiento en curso (Socio): EntrenamientoCurso.html?id=5
 *
 * Muestra los ejercicios de la rutina de a uno, con un cronómetro.
 * El socio puede ajustar peso y repeticiones de cada serie y marcarlas.
 * Al terminar, se guarda el entrenamiento (rutina y minutos) en el historial.
 */

let rutinaActual = null;
let ejercicios = [];
// Posición del ejercicio que se está mostrando.
let indiceEjercicioActual = 0;
let segundosTranscurridos = 0;
let timerInterval = null;
// Evita guardar el mismo entrenamiento dos veces (doble clic).
let entrenamientoGuardado = false;

// Id de la rutina, tomado de ?id= en la URL. Sin id no se puede entrenar.
const idRutina = Number(new URLSearchParams(window.location.search).get('id')) || null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!idRutina) {
        document.getElementById('nombreRutina').textContent = 'No se eligió ninguna rutina';
        document.getElementById('nombreEjercicio').textContent = 'Rutina no disponible';
        document.getElementById('infoEjercicio').textContent = 'Volvé a Rutinas y apretá "Iniciar" en la que quieras hacer.';
        return;
    }

    iniciarCronometro();

    try {
        const respuesta = await API.request(`/rutinas/${idRutina}`, 'GET');

        let nombre = `Rutina #${idRutina}`;
        let listaEjercicios = [];
        if (Array.isArray(respuesta)) {
            listaEjercicios = respuesta;
        } else if (respuesta) {
            nombre = respuesta.nombre || respuesta.rutina || nombre;
            if (Array.isArray(respuesta.ejercicios)) {
                listaEjercicios = respuesta.ejercicios;
            } else if (Array.isArray(respuesta.data)) {
                listaEjercicios = respuesta.data;
            } else if (respuesta.data && Array.isArray(respuesta.data.ejercicios)) {
                nombre = respuesta.data.nombre || nombre;
                listaEjercicios = respuesta.data.ejercicios;
            }
        }

        if (listaEjercicios.length === 0) {
            throw new Error("Sin ejercicios en la respuesta");
        }

        rutinaActual = { nombre, ejercicios: listaEjercicios };
        ejercicios = listaEjercicios;
        renderEjercicioActual();

    } catch (err) {
        clearInterval(timerInterval);
        document.getElementById('nombreRutina').textContent = 'No se pudo cargar la rutina';
        document.getElementById('nombreEjercicio').textContent = 'Rutina no disponible';
        document.getElementById('infoEjercicio').textContent = 'Verificá que tengas una rutina asignada.';
        return;
    }

    // "Siguiente": pasa al próximo ejercicio; en el último, termina el entrenamiento.
    document.getElementById('btnSiguiente').addEventListener('click', async () => {
        if (indiceEjercicioActual < ejercicios.length - 1) {
            indiceEjercicioActual++;
            renderEjercicioActual();
        } else {
            await finalizarEntrenamiento();
        }
    });
    document.getElementById('btnAnterior').addEventListener('click', () => {
        if (indiceEjercicioActual > 0) {
            indiceEjercicioActual--;
            renderEjercicioActual();
        }
    });
    document.getElementById('btnFinalizar').addEventListener('click', finalizarEntrenamiento);
    document.getElementById('btnAnadirSerie').addEventListener('click', () => {
        const ej = ejercicios[indiceEjercicioActual];
        if (!ej.listaSeries) {
            ej.listaSeries = [];
            for (let i = 1; i <= (ej.series || 4); i++) {
                ej.listaSeries.push({ peso: 10, repeticiones: ej.repeticiones || 10, completada: false });
            }
        }
        ej.listaSeries.push({ peso: 10, repeticiones: ej.repeticiones || 10, completada: false });
        renderSeries(ej);
    });
});

// Guarda el entrenamiento con la duración en minutos y va al historial.
async function finalizarEntrenamiento() {
    if (entrenamientoGuardado) return;

    const error = document.getElementById('errorEntrenamiento');
    const boton = document.getElementById('btnFinalizar');
    if (boton) boton.disabled = true;

    const duracion = Math.ceil(segundosTranscurridos / 60);
    const respuesta = await API.request('/entrenamientos/completar', 'POST', {
        id_rutina: idRutina,
        duracion: duracion
    });

    if (!respuesta || respuesta.status !== 'ok') {
        if (error) error.textContent = respuesta?.message || 'No se pudo guardar el entrenamiento.';
        if (boton) boton.disabled = false;
        return;
    }

    entrenamientoGuardado = true;
    clearInterval(timerInterval);
    window.location.href = 'Entrenamientos.html';
}

// Suma un segundo por segundo y actualiza el reloj en pantalla.
function iniciarCronometro() {
    timerInterval = setInterval(() => {
        segundosTranscurridos++;
        const mins = String(Math.floor(segundosTranscurridos / 60)).padStart(2, '0');
        const secs = String(segundosTranscurridos % 60).padStart(2, '0');
        const c = document.getElementById('cronometro');
        if (c) c.textContent = `${mins}:${secs}`;
    }, 1000);
}

// Muestra el ejercicio actual. La primera vez arma sus series con valores iniciales.
function renderEjercicioActual() {
    const ej = ejercicios[indiceEjercicioActual];
    
    document.getElementById('nombreRutina').textContent = rutinaActual.nombre;
    document.getElementById('progresoEjercicios').textContent = `${indiceEjercicioActual + 1} / ${ejercicios.length} ejercicios`;
    document.getElementById('nombreEjercicio').textContent = ej.nombre || ej.nombre_ejercicio || "Ejercicio";
    document.getElementById('infoEjercicio').textContent = `${ej.series || 4} series - ${ej.repeticiones || 10} rep - ${ej.descanso || 120} seg`;

    document.getElementById('btnAnterior').disabled = indiceEjercicioActual === 0;
    const btnSig = document.getElementById('btnSiguiente');
    if (indiceEjercicioActual === ejercicios.length - 1) {
        btnSig.innerHTML = `Finalizar rutina <i class="bi bi-check-lg"></i>`;
    } else {
        btnSig.innerHTML = `Siguiente ejercicio <i class="bi bi-arrow-right"></i>`;
    }

    if (!ej.listaSeries) {
        ej.listaSeries = [];
        const totalSeries = ej.series || 4;
        for (let i = 1; i <= totalSeries; i++) {
            ej.listaSeries.push({ peso: 10, repeticiones: ej.repeticiones || 10, completada: false });
        }
    }

    renderSeries(ej);
}

// Dibuja las series del ejercicio; los cambios de peso y repeticiones se guardan en ej.listaSeries.
function renderSeries(ej) {
    const contenedor = document.getElementById('contenedorSeries');
    contenedor.innerHTML = ej.listaSeries.map((s, idx) => `
        <div class="row align-items-center g-2 p-2 rounded bg-dark border border-secondary">
            <div class="col-3 text-center">
                <span class="text-whit d-block" style="font-size: 11px;">Serie</span>
                <span class="fw-bold text-light">${idx + 1}</span>
            </div>
            <div class="col-4 text-center">
                <span class="text-whit d-block" style="font-size: 11px;">Kg</span>
                <input type="number" class="form-control form-control-sm bg-black text-light border-secondary text-center input-peso" data-index="${idx}" value="${s.peso}">
            </div>
            <div class="col-4 text-center">
                <span class="text-whit d-block" style="font-size: 11px;">Repeticiones</span>
                <input type="number" class="form-control form-control-sm bg-black text-light border-secondary text-center input-rep" data-index="${idx}" value="${s.repeticiones}">
            </div>
            <div class="col-1 text-center">
                <input type="checkbox" class="form-check-input chk-serie" data-index="${idx}" ${s.completada ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #cdfa3f;">
            </div>
        </div>
    `).join("");

    document.querySelectorAll('.input-peso').forEach(input => {
        input.addEventListener('input', (e) => {
            ej.listaSeries[e.target.dataset.index].peso = e.target.value;
        });
    });

    document.querySelectorAll('.input-rep').forEach(input => {
        input.addEventListener('input', (e) => {
            ej.listaSeries[e.target.dataset.index].repeticiones = e.target.value;
        });
    });

    document.querySelectorAll('.chk-serie').forEach(chk => {
        chk.addEventListener('change', (e) => {
            ej.listaSeries[e.target.dataset.index].completada = e.target.checked;
        });
    });
}