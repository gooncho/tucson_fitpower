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

        if (!$fila || !$this->passwordCorrecta($password, $fila, $authModel)) {
            http_response_code(401);

            echo json_encode([
                'status' => 'error',
                'message' => 'Usuario o contraseña incorrectos'
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        if ((int) $fila['activo'] !== 1) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Tu cuenta está desactivada. Consultá en recepción.'
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

    private function passwordCorrecta($password, $fila, $authModel) {
        $guardado = (string) $fila['hash'];

        if (str_starts_with($guardado, '$2y$')) {
            return password_verify($password, $guardado);
        }

        // Contraseña vieja en texto plano: si coincide, la pasamos a hash
        if (hash_equals($guardado, $password)) {
            $authModel->actualizarHash((int) $fila['id_usuario'], password_hash($password, PASSWORD_DEFAULT));
            return true;
        }
        return false;
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

    public function registrar() {
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            $datos = [];
        }

        $usuario = trim((string) ($datos['usuario'] ?? ''));
        $email = strtolower(trim((string) ($datos['email'] ?? '')));
        $password = (string) ($datos['password'] ?? '');

        $error = null;
        if (mb_strlen($usuario) < 3 || mb_strlen($usuario) > 50) {
            $error = 'El usuario debe tener entre 3 y 50 caracteres.';
        } elseif (!preg_match('/^[A-Za-z0-9._-]+$/', $usuario)) {
            $error = 'El usuario solo puede tener letras, numeros, ., -, _.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
            $error = 'El email no es válido';
        } elseif (mb_strlen($password) < 6 || mb_strlen($password) > 100) {
            $error = 'La contraseña debe tener entre 6 y 100 caracteres';
        }

        if ($error !== null) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $error], JSON_UNESCAPED_UNICODE);
            return;
        }

        $authModel = new AuthModel($this->db);

        try {
            $duplicado = $authModel->buscarDuplicado($usuario, $email);
            if ($duplicado) {
                http_response_code(409);
                $mensaje = strtolower($duplicado['nombre_usuario']) === strtolower($usuario)
                    ? 'Ese nombre de usuario ya existe'
                    : 'Ese email ya esta registrado';
                    echo json_encode(['status' => 'error', 'message' => $mensaje], JSON_UNESCAPED_UNICODE);
                    return;
            }

            $nuevo = $authModel->crearSocio($usuario, $email, $password);
        } catch (\Exception $e) {
            if ((string) $e->getCode() === '23000') {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'Ese usuario o email ya está registrado'], JSON_UNESCAPED_UNICODE);
            return;
            }
            error_log('Error al registrar usuario: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo crear el usuario'], JSON_UNESCAPED_UNICODE);
            return;
        }

        session_regenerate_id(true);
            $_SESSION['usuario_id'] = $nuevo['id_usuario'];
            $_SESSION['usuario'] = $usuario;
            $_SESSION['rol_id'] = $nuevo['id_rol'];
            $_SESSION['rol'] = $nuevo['nombre_rol'];

        http_response_code(201);
        echo json_encode([
            'status' => 'ok',
            'message' => 'Usuario creado',
            'data' => [
                'usuario' => $usuario,
                'rol_id' => $nuevo['id_rol'],
                'rol' => $nuevo['nombre_rol'],
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
}