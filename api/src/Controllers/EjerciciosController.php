<?php
namespace App\Controllers;

use App\Models\EjerciciosModel;

class EjerciciosController {

    const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

    private $modelo;

    public function __construct($db) {
        $this->modelo = new EjerciciosModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

     private function accesoPermitido() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tenes que iniciar sesion']);
            return false;
        }
        if (!in_array($_SESSION['rol'] ?? '', ['Entrenador', 'Administrador'])) {
            $this->responder(403, ['status' => 'error', 'message' => 'No tenes permiso para hacer esto']);
            return false;
        }
        return true;
    }
     public function index() {
        if (!$this->accesoPermitido()) {
            return;
        }

        try {
            $this->responder(200, ['status' => 'ok', 'data' => $this->modelo->listar()]);
        } catch (\Exception $e) {
            error_log('Error al listar ejercicios: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudieron cargar los ejercicios']);
        }
    }
    
    public function store() {
        if (!$this->accesoPermitido()) {
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            $datos = [];
        }
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $grupo = trim((string) ($datos['grupo_muscular'] ?? ''));
        $nivel = trim((string) ($datos['nivel'] ?? ''));
        $descripcion = trim((string) ($datos['descripcion'] ?? ''));

        if ($nombre === '' || mb_strlen($nombre) > 50) {
            $this->responder(400, ['status' => 'error', 'message' => 'El nombre es obligatorio (maximo 50 caracteres)']);
            return;
        }
        if ($grupo === '' || mb_strlen($grupo) > 70) {
            $this->responder(400, ['status' => 'error', 'message' => 'El grupo muscular es obligatorio (maximo 70 caracteres)']);
            return;
        }
        if (!in_array($nivel, self::NIVELES, true)) {
            $this->responder(400, ['status' => 'error', 'message' => 'El nivel no es valido']);
            return;
        }

        try {
            $id = $this->modelo->crear(
                $nombre,
                $grupo,
                $nivel,
                $descripcion === '' ? null : $descripcion,
            );
            $this->responder(201, ['status' => 'ok', 'message' => 'Ejercicio creado', 'id' => (int) $id]);
        } catch (\Exception $e) {
            error_log('Error al crear ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar el ejercicio']);
        }
    }
}