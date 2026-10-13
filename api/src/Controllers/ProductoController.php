<?php
namespace App\Controllers;

use App\Models\ProductoModel;

class ProductoController {
    private $db;

    public function __construct($db) {
        $this->db = $db;

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function listar() {
        $productoModel = new ProductoModel($this->db);
        $productos = $productoModel->obtenerProductos();

        echo json_encode($productos, JSON_UNESCAPED_UNICODE);
    }
}