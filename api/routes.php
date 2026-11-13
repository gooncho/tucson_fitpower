<?php
/**
 * Lista de rutas de la API.
 *
 * Cada línea dice: "cuando llegue este MÉTODO a esta URL, ejecutá Controller@método".
 * Las partes con dos puntos (:id) son parámetros: /socios/5 llama a actualizar(5).
 * Todas las URLs empiezan con /api (lo agrega el Router).
 */
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"
// --- Autenticación: registro, login, sesión actual y cierre de sesión ---
$router->post('/registro', 'AuthController@registrar');
$router->post('/acceso', 'AuthController@login');
$router->get('/sesion', 'AuthController@sesion');
$router->post('/logout', 'AuthController@logout');
// --- Administrador: gestión de socios ---
$router->get('/socios', 'SocioController@listar');
$router->post('/socios', 'SocioController@crear');
$router->put('/socios/:id', 'SocioController@actualizar');
$router->delete('/socios/:id', 'SocioController@eliminar');
// --- Lista simple de ejercicios (la usa el socio al armar su rutina) ---
$router->get('/ejercicios', 'EjercicioController@listar');
// --- Administrador: gestión de entrenadores ---
$router->get('/entrenadores', 'EntrenadorController@listar');
$router->post('/entrenadores', 'EntrenadorController@crear');
$router->delete('/entrenadores/:id', 'EntrenadorController@eliminar');
// --- Administrador: pagos (compras de productos) ---
$router->get('/pagos', 'PagoController@listar');
$router->put('/pagos/:id', 'PagoController@actualizar');
// --- Administrador: gestión de productos ---
$router->get('/productos', 'ProductoController@listar');
$router->post('/productos', 'ProductoController@crear');
$router->put('/productos/:id', 'ProductoController@actualizar');
$router->delete('/productos/:id', 'ProductoController@eliminar');
// --- Entrenador: sus socios y su agenda ---
$router->get('/mis-socios', 'MissociosController@index');
$router->get('/mi-agenda', 'MissociosController@agenda');
// --- Rutinas (entrenador y socio) ---
$router->get('/rutinas', 'RutinaController@index');
$router->get('/rutinas/:id', 'RutinaController@verRutina');
$router->post('/rutinas', 'RutinaController@store');
$router->delete('/rutinas/:id', 'RutinaController@destroy');
$router->put('/rutinas/:id', 'RutinaController@actualizar');
// --- Ejercicios (entrenador y administrador): crear, editar, imagen, desactivar y reactivar ---
$router->get('/ejercicio', 'EjerciciosController@index');
$router->post('/ejercicio', 'EjerciciosController@store');
$router->put('/ejercicio/:id', 'EjerciciosController@update');
$router->post('/ejercicio/:id/imagen', 'EjerciciosController@subirImagen');
$router->delete('/ejercicio/:id', 'EjerciciosController@destroy');
$router->put('/ejercicio/:id/reactivar', 'EjerciciosController@reactivar');
// --- Tienda del socio: productos, reseñas y compras ---
$router->get('/producto', 'ProductosController@index');
$router->get('/producto/:id/resenas', 'ResenaController@index');
$router->post('/producto/:id/resenas', 'ResenaController@store');
$router->post('/compras', 'CompraController@crear');
// --- Perfil de cualquier usuario logueado ---
$router->get('/perfil', 'PerfilController@ver');
$router->put('/perfil', 'PerfilController@actualizar');
$router->post('/perfil/foto', 'PerfilController@subirFoto');
// --- Socio: objetivos, logros y planes ---
$router->get('/objetivos', 'ObjetivoController@index');
$router->get('/logros', 'SocioDashboardController@logros');
$router->get('/planes', 'PlanController@index');
$router->post('/objetivos', 'ObjetivoController@store');
$router->put('/objetivos/:id', 'ObjetivoController@update');
$router->delete('/objetivos/:id', 'ObjetivoController@destroy');

// Próxima clase: login
// $router->post('/login', 'AuthController@login');
// --- Socio: panel (rutinas, entrenamientos, membresía, progreso, asistencia e inicio) ---
$router->get('/mis-rutinas', 'SocioDashboardController@rutinas');
$router->get('/entrenamientos', 'SocioDashboardController@entrenamientos');
$router->post('/entrenamientos/completar', 'SocioDashboardController@completarEntrenamiento');
$router->get('/membresia', 'SocioDashboardController@membresia');
$router->get('/progreso', 'SocioDashboardController@progreso');
$router->post('/progreso/peso', 'SocioDashboardController@guardarPeso');
$router->post('/asistencia', 'SocioDashboardController@marcarAsistencia');
$router->delete('/mis-rutinas/:id', 'SocioDashboardController@eliminarRutina');
$router->get('/inicio-socio', 'SocioDashboardController@inicio');
// --- Administrador: inicio y asignación de socios a entrenadores ---
$router->get('/inicio-administrador', 'AdministradorController@inicio');
$router->get('/entrenadores/:id/socios', 'EntrenadorController@sociosAsignados');
$router->put('/entrenadores/:id/socios', 'EntrenadorController@guardarAsignaciones');
$router->put('/entrenadores/:id', 'EntrenadorController@actualizar');
