<?php
/**
 * Objetivos personales del socio (/api/objetivos).
 *
 * El socio puede ver, crear, editar (incluido el porcentaje de progreso) y eliminar
 * sus objetivos. Cada consulta filtra por la persona de la sesión, así nadie
 * puede ver ni tocar objetivos de otro socio.
 */
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

    // Devuelve el id_persona del usuario logueado (o 0 si no hay sesión).
    private function personaActual() {
        if (empty($_SESSION['usuario_id'])) {
            return 0;
        }
        $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :usuario');
        $stmt->execute(['usuario' => $_SESSION['usuario_id']]);
        return (int) $stmt->fetchColumn();
    }

    // GET /api/objetivos: objetivos del socio logueado.
    public function index() {
        $idPersona = $this->personaActual();
        if (!$idPersona || ($_SESSION['rol'] ?? '') !== 'Socio') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        echo json_encode(['status' => 'ok', 'data' => $this->model->obtenerPorPersona($idPersona)], JSON_UNESCAPED_UNICODE);
    }


    // DELETE /api/objetivos/:id: elimina un objetivo propio.
    public function destroy($id) {
        $idPersona = $this->personaActual();
        if (!$idPersona || ($_SESSION['rol'] ?? '') !== 'Socio') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        try {
            $eliminado = $this->model->eliminar((int) $id, $idPersona);
            if (!$eliminado) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Objetivo no encontrado']);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Objetivo eliminado']);
        } catch (\Throwable $e) {
            error_log('Error al eliminar objetivo: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo eliminar el objetivo']);
        }
    }

    // PUT /api/objetivos/:id: edita un objetivo propio. El progreso debe estar entre 0 y 100.
    public function update($id) {
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
        if (!isset($datos['porcentaje']) || !is_numeric($datos['porcentaje']) || $datos['porcentaje'] < 0 || $datos['porcentaje'] > 100) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El progreso debe estar entre 0 y 100']);
            return;
        }
        try {
            $actualizado = $this->model->actualizar((int) $id, $idPersona, $datos);
            if (!$actualizado) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Objetivo no encontrado o sin cambios']);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Objetivo actualizado']);
        } catch (\Throwable $e) {
            error_log('Error al actualizar objetivo: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo actualizar el objetivo']);
        }
    }

    // POST /api/objetivos: crea un objetivo nuevo para el socio logueado.
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
        if (!isset($datos['porcentaje']) || !is_numeric($datos['porcentaje']) || $datos['porcentaje'] < 0 || $datos['porcentaje'] > 100) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El progreso debe estar entre 0 y 100']);
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
