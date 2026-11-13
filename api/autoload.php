<?php
/**
 * Autocarga de clases.
 *
 * Cuando el código usa una clase como App\Controllers\AuthController,
 * PHP llama a esta función, que convierte el nombre en la ruta
 * src/Controllers/AuthController.php y la incluye. Así no hace falta
 * escribir un require por cada archivo.
 */
// api/autoload.php
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});