<?php
/**
 * Gestión de ejercicios para Entrenador y Administrador (/api/ejercicio).
 *
 * Permite listar, crear, editar, subir imagen, desactivar y reactivar.
 * Los ejercicios no se borran de la base: se desactivan (columna activo = 0)
 * para que las rutinas que ya los usan no se rompan.
 */
namespace App\Controllers;

use App\Models\EjerciciosModel;

class EjerciciosController {

    const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

    private $modelo;

    public function __construct($db) {
        $this->modelo = new EjerciciosModel($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // Envía la respuesta JSON con el código HTTP indicado.
    private function responder($codigo, $payload) {
        http_response_code($codigo);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

     // Solo pueden entrar usuarios logueados con rol Entrenador o Administrador.
     private function accesoPermitido() {
        if (empty($_SESSION['usuario_id'])) {
            $this->responder(401, ['status' => 'error', 'message' => 'Tenes que iniciar sesion']);
            return false;
        }
        $rol = strtolower(trim((string) ($_SESSION['rol'] ?? '')));
        if (!in_array($rol, ['entrenador', 'administrador'], true)) {
            $this->responder(403, ['status' => 'error', 'message' => 'No tenes permiso para hacer esto']);
            return false;
        }
        return true;
    }
     // GET /api/ejercicio  (o ?estado=inactivos para ver los desactivados)
     public function index() {
        if (!$this->accesoPermitido()) {
            return;
        }

        try {
            $activos = ($_GET['estado'] ?? '') !== 'inactivos';
            $this->responder(200, ['status' => 'ok', 'data' => $this->modelo->listar($activos)]);
        } catch (\Exception $e) {
            error_log('Error al listar ejercicios: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudieron cargar los ejercicios']);
        }
    }
    
    // Lee y valida el JSON del formulario (nombre, grupo muscular, nivel y descripción).
    // Devuelve null y responde 400 si algo no es válido.
    private function leerDatos() {
        $datos = json_decode(file_get_contents('php://input'), true); 
        if (!is_array($datos)) {
            $datos = [];
        }
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $grupo = trim((string) ($datos['grupo_muscular'] ?? ''));
        $nivel = trim((string)($datos['nivel'] ?? ''));
        $descripcion = trim((string) ($datos['descripcion'] ?? '')); 

        if($nombre === '' || mb_strlen($nombre) > 50) {
            $this->responder(400, ['status' => 'error', 'message' => 'El nombre es obligatorio']);
            return null;
        }

        if ($grupo === '' || mb_strlen($grupo) > 70) {
        $this->responder(400, ['status' => 'error', 'message' => 'El grupo muscular es obligatorio']);
        return null;
        }

        if (!in_array($nivel, self::NIVELES, true)) {
        $this->responder(400, ['status' => 'error', 'message' => 'El nivel no es valido']);
        return null;
        }
        
        return [
            'nombre' => $nombre,
            'grupo' => $grupo,
            'nivel' => $nivel,
            'descripcion' => $descripcion === '' ? null : $descripcion,
        ];
    }

    // POST /api/ejercicio: crea un ejercicio.
    // Si ya existe uno desactivado con el mismo nombre, pide reactivarlo en vez de duplicarlo.
    public function store() {
        if(!$this->accesoPermitido()) {
            return;
        }
        $d = $this->leerDatos();
        if ($d === null) {
            return;
        }

        try {
            if ($this->modelo->existeInactivoConNombre($d['nombre'])) {
                $this->responder(409, [
                    'status' => 'error',
                    'message' => 'Ya existe un ejercicio desactivado con ese nombre. Reactivalo desde "Desactivados".'
                ]);
                return;
            }
            $id = $this->modelo->crear($d['nombre'], $d['grupo'], $d['nivel'], $d['descripcion']);
            $this->responder(201, ['status' => 'ok', 'message' => 'Ejercicio creado', 'id' => (int) $id]);
        } catch (\Exception $e) {
            error_log('Error al crear ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar el ejercicio']);
        }
    }

    // PUT /api/ejercicio/:id: edita un ejercicio existente.
    public function update($idEjercicio) {
        if (!$this->accesoPermitido()) {
            return;
        }
        $idEjercicio = (int) $idEjercicio;
        $d = $this->leerDatos();
        if ($d === null) {
            return;
        }

        try {
            if ($idEjercicio <= 0 || !$this->modelo->existe($idEjercicio)) {
                $this->responder(404, ['status' => 'error', 'message' => 'Ejercicio no encontrado']);
                return;
            }
            $this->modelo->actualizar($idEjercicio, $d['nombre'], $d['grupo'], $d['nivel'], $d['descripcion']);
            $this->responder(200, ['status' => 'ok', 'message' => 'Ejercicio actualizado']);
        } catch (\Exception $e) {
            error_log('Error al actualizar ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo actualizar el ejercicio']);
        }
    }

    // POST /api/ejercicio/:id/imagen
    // Guarda la imagen como front/dist/assets/Ejercicios/{id}.png|jpg|webp.
    // Se valida que sea una imagen real (getimagesize) y que pese hasta 2 MB;
    // el nombre del archivo lo arma el servidor, nunca el usuario.
    public function subirImagen($idEjercicio) {
        if (!$this->accesoPermitido()) {
            return;
        }
        $idEjercicio = (int) $idEjercicio;

        try {
            if ($idEjercicio <= 0 || !$this->modelo->existe($idEjercicio)) {
                $this->responder(404, ['status' => 'error', 'message' => 'Ejercicio no encontrado']);
                return;
            }

            if (!isset($_FILES['imagen'])) {
                $this->responder(400, ['status' => 'error', 'message' => 'No se recibió ninguna imagen']);
                return;
            }
            $archivo = $_FILES['imagen'];

            if ($archivo['error'] === UPLOAD_ERR_INI_SIZE || $archivo['size'] > 2 * 1024 * 1024) {
                $this->responder(400, ['status' => 'error', 'message' => 'La imagen pesa más de 2 MB']);
                return;
            }
            if ($archivo['error'] !== UPLOAD_ERR_OK) {
                $this->responder(400, ['status' => 'error', 'message' => 'No se pudo subir la imagen']);
                return;
            }
            $info = getimagesize($archivo['tmp_name']);
            $tipos = [
                IMAGETYPE_PNG  => 'png',
                IMAGETYPE_JPEG => 'jpg',
                IMAGETYPE_WEBP => 'webp',
            ];
            if ($info === false || !isset($tipos[$info[2]])) {
                $this->responder(400, ['status' => 'error', 'message' => 'Solo se aceptan imágenes PNG, JPG o WEBP']);
                return;
            }
            $extension = $tipos[$info[2]];

            $carpeta = __DIR__ . '/../../../front/dist/assets/Ejercicios/';
            foreach ($tipos as $ext) {
                $vieja = $carpeta . $idEjercicio . '.' . $ext;
                if (file_exists($vieja)) {
                    unlink($vieja);
                }
            }

            if (!move_uploaded_file($archivo['tmp_name'], $carpeta . $idEjercicio . '.' . $extension)) {
                $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar la imagen']);
                return;
            }

            $this->responder(200, ['status' => 'ok', 'message' => 'Imagen guardada']);
        } catch (\Exception $e) {
            error_log('Error al subir imagen: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo guardar la imagen']);
        }
    }

    // DELETE /api/ejercicio/:id: desactiva el ejercicio (no lo borra).
    public function destroy($idEjercicio) {
        $this->cambiarActivo($idEjercicio, false);
    }

    // PUT /api/ejercicio/:id/reactivar: vuelve a activar un ejercicio desactivado.
    public function reactivar($idEjercicio) {
        $this->cambiarActivo($idEjercicio, true);
    }

    // Lógica común de desactivar/reactivar: comprueba permisos, que exista
    // y que no esté ya en ese estado, y después cambia la columna activo.
    private function cambiarActivo($idEjercicio, $activo) {
        if (!$this->accesoPermitido()) {
            return;
        }
        $idEjercicio = (int) $idEjercicio;

        try {
            if ($idEjercicio <= 0 || !$this->modelo->existe($idEjercicio)) {
                $this->responder(404, ['status' => 'error', 'message' => 'Ejercicio no encontrado']);
                return;
            }
            $this->modelo->cambiarEstado($idEjercicio, $activo);
            $this->responder(200, [
                'status' => 'ok',
                'message' => $activo ? 'Ejercicio reactivado' : 'Ejercicio desactivado'
            ]);
        } catch (\Exception $e) {
            error_log('Error al cambiar estado del ejercicio: ' . $e->getMessage());
            $this->responder(500, ['status' => 'error', 'message' => 'No se pudo cambiar el estado del ejercicio']);
        }
    }
}