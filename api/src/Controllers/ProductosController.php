<?php 
namespace App\Controllers;

class ProductosController {
        private $db;
        public function __construct($db) {
            $this->db = $db;
        }
        public function index() {
            try {
                $stmt = $this->db->prepare("SELECT p.*, c.nombre AS categoria FROM PRODUCTO p JOIN CATEGORIA c ON c.id_categoria = p.id_categoria ORDER BY p.id_producto");
                $stmt->execute();
                $productos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode($productos);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
}