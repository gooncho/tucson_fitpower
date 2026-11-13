<?php
/**
 * Conexión a la base de datos MySQL con PDO.
 *
 * Los datos de conexión (host, base, usuario y contraseña) se leen del .env,
 * así no quedan escritos en el código ni se suben a GitHub.
 */
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Leemos las variables cargadas desde el .env
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME');
        $this->username = getenv('DB_USER');
        $this->password = getenv('DB_PASS');
    }

    // Crea la conexión PDO. ERRMODE_EXCEPTION hace que cualquier error de SQL
    // lance una excepción, que después atrapan los controllers con try/catch.
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            throw new Exception($e->getMessage());
        }
        return $this->conn;
    }
}