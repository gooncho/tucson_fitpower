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
                    WHERE t.nombre_rol = 'Entrenador' AND u.activo = 1
                    GROUP BY u.id_usuario, p.id_persona, u.nombre_usuario, u.email, p.apellido, p.especialidad";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }


    public function eliminarEntrenador($idUsuario) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT p.id_persona FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario INNER JOIN TIPOUSUARIO t ON t.id_rol = u.id_rol WHERE u.id_usuario = :id AND t.nombre_rol = 'Entrenador'");
            $stmt->execute(['id' => $idUsuario]);
            $idPersona = $stmt->fetchColumn();

            if (!$idPersona) {
                $this->db->rollBack();
                return false;
            }

            $stmt = $this->db->prepare('UPDATE PERSONA SET id_entrenador = NULL WHERE id_entrenador = :id');
            $stmt->execute(['id' => $idPersona]);
            $stmt = $this->db->prepare('DELETE FROM SUPERVISA WHERE id_entrenador = :id OR id_persona = :id');
            $stmt->execute(['id' => $idPersona]);
            $stmt = $this->db->prepare('DELETE FROM DETALLECOMPRA WHERE id_compra IN (SELECT id_compra FROM COMPRA WHERE id_persona = :id)');
            $stmt->execute(['id' => $idPersona]);

            foreach (['CREA', 'PROGRESO', 'OBJETIVO', 'OBTIENE', 'RESENA', 'ASISTENCIA', 'MENSAJE', 'ASIGNA'] as $tabla) {
                $stmt = $this->db->prepare('DELETE FROM ' . $tabla . ' WHERE id_persona = :id');
                $stmt->execute(['id' => $idPersona]);
            }

            $stmt = $this->db->prepare('DELETE FROM COMPRA WHERE id_persona = :id');
            $stmt->execute(['id' => $idPersona]);
            $stmt = $this->db->prepare('DELETE FROM PERSONA WHERE id_persona = :id');
            $stmt->execute(['id' => $idPersona]);
            $stmt = $this->db->prepare('DELETE FROM USUARIO WHERE id_usuario = :id');
            $stmt->execute(['id' => $idUsuario]);
            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
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
