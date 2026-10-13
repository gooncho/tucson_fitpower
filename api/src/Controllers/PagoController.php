<?php
namespace App\Controllers;

use App\Models\PagoModel;

class PagoController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function listar() {
        $pagoModel = new PagoModel($this->db);
        $pagos = $pagoModel->obtenerPagos();

        echo json_encode($pagos, JSON_UNESCAPED_UNICODE);
    }
}