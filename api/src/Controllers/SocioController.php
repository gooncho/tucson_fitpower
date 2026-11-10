<?php
namespace App\Controllers;

use App\Models\SocioModel;

class SocioController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function listar() {

        if (empty($_SESSION['usuario_id'])) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'No autorizado'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $socioModel = new SocioModel($this->db);
        $socios = $socioModel->obtenerSocios();

        echo json_encode([
            'status' => 'ok',
            'data' => $socios
        ], JSON_UNESCAPED_UNICODE);
    }

    public function crear() {

        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $d = json_decode(file_get_contents('php://input'), true);
        $d = is_array($d) ? $d : [];

        $usuario = trim((string) ($d['nombre_usuario'] ?? ''));
        $apellido = trim((string) ($d['apellido'] ?? ''));
        $email = trim((string) ($d['email'] ?? ''));
        $password = (string) ($d['password'] ?? '');
        $idPlan = (int) ($d['id_plan'] ?? 0);

        if ($usuario === '' || $apellido === '' || $password === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá todos los campos con datos válidos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $socioModel = new SocioModel($this->db);
            $socioModel->crearSocio($usuario, $apellido, $email, $password, $idPlan ?: null);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            http_response_code($e->getCode() == 23000 ? 409 : 500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getCode() == 23000 ? 'El usuario o el email ya existen' : 'No se pudo guardar el socio'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
