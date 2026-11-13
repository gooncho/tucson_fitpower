<?php
/**
 * Gestión de socios desde el panel del Administrador (/api/socios).
 *
 * Listar, crear, editar (incluido activar/desactivar la cuenta) y eliminar socios.
 * Todas las funciones son solo para el Administrador.
 */
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

    // GET /api/socios: socios con su plan, vencimiento y entrenador.
    public function listar() {

        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $socioModel = new SocioModel($this->db);
        $socios = $socioModel->obtenerSocios();

        echo json_encode([
            'status' => 'ok',
            'data' => $socios
        ], JSON_UNESCAPED_UNICODE);
    }

    // PUT /api/socios/:id: edita usuario, email y estado (activo/inactivo).
    public function actualizar($id) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        $datos = is_array($datos) ? $datos : [];
        $nombre = trim((string) ($datos['nombre_usuario'] ?? ''));
        $email = trim((string) ($datos['email'] ?? ''));
        $activo = filter_var($datos['activo'] ?? null, FILTER_VALIDATE_INT);
        if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($activo, [0, 1], true)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá nombre, email y estado con datos válidos'], JSON_UNESCAPED_UNICODE);
            return;
        }
        try {
            $modelo = new SocioModel($this->db);
            $modelo->actualizarSocio((int) $id, ['nombre_usuario' => $nombre, 'email' => $email, 'activo' => $activo]);
            echo json_encode(['status' => 'ok', 'message' => 'Socio actualizado'], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al actualizar socio: ' . $e->getMessage());
            http_response_code($e->getCode() == 23000 ? 409 : 500);
            echo json_encode(['status' => 'error', 'message' => $e->getCode() == 23000 ? 'El email o usuario ya está registrado' : 'No se pudo actualizar el socio'], JSON_UNESCAPED_UNICODE);
        }
    }


    public function asignarMembresia($id) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $idPlan = (int) ($datos['id_plan'] ?? 0);

        if ($idPlan < 1 || $idPlan > 3) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Seleccioná un plan válido'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $modelo = new SocioModel($this->db);
            if (!$modelo->asignarMembresia((int) $id, $idPlan)) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'No se encontró el socio'], JSON_UNESCAPED_UNICODE);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Membresía asignada'], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al asignar membresía: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo asignar la membresía'], JSON_UNESCAPED_UNICODE);
        }
    }

    // DELETE /api/socios/:id: elimina al socio y todos sus datos (ver SocioModel).
    public function eliminar($id) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $modelo = new SocioModel($this->db);
            if (!$modelo->eliminarSocio((int) $id)) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Socio no encontrado'], JSON_UNESCAPED_UNICODE);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Socio eliminado'], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al eliminar socio: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo eliminar el socio'], JSON_UNESCAPED_UNICODE);
        }
    }

    // POST /api/socios: crea el usuario (rol Socio) y su persona con el plan elegido.
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
