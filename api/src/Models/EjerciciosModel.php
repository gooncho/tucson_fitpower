<?php

namespace App\Models;

class EjerciciosModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar($activos = true) {
        $stmt = $this->db->prepare(
            'SELECT id_ejercicio, nombre, descripcion, grupo_muscular, nivel
            FROM EJERCICIO
            WHERE activo = :activo
            ORDER BY nombre'
        );
        $stmt->execute(['activo' => $activos ? 1 : 0]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function crear($nombre, $grupo, $nivel, $descripcion) {
        $stmt = $this->db->prepare(
            'INSERT INTO EJERCICIO (nombre, descripcion, nivel, grupo_muscular)
            VALUES (:nombre, :descripcion, :nivel, :grupo)'
        );
        $stmt->execute([
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'nivel' => $nivel,
            'grupo' => $grupo,
        ]);
        return $this->db->lastInsertId();
    }

    public function existe($idEjercicio) {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM EJERCICIO WHERE id_ejercicio = :id');
        $stmt->execute(['id' => $idEjercicio]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function actualizar($idEjercicio, $nombre, $grupo, $nivel, $descripcion) {
        $stmt = $this->db->prepare(
            'UPDATE EJERCICIO
            SET nombre = :nombre,
                descripcion = :descripcion,
                nivel = :nivel,
                grupo_muscular = :grupo
            WHERE id_ejercicio = :id'
        );
        $stmt->execute([
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'nivel' => $nivel,
            'grupo' => $grupo,
            'id' => $idEjercicio,
        ]);
    }
    public function estaActivo($idEjercicio) {
        $stmt = $this->db->prepare('SELECT activo FROM EJERCICIO WHERE id_ejercicio = :id');
        $stmt->execute(['id' => $idEjercicio]);
        return (int) $stmt->fetchColumn() === 1;
    }

    public function cambiarEstado($idEjercicio, $activo) {
        $stmt = $this->db->prepare('UPDATE EJERCICIO SET activo = :activo WHERE id_ejercicio = :id');
        $stmt->execute(['activo' => $activo ? 1 : 0, 'id' => $idEjercicio]);
    }

    public function existeInactivoConNombre($nombre) {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM EJERCICIO WHERE activo = 0 AND LOWER(nombre) = LOWER(:nombre)'
        );
        $stmt->execute(['nombre' => $nombre]);
        return (int) $stmt->fetchColumn() > 0;
    }
}