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
