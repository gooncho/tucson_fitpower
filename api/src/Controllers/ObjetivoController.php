<?php
namespace App\Controllers;

use App\Models\ObjetivoModel;

class ObjetivoController {
    private $model;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new ObjetivoModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function personaActual() {
        if (empty($_SESSION['usuario_id'])) {
            return 0;
        }
        $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :usuario');
        $stmt->execute(['usuario' => $_SESSION['usuario_id']]);
        return (int) $stmt->fetchColumn();
    }

    public function index() {
        $idPersona = $this->personaActual();
        if (!$idPersona || ($_SESSION['rol'] ?? '') !== 'Socio') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        echo json_encode(['status' => 'ok', 'data' => $this->model->obtenerPorPersona($idPersona)], JSON_UNESCAPED_UNICODE);
    }

    public function store() {
        $idPersona = $this->personaActual();
        if (!$idPersona || ($_SESSION['rol'] ?? '') !== 'Socio') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos) || empty($datos['titulo']) || empty($datos['fecha_inicio']) || empty($datos['fecha_fin'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá título y fechas']);
            return;
        }
        try {
            $id = $this->model->crear($datos, $idPersona);
            http_response_code(201);
            echo json_encode(['status' => 'ok', 'id_objetivo' => $id]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar el objetivo']);
        }
    }
}
