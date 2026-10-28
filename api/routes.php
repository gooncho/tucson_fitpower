<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"
$router->post('/acceso', 'AuthController@login');
$router->get('/sesion', 'AuthController@sesion');
$router->post('/logout', 'AuthController@logout');
$router->get('/socios', 'SocioController@listar');
$router->get('/ejercicios', 'EjercicioController@listar');
$router->get('/entrenadores', 'EntrenadorController@listar');
$router->get('/pagos', 'PagoController@listar');
$router->get('/productos', 'ProductoController@listar');
$router->get('/socios', 'MissociosController@index');
$router->get('/rutinas', 'RutinaController@index');
$router->get('/rutinas/:id', 'RutinaController@verRutina');
$router->post('/rutinas', 'RutinaController@store');
$router->get('/ejercicio', 'EjerciciosController@index');
$router->post('/ejercicio', 'EjerciciosController@store');
$router->put('/ejercicio/:id', 'EjerciciosController@update');
$router->get('/producto', 'ProductosController@index');
$router->get('/producto/:id/resenas', 'ResenaController@index');
$router->post('/producto/:id/resenas', 'ResenaController@store');

// Próxima clase: login
// $router->post('/login', 'AuthController@login');
