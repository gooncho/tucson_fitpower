<?php
/**
 * Consultas del perfil de usuario (los tres roles).
 */
namespace App\Models;

class PerfilModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Datos del usuario y su persona, más la edad (calculada), su último peso y su objetivo más reciente.
    public function obtener($idUsuario) {
        $stmt = $this->db->prepare('SELECT u.nombre_usuario AS usuario, u.email, t.nombre_rol AS rol, p.id_persona, p.apellido, p.fecha_nacimiento, p.altura, p.especialidad, p.sobre_mi, p.foto FROM USUARIO u INNER JOIN TIPOUSUARIO t ON t.id_rol = u.id_rol INNER JOIN PERSONA p ON p.id_usuario = u.id_usuario WHERE u.id_usuario = :id LIMIT 1');
        $stmt->execute(['id' => $idUsuario]);
        $perfil = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$perfil) return false;
        $perfil['edad'] = null;
        $perfil['peso'] = null;
        $perfil['objetivo'] = null;
        if (!empty($perfil['fecha_nacimiento'])) {
            $nacimiento = new \DateTime($perfil['fecha_nacimiento']);
            $perfil['edad'] = $nacimiento->diff(new \DateTime())->y;
        }
        try {
            $peso = $this->db->prepare('SELECT peso FROM PROGRESO WHERE id_persona = :persona ORDER BY fecha DESC, id_progreso DESC LIMIT 1');
            $peso->execute(['persona' => $perfil['id_persona']]);
            $perfil['peso'] = $peso->fetchColumn() ?: null;
        } catch (\Exception $e) {
            $perfil['peso'] = null;
        }
        try {
            $objetivo = $this->db->prepare('SELECT titulo FROM OBJETIVO WHERE id_persona = :persona ORDER BY id_objetivo DESC LIMIT 1');
            $objetivo->execute(['persona' => $perfil['id_persona']]);
            $perfil['objetivo'] = $objetivo->fetchColumn() ?: null;
        } catch (\Exception $e) {
            $perfil['objetivo'] = null;
        }
        return $perfil;
    }

    // Actualiza solo los campos permitidos; la especialidad solo si es entrenador.
    public function actualizar($idUsuario, $d, $esEntrenador) {
        $campos = ['apellido = :apellido', 'fecha_nacimiento = :fecha', 'altura = :altura', 'sobre_mi = :sobre'];
        $params = ['apellido' => $d['apellido'], 'fecha' => $d['fecha_nacimiento'], 'altura' => $d['altura'], 'sobre' => $d['sobre_mi'], 'id' => $idUsuario];
        if ($esEntrenador) {
            $campos[] = 'especialidad = :especialidad';
            $params['especialidad'] = $d['especialidad'];
        }
        $stmt = $this->db->prepare('UPDATE PERSONA SET ' . implode(', ', $campos) . ' WHERE id_usuario = :id');
        $stmt->execute($params);
    }

    // Nombre del archivo de la foto actual (para borrarla al subir una nueva).
    public function fotoActual($idUsuario) {
        $stmt = $this->db->prepare('SELECT foto FROM PERSONA WHERE id_usuario = :id');
        $stmt->execute(['id' => $idUsuario]);
        return $stmt->fetchColumn() ?: null;
    }

    // Guarda el nombre del archivo de la foto nueva.
    public function guardarFoto($idUsuario, $archivo) {
        $stmt = $this->db->prepare('UPDATE PERSONA SET foto = :foto WHERE id_usuario = :id');
        $stmt->execute(['foto' => $archivo, 'id' => $idUsuario]);
    }
}
