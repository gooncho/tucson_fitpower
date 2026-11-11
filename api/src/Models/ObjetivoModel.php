<?php
namespace App\Models;

class ObjetivoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerPorPersona($idPersona) {
        $stmt = $this->db->prepare('SELECT id_objetivo, titulo, descripcion, estado, fecha_inicio, fecha_fin FROM OBJETIVO WHERE id_persona = :persona ORDER BY fecha_inicio DESC');
        $stmt->execute(['persona' => $idPersona]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function eliminar($idObjetivo, $idPersona) {
        $stmt = $this->db->prepare('DELETE FROM OBJETIVO WHERE id_objetivo = :id AND id_persona = :persona');
        $stmt->execute(['id' => $idObjetivo, 'persona' => $idPersona]);
        return $stmt->rowCount();
    }

    public function crear($datos, $idPersona) {
        $stmt = $this->db->prepare('INSERT INTO OBJETIVO (id_persona, titulo, descripcion, estado, fecha_inicio, fecha_fin) VALUES (:persona, :titulo, :descripcion, :estado, :inicio, :fin)');
        $stmt->execute([
            'persona' => $idPersona,
            'titulo' => $datos['titulo'],
            'descripcion' => $datos['descripcion'] ?? null,
            'estado' => $datos['estado'] ?? 'En curso',
            'inicio' => $datos['fecha_inicio'],
            'fin' => $datos['fecha_fin']
        ]);
        return (int) $this->db->lastInsertId();
    }
}
