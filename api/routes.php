<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"
$router->post('/acceso', 'AuthController@login');
$router->get('/sesion', 'AuthController@sesion');
$router->post('/logout', 'AuthController@logout');


// Próxima clase: login
// $router->post('/login', 'AuthController@login');
