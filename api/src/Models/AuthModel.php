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
                'SELECT u.id_usuario, u.nombre_usuario, u.email, u.hash, u.id_rol, t.nombre_rol 
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
}