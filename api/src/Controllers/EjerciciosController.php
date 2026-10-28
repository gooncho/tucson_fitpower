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
    
    private function leerDatos() {
        $datos = json_decode(file_get_contents('php://input'), true); 
        if (!is_array($datos)) {
            $datos = [];
        }
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $grupo = trim((string) ($datos['grupo_muscular'] ?? ''));
        $nivel = trim((string)($datos['nivel'] ?? ''));
        $descripcion = trim((string) ($datos['descripcion'] ?? '')); 

        if($nombre === '' || mb_strlen($nombre) > 50) {
            $this->responder(400, ['status' => 'error', 'message' => 'El nombre es obligatorio']);
            return null;
        }

        if ($grupo === '' || mb_strlen($grupo) > 70) {
        $this->responder(400, ['status' => 'error', 'message' => 'El grupo muscular es obligatorio']);
        return null;
        }

        if (!in_array($nivel, self::NIVELES, true)) {
        $this->responder(400, ['status' => 'error', 'message' => 'El nivel no es valido']);
        return null;
        }
        
        return [
            'nombre' => $nombre,
            'grupo' => $grupo,
            'nivel' => $nivel,
            'descripcion' => $descripcion === '' ? null : $descripcion,
        ];
    }

    public function store() {
        if(!$this->accesoPermitido()) {
            return;
        }
        $d = $this->leerDatos();
        if ($d === null) {
            return;
        }

        try {
            $id = $this->modelo->crear($d['nombre'], $d['grupo'], $d['nivel'], $d['descripcion']);
            $this->responder(201, ['status' => 'ok', 'message' => 'Ejercicio creado', 'id' => (int) $id]);
        } catch (\Exception $e) {
            error_log('Error al crear ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar el ejercicio']);
        }
    }

    public function update($idEjercicio) {
        if (!$this->accesoPermitido()) {
            return;
        }
        $idEjercicio = (int) $idEjercicio;
        $d = $this->leerDatos();
        if ($d === null) {
            return;
        }

        try {
            if ($idEjercicio <= 0 || !$this->modelo->existe($idEjercicio)) {
                $this->responder(404, ['status' => 'error', 'message' => 'Ejercicio no encontrado']);
                return;
            }
            $this->modelo->actualizar($idEjercicio, $d['nombre'], $d['grupo'], $d['nivel'], $d['descripcion']);
            $this->responder(200, ['status' => 'ok', 'message' => 'Ejercicio actualizado']);
        } catch (\Exception $e) {
            error_log('Error al actualizar ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo actualizar el ejercicio']);
        }
    }
}