<?php
namespace App\Models;

class AuthModel {

    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function buscarPorUsuario($usuario) {

        try {
            $stmt = $this->db->prepare(
                'SELECT u.id_usuario, u.nombre_usuario, u.email, u.hash, u.activo, u.id_rol, t.nombre_rol 
                FROM USUARIO u
                INNER JOIN TIPOUSUARIO t 
                ON u.id_rol = t.id_rol
                WHERE u.nombre_usuario = :usuario
                LIMIT 1'
            );
            $stmt->execute([
                'usuario' => $usuario
            ]);
            return $stmt->fetch(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizarHash($idUsuario, $hash) {
        $stmt = $this->db->prepare('UPDATE USUARIO SET hash = :hash WHERE id_usuario = :id');
        $stmt->execute(['hash' => $hash, 'id' => $idUsuario]);
    }

    public function buscarDuplicado($usuario, $email) {
        $stmt = $this->db->prepare(
            'SELECT nombre_usuario, email
            FROM USUARIO 
            WHERE nombre_usuario = :usuario OR email = :email
            LIMIT 1'
        );
        $stmt->execute(['usuario' => $usuario, 'email' => $email]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function crearSocio($usuario, $email, $password) {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare('SELECT id_rol, nombre_rol FROM TIPOUSUARIO WHERE nombre_rol = :rol');
            $stmt->execute(['rol' => 'Socio']);
            $rol = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$rol) {
                throw new \Exception('No existe el rol Socio');
            }

            $stmt = $this->db->prepare(
                'INSERT INTO USUARIO (id_rol, nombre_usuario, email, hash)
                VALUES (:rol, :usuario, :email, :hash)'
            );

            $stmt->execute([
                'rol' => $rol['id_rol'],
                'usuario' => $usuario,
                'email' => $email,
                'hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);

            $idUsuario = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare('INSERT INTO PERSONA (id_usuario) VALUES (:id)');
            $stmt->execute(['id' => $idUsuario]);

            $this->db->commit();

            return [
                'id_usuario' => $idUsuario,
                'id_rol' => (int) $rol['id_rol'],
                'nombre_rol' => $rol['nombre_rol'],
            ];
        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}