<?php
namespace App\Models;

class CompraModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function buscarPersonaPorUsuario($idUsuario) {
        $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :id LIMIT 1');
        $stmt->execute(['id' => $idUsuario]);
        return (int) $stmt->fetchColumn();
    }

    public function crear($idPersona, $idProducto, $cantidad, $metodo) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('SELECT precio, stock FROM PRODUCTO WHERE id_producto = :id FOR UPDATE');
            $stmt->execute(['id' => $idProducto]);
            $producto = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$producto) {
                $this->db->rollBack();
                return ['ok' => false, 'motivo' => 'no_existe'];
            }
            if ((int) $producto['stock'] < $cantidad) {
                $this->db->rollBack();
                return ['ok' => false, 'motivo' => 'sin_stock', 'stock' => (int) $producto['stock']];
            }

            $stmt = $this->db->prepare(
                "INSERT INTO COMPRA (id_persona, fecha, metodo_pago, estado)
                VALUES (:persona, CURDATE(), :metodo, 'Pendiente')"
            );
            $stmt->execute(['persona' => $idPersona, 'metodo' => $metodo]);
            $idCompra = (int) $this->db->lastInsertId();

            $precio = (float) $producto['precio'];
            $stmt = $this->db->prepare(
                'INSERT INTO DETALLECOMPRA (id_compra, id_producto, total, precio_unitario, cantidad)
                VALUES (:compra, :producto, :total, :precio, :cantidad)'
            );
            $stmt->execute([
                'compra' => $idCompra,
                'producto' => $idProducto,
                'total' => $precio * $cantidad,
                'precio' => $precio,
                'cantidad' => $cantidad
            ]);

            $stmt = $this->db->prepare('UPDATE PRODUCTO SET stock = stock - :cantidad WHERE id_producto = :id');
            $stmt->execute(['cantidad' => $cantidad, 'id' => $idProducto]);

            $this->db->commit();
            return [
                'ok' => true,
                'id_compra' => $idCompra,
                'total' => $precio * $cantidad,
                'stock' => (int) $producto['stock'] - $cantidad
            ];
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}