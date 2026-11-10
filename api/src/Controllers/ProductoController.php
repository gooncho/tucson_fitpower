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

    private function soloAdmin() {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return false;
        }
        return true;
    }

    public function crear() {

        if (!$this->soloAdmin()) {
            return;
        }

        $d = json_decode(file_get_contents('php://input'), true);
        $d = is_array($d) ? $d : [];

        $nombre = trim((string) ($d['nombre'] ?? ''));
        $descripcion = trim((string) ($d['descripcion'] ?? ''));
        $idCategoria = (int) ($d['id_categoria'] ?? 0);
        $precio = $d['precio'] ?? '';
        $stock = $d['stock'] ?? '';

        if ($nombre === '' || $idCategoria <= 0 || !is_numeric($precio) || $precio < 0 || !is_numeric($stock) || $stock < 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá todos los campos con datos válidos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $productoModel = new ProductoModel($this->db);
            $productoModel->crearProducto($idCategoria, $nombre, $descripcion, (float) $precio, (int) $stock);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar el producto'], JSON_UNESCAPED_UNICODE);
        }
    }

    public function eliminar($id) {

        if (!$this->soloAdmin()) {
            return;
        }

        try {
            $productoModel = new ProductoModel($this->db);
            $productoModel->eliminarProducto((int) $id);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            http_response_code($e->getCode() == 23000 ? 409 : 500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getCode() == 23000 ? 'No se puede eliminar: el producto tiene compras asociadas' : 'No se pudo eliminar el producto'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
