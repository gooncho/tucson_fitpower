<?php
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

    public function listar() {
        $entrenadorModel = new EntrenadorModel($this->db);
        $entrenadores = $entrenadorModel->obtenerEntrenadores();

        echo json_encode($entrenadores, JSON_UNESCAPED_UNICODE);
    }
}