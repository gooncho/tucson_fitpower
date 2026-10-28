<?php

namespace App\Controllers;

use App\Models\SociosModel;

class MissociosController {
        private $modelo;

        public function __construct($db) {
            $this->modelo  = new SociosModel($db);
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
        public function index() {
            if (!$this->accesoPermitido()) {
                return;
            }
            try {
                $idEntrenador = null;
                
                if (($_SESSION['rol'] ?? '') === 'Entrenador') {
                    $idEntrenador = $this->modelo->buscarPersonaPorUsuario((int) $_SESSION['usuario_id']);
                    if (!$idEntrenador) {
                        $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene un perfil asociado']);
                        return;
                    }
                }
                $this->responder(200, ['status' => 'ok', 'data' => $this->modelo->listar((int) $idEntrenador ?: null)]);
            } catch (\Exception $e) {
                error_log('Error al listar socios: ' . $e->getMessage());
                $this->responder(500, ['status' => 'error', 'message' => 'No se pudieron cargar los socios']);
            }
        }
}