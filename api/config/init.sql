CREATE TABLE TIPOUSUARIO (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hash VARCHAR(150) NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES TIPOUSUARIO(id_rol)
);

CREATE TABLE PLAN (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    precio FLOAT NOT NULL,
    duracion VARCHAR(50),
    descripcion TEXT
);

CREATE TABLE PERSONA (
    id_persona INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_plan INT,
    apellido VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    especialidad VARCHAR(70),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (id_plan) REFERENCES PLAN(id_plan)
);

CREATE TABLE SALA (
    id_sala INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE RUTINA (
    id_rutina INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE CREA (
    id_rutina INT NOT NULL,
    id_persona INT NOT NULL,
    PRIMARY KEY (id_rutina, id_persona),
    FOREIGN KEY (id_rutina) REFERENCES RUTINA(id_rutina),
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE EJERCICIO (
    id_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    nivel VARCHAR(100),
    grupo_muscular VARCHAR(70)
);

CREATE TABLE DETALLERUTINA (
    id_rutina INT NOT NULL,
    id_ejercicio INT NOT NULL,
    series INT,
    repeticiones INT,
    descanso INT,
    observaciones TEXT,
    orden_ejercicios INT,
    PRIMARY KEY (id_rutina, id_ejercicio),
    FOREIGN KEY (id_rutina) REFERENCES RUTINA(id_rutina),
    FOREIGN KEY (id_ejercicio) REFERENCES EJERCICIO(id_ejercicio)
);

CREATE TABLE PROGRESO (
    id_progreso INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    fecha DATE NOT NULL,
    peso FLOAT,
    racha_actual INT,
    masa_muscular FLOAT,
    grasa FLOAT,
    observaciones TEXT,
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE OBJETIVO (
    id_objetivo INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    titulo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE LOGRO (
    id_logro INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100)
);

CREATE TABLE OBTIENE (
    id_persona INT NOT NULL,
    id_logro INT NOT NULL,
    fecha_obtenido DATE NOT NULL,
    PRIMARY KEY (id_persona, id_logro),
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona),
    FOREIGN KEY (id_logro) REFERENCES LOGRO(id_logro)
);

CREATE TABLE COMPRA (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    fecha DATE NOT NULL,
    metodo_pago VARCHAR(50),
    estado VARCHAR(50),
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE CATEGORIA (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE PRODUCTO (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio FLOAT NOT NULL,
    stock INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria)
);

CREATE TABLE DETALLECOMPRA (
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    total FLOAT,
    precio_unitario FLOAT,
    cantidad INT,
    PRIMARY KEY (id_compra, id_producto),
    FOREIGN KEY (id_compra) REFERENCES COMPRA(id_compra),
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto)
);

CREATE TABLE RESENA (
    id_producto INT NOT NULL,
    id_persona INT NOT NULL,
    fecha_publicacion DATE NOT NULL,
    puntuacion FLOAT,
    comentario TEXT,
    PRIMARY KEY (id_producto, id_persona),
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto),
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE ASISTENCIA (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

CREATE TABLE MENSAJE (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT NOT NULL,
    contenido TEXT,
    fecha_envio DATETIME,
    leido BOOLEAN,
    FOREIGN KEY (id_persona) REFERENCES PERSONA(id_persona)
);

INSERT INTO TIPOUSUARIO (nombre_rol) VALUES
('Administrador'),
('Entrenador'),
('Socio');

INSERT INTO USUARIO (id_rol, nombre_usuario, email, hash) VALUES
(1, 'admin01', 'admin@fitpower.com', 'hash_admin_123'),
(2, 'entrenador01', 'juan@fitpower.com', 'hash_juan_456'),
(2, 'entrenador02', 'lucia@fitpower.com', 'hash_lucia_789'),
(3, 'martin01', 'martin@fitpower.com', 'hash_martin_111'),
(3, 'ana01', 'ana@fitpower.com', 'hash_ana_222'),
(3, 'carlos01', 'carlos@fitpower.com', 'hash_carlos_333'),
(3, 'laura01', 'laura@fitpower.com', 'hash_laura_444'),
(3, 'pedro01', 'pedro@fitpower.com', 'hash_pedro_555');

INSERT INTO PLAN (nombre, precio, duracion, descripcion) VALUES
('Plan Basico', 1200.00, '1 mes', 'Acceso general al gimnasio.'),
('Plan Premium', 1800.00, '1 mes', 'Acceso al gimnasio y seguimiento personalizado.'),
('Plan Trimestral', 4800.00, '3 meses', 'Acceso durante tres meses con beneficios adicionales.');

INSERT INTO PERSONA
(id_usuario, id_plan, apellido, fecha_inicio, fecha_fin, especialidad) VALUES
(1, NULL, 'Sanchez', NULL, NULL, NULL),
(2, NULL, 'Perez', NULL, NULL, 'Hipertrofia'),
(3, NULL, 'Fernandez', NULL, NULL, 'Entrenamiento funcional'),
(4, 2, 'Silva', '2026-08-01', '2026-08-30', NULL),
(5, 1, 'Lopez', '2026-08-05', '2026-09-04', NULL),
(6, 3, 'Rodriguez', '2026-07-15', '2026-10-12', NULL),
(7, 1, 'Martinez', '2026-08-10', '2026-09-08', NULL),
(8, NULL, 'Gomez', NULL, NULL, NULL);

INSERT INTO SALA (nombre) VALUES
('Musculacion'),
('Cardio'),
('Pilates'),
('Crossfit');

INSERT INTO RUTINA (nombre, descripcion) VALUES
('Fuerza Tren Superior', 'Rutina enfocada en pecho, espalda y brazos.'),
('Piernas', 'Rutina enfocada en el desarrollo del tren inferior.'),
('Perdida de Peso', 'Rutina combinada de fuerza y acondicionamiento.'),
('Fuerza General', 'Rutina para mejorar la fuerza general.'),
('Resistencia', 'Rutina enfocada en mejorar la resistencia muscular.');

INSERT INTO CREA (id_rutina, id_persona) VALUES
(1, 2),
(2, 2),
(3, 3),
(4, 2),
(5, 3);

INSERT INTO EJERCICIO (nombre, descripcion, nivel, grupo_muscular) VALUES
('Press de banca', 'Ejercicio para trabajar principalmente el pecho.', 'Intermedio', 'Pecho'),
('Sentadilla', 'Ejercicio compuesto para trabajar el tren inferior.', 'Principiante', 'Piernas'),
('Peso muerto', 'Ejercicio compuesto para trabajar fuerza general.', 'Avanzado', 'Espalda'),
('Curl de biceps', 'Ejercicio de aislamiento para los biceps.', 'Principiante', 'Biceps'),
('Extension de triceps', 'Ejercicio de aislamiento para los triceps.', 'Principiante', 'Triceps'),
('Remo con barra', 'Ejercicio para espalda y biceps.', 'Intermedio', 'Espalda'),
('Press militar', 'Ejercicio para desarrollar los hombros.', 'Intermedio', 'Hombros'),
('Plancha', 'Ejercicio isometrico para fortalecer el core.', 'Principiante', 'Abdominales');

INSERT INTO DETALLERUTINA
(id_rutina, id_ejercicio, series, repeticiones, descanso, observaciones, orden_ejercicios) VALUES
(1, 1, 4, 10, 90, 'Mantener tecnica correcta durante todo el movimiento.', 1),
(1, 4, 3, 12, 60, 'Controlar el movimiento.', 2),
(1, 5, 3, 12, 60, 'Evitar movimientos bruscos.', 3),
(2, 2, 4, 10, 120, 'Mantener la espalda recta.', 1),
(2, 3, 3, 8, 120, 'Realizar con tecnica correcta.', 2),
(3, 2, 3, 15, 60, 'Utilizar un peso moderado.', 1),
(3, 8, 3, 45, 45, 'Mantener la posicion durante el tiempo indicado.', 2),
(4, 3, 4, 6, 150, 'Priorizar la tecnica.', 1),
(4, 7, 3, 10, 90, 'Controlar el descenso.', 2),
(5, 6, 3, 12, 60, 'Mantener ritmo constante.', 1);

INSERT INTO PROGRESO
(id_persona, fecha, peso, racha_actual, masa_muscular, grasa, observaciones) VALUES
(4, '2026-08-01', 70.0, 1, 31.5, 18.0, 'Medicion inicial.'),
(4, '2026-09-01', 71.5, 4, 32.2, 17.5, 'Aumento de masa muscular.'),
(5, '2026-08-05', 82.0, 1, 29.0, 28.0, 'Medicion inicial.'),
(5, '2026-09-01', 80.5, 3, 29.4, 26.5, 'Descenso de peso.'),
(6, '2026-08-01', 75.0, 1, 34.0, 16.0, 'Medicion inicial.'),
(7, '2026-08-10', 65.0, 1, 27.0, 22.0, 'Medicion inicial.');

INSERT INTO OBJETIVO
(id_persona, titulo, descripcion, estado, fecha_inicio, fecha_fin) VALUES
(4, 'Ganar masa muscular', 'Aumentar la masa muscular mediante entrenamiento de fuerza.', 'En curso', '2026-08-01', '2026-12-01'),
(5, 'Bajar de peso', 'Reducir el porcentaje de grasa corporal.', 'En curso', '2026-08-05', '2026-11-05'),
(6, 'Aumentar fuerza', 'Mejorar los niveles de fuerza en ejercicios basicos.', 'En curso', '2026-08-01', '2026-12-01'),
(7, 'Mejorar resistencia', 'Aumentar la resistencia cardiovascular y muscular.', 'Pausado', '2026-08-10', '2026-11-10');

INSERT INTO LOGRO (nombre, descripcion, icono) VALUES
('Primer entrenamiento', 'Completo su primer entrenamiento registrado.', 'logro1'),
('Primera semana', 'Completo una semana de entrenamiento.', 'logro2'),
('Constancia', 'Asistio al gimnasio durante varias semanas.', 'logro3'),
('Primer objetivo', 'Completo su primer objetivo personal.', 'logro4'),
('Gran progreso', 'Registro una mejora significativa en su progreso.', 'logro5');

INSERT INTO OBTIENE (id_persona, id_logro, fecha_obtenido) VALUES
(4, 1, '2026-08-01'),
(4, 2, '2026-08-08'),
(4, 3, '2026-08-31'),
(5, 1, '2026-08-05'),
(5, 2, '2026-08-12'),
(6, 1, '2026-08-01'),
(6, 3, '2026-08-30');

INSERT INTO CATEGORIA (nombre) VALUES
('Suplementos'),
('Indumentaria'),
('Accesorios');

INSERT INTO PRODUCTO
(id_categoria, nombre, descripcion, precio, stock) VALUES
(1, 'Proteina Whey', 'Suplemento de proteina en polvo.', 2500.00, 20),
(1, 'Creatina', 'Suplemento de creatina monohidratada.', 1800.00, 15),
(2, 'Remera FitPower', 'Remera deportiva oficial de FitPower.', 1200.00, 25),
(2, 'Short Deportivo', 'Short deportivo para entrenamiento.', 1500.00, 18),
(3, 'Shaker FitPower', 'Botella mezcladora para suplementos.', 800.00, 30),
(3, 'Toalla FitPower', 'Toalla deportiva oficial.', 600.00, 20);

INSERT INTO COMPRA
(id_persona, metodo_pago, estado, fecha) VALUES
(4, 'Tarjeta', 'Pagada', '2026-08-15'),
(5, 'Efectivo', 'Pagada', '2026-08-20'),
(6, 'Transferencia', 'Pagada', '2026-08-25');

INSERT INTO DETALLECOMPRA
(id_compra, id_producto, total, precio_unitario, cantidad) VALUES
(1, 1, 2500.00, 2500.00, 1),
(1, 5, 800.00, 800.00, 1),
(2, 3, 1200.00, 1200.00, 1),
(2, 6, 600.00, 600.00, 1),
(3, 4, 1500.00, 1500.00, 1);

INSERT INTO RESENA
(id_producto, id_persona, fecha_publicacion, puntuacion, comentario) VALUES
(1, 4, '2026-08-20', 5.0, 'Muy buena proteina y buen sabor.'),
(5, 4, '2026-08-20', 4.5, 'Comodo y facil de utilizar.'),
(3, 5, '2026-08-25', 5.0, 'Buena calidad y comodo para entrenar.'),
(4, 6, '2026-08-28', 4.0, 'Buen producto para entrenar.');

INSERT INTO ASISTENCIA
(id_persona, fecha, hora_entrada, hora_salida) VALUES
(4, '2026-09-01', '18:30:00', '20:00:00'),
(4, '2026-09-03', '19:00:00', '20:30:00'),
(5, '2026-09-02', '17:30:00', '18:45:00'),
(6, '2026-09-01', '20:00:00', '21:30:00'),
(6, '2026-09-04', '18:45:00', '20:15:00'),
(7, '2026-09-03', '16:30:00', '17:45:00');

INSERT INTO MENSAJE
(id_persona, contenido, fecha_envio, leido) VALUES
(4, 'Recordatorio de entrenamiento de hoy.', '2026-09-01 10:00:00', TRUE),
(5, 'Tu membresia esta por vencer.', '2026-09-02 09:30:00', FALSE),
(6, 'Nueva rutina disponible.', '2026-09-03 11:15:00', TRUE);