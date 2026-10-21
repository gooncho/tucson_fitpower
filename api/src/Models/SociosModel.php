<?php

namespace App\Models;

class SociosModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }
        public function listar() {
            $stmt = $this->db->prepare(
                'SELECT p.id_persona,
                u.nombre_usuario AS usuario,
                p.apellido,
                o.titulo AS objetivo,
                pl.nombre AS membresia,
                o.estado AS estado_objetivo,
                p.fecha_fin
                FROM PERSONA AS p
                INNER JOIN USUARIO AS u ON u.id_usuario = p.id_usuario
                LEFT JOIN PLAN AS pl ON pl.id_plan = p.id_plan
                LEFT JOIN OBJETIVO AS o ON o.id_persona = p.id_persona
                WHERE u.id_rol = 3
                ORDER BY p.id_persona'
            );
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
}