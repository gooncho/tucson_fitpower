<?php

namespace App\Controllers;

use App\Models\PerfilModel;

class PerfilController {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new PerfilModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE); 
    }

    public function ver() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tienes que iniciar sesion']);
            return;
        }

        try {
            $perfil = $this->modelo->obtener((int) $_SESSION['usuario_id']);
            if (!$perfil) {
                $this->responder(404, ['status' => 'error', 'message' => 'Perfil no encontrado']);
                return;
            }

            $this->responder(200, ['status' => 'ok', 'data' => $perfil]);
        } catch (\Exception $e) {
            error_log('Error al cargar el perfil: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo cargar el perfil']);
        }
    }
}
