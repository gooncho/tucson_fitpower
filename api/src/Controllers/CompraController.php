<?php
namespace App\Controllers;

use App\Models\CompraModel;

class CompraController {
    private $modelo;
    const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia'];

    public function __construct($db) {
        $this->modelo = new CompraModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    public function crear() {
        if (empty($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Socio') {
            $this->responder(403, ['status' => 'error', 'message' => 'Solo los socios pueden comprar']);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $datos = is_array($datos) ? $datos : [];
        $idProducto = (int) ($datos['id_producto'] ?? 0);
        $cantidad = filter_var($datos['cantidad'] ?? null, FILTER_VALIDATE_INT);
        $metodo = (string) ($datos['metodo_pago'] ?? '');

        if ($idProducto <= 0 || $cantidad === false || $cantidad < 1 || $cantidad > 10) {
            $this->responder(400, ['status' => 'error', 'message' => 'La cantidad tiene que ser entre 1 y 10']);
            return;
        }
        if (!in_array($metodo, self::METODOS, true)) {
            $this->responder(400, ['status' => 'error', 'message' => 'Elegí un método de pago válido']);
            return;
        }

        try {
            $idPersona = $this->modelo->buscarPersonaPorUsuario((int) $_SESSION['usuario_id']);
            if (!$idPersona) {
                $this->responder(403, ['status' => 'error', 'message' => 'Tu usuario no tiene un perfil asociado']);
                return;
            }

            $r = $this->modelo->crear($idPersona, $idProducto, $cantidad, $metodo);

            if (!$r['ok'] && $r['motivo'] === 'no_existe') {
                $this->responder(404, ['status' => 'error', 'message' => 'Producto no encontrado']);
                return;
            }
            if (!$r['ok']) {
                $this->responder(409, [
                    'status' => 'error',
                    'message' => $r['stock'] > 0 ? 'Solo quedan ' . $r['stock'] . ' unidades' : 'Sin stock',
                    'stock' => $r['stock']
                ]);
                return;
            }

            $this->responder(201, [
                'status' => 'ok',
                'message' => 'Compra reservada',
                'data' => ['id_compra' => $r['id_compra'], 'total' => $r['total'], 'stock' => $r['stock']]
            ]);
        } catch (\Throwable $e) {
            error_log('Error al crear la compra: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo registrar la compra']);
        }
    }
}