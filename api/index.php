<?php
/**
 * Punto de entrada de la API.
 *
 * Todas las peticiones a /api/... llegan acá gracias al .htaccess.
 * Este archivo prepara todo y le pasa la petición al Router:
 *   1. Configura los errores (se guardan en el log, no se muestran al usuario).
 *   2. Define que las respuestas son JSON y protege la cookie de sesión.
 *   3. Carga las variables del .env y se conecta a la base de datos.
 *   4. Carga las rutas (routes.php) y ejecuta la que coincide con la URL.
 */
// api/index.php

// Los errores de PHP no se muestran en la respuesta (darían pistas a un atacante);
// se guardan en el log del servidor (docker logs).
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// ... el resto de tu código (require autoload, router, etc.)
// 1. Iniciamos buffer para atrapar cualquier error de texto plano o warnings de PHP
ob_start(); 

// 2. Cabeceras estrictas para API-Driven
header("Content-Type: application/json; charset=UTF-8");
// Cookie de sesión más segura:
//   httponly: el JavaScript no puede leerla (protege contra robo por XSS).
//   samesite Lax: otra página no puede usar tu sesión para hacer POST/PUT/DELETE.
//   secure: con HTTPS, la cookie solo viaja cifrada.
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']),
]);

// Manejo de peticiones preflight (CORS) de los navegadores
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Carga automática de clases: al usar App\Controllers\X se incluye src/Controllers/X.php.
require_once 'autoload.php';

// 3. Cargar las variables del archivo .env
\App\Utils\EnvLoader::load(__DIR__ . '/.env');

require_once 'config/database.php';

// 4. Intentar conexión aislada
try {
    $db = (new Database())->getConnection();
} catch (Throwable $e) {
    ob_clean();
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    // En local mostramos el detalle del error para depurar; en producción, un mensaje genérico.
    $isLocalHost = isset($_SERVER['HTTP_HOST'])
        && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false
            || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
    $clientMsg = $isLocalHost
        ? ('Error crítico de BD: ' . $e->getMessage())
        : 'Error crítico de BD: no se pudo conectar al servidor de datos';
    echo json_encode([
        'status' => 'error',
        'message' => $clientMsg,
    ]);
    exit;
}

// En Docker Apache la API vive en http://localhost:8080/api
$base = '/api';

// Instanciamos el router inyectando el base path correcto y la DB
$router = new \App\Utils\Router($base, $db);

// Cargamos todas las definiciones de rutas
require_once 'routes.php';

// 5. Limpiamos cualquier echo/espacio en blanco accidental antes de ejecutar
// (Se descarta: cualquier texto impreso por error antes de este punto no debe romper el JSON.)
$basura = ob_get_clean(); 

// 6. Lanzar la aplicación
$router->run();