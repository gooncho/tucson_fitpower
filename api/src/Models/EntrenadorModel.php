<?php
namespace App\Models;

class EntrenadorModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerEntrenadores() {
        try {
            $sql = "SELECT 
                        u.id_usuario, 
                        u.nombre_usuario, 
                        u.email, 
                        p.apellido, 
                        p.especialidad,
                        0 AS socios_asignados,
                        NULL AS dias,
                        NULL AS hora_inicio,
                        NULL AS hora_fin,
                        'Activo' AS estado
                    FROM USUARIO u
                    INNER JOIN TIPOUSUARIO t ON u.id_rol = t.id_rol
                    INNER JOIN PERSONA p ON u.id_usuario = p.id_usuario
                    WHERE t.nombre_rol = 'Entrenador'";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
}