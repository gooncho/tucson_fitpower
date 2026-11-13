<?php
/**
 * Perfil del usuario logueado (/api/perfil), para los tres roles.
 *
 * Ver los datos, editarlos (apellido, fecha de nacimiento, altura, especialidad
 * si es entrenador y "sobre mí") y subir la foto de perfil.
 */

namespace App\Controllers;

use App\Models\PerfilModel;

class PerfilController {
    private $modelo;

    public function __construct($db) {
        $this->modelo = new PerfilModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE); 
    }

    // GET /api/perfil: datos del usuario de la sesión.
    public function ver() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tienes que iniciar sesion']);
            return;
        }

        try {
            $perfil = $this->modelo->obtener((int) $_SESSION['usuario_id']);
            if (!$perfil) {
                $this->responder(404, ['status' => 'error', 'message' => 'Perfil no encontrado']);
                return;
            }

            $this->responder(200, ['status' => 'ok', 'data' => $perfil]);
        } catch (\Exception $e) {
            error_log('Error al cargar el perfil: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo cargar el perfil']);
        }
    }
    // PUT /api/perfil: valida cada campo antes de guardarlo.
    // La especialidad solo se guarda si el usuario es Entrenador.
    public function actualizar() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tienes que iniciar sesion']);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            $datos = [];
        }

        $apellido = trim((string) ($datos['apellido'] ?? ''));
        $fecha = trim((string) ($datos['fecha_nacimiento'] ?? ''));
        $altura = $datos['altura'] ?? null;
        $especialidad = trim((string) ($datos['especialidad'] ?? ''));
        $sobreMi = trim((string) ($datos['sobre_mi'] ?? ''));

        if ($apellido === '' || mb_strlen($apellido) > 50) {
            $this->responder(400, ['status' => 'error', 'message' => 'El apellido es obligatorio (máximo 50 caracteres)']);
            return;
        }

        if ($fecha !== '') {
            $f = \DateTime::createFromFormat('Y-m-d', $fecha);
            $valida = $f && $f->format('Y-m-d') === $fecha;
            if (!$valida || $f > new \DateTime('today') || (int) $f->format('Y') < 1900) {
                $this->responder(400, ['status' => 'error', 'message' => 'La fecha de nacimiento no es válida']);
                return;
            }
        }

        if ($altura === '' || $altura === null) {
            $altura = null;
        } else {
            $altura = (int) $altura;
            if ($altura < 50 || $altura > 250) {
                $this->responder(400, ['status' => 'error', 'message' => 'La altura debe estar entre 50 y 250 cm']);
                return;
            }
        }

        if (mb_strlen($especialidad) > 70) {
            $this->responder(400, ['status' => 'error', 'message' => 'La especialidad es muy larga (máximo 70 caracteres)']);
            return;
        }
        if (mb_strlen($sobreMi) > 500) {
            $this->responder(400, ['status' => 'error', 'message' => '"Sobre mí" admite hasta 500 caracteres']);
            return;
        }

        $limpios = [
            'apellido' => $apellido,
            'fecha_nacimiento' => $fecha === '' ? null : $fecha,
            'altura' => $altura,
            'especialidad' => $especialidad === '' ? null : $especialidad,
            'sobre_mi' => $sobreMi === '' ? null : $sobreMi,
        ];

        try {
            $esEntrenador = ($_SESSION['rol'] ?? '') === 'Entrenador';
            $this->modelo->actualizar((int) $_SESSION['usuario_id'], $limpios, $esEntrenador);
            $this->responder(200, ['status' => 'ok', 'message' => 'Perfil actualizado']);
        } catch (\Exception $e) {
            error_log('Error al actualizar el perfil: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo actualizar el perfil']);
        }
    }

    // POST /api/perfil/foto
    // Valida que sea una imagen real de hasta 2 MB, la guarda en assets/perfiles/
    // con un nombre armado por el servidor y borra la foto anterior.
    public function subirFoto() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder (401, ['status' => 'error', 'message' => 'Tienes que iniciar sesion']);
        return;
        }
        $idUsuario = (int) $_SESSION['usuario_id'];

        if (!isset($_FILES['foto'])) {
            $this->responder(400, ['status' => 'error', 'message' => 'No se recibió ninguna foto']);
            return;
        }
        $archivo = $_FILES['foto'];

        if ($archivo['error'] === UPLOAD_ERR_INI_SIZE || $archivo['size'] > 2 * 1024 * 1024) {
            $this->responder(400, ['status' => 'error', 'message' => 'La foto pesa más de 2 MB']);
            return;
        }

        $info = getimagesize($archivo['tmp_name']);
        $tipos = [IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg', IMAGETYPE_WEBP => 'webp'];
        if ($info === false || !isset($tipos[$info[2]])) {
            $this->responder(400, ['status' => 'error', 'message' => 'Solo se aceptan imágenes PNG, JPG o WEBP']);
            return;
        }

        $carpeta = __DIR__ . '/../../../front/dist/assets/perfiles/';
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0755, true);
        }

        $nombre = $idUsuario . '_' . time() . '.' . $tipos[$info[2]];
        
    try {
        $vieja = $this->modelo->fotoActual($idUsuario);

        if (!move_uploaded_file($archivo['tmp_name'], $carpeta . $nombre)) {
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar la foto']);
            return;
        }

        $this->modelo->guardarFoto($idUsuario, $nombre);

        if ($vieja && $vieja !== $nombre && is_file($carpeta . basename($vieja))) {
            unlink($carpeta . basename($vieja));
        }

            $this->responder(200, ['status' => 'ok', 'message' => 'Foto actualizada', 'foto' => $nombre]);
        } catch (\Exception $e) {
            if (is_file($carpeta . $nombre)) {
                unlink($carpeta . $nombre);
            }
            error_log('Error al subir foto de perfil: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar la foto']);
        }
    }
}   
