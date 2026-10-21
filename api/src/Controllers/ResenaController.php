<?php

namespace App\Controllers;

use App\Models\ResenaModel;

class ResenaController {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new ResenaModel($db);

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
   
    public function index($idProducto) {
        $idProducto = (int) $idProducto;

        try {
            if (!$this->modelo->productoExiste($idProducto)) {
                $this->responder (404, ['status' => 'error', 'message' => 'Producto no encontrado']);
                return;
            }
            $filas = $this->modelo->listarPorProducto($idProducto);
            $distribucion = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            $suma = 0;
            $resenas = [];

            foreach ($filas as $f) {
                if ($f['puntuacion'] === null) {
                    continue;
                }
                $puntuacion = (float) $f['puntuacion'];
                $suma += $puntuacion;
                $distribucion[min(5, max(1, (int) round($puntuacion)))]++;

                $resenas[] = [
                    'usuario' => $f['usuario'],
                    'puntuacion' => $puntuacion,
                    'comentario' => (string) $f['comentario'],
                    'fecha' => $f['fecha'],
                ];
            }
            $total = count($resenas);
            $this->responder(200, [
                'status' => 'ok',
                'data' => [
                    'promedio' => $total > 0 ? round($suma / $total, 1) : 0,
                    'total' => $total,
                    'distribucion' => $distribucion,
                    'resenas' => $resenas,
                ],
            ]);
        }
        catch (\Exception $e) {
            error_log('Error la listar reseñas: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudieron cargar las reseñas']);
        }
    }

    public function store($idProducto) {
        $idProducto = (int) $idProducto;

        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tenes que iniciar sesión para escribir una reseña']);
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array ($datos)) {
            $datos = [];
        }

        $puntuacion = filter_var(
            $datos['puntuacion'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 5]]
        );

        $comentario = trim((string) ($datos['comentario'] ?? ''));
        if ($puntuacion === false) {
            $this->responder(400, ['status' => 'error', 'message' => 'Producto no encontrado']);
            return;
        }

        if ($comentario === '' || mb_strlen($comentario) > 500) {
            $this->responder(400,  ['status' => 'error', 'message' => 'El comentario es obligatorio (máximo 500 caracteres)']);
            return;
        }

        try {
        $idPersona = $this->modelo->buscarPersonaPorUsuario((int) $_SESSION['usuario_id']);
        if (!$idPersona) {
            $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene un perfil para escribir reseñas']);
            return;
        }
        $this->modelo->guardar($idProducto, (int) $idPersona, $puntuacion, $comentario);

        $this->responder(200, ['status' => 'ok', 'message' => 'Resena publicada']);
    }
        catch (\Exception $e) {
            error_log('Error al guardar reseña: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar la reseña']);
        }
    }
}