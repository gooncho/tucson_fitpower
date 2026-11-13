<?php
/**
 * Consultas de productos para el Administrador.
 */
namespace App\Models;

class ProductoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Productos con su categoría y un estado calculado según el stock:
    // Sin stock (0), Crítico (menos de 10), Bajo (menos de 20) o Disponible.
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
                            WHEN pr.stock < 10 THEN 'Crítico'
                            WHEN pr.stock < 20 THEN 'Bajo'
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

    // Inserta un producto nuevo.
    public function crearProducto($idCategoria, $nombre, $descripcion, $precio, $stock) {
        $stmt = $this->db->prepare("INSERT INTO PRODUCTO (id_categoria, nombre, descripcion, precio, stock) VALUES (:cat, :nombre, :descripcion, :precio, :stock)");
        $stmt->execute(['cat' => $idCategoria, 'nombre' => $nombre, 'descripcion' => $descripcion, 'precio' => $precio, 'stock' => $stock]);
    }

    // Actualiza nombre, precio y stock.
    public function actualizarProducto($id, $nombre, $precio, $stock) {
        $stmt = $this->db->prepare("UPDATE PRODUCTO SET nombre = :nombre, precio = :precio, stock = :stock WHERE id_producto = :id");
        $stmt->execute([
            'nombre' => $nombre,
            'precio' => $precio,
            'stock' => $stock,
            'id' => $id
        ]);
    }

    // Borra las reseñas y el producto en una transacción.
    // Si el producto tiene compras, MySQL no deja borrarlo (clave foránea).
    public function eliminarProducto($id) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("DELETE FROM RESENA WHERE id_producto = :id");
            $stmt->execute(['id' => $id]);
            $stmt = $this->db->prepare("DELETE FROM PRODUCTO WHERE id_producto = :id");
            $stmt->execute(['id' => $id]);
            $this->db->commit();
        } catch (\PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
