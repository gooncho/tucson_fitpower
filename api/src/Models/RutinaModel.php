<?php 
/**
 * Consultas de rutinas.
 *
 * Una rutina usa cuatro tablas:
 *   RUTINA        -> nombre y descripción
 *   DETALLERUTINA -> ejercicios con series, repeticiones, descanso y orden
 *   CREA          -> quién la creó (entrenador o socio)
 *   ASIGNA        -> a qué socio pertenece
 */

namespace App\Models;

Class RutinaModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Rutinas con su socio. Si se pasa un entrenador, solo las de sus socios.
    public function listar($idEntrenador = null) {
        $sql =  'SELECT a.id_rutina,
                    r.descripcion,
                    a.id_persona,
                    r.nombre AS rutina,
                    u.nombre_usuario AS usuario,
                    p.apellido,
                    COUNT(d.id_ejercicio) AS total_ejercicios
                    FROM ASIGNA AS a
                    INNER JOIN RUTINA AS r ON r.id_rutina = a.id_rutina
                    INNER JOIN PERSONA AS p ON p.id_persona = a.id_persona
                    INNER JOIN USUARIO AS u ON u.id_usuario = p.id_usuario
                    LEFT JOIN DETALLERUTINA AS d ON d.id_rutina = r.id_rutina';
        $params = [];

        if ($idEntrenador !== null) {
            $sql .= ' WHERE p.id_entrenador = :entrenador';
            $params['entrenador'] = $idEntrenador;
        }
        $sql .= ' GROUP BY a.id_rutina, a.id_persona, r.nombre, r.descripcion, u.nombre_usuario, p.apellido
                ORDER BY a.id_persona, a.id_rutina';

        $stmt = $this->db->prepare($sql); 
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // Ejercicios de la rutina en el orden guardado.
    public function VerRutina($idRutina) {
        $stmt = $this->db->prepare(
            'SELECT d.id_ejercicio,
                    e.nombre,
                    d.series,
                    d.repeticiones,
                    d.descanso
            FROM DETALLERUTINA AS d
            INNER JOIN EJERCICIO AS e ON e.id_ejercicio = d.id_ejercicio
            WHERE d.id_rutina = :id
            ORDER BY d.orden_ejercicios'
        );
        $stmt->execute(['id' => $idRutina]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // id_persona del usuario logueado.
    public function buscarPersonaPorUsuario ($idUsuario) {
        $stmt = $this->db->prepare('SELECT id_persona FROM PERSONA WHERE id_usuario = :id LIMIT 1');
        $stmt->execute(['id' => $idUsuario]);
        return $stmt->fetchColumn();
    }

    // true si la rutina está asignada a esa persona.
    public function verificarAsignacion($idRutina, $idPersona) {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM ASIGNA WHERE id_rutina = :rutina AND id_persona = :persona');
        $stmt->execute(['rutina' => $idRutina, 'persona' => $idPersona]);
        return (int) $stmt->fetchColumn() > 0;
    }

    // true si la persona es un Socio y, si se pasa un entrenador, si es socio suyo.
    public function esSocioDe($idSocio, $idEntrenador = null) {
        $sql = 'SELECT COUNT(*)
                FROM PERSONA AS p
                INNER JOIN USUARIO AS u ON u.id_usuario = p.id_usuario
                INNER JOIN TIPOUSUARIO AS t ON t.id_rol = u.id_rol
                WHERE p.id_persona = :socio AND t.nombre_rol = \'Socio\'';
        $params = ['socio' => $idSocio];

        if ($idEntrenador !== null) {
            $sql .= ' AND p.id_entrenador = :entrenador';
            $params['entrenador'] = $idEntrenador;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    // Crea la rutina completa en una transacción: RUTINA, CREA, ASIGNA y sus ejercicios.
    public function crear($nombre, $descripcion, $idEntrenador, $idSocio, $ejercicios) {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare('INSERT INTO RUTINA (nombre, descripcion) VALUES (:nombre, :descripcion)');
            $stmt->execute(['nombre' => $nombre, 'descripcion' => $descripcion]);
            $idRutina = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare('INSERT INTO CREA (id_rutina, id_persona) VALUES (:rutina, :persona)');
            $stmt->execute(['rutina' => $idRutina, 'persona' => $idEntrenador]);
            
            $stmt = $this->db->prepare(
                'INSERT INTO ASIGNA (id_rutina, id_persona, fecha_asignacion) VALUES (:rutina, :persona, CURDATE())'
            );
            $stmt->execute(['rutina' => $idRutina, 'persona' => $idSocio]);

            $this->guardarEjercicios($idRutina, $ejercicios);

            $this->db->commit();
            return $idRutina;
            } catch (\Exception $e) {
                $this->db->rollBack();
                throw $e;
            }
    }

    // true si la rutina existe y (si se pasa un entrenador) es de uno de sus socios.
    public function puedeEliminar($idRutina, $idEntrenador = null) {
        if ($idEntrenador === null) {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM RUTINA WHERE id_rutina = :rutina');
            $stmt->execute(['rutina' => $idRutina]);
        } else {
            $stmt = $this->db->prepare(
                'SELECT COUNT(*)
                FROM ASIGNA AS a
                INNER JOIN PERSONA AS p ON p.id_persona = a.id_persona
                WHERE a.id_rutina = :rutina AND p.id_entrenador = :entrenador'
            );
            $stmt->execute(['rutina' => $idRutina, 'entrenador' => $idEntrenador]);
        }
        return (int) $stmt->fetchColumn() > 0;
    }

    // Borra la rutina de todas sus tablas en una transacción (también los
    // entrenamientos registrados con ella, porque apuntan a la rutina).
    public function eliminar($idRutina) {
        try {
            $this->db->beginTransaction();
            foreach(['ENTRENAMIENTO_REALIZADO', 'DETALLERUTINA', 'ASIGNA', 'CREA', 'RUTINA'] as $tabla) {
                $stmt = $this->db->prepare("DELETE FROM $tabla WHERE id_rutina = :id");
                $stmt->execute(['id' => $idRutina]);
            }
            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Inserta los ejercicios de la rutina; orden_ejercicios guarda su posición.
    private function guardarEjercicios($idRutina, $ejercicios) {
        $stmt = $this->db->prepare(
            'INSERT INTO DETALLERUTINA (id_rutina, id_ejercicio, series, repeticiones, descanso, orden_ejercicios)
            VALUES (:rutina, :ejercicio, :series, :repeticiones, :descanso, :orden)'
        );
        foreach ($ejercicios as $i => $item) {
            $stmt->execute ([
                'rutina' => $idRutina,
                'ejercicio' => $item['id_ejercicio'],
                'series' => $item['series'],
                'repeticiones' => $item['repeticiones'],
                'descanso' => $item['descanso'],
                'orden' => $i + 1,
            ]);
        }
    }

    // Actualiza nombre y descripción, y reemplaza todos los ejercicios.
    public function actualizar($idRutina, $nombre, $descripcion, $ejercicios) {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                'UPDATE RUTINA SET nombre = :nombre, descripcion = :descripcion WHERE id_rutina = :id'
            );
            $stmt->execute(['nombre' => $nombre, 'descripcion' => $descripcion, 'id' => $idRutina]);

            $stmt = $this->db->prepare('DELETE FROM DETALLERUTINA WHERE id_rutina = :id');
            $stmt->execute(['id' => $idRutina]);

            $this->guardarEjercicios($idRutina, $ejercicios);

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    // true si esa persona creó la rutina (tabla CREA).
    public function esCreador($idRutina, $idPersona) {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM CREA WHERE id_rutina = :rutina AND id_persona = :persona');
        $stmt->execute(['rutina' => $idRutina, 'persona' => $idPersona]);
        return (int) $stmt->fetchColumn() > 0;
    }
}