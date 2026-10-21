<?php 

namespace App\Models;

class ResenaModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function productoExiste($idProducto) {
        $stmt = $this->db->prepare (
            'SELECT 1 FROM PRODUCTO WHERE id_producto = :id LIMIT 1'
        );
        $stmt->execute(['id' => $idProducto]);
        return (bool) $stmt->fetchColumn();
    }

    public function buscarPersonaPorUsuario($idUsuario) {
        $stmt = $this->db->prepare
        ('SELECT id_persona FROM PERSONA WHERE id_usuario = :id LIMIT 1');
        $stmt->execute(['id' => $idUsuario]);
        return $stmt->fetchColumn();
    }

    public function listarPorProducto($idProducto) {
        $stmt = $this->db->prepare(
            'SELECT u.nombre_usuario AS usuario,
                    r.puntuacion,
                    r.comentario,
                    r.fecha_publicacion AS fecha
            FROM RESENA r
            INNER JOIN PERSONA pe ON pe.id_persona = r.id_persona
            INNER JOIN USUARIO u ON u.id_usuario = pe.id_usuario
            WHERE r.id_producto = :id
            ORDER BY r.fecha_publicacion DESC, r.id_persona DESC');

            $stmt->execute(['id' => $idProducto]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    public function guardar($idProducto, $idPersona, $puntuacion, $comentario) {
        $stmt = $this->db->prepare(
            'INSERT INTO RESENA (id_producto, id_persona, fecha_publicacion, puntuacion, comentario)
            VALUES (:producto, :persona, :fecha, :puntuacion, :comentario)
            ON DUPLICATE KEY UPDATE
                fecha_publicacion = :fecha_u,
                puntuacion = :puntuacion_u,
                comentario = :comentario_u'
        );
        $hoy = date('Y-m-d');
        $stmt->execute([
            'producto' => $idProducto,
            'persona' => $idPersona,
            'fecha' => $hoy,
            'puntuacion' => $puntiacion,
            'comentario' => $comentario,
            'fecha_u' => $hoy,
            'puntuacion_u' => $puntiacion,
            'comentario_u' => $comentario
        ]);
    }
}