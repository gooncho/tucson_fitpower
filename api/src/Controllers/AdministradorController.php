<?php
namespace App\Controllers;

class AdministradorController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function inicio() {
        header('Content-Type: application/json; charset=utf-8');
        if (($_SESSION['rol'] ?? '') !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }

        try {
            $datos = [];
            $datos['socios'] = (int) $this->db->query("SELECT COUNT(*) FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario WHERE u.id_rol = 3")->fetchColumn();
            $datos['entrenadores'] = (int) $this->db->query("SELECT COUNT(*) FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario WHERE u.id_rol = 2")->fetchColumn();
            $datos['ejercicios_disponibles'] = (int) $this->db->query("SELECT COUNT(*) FROM EJERCICIO WHERE activo = 1")->fetchColumn();
            $datos['membresias_activas'] = (int) $this->db->query("SELECT COUNT(*) FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario WHERE u.id_rol = 3 AND p.id_plan IS NOT NULL AND p.fecha_fin >= CURDATE()")->fetchColumn();
            $datos['ingresos_mes'] = (float) $this->db->query("SELECT COALESCE(SUM(dc.total), 0) FROM COMPRA c LEFT JOIN DETALLECOMPRA dc ON dc.id_compra = c.id_compra WHERE c.estado = 'Pagada' AND YEAR(c.fecha) = YEAR(CURDATE()) AND MONTH(c.fecha) = MONTH(CURDATE())")->fetchColumn();
            $datos['planes'] = $this->db->query("SELECT pl.nombre, COUNT(p.id_persona) AS cantidad FROM PLAN pl LEFT JOIN PERSONA p ON p.id_plan = pl.id_plan AND p.fecha_fin >= CURDATE() GROUP BY pl.id_plan, pl.nombre ORDER BY pl.nombre")->fetchAll(\PDO::FETCH_ASSOC);
            $datos['productos_bajo_stock'] = $this->db->query("SELECT nombre, stock FROM PRODUCTO WHERE stock < 20 ORDER BY stock ASC")->fetchAll(\PDO::FETCH_ASSOC);
            $datos['por_vencer'] = $this->db->query("SELECT u.nombre_usuario, p.apellido, pl.nombre AS plan, p.fecha_fin, DATEDIFF(p.fecha_fin, CURDATE()) AS dias FROM PERSONA p INNER JOIN USUARIO u ON u.id_usuario = p.id_usuario LEFT JOIN PLAN pl ON pl.id_plan = p.id_plan WHERE u.id_rol = 3 AND p.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) ORDER BY p.fecha_fin ASC")->fetchAll(\PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'ok', 'data' => $datos], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            error_log('Error en inicio administrador: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo cargar el resumen del administrador']);
        }
    }
}
