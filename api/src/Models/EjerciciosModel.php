<?php

namespace App\Models;

class EjerciciosModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $stmt = $this->db->prepare(
            'SELECT id_ejercicio, nombre, descripcion, grupo_muscular, nivel
            FROM EJERCICIO 
            ORDER BY nombre'
        );
        $stmt->execute();
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
}