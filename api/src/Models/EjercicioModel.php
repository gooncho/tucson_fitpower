<?php
namespace App\Models;

class EjercicioModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerEjercicios() {
        try {
            $stmt = $this->db->prepare(
                'SELECT id_ejercicio, nombre, descripcion, nivel AS dificultad, grupo_muscular 
                 FROM EJERCICIO'
            );
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
}