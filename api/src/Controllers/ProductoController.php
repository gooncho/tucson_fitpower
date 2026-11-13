<?php
/**
 * Gestión de productos desde el panel del Administrador (/api/productos).
 *
 * Listar, crear, editar (nombre, precio y stock) y eliminar productos.
 * Un producto que ya tiene compras no se puede eliminar, para no perder
 * el historial de ventas.
 */
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

    // GET /api/productos: lista con categoría y estado del stock.
    public function listar() {
        $productoModel = new ProductoModel($this->db);
        $productos = $productoModel->obtenerProductos();

        echo json_encode($productos, JSON_UNESCAPED_UNICODE);
    }

    // Solo el Administrador puede usar esta función.
    // Si no lo es, responde 403 y devuelve false.
    private function soloAdmin() {
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
            return false;
        }
        return true;
    }

    // POST /api/productos: crea un producto nuevo.
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

    // PUT /api/productos/:id: edita nombre, precio y stock (con validación).
    public function actualizar($id) {
        if (!$this->soloAdmin()) {
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $datos = is_array($datos) ? $datos : [];

        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $precio = $datos['precio'] ?? '';
        $stock = $datos['stock'] ?? '';

        if ($nombre === '' || mb_strlen($nombre) > 50 || !is_numeric($precio) || $precio < 0 || !is_numeric($stock) || $stock < 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Completá nombre, precio y stock con datos válidos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $productoModel = new ProductoModel($this->db);
            $productoModel->actualizarProducto((int) $id, $nombre, (float) $precio, (int) $stock);
            echo json_encode(['status' => 'ok'], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo actualizar el producto'], JSON_UNESCAPED_UNICODE);
        }
    }

    // DELETE /api/productos/:id: borra el producto y sus reseñas.
    // Si tiene compras, MySQL lo impide (clave foránea) y se responde 409.
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
