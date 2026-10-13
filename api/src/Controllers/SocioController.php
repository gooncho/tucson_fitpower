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
}