<?php
namespace App\Controllers;

use App\Models\EjercicioModel;

class EjercicioController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function listar() {
        $ejercicioModel = new EjercicioModel($this->db);
        $ejercicios = $ejercicioModel->obtenerEjercicios();

        echo json_encode($ejercicios, JSON_UNESCAPED_UNICODE);
    }
}