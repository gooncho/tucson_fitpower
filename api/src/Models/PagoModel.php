<?php
namespace App\Models;

class PagoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerPagos() {
        $sql = "SELECT c.id_compra AS id_pago, u.nombre_usuario, c.fecha, 'Productos' AS razon, COALESCE(SUM(dc.total), 0) AS monto, c.estado
                FROM COMPRA c
                INNER JOIN PERSONA p ON c.id_persona = p.id_persona
                INNER JOIN USUARIO u ON p.id_usuario = u.id_usuario
                LEFT JOIN DETALLECOMPRA dc ON c.id_compra = dc.id_compra
                GROUP BY c.id_compra, u.nombre_usuario, c.fecha, c.estado
                ORDER BY c.fecha DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function actualizarEstado($id, $estado) {
        $stmt = $this->db->prepare("UPDATE COMPRA SET estado = :estado WHERE id_compra = :id");
        $stmt->execute(['estado' => $estado, 'id' => $id]);
        return $stmt->rowCount();
    }

    public function existe($id) {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM COMPRA WHERE id_compra = :id");
        $stmt->execute(['id' => $id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
