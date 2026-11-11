<?php
namespace App\Controllers;

use App\Models\PagoModel;

class PagoController {
    private $db;
    private $modelo;

    public function __construct($db) {
        $this->db = $db;
        $this->modelo = new PagoModel($db);
        if (session_status() === PHP_SESSION_NONE) session_start();
    }

    private function soloAdmin() {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return false;
        }
        return true;
    }

    public function listar() {
        if (!$this->soloAdmin()) return;
        try {
            echo json_encode(['status' => 'ok', 'data' => $this->modelo->obtenerPagos()], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al listar pagos: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudieron cargar los pagos'], JSON_UNESCAPED_UNICODE);
        }
    }

    public function actualizar($id) {
        if (!$this->soloAdmin()) return;
        $datos = json_decode(file_get_contents('php://input'), true);
        $estado = $datos['estado'] ?? '';
        if (!in_array($estado, ['Pagada', 'Pendiente'], true)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Estado inválido'], JSON_UNESCAPED_UNICODE);
            return;
        }
        try {
            if (!$this->modelo->existe((int) $id)) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Pago no encontrado'], JSON_UNESCAPED_UNICODE);
                return;
            }
            $this->modelo->actualizarEstado((int) $id, $estado);
            echo json_encode(['status' => 'ok', 'message' => 'Pago actualizado'], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al actualizar pago: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo actualizar el pago'], JSON_UNESCAPED_UNICODE);
        }
    }
}
