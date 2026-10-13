<?php
namespace App\Models;

class PagoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerPagos() {
        try {
            $sql = "SELECT 
                        c.id_compra AS id_pago,
                        u.nombre_usuario,
                        c.fecha,
                        'Productos' AS razon,
                        COALESCE(SUM(dc.total), 0) AS monto,
                        c.estado
                    FROM COMPRA c
                    INNER JOIN PERSONA p ON c.id_persona = p.id_persona
                    INNER JOIN USUARIO u ON p.id_usuario = u.id_usuario
                    LEFT JOIN DETALLECOMPRA dc ON c.id_compra = dc.id_compra
                    GROUP BY c.id_compra, u.nombre_usuario, c.fecha, c.estado";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
}