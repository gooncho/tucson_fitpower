<?php
/**
 * Planes de membresía (GET /api/planes), ordenados por precio.
 * Los muestra la página de membresía.
 */
namespace App\Controllers;

class PlanController {
    private $db;
    public function __construct($db) { $this->db = $db; }
    public function index() {
        try {
            $stmt = $this->db->query('SELECT id_plan, nombre, precio, duracion, descripcion FROM PLAN ORDER BY precio ASC');
            echo json_encode(['status' => 'ok', 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudieron cargar los planes'], JSON_UNESCAPED_UNICODE);
        }
    }
}
