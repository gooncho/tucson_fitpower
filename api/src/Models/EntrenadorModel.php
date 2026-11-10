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
                        p.id_persona,
                        u.nombre_usuario, 
                        u.email, 
                        p.apellido, 
                        p.especialidad,
                        COUNT(DISTINCT s.id_persona) AS socios_asignados,
                        GROUP_CONCAT(DISTINCT s.dia_semana SEPARATOR ', ') AS dias,
                        TIME_FORMAT(MIN(s.hora_inicio), '%H:%i') AS hora_inicio,
                        TIME_FORMAT(MAX(s.hora_fin), '%H:%i') AS hora_fin,
                        'Activo' AS estado
                    FROM USUARIO u
                    INNER JOIN TIPOUSUARIO t ON u.id_rol = t.id_rol
                    INNER JOIN PERSONA p ON u.id_usuario = p.id_usuario
                    LEFT JOIN SUPERVISA s ON s.id_entrenador = p.id_persona
                    WHERE t.nombre_rol = 'Entrenador'
                    GROUP BY u.id_usuario, p.id_persona, u.nombre_usuario, u.email, p.apellido, p.especialidad";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }

    public function crearEntrenador($usuario, $apellido, $email, $password, $especialidad) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO USUARIO (id_rol, nombre_usuario, email, hash) VALUES (2, :usuario, :email, :hash)");
            $stmt->execute(['usuario' => $usuario, 'email' => $email, 'hash' => $password]);
            $idUsuario = $this->db->lastInsertId();

            $stmt = $this->db->prepare("INSERT INTO PERSONA (id_usuario, apellido, especialidad) VALUES (:usuario, :apellido, :especialidad)");
            $stmt->execute(['usuario' => $idUsuario, 'apellido' => $apellido, 'especialidad' => $especialidad ?: null]);

            $this->db->commit();
        } catch (\PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
