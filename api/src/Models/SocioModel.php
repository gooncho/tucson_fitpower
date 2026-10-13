<?php
namespace App\Models;

class SocioModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerSocios() {
        try {
            $sql = "SELECT 
                        u.id_usuario, 
                        u.nombre_usuario, 
                        u.email, 
                        p.apellido, 
                        pl.nombre AS nombre_plan, 
                        p.fecha_inicio, 
                        p.fecha_fin,
                        t.nombre_rol
                    FROM USUARIO u
                    INNER JOIN TIPOUSUARIO t ON u.id_rol = t.id_rol
                    INNER JOIN PERSONA p ON u.id_usuario = p.id_usuario
                    LEFT JOIN PLAN pl ON p.id_plan = pl.id_plan
                    WHERE t.nombre_rol = 'Socio'";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
}