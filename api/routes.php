<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"
$router->post('/registro', 'AuthController@registrar');
$router->post('/acceso', 'AuthController@login');
$router->get('/sesion', 'AuthController@sesion');
$router->post('/logout', 'AuthController@logout');
$router->get('/socios', 'SocioController@listar');
$router->get('/ejercicios', 'EjercicioController@listar');
$router->get('/entrenadores', 'EntrenadorController@listar');
$router->get('/pagos', 'PagoController@listar');
$router->get('/productos', 'ProductoController@listar');
$router->get('/mis-socios', 'MissociosController@index');
$router->get('/rutinas', 'RutinaController@index');
$router->get('/rutinas/:id', 'RutinaController@verRutina');
$router->post('/rutinas', 'RutinaController@store');
$router->delete('/rutinas/:id', 'RutinaController@destroy');
$router->put('/rutinas/:id', 'RutinaController@actualizar');
$router->get('/ejercicio', 'EjerciciosController@index');
$router->post('/ejercicio', 'EjerciciosController@store');
$router->put('/ejercicio/:id', 'EjerciciosController@update');
$router->post('/ejercicio/:id/imagen', 'EjerciciosController@subirImagen'); 
$router->get('/producto', 'ProductosController@index');
$router->get('/producto/:id/resenas', 'ResenaController@index');
$router->post('/producto/:id/resenas', 'ResenaController@store');
$router->get('/perfil', 'PerfilController@ver');
$router->put('/perfil', 'PerfilController@actualizar');
$router->get('/objetivos', 'ObjetivoController@index');
$router->post('/objetivos', 'ObjetivoController@store');

// Próxima clase: login
// $router->post('/login', 'AuthController@login');
