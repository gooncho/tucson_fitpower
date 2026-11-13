<?php
/**
 * Consultas para el Entrenador: sus socios y su agenda.
 */

namespace App\Models;

class SociosModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }
        // Socios asignados al entrenador, con su objetivo, plan y vencimiento.
        public function listar($idEntrenador = null) {
            $sql = 'SELECT  p.id_persona,
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
                    WHERE u.id_rol = 3';
            $params = [];

            if ($idEntrenador !== null) {
                $sql .= ' AND p.id_entrenador = :entrenador';
                $params['entrenador'] = $idEntrenador;
            }

            $sql .= ' ORDER BY p.id_persona';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        // id_persona del usuario logueado.
        public function buscarPersonaPorUsuario($idUsuario) {
            $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :id LIMIT 1');
            $stmt->execute(['id' =>  $idUsuario]);
            return $stmt->fetchColumn();
            }
            // Horarios del entrenador (SUPERVISA) ordenados de lunes a domingo y por hora,
            // con la última rutina asignada a cada socio. Solo cuentas activas.
            public function agenda($idEntrenador) {
            $stmt = $this->db->prepare(
                "SELECT s.id_persona,
                        u.nombre_usuario AS usuario,
                        p.apellido,
                        s.dia_semana,
                        TIME_FORMAT(s.hora_inicio, '%H:%i') AS hora_inicio,
                        TIME_FORMAT(s.hora_fin, '%H:%i') AS hora_fin,
                        (SELECT r.nombre
                         FROM ASIGNA AS a
                         INNER JOIN RUTINA AS r ON r.id_rutina = a.id_rutina
                         WHERE a.id_persona = p.id_persona
                         ORDER BY a.fecha_asignacion DESC
                         LIMIT 1) AS rutina
                FROM SUPERVISA AS s
                INNER JOIN PERSONA AS p ON p.id_persona = s.id_persona
                INNER JOIN USUARIO AS u ON u.id_usuario = p.id_usuario
                WHERE s.id_entrenador = :entrenador AND u.activo = 1
                ORDER BY FIELD(s.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
                         s.hora_inicio"
            );
            $stmt->execute(['entrenador' => $idEntrenador]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
}