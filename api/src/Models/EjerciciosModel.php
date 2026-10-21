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
}