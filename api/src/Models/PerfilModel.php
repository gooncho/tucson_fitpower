<?php
namespace App\Models;

class PerfilModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtener($idUsuario) {
        $stmt = $this->db->prepare(
            'SELECT u.nombre_usuario AS usuario,
                    u.email,
                    t.nombre_rol AS rol,
                    p.id_persona,
                    p.apellido,
                    p.fecha_nacimiento,
                    TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
                    p.altura,
                    p.especialidad,
                    p.sobre_mi,
                    (SELECT pr.peso
                    FROM PROGRESO AS pr
                    WHERE pr.id_persona = p.id_persona
                    ORDER BY pr.fecha DESC, pr.id_progreso DESC
                    LIMIT 1) AS peso,
                    (SELECT o.titulo
                    FROM OBJETIVO AS o 
                    WHERE o.id_persona = p.id_persona
                    ORDER BY o.id_objetivo DESC
                    LIMIT 1) AS objetivo
                FROM USUARIO AS u
                INNER JOIN TIPOUSUARIO AS t ON t.id_rol = u.id_rol
                INNER JOIN PERSONA AS p ON p.id_usuario = u.id_usuario
                WHERE u.id_usuario = :id
                LIMIT 1'
        );
        $stmt->execute(['id' => $idUsuario]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}