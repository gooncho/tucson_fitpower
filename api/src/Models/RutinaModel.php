<?php 

namespace App\Models;

Class RutinaModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $stmt = $this->db->prepare(
            'SELECT a.id_rutina,
                    a.id_persona,
                    r.nombre AS rutina,
                    u.nombre_usuario AS usuario,
                    p.apellido,
                    COUNT(d.id_ejercicio) AS total_ejercicios
                    FROM ASIGNA AS a
                    INNER JOIN RUTINA AS r ON r.id_rutina = a.id_rutina
                    INNER JOIN PERSONA AS p ON p.id_persona = a.id_persona
                    INNER JOIN USUARIO AS u ON u.id_usuario = p.id_usuario
                    LEFT JOIN DETALLERUTINA AS d ON d.id_rutina = r.id_rutina
                    GROUP BY a.id_rutina, a.id_persona, r.nombre, u.nombre_usuario, p.apellido
                    ORDER BY a.id_persona, a.id_rutina' 
        );
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function VerRutina($idRutina) {
        $stmt = $this->db->prepare(
            'SELECT e.nombre,
                    d.series,
                    d.repeticiones,
                    d.descanso
            FROM DETALLERUTINA AS d
            INNER JOIN EJERCICIO AS e ON e.id_ejercicio = d.id_ejercicio
            WHERE d.id_rutina = :id
            ORDER BY d.orden_ejercicios'
        );
        $stmt->execute(['id' => $idRutina]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}