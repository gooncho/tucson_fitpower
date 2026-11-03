<?php

namespace App\Controllers;

use App\Models\RutinaModel;

class RutinaController {
        private $modelo;
      
        public function __construct($db) {
            $this->modelo  = new RutinaModel($db);
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
                $this->responder(401, ['status' => 'error', 'message' => 'Tienes que iniciar sesion']);
                return false;
            }
            if (!in_array($_SESSION['rol'] ?? '', ['Entrenador', 'Administrador'])) {
                $this->responder(403, ['status' => 'error', 'message' => 'No tienes permisos de acceso']);
                return false;
            }
            return true;
    }

    private function entrenadorActual() {
        if (($_SESSION['rol'] ?? '') !== 'Entrenador')  {
            return null;
        }
        $id = $this->modelo->buscarPersonaPorUsuario((int) $_SESSION['usuario_id']);
        return $id ? (int) $id : 0;
    }

    public function index() {
        if (!$this->accesoPermitido()) {
            return;
        }

        $idEntrenador = $this->entrenadorActual();
        if($idEntrenador === 0) {
            $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene un perfil']);
            return;
        }

        try {
            $this->responder(200, ['status' => 'ok', 'data' => $this->modelo->listar($idEntrenador)]);
        } catch (\Exception $e) {
            error_log('Error al listar socios: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudieron cargar las rutinas']);
        }
    }

    public function VerRutina($idRutina) {
        if (!$this->accesoPermitido()) {
            return;
        }
        try {
            $datos = $this->modelo->VerRutina((int) $idRutina);
            $this->responder(200, ['status' => 'ok', 'data' => $datos]);
        } catch (\Exception $e) {
            error_log('Error al cargar la rutina: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo cargar la rutina']);
        }
    }

    public function store() {
        if (!$this->accesoPermitido()) {
            return;
        }

        $d = $this->leerRutina();
        if ($d === null) {
            return;
        }

        $idPersona = $this->modelo->buscarPersonaPorUsuario((int) $_SESSION['usuario_id']);
        if (!$idPersona) {
            $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene perfil']);
            return;
        }

        $filtro = (($_SESSION['rol'] ?? '') === 'Entrenador') ? (int) $idPersona : null;
        if ($d['id_persona'] <= 0 || !$this->modelo->esSocioDe($d['id_persona'], $filtro)) {
            $this->responder(400, ['status' => 'error', 'message' => 'El socio no es valido']);
            return;
        }

        try {
            $id = $this->modelo->crear(
                $d['nombre'],
                $d['descripcion'],
                (int) $idPersona,
                $d['id_persona'],
                $d['ejercicios']
            );
            $this->responder(201, ['status' => 'ok', 'message' => 'Rutina creada', 'id' => $id]);
        } catch (\Exception $e) {
            error_log('Error al crear rutina: ' . $e->getMessage());
            // 💡 Muestra el error real temporalmente para depurar:
            $this->responder(500, ['status' => 'error', 'message' => 'EXCEPCIÓN PHP: ' . $e->getMessage()]);
        }
    }    

    public function destroy($idRutina) {
        if (!$this->accesoPermitido()) {
            return;
        }

        $idRutina = (int) $idRutina;
        $idEntrenador = $this->entrenadorActual();
        if ($idEntrenador === 0) {
            $this->responder(403, ['status' => 'error', 'message' => 'rutina no encontrada']);
            return;
        }

        if ($idRutina <= 0 || !$this->modelo->puedeEliminar($idRutina, $idEntrenador)) {
            $this->responder(404, ['status' => 'error', 'message' => 'Rutina no encontrada']);
            return;
        }
        try {
            $this->modelo->eliminar($idRutina);
            $this->responder(200, ['status' => 'ok', 'message' => 'Rutina eliminada']);
        } catch (\Exception $e) {
            error_log('Error al eliminar la rutina: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo eliminar la rutina']);
        }
    }

    private function leerRutina() {
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            $datos = [];
        }

        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $descripcion = trim((string) ($datos['descripcion'] ?? ''));
        $ejercicios = $datos['ejercicios'] ?? []; 

        if ($nombre === '' || mb_strlen($nombre) > 50) {
            $this->responder(400, ['status' => 'error', 'message' => 'El nombre es obligatorio']);
            return null;
        }

        if(!is_array($ejercicios) || count($ejercicios) === 0) {
            $this->responder(400, ['status' => 'error', 'message' => 'Agrega al menos un ejercicio']);
            return null;
        }

        $limpios = [];
        $usados = [];

        foreach ($ejercicios as $item) {
            $item = is_array($item) ? $item : [];
            $idEjercicio = (int) ($item['id_ejercicio'] ?? 0);
            $series = (int) ($item['series'] ?? 0);
            $repeticiones = (int) ($item['repeticiones'] ?? 0);
            $descanso = (int) ($item['descanso'] ?? 0);

            if ($idEjercicio <= 0 || $series < 1 || $repeticiones < 1 || $descanso < 0) {
                $this->responder(400, ['status' => 'error', 'message' => 'Revisa los datos de los ejercicios']);
                return null;
            }
            if (isset($usados[$idEjercicio])) {
                $this->responder(400, ['status' => 'error', 'message' => 'No repitas un ejercicio en la misma rutina']);
                return null;
            }
            $usados[$idEjercicio] = true;

            $limpios[] = [
                'id_ejercicio' => $idEjercicio,
                'series' => $series,
                'repeticiones' => $repeticiones,
                'descanso' => $descanso,
            ];
        }

        return [
            'nombre' => $nombre,
            'descripcion' => $descripcion === '' ? null : $descripcion,
            'id_persona' => (int) ($datos['id_persona'] ?? 0),
            'ejercicios' => $limpios,
        ];
    }

    public function actualizar($idRutina) {
        if (!$this->accesoPermitido()) {
            return;
        }

        $idRutina = (int) $idRutina;
        $idEntrenador = $this->entrenadorActual();
        if ($idEntrenador === 0) {
            $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene un perfil']);
            return;
        }

        $d = $this->leerRutina();
        if ($d === null) {
            return;
        }

        try {
            if ($idRutina <= 0 || !$this->modelo->puedeEliminar($idRutina, $idEntrenador)) {
                $this->responder(404, ['status' => 'error', 'message' => 'Rutina no encontrada']);
                return;
            }

            $this->modelo->actualizar($idRutina, $d['nombre'], $d['descripcion'], $d['ejercicios']);
            $this->responder(200, ['status' => 'ok', 'message' => 'Rutina actualizada']);
        } catch (\Exception $e) {
            error_log('Error al actualizar rutina: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo actualizar la rutina']);
        }
    }
}   