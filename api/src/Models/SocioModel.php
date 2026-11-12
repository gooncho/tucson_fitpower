<?php
namespace App\Models;

class SocioModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerSocios() {
        $sql = "SELECT u.id_usuario, p.id_persona, u.nombre_usuario, u.email, u.activo, p.apellido, pl.nombre AS nombre_plan, p.fecha_inicio, p.fecha_fin, t.nombre_rol
                FROM USUARIO u
                INNER JOIN TIPOUSUARIO t ON u.id_rol = t.id_rol
                INNER JOIN PERSONA p ON u.id_usuario = p.id_usuario
                LEFT JOIN PLAN pl ON p.id_plan = pl.id_plan
                WHERE t.nombre_rol = 'Socio'";
        return $this->db->query($sql)->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function actualizarSocio($id, $datos) {
        $stmt = $this->db->prepare("UPDATE USUARIO u INNER JOIN TIPOUSUARIO t ON t.id_rol = u.id_rol
                                    SET u.nombre_usuario = :nombre, u.email = :email, u.activo = :activo
                                    WHERE u.id_usuario = :id AND t.nombre_rol = 'Socio'");
        $stmt->execute([
            'nombre' => $datos['nombre_usuario'],
            'email' => $datos['email'],
            'activo' => (int) $datos['activo'],
            'id' => $id
        ]);
        return $stmt->rowCount();
    }


    public function eliminarSocio($id) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT p.id_persona FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario INNER JOIN TIPOUSUARIO t ON t.id_rol = u.id_rol WHERE u.id_usuario = :id AND t.nombre_rol = 'Socio'");
            $stmt->execute(['id' => $id]);
            $idPersona = $stmt->fetchColumn();

            if (!$idPersona) {
                $this->db->rollBack();
                return false;
            }

            $stmt = $this->db->prepare('UPDATE PERSONA SET id_entrenador = NULL WHERE id_entrenador = :id');
            $stmt->execute(['id' => $idPersona]);
            $stmt = $this->db->prepare('DELETE FROM SUPERVISA WHERE id_persona = :id OR id_entrenador = :id');
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
            $stmt->execute(['id' => $id]);
            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function crearSocio($usuario, $apellido, $email, $password, $idPlan) {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO USUARIO (id_rol, nombre_usuario, email, hash) VALUES ((SELECT id_rol FROM TIPOUSUARIO WHERE nombre_rol = 'Socio'), :usuario, :email, :hash)");
            $stmt->execute(['usuario' => $usuario, 'email' => $email, 'hash' => $password]);
            $idUsuario = $this->db->lastInsertId();
            $inicio = $idPlan ? date('Y-m-d') : null;
            $fin = $idPlan ? date('Y-m-d', strtotime($idPlan == 3 ? '+3 month' : '+1 month')) : null;
            $stmt = $this->db->prepare("INSERT INTO PERSONA (id_usuario, id_plan, apellido, fecha_inicio, fecha_fin) VALUES (:usuario, :plan, :apellido, :inicio, :fin)");
            $stmt->execute(['usuario' => $idUsuario, 'plan' => $idPlan, 'apellido' => $apellido, 'inicio' => $inicio, 'fin' => $fin]);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
