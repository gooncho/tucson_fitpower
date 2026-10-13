<?php
namespace App\Models;

class ProductoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerProductos() {
        try {
            $sql = "SELECT 
                        pr.id_producto,
                        pr.nombre,
                        c.nombre AS categoria,
                        pr.stock,
                        pr.precio,
                        CASE 
                            WHEN pr.stock = 0 THEN 'Sin stock'
                            WHEN pr.stock <= 5 THEN 'Bajo stock'
                            ELSE 'Disponible'
                        END AS estado
                    FROM PRODUCTO pr
                    INNER JOIN CATEGORIA c ON pr.id_categoria = c.id_categoria";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
}