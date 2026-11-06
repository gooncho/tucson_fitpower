<?php
namespace App\Controllers;

use App\Models\ObjetivoModel;

class ObjetivoController {
    private $model;

    public function __construct() {
        $this->model = new ObjetivoModel();
    }
    public function index() {
        try {
            $objetivos = $this->model->obtenerTodos();

            http_response_code(200);
            echo json_encode([
                "status" => "ok",
                "data" => $objetivos
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Error al obtener objetivos: " . $e->getMessage()
            ]);
        }
    }
    public function store() {
        $datos = json_decode(file_get_contents("php://input"), true);

        if (empty($datos['titulo']) || empty($datos['fecha_inicio']) || empty($datos['fecha_fin'])) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Los campos título, fecha de inicio y fecha fin son obligatorios."
            ]);
            return;
        }
        try {
            $idCreado = $this->model->crear($datos);
            http_response_code(201);
            echo json_encode([
                "status" => "ok",
                "message" => "Objetivo creado exitosamente",
                "id_objetivo" => $idCreado
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Error en la base de datos: " . $e->getMessage()
            ]);
        }
    }
}