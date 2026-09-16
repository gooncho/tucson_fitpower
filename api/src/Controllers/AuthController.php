<?php
namespace App\Controllers;

use App\Models\AuthModel;

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login() {

        $datos = json_decode(file_get_contents('php://input'), true);

        if (!is_array($datos)) {
            $datos = [];
        }

        $usuario = trim((string) ($datos['usuario'] ?? ''));
        $password = (string) ($datos['password'] ?? '');

        if ($usuario === '' || $password === '') {
            http_response_code(400);

            echo json_encode([
                'status' => 'error',
                'message' => 'Usuario y contraseña son obligatorios'
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        $authModel = new AuthModel($this->db);
        $fila = $authModel->buscarPorUsuario($usuario);

            if (!$fila || $password !== $fila['hash']) {
            http_response_code(401);

            echo json_encode([
                'status' => 'error',
                'message' => 'Usuario o contraseña incorrectos'
            ], JSON_UNESCAPED_UNICODE);

            return;
        }
        session_regenerate_id(true);

        $_SESSION['usuario_id'] = (int) $fila['id_usuario'];
        $_SESSION['usuario'] = $fila['nombre_usuario'];
        $_SESSION['rol_id'] = (int) $fila['id_rol'];
        $_SESSION['rol'] = $fila['nombre_rol'];

        echo json_encode([
            'status' => 'ok',
            'message' => 'Login correcto',
            'data' => [
                'usuario' => $fila['nombre_usuario'],
                'rol_id' => (int) $fila['id_rol'],
                'rol' => $fila['nombre_rol']
            ]
        ], JSON_UNESCAPED_UNICODE);
    }


    public function sesion() {

        if (empty($_SESSION['usuario_id'])) {

            http_response_code(401);

            echo json_encode([
                'status' => 'error',
                'message' => 'No hay sesión'
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'usuario' => $_SESSION['usuario'],
                'rol_id' => $_SESSION['rol_id'],
                'rol' => $_SESSION['rol']
            ]
        ], JSON_UNESCAPED_UNICODE);
    }


    public function logout() {

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {

            $params = session_get_cookie_params();

            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        echo json_encode([
            'status' => 'ok',
            'message' => 'Sesión cerrada'
        ], JSON_UNESCAPED_UNICODE);
    }
}