<?php
/**
 * Gestión de entrenadores desde el panel del Administrador (/api/entrenadores).
 *
 * Listar, crear, editar y eliminar entrenadores, y asignarles socios
 * con día y horario (tabla SUPERVISA, que usa la agenda del entrenador).
 * Todas las funciones son solo para el Administrador.
 */
namespace App\Controllers;

use App\Models\EntrenadorModel;

class EntrenadorController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // GET /api/entrenadores: lista con cantidad de socios y días asignados.
    public function listar() {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $entrenadorModel = new EntrenadorModel($this->db);
        $entrenadores = $entrenadorModel->obtenerEntrenadores();

        echo json_encode($entrenadores, JSON_UNESCAPED_UNICODE);
    }
    
    // POST /api/entrenadores: crea el usuario (rol Entrenador) y su persona.
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
        $especialidad = trim((string) ($d['especialidad'] ?? ''));

        if ($usuario === '' || $apellido === '' || $password === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá todos los campos con datos válidos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $entrenadorModel = new EntrenadorModel($this->db);
            $entrenadorModel->crearEntrenador($usuario, $apellido, $email, $password, $especialidad);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            http_response_code($e->getCode() == 23000 ? 409 : 500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getCode() == 23000 ? 'El usuario o el email ya existen' : 'No se pudo guardar el entrenador'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    // GET /api/entrenadores/:id/socios: socios asignados con su día y horario.
    public function sociosAsignados($idEntrenador) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        $stmt = $this->db->prepare('SELECT s.id_persona, s.dia_semana, TIME_FORMAT(s.hora_inicio, "%H:%i") AS hora_inicio, TIME_FORMAT(s.hora_fin, "%H:%i") AS hora_fin FROM SUPERVISA s WHERE s.id_entrenador = :entrenador');
        $stmt->execute(['entrenador' => (int) $idEntrenador]);
        echo json_encode(['status' => 'ok', 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
    }

    // PUT /api/entrenadores/:id/socios
    // Reemplaza todas las asignaciones del entrenador en una transacción:
    // borra las anteriores y guarda la lista nueva. Si un socio tenía otro
    // entrenador, se lo mueve a este (un socio tiene un solo entrenador).
    public function guardarAsignaciones($idEntrenador) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        $asignaciones = $datos['asignaciones'] ?? [];
        if (!is_array($asignaciones)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Asignaciones inválidas']);
            return;
        }
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare('DELETE FROM SUPERVISA WHERE id_entrenador = :entrenador');
            $stmt->execute(['entrenador' => (int) $idEntrenador]);
            $stmt = $this->db->prepare('UPDATE PERSONA SET id_entrenador = NULL WHERE id_entrenador = :entrenador');
            $stmt->execute(['entrenador' => (int) $idEntrenador]);
            $stmtPersona = $this->db->prepare('UPDATE PERSONA SET id_entrenador = :entrenador WHERE id_persona = :persona');
            $stmtInsert = $this->db->prepare('INSERT INTO SUPERVISA (id_entrenador, id_persona, dia_semana, hora_inicio, hora_fin, fecha_asignacion) VALUES (:entrenador, :persona, :dia, :inicio, :fin, CURDATE())');
            foreach ($asignaciones as $a) {
                $idPersona = (int) ($a['id_persona'] ?? 0);
                if (!$idPersona) { continue; }
                $stmtMover = $this->db->prepare('DELETE FROM SUPERVISA WHERE id_persona = :persona');
                $stmtMover->execute(['persona' => $idPersona]);
                $stmtPersona->execute(['entrenador' => (int) $idEntrenador, 'persona' => $idPersona]);
                $stmtInsert->execute([
                    'entrenador' => (int) $idEntrenador,
                    'persona' => $idPersona,
                    'dia' => $a['dia_semana'] ?? null,
                    'inicio' => !empty($a['hora_inicio']) ? $a['hora_inicio'] : null,
                    'fin' => !empty($a['hora_fin']) ? $a['hora_fin'] : null
                ]);
            }
            $this->db->commit();
            echo json_encode(['status' => 'ok', 'message' => 'Asignaciones guardadas'], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudieron guardar las asignaciones'], JSON_UNESCAPED_UNICODE);
        }
    }


    // DELETE /api/entrenadores/:id: elimina al entrenador; sus socios quedan sin entrenador.
    public function eliminar($idUsuario) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $modelo = new EntrenadorModel($this->db);
            if (!$modelo->eliminarEntrenador((int) $idUsuario)) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Entrenador no encontrado'], JSON_UNESCAPED_UNICODE);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Entrenador eliminado'], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error al eliminar entrenador: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo eliminar el entrenador'], JSON_UNESCAPED_UNICODE);
        }
    }

    // PUT /api/entrenadores/:id: edita usuario, email y especialidad (con validación).
    public function actualizar($idUsuario) {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $datos = is_array($datos) ? $datos : [];
        $nombre = trim((string) ($datos['nombre_usuario'] ?? ''));
        $email = trim((string) ($datos['email'] ?? ''));
        $especialidad = trim((string) ($datos['especialidad'] ?? ''));

        if ($nombre === '' || mb_strlen($nombre) > 50 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá el usuario y un email válido'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $stmt = $this->db->prepare('UPDATE USUARIO u INNER JOIN PERSONA p ON p.id_usuario = u.id_usuario SET u.nombre_usuario = :nombre, u.email = :email, p.especialidad = :especialidad WHERE u.id_usuario = :id AND u.id_rol = 2');
            $stmt->execute([
                'nombre' => $nombre,
                'email' => $email,
                'especialidad' => $especialidad !== '' ? $especialidad : null,
                'id' => (int) $idUsuario
            ]);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            $repetido = $e->getCode() == 23000;
            http_response_code($repetido ? 409 : 500);
            echo json_encode([
                'status' => 'error',
                'message' => $repetido ? 'Ese usuario o email ya existe' : 'No se pudo actualizar el entrenador'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

}
