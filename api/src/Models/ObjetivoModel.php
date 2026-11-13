<?php
/**
 * Consultas de objetivos del socio. Todas filtran por id_persona,
 * así cada socio solo accede a sus propios objetivos.
 */
namespace App\Models;

class ObjetivoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Objetivos del socio, del más nuevo al más viejo.
    public function obtenerPorPersona($idPersona) {
        $stmt = $this->db->prepare('SELECT id_objetivo, titulo, descripcion, estado, fecha_inicio, fecha_fin, porcentaje FROM OBJETIVO WHERE id_persona = :persona ORDER BY fecha_inicio DESC');
        $stmt->execute(['persona' => $idPersona]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // Borra el objetivo solo si es de ese socio. Devuelve cuántas filas borró.
    public function eliminar($idObjetivo, $idPersona) {
        $stmt = $this->db->prepare('DELETE FROM OBJETIVO WHERE id_objetivo = :id AND id_persona = :persona');
        $stmt->execute(['id' => $idObjetivo, 'persona' => $idPersona]);
        return $stmt->rowCount();
    }

    // Actualiza el objetivo. El porcentaje se limita entre 0 y 100.
    // Si no cambió nada, igual devuelve true cuando el objetivo existe.
    public function actualizar($idObjetivo, $idPersona, $datos) {
        $stmt = $this->db->prepare('UPDATE OBJETIVO SET titulo = :titulo, descripcion = :descripcion, estado = :estado, fecha_inicio = :inicio, fecha_fin = :fin, porcentaje = :porcentaje WHERE id_objetivo = :id AND id_persona = :persona');
        $stmt->execute([
            'titulo' => $datos['titulo'],
            'descripcion' => $datos['descripcion'] ?? null,
            'estado' => $datos['estado'] ?? 'En curso',
            'inicio' => $datos['fecha_inicio'],
            'fin' => $datos['fecha_fin'],
            'porcentaje' => max(0, min(100, (int) ($datos['porcentaje'] ?? 0))),
            'id' => $idObjetivo,
            'persona' => $idPersona
        ]);
        if ($stmt->rowCount() > 0) {
            return true;
        }
        $verificar = $this->db->prepare('SELECT COUNT(*) FROM OBJETIVO WHERE id_objetivo = :id AND id_persona = :persona');
        $verificar->execute(['id' => $idObjetivo, 'persona' => $idPersona]);
        return (int) $verificar->fetchColumn() > 0;
    }

    // Crea un objetivo y devuelve su id.
    public function crear($datos, $idPersona) {
        $stmt = $this->db->prepare('INSERT INTO OBJETIVO (id_persona, titulo, descripcion, estado, fecha_inicio, fecha_fin, porcentaje) VALUES (:persona, :titulo, :descripcion, :estado, :inicio, :fin, :porcentaje)');
        $stmt->execute([
            'persona' => $idPersona,
            'titulo' => $datos['titulo'],
            'descripcion' => $datos['descripcion'] ?? null,
            'estado' => $datos['estado'] ?? 'En curso',
            'inicio' => $datos['fecha_inicio'],
            'fin' => $datos['fecha_fin'],
            'porcentaje' => max(0, min(100, (int) ($datos['porcentaje'] ?? 0)))
        ]);
        return (int) $this->db->lastInsertId();
    }
}
