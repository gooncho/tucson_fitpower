<?php
/**
 * Panel del Socio: todas las pantallas de datos propios.
 *
 * Rutinas asignadas, historial de entrenamientos, membresía, progreso, logros,
 * peso, asistencia e inicio. Cada función obtiene el socio desde la sesión,
 * así cada uno ve solo sus datos.
 */
namespace App\Controllers;

class SocioDashboardController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // id_persona del socio logueado (0 si no hay sesión o no es Socio).
    private function personaActual() {
        if (empty($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Socio') {
            return 0;
        }
        $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :usuario');
        $stmt->execute(['usuario' => $_SESSION['usuario_id']]);
        return (int) $stmt->fetchColumn();
    }

    // Responde {status: ok, data} o 403 si no hay un socio logueado.
    private function responder($data) {
        if (!$this->personaActual()) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return false;
        }
        echo json_encode(['status' => 'ok', 'data' => $data], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // GET /api/mis-rutinas: rutinas asignadas al socio.
    // es_propia = 1 si la creó él (así el front sabe a cuáles mostrarles "Editar").
    public function rutinas() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare(
            'SELECT r.id_rutina, r.nombre, r.descripcion,
                    COUNT(d.id_ejercicio) AS cantidad_ejercicios,
                    EXISTS(SELECT 1 FROM CREA c WHERE c.id_rutina = r.id_rutina AND c.id_persona = :creador) AS es_propia
            FROM ASIGNA a
            INNER JOIN RUTINA r ON r.id_rutina = a.id_rutina
            LEFT JOIN DETALLERUTINA d ON d.id_rutina = r.id_rutina
            WHERE a.id_persona = :persona
            GROUP BY r.id_rutina, r.nombre, r.descripcion
            ORDER BY a.fecha_asignacion DESC'
        );
        $stmt->execute(['persona' => $id, 'creador' => $id]);
        $this->responder($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // GET /api/entrenamientos: historial de entrenamientos.
    // Une los entrenamientos guardados (ENTRENAMIENTO_REALIZADO) con las asistencias
    // viejas que no tienen entrenamiento registrado ese día.
    public function entrenamientos() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare("SELECT DATE_FORMAT(e.fecha, '%Y-%m-%d') AS fecha, r.nombre AS rutina, CONCAT(e.duracion, ' min') AS duracion, 'Completado' AS estado FROM ENTRENAMIENTO_REALIZADO e INNER JOIN RUTINA r ON r.id_rutina = e.id_rutina WHERE e.id_persona = :persona
            UNION ALL
            SELECT DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha, 'Rutina no registrada' AS rutina, CASE WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL THEN CONCAT(TIMESTAMPDIFF(MINUTE, a.hora_entrada, a.hora_salida), ' min') ELSE 'Sin duración' END AS duracion, 'Completado' AS estado FROM ASISTENCIA a WHERE a.id_persona = :persona_antigua AND NOT EXISTS (SELECT 1 FROM ENTRENAMIENTO_REALIZADO e WHERE e.id_persona = a.id_persona AND DATE(e.fecha) = a.fecha) ORDER BY fecha DESC");
        $stmt->execute(['persona' => $id, 'persona_antigua' => $id]);
        $this->responder($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // POST /api/entrenamientos/completar
    // Guarda un entrenamiento terminado (rutina y minutos). La rutina tiene
    // que estar asignada al socio.
    public function completarEntrenamiento() {
        $idPersona = $this->personaActual();
        if (!$idPersona) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $idRutina = (int) ($datos['id_rutina'] ?? 0);
        $duracion = (int) ($datos['duracion'] ?? 0);

        if ($idRutina <= 0 || $duracion < 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Datos del entrenamiento inválidos']);
            return;
        }

        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASIGNA WHERE id_persona = :persona AND id_rutina = :rutina');
            $stmt->execute(['persona' => $idPersona, 'rutina' => $idRutina]);
            if ((int) $stmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['status' => 'error', 'message' => 'La rutina no está asignada a tu usuario']);
                return;
            }

            $stmt = $this->db->prepare('INSERT INTO ENTRENAMIENTO_REALIZADO (id_persona, id_rutina, fecha, duracion) VALUES (:persona, :rutina, NOW(), :duracion)');
            $stmt->execute(['persona' => $idPersona, 'rutina' => $idRutina, 'duracion' => $duracion]);
            echo json_encode(['status' => 'ok', 'message' => 'Entrenamiento guardado']);
        } catch (\Throwable $e) {
            error_log('Error al guardar entrenamiento: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar el entrenamiento']);
        }
    }

    // GET /api/membresia: plan actual, fechas y estado (Activa, Vencida o Sin membresía).
    public function membresia() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare("SELECT pl.nombre AS nombre_plan, pl.precio, pl.duracion, pl.descripcion, p.fecha_inicio, p.fecha_fin, CASE WHEN p.id_plan IS NULL THEN 'Sin membresía' WHEN p.fecha_fin >= CURDATE() THEN 'Activa' ELSE 'Vencida' END AS estado FROM PERSONA p LEFT JOIN PLAN pl ON pl.id_plan = p.id_plan WHERE p.id_persona = :persona");
        $stmt->execute(['persona' => $id]);
        $this->responder($stmt->fetch(\PDO::FETCH_ASSOC) ?: []);
    }

    // GET /api/progreso: última medición, asistencias, racha, rutinas y objetivo actual.
    public function progreso() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare('SELECT peso, fecha, racha_actual, masa_muscular, masa_magra, grasa, observaciones FROM PROGRESO WHERE id_persona = :persona ORDER BY fecha DESC, id_progreso DESC LIMIT 1');
        $stmt->execute(['persona' => $id]);
        $medicion = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        $stmt = $this->db->prepare('SELECT fecha_nacimiento, altura FROM PERSONA WHERE id_persona = :persona');
        $stmt->execute(['persona' => $id]);
        $datosFisicos = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        $edad = null;
        if (!empty($datosFisicos['fecha_nacimiento'])) {
            $nacimiento = new \DateTime($datosFisicos['fecha_nacimiento']);
            $edad = $nacimiento->diff(new \DateTime('today'))->y;
        }
        $altura = !empty($datosFisicos['altura']) ? (float) $datosFisicos['altura'] : null;
        $stmt = $this->db->prepare('SELECT peso, fecha FROM PROGRESO WHERE id_persona = :persona AND peso IS NOT NULL ORDER BY fecha DESC, id_progreso DESC LIMIT 1');
        $stmt->execute(['persona' => $id]);
        $ultimaMedicionPeso = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        $stmt = $this->db->prepare('SELECT id_progreso, fecha, peso, masa_muscular, masa_magra, grasa, observaciones FROM PROGRESO WHERE id_persona = :persona ORDER BY fecha DESC, id_progreso DESC LIMIT 20');
        $stmt->execute(['persona' => $id]);
        $historialProgreso = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASIGNA WHERE id_persona = :persona');
        $stmt->execute(['persona' => $id]);
        $rutinas = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASISTENCIA WHERE id_persona = :persona AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)');
        $stmt->execute(['persona' => $id]);
        $asistenciasSemana = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT COUNT(DISTINCT fecha) FROM ASISTENCIA WHERE id_persona = :persona AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())');
        $stmt->execute(['persona' => $id]);
        $asistenciasMes = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT DISTINCT DATE_FORMAT(fecha, "%Y-%m-%d") AS fecha FROM ASISTENCIA WHERE id_persona = :persona ORDER BY fecha DESC');
        $stmt->execute(['persona' => $id]);
        $fechasAsistencia = array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'fecha');
        $stmt = $this->db->prepare("SELECT titulo, descripcion, estado FROM OBJETIVO WHERE id_persona = :persona ORDER BY fecha_inicio DESC LIMIT 1");
        $stmt->execute(['persona' => $id]);
        $objetivo = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        $racha = $this->calcularRacha($id);
        $this->responder([
            'peso_actual' => $ultimaMedicionPeso['peso'] ?? null,
            'fecha_medicion' => $ultimaMedicionPeso['fecha'] ?? null,
            'racha' => $racha,
            'masa_muscular' => $medicion['masa_muscular'] ?? null,
            'masa_magra' => $medicion['masa_magra'] ?? null,
            'grasa' => $medicion['grasa'] ?? null,
            'edad' => $edad,
            'altura' => $altura,
            'observaciones' => $medicion['observaciones'] ?? null,
            'historial_progreso' => $historialProgreso,
            'asistencias_semana' => $asistenciasSemana,
            'asistencias_mes' => $asistenciasMes,
            'fechas_asistencia' => $fechasAsistencia,
            'rutinas_totales' => $rutinas,
            'objetivo' => $objetivo,
            'porcentaje_cumplimiento' => $objetivo && strtolower($objetivo['estado'] ?? '') === 'completado' ? 100 : 0
        ]);
    }


    // Cuenta cuántos días seguidos fue al gimnasio, contando hacia atrás desde la
    // última asistencia. Si la última fue antes de ayer, la racha es 0.
    private function calcularRacha($idPersona) {
        $stmt = $this->db->prepare('SELECT DISTINCT fecha FROM ASISTENCIA WHERE id_persona = :persona ORDER BY fecha DESC');
        $stmt->execute(['persona' => $idPersona]);
        $fechas = $stmt->fetchAll(\PDO::FETCH_COLUMN);
        if (!$fechas) return 0;

        $hoy = new \DateTime(date('Y-m-d'));
        $ultima = new \DateTime($fechas[0]);
        $diferencia = (int) $ultima->diff($hoy)->days;
        if ($diferencia < 0 || $diferencia > 1) return 0;

        $racha = 0;
        $esperada = clone $ultima;
        foreach ($fechas as $fecha) {
            $actual = new \DateTime($fecha);
            if ($actual->format('Y-m-d') !== $esperada->format('Y-m-d')) break;
            $racha++;
            $esperada->modify('-1 day');
        }
        return $racha;
    }

    // POST /api/progreso/peso: registra el peso de hoy (entre 0 y 500 kg).
    public function guardarPeso() {
        $id = $this->personaActual();
        if (!$id) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        $peso = $datos['peso'] ?? null;
        if (!is_numeric($peso) || (float) $peso <= 0 || (float) $peso > 500) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Ingresá un peso válido']);
            return;
        }
        try {
            $stmt = $this->db->prepare('INSERT INTO PROGRESO (id_persona, fecha, peso) VALUES (:persona, CURDATE(), :peso)');
            $stmt->execute(['persona' => $id, 'peso' => (float) $peso]);
            echo json_encode(['status' => 'ok', 'message' => 'Peso registrado']);
        } catch (\Throwable $e) {
            error_log('Error al guardar peso: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar el peso']);
        }
    }

    public function guardarMedicion() {
        $id = $this->personaActual();
        if (!$id) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        $peso = $datos['peso'] ?? null;
        $observaciones = trim((string) ($datos['observaciones'] ?? ''));

        if (!is_numeric($peso) || (float) $peso <= 0 || (float) $peso > 500) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Ingresá un peso válido']);
            return;
        }

        if (mb_strlen($observaciones) > 2000) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Las observaciones no pueden superar los 2000 caracteres']);
            return;
        }

        try {
            $stmt = $this->db->prepare('SELECT fecha_nacimiento, altura FROM PERSONA WHERE id_persona = :persona');
            $stmt->execute(['persona' => $id]);
            $perfil = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$perfil || empty($perfil['fecha_nacimiento']) || empty($perfil['altura'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Completá tu fecha de nacimiento y altura en Perfil para calcular tus mediciones']);
                return;
            }

            $nacimiento = new \DateTime($perfil['fecha_nacimiento']);
            $edad = $nacimiento->diff(new \DateTime('today'))->y;
            $altura = (float) $perfil['altura'] / 100;
            $peso = (float) $peso;
            $imc = $peso / ($altura * $altura);
            $grasa = (1.2 * $imc) + (0.23 * $edad) - 10.8 - 5.4;

            if ($grasa < 0 || $grasa > 100) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Los datos ingresados no permiten calcular un porcentaje de grasa válido. Revisá tu peso, altura y fecha de nacimiento']);
                return;
            }

            $grasa = round($grasa, 2);
            $masaMagra = round($peso * (1 - ($grasa / 100)), 2);

            $stmt = $this->db->prepare('INSERT INTO PROGRESO (id_persona, fecha, peso, masa_magra, grasa, observaciones) VALUES (:persona, CURDATE(), :peso, :masa_magra, :grasa, :observaciones)');
            $stmt->execute([
                'persona' => $id,
                'peso' => $peso,
                'masa_magra' => $masaMagra,
                'grasa' => $grasa,
                'observaciones' => $observaciones !== '' ? $observaciones : null
            ]);

            echo json_encode([
                'status' => 'ok',
                'message' => 'Medición guardada',
                'data' => [
                    'imc' => round($imc, 2),
                    'grasa' => $grasa,
                    'masa_magra' => $masaMagra
                ]
            ]);
        } catch (\Throwable $e) {
            error_log('Error al guardar medición: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar la medición']);
        }
    }

    // POST /api/asistencia: marca la asistencia de hoy (una sola vez por día).
    public function marcarAsistencia() {
        $id = $this->personaActual();
        if (!$id) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASISTENCIA WHERE id_persona = :persona AND fecha = CURDATE()');
            $stmt->execute(['persona' => $id]);
            if ((int) $stmt->fetchColumn() > 0) {
                echo json_encode(['status' => 'ok', 'message' => 'La asistencia de hoy ya está registrada']);
                return;
            }
            $stmt = $this->db->prepare('INSERT INTO ASISTENCIA (id_persona, fecha, hora_entrada) VALUES (:persona, CURDATE(), CURTIME())');
            $stmt->execute(['persona' => $id]);
            echo json_encode(['status' => 'ok', 'message' => 'Asistencia registrada']);
        } catch (\Throwable $e) {
            error_log('Error al marcar asistencia: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo registrar la asistencia']);
        }
    }

    // DELETE /api/mis-rutinas/:id: quita la rutina de la lista del socio.
    public function eliminarRutina($idRutina) {
        $idPersona = $this->personaActual();
        if (!$idPersona) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
            return;
        }
        try {
            $stmt = $this->db->prepare('DELETE FROM ASIGNA WHERE id_rutina = :rutina AND id_persona = :persona');
            $stmt->execute(['rutina' => (int) $idRutina, 'persona' => $idPersona]);
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'La rutina no está asignada a tu usuario']);
                return;
            }
            echo json_encode(['status' => 'ok', 'message' => 'Rutina eliminada de tu lista']);
        } catch (\Throwable $e) {
            error_log('Error al quitar rutina del socio: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo eliminar la rutina']);
        }
    }

    // GET /api/logros: logros que obtuvo el socio.
    public function logros() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare('SELECT l.nombre, l.descripcion, l.icono, o.fecha_obtenido FROM OBTIENE o INNER JOIN LOGRO l ON l.id_logro = o.id_logro WHERE o.id_persona = :persona ORDER BY o.fecha_obtenido DESC');
        $stmt->execute(['persona' => $id]);
        $this->responder($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // GET /api/inicio-socio: datos resumidos para la pantalla de inicio del socio.
    public function inicio() {
        $id = $this->personaActual();
        if (!$id) { $this->responder(null); return; }
        $stmt = $this->db->prepare('SELECT racha_actual FROM PROGRESO WHERE id_persona = :persona ORDER BY fecha DESC LIMIT 1');
        $stmt->execute(['persona' => $id]);
        $racha = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASISTENCIA WHERE id_persona = :persona AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)');
        $stmt->execute(['persona' => $id]);
        $semana = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASISTENCIA WHERE id_persona = :persona AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())');
        $stmt->execute(['persona' => $id]);
        $mes = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('SELECT r.id_rutina, r.nombre FROM ASIGNA a INNER JOIN RUTINA r ON r.id_rutina = a.id_rutina WHERE a.id_persona = :persona ORDER BY a.fecha_asignacion DESC LIMIT 1');
        $stmt->execute(['persona' => $id]);
        $rutina = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        $stmt = $this->db->prepare('SELECT pl.nombre, p.fecha_fin FROM PERSONA p LEFT JOIN PLAN pl ON pl.id_plan = p.id_plan WHERE p.id_persona = :persona');
        $stmt->execute(['persona' => $id]);
        $plan = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        $stmt = $this->db->prepare('SELECT l.nombre, l.descripcion, l.icono FROM OBTIENE o INNER JOIN LOGRO l ON l.id_logro = o.id_logro WHERE o.id_persona = :persona ORDER BY o.fecha_obtenido DESC');
        $stmt->execute(['persona' => $id]);
        $logros = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt = $this->db->prepare('SELECT hora_entrada, hora_salida, fecha FROM ASISTENCIA WHERE id_persona = :persona ORDER BY fecha DESC LIMIT 1');
        $stmt->execute(['persona' => $id]);
        $ultima = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        $duracion = null;
        if (!empty($ultima['hora_entrada']) && !empty($ultima['hora_salida'])) {
            $duracion = (int) ((strtotime($ultima['hora_salida']) - strtotime($ultima['hora_entrada'])) / 60);
        }
        $this->responder([
            'entrenamientos_semana' => $semana,
            'asistencia_mes' => $mes,
            'racha' => $racha,
            'total_logros' => count($logros),
            'progreso_general' => min(100, (int) round($semana / 5 * 100)),
            'rutina' => $rutina,
            'dia_entrenamiento' => $ultima['fecha'] ?? null,
            'duracion' => $duracion,
            'plan' => $plan['nombre'] ?? null,
            'fecha_fin' => $plan['fecha_fin'] ?? null,
            'logros' => $logros
        ]);
    }
}
