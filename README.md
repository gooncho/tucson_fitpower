# FitPower — Plataforma web de gestión de gimnasios

FitPower es una aplicación web para administrar un gimnasio. Tiene un sitio público (página principal, planes, entrenadores, contacto y tienda de productos con reseñas) y tres paneles privados según el rol del usuario:

| Rol | Qué puede hacer |
|---|---|
| **Administrador** | Ver el resumen del gimnasio y gestionar socios, entrenadores (con asignación de socios y horarios), pagos, productos y ejercicios. |
| **Entrenador** | Consultar sus socios asignados, crear y asignar rutinas y administrar la biblioteca de ejercicios. |
| **Socio** | Ver y realizar sus rutinas, registrar peso y asistencia, consultar su historial, membresía, objetivos y logros, y dejar reseñas de productos. |

Proyecto de egreso de 3.° BT Tecnologías de la Información - **Tucson S.R.L.**

---
Integrantes
Integrante	Rol en el proyecto
Gonzalo Pisón	Coordinador y diseñador
Enzo Ríos	Secretario y programador full stack
Andrés Trujillo	Programador full stack
Santiago Fiore	Administrador de sistemas operativos
Brian Gonzatto	Administrador de sistemas operativos
## Índice

1. [Tecnologías](#tecnologías)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
4. [Usuarios de prueba](#usuarios-de-prueba)
5. [Uso de la aplicación](#uso-de-la-aplicación)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Arquitectura por capas](#arquitectura-por-capas)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Base de datos](#base-de-datos)
10. [Comandos útiles](#comandos-útiles)
11. [Solución de problemas](#solución-de-problemas)

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3 y JavaScript (sin frameworks) |
| Backend (API REST) | PHP 8.2 con PDO, estructura MVC propia |
| Base de datos | MySQL 8.0 |
| Servidor | Apache con `mod_rewrite` |
| Entorno | Docker y Docker Compose |
| Administración de la BD | phpMyAdmin |
| Idiomas | Español / inglés con un módulo i18n propio (`front/dist/JS/i18n.js`) |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) o Docker Engine + Docker Compose (Linux).
- [Git](https://git-scm.com/) para clonar el repositorio.
- Un navegador web actualizado (Chrome, Firefox, Edge o Safari).
- Los puertos **8080**, **8081** y **3306** libres en tu computadora.

> No hace falta instalar PHP, Apache ni MySQL: Docker los levanta en contenedores.

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/gooncho/tucson_fitpower.git
cd tucson_fitpower
```

### 2. Crear los archivos de entorno

Los archivos `.env` no se suben al repositorio, así que hay que crearlos.

**`.env` en la raíz** (define el prefijo del nombre de los contenedores):

```env
APP_NAME=fitpower
```

**`api/.env`** (datos de conexión a la base de datos). Copiá el ejemplo:

```bash
cp api/.env.example api/.env
```

Contenido por defecto, que ya coincide con `docker-compose.yml`:

```env
DB_HOST=db
DB_NAME=fitpower_tucson
DB_USER=usuario
DB_PASS=password
```

### 3. Levantar los contenedores

```bash
docker compose up -d --build
```

La primera vez, Docker descarga las imágenes, construye la imagen de PHP + Apache y ejecuta `api/config/init.sql`. Ese script crea todas las tablas y carga los datos de prueba. Puede tardar uno o dos minutos.

### 4. Abrir la aplicación

| Servicio | Dirección |
|---|---|
| Aplicación (sitio público y paneles) | <http://localhost:8080> |
| API REST | <http://localhost:8080/api> |
| phpMyAdmin | <http://localhost:8081> (usuario `usuario`, contraseña `password`) |
| MySQL (desde un cliente externo) | `localhost:3306` |

Al entrar a `http://localhost:8080`, el servidor redirige automáticamente a `front/index.html`.

---

## Usuarios de prueba

La base de datos se carga con 310 usuarios de ejemplo. Para probar cada rol:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin01` | `hash_admin_123` |
| Entrenador | `entrenador01` | `hash_juan_456` |
| Entrenador | `entrenador02` | `hash_lucia_789` |
| Socio | `martin01` | `hash_martin_111` |
| Socio | `ana01` | `hash_ana_222` |

Los socios generados automáticamente (id 13 al 310) usan como contraseña `hash_` seguido de su nombre de usuario. Por ejemplo, `sofia02` → `hash_sofia02`.

> El inicio de sesión se hace con el **nombre de usuario**, no con el email.

---

## Uso de la aplicación

1. Entrá a <http://localhost:8080>.
2. Hacé clic en **Iniciar sesión** e ingresá uno de los usuarios de prueba.
3. El sistema te redirige al panel que corresponde a tu rol.
4. Para crear una cuenta nueva, usá **Regístrate** en la pantalla de acceso. Las cuentas registradas desde ahí se crean con el rol de socio.
5. Para salir, usá **Cerrar sesión** en el menú lateral.

El funcionamiento detallado de cada pantalla, paso a paso y con capturas, está en el **Manual de usuario** (sección 9 de la documentación del proyecto).

---

## Estructura del proyecto

```
tucson_fitpower/
├── .env                      # APP_NAME para los contenedores (no se versiona)
├── .htaccess                 # Envía /api/* a la API y la raíz al frontend
├── Dockerfile                # Imagen PHP 8.2 + Apache con mod_rewrite y pdo_mysql
├── docker-compose.yml        # Servicios: app, db (MySQL) y phpmyadmin
│
├── api/                      # BACKEND — API REST en PHP
│   ├── .env.example          # Plantilla de variables de conexión
│   ├── .htaccess             # Envía toda petición a index.php
│   ├── index.php             # Punto de entrada: cabeceras, conexión y router
│   ├── autoload.php          # Carga automática de clases (namespace App\)
│   ├── routes.php            # Tabla de rutas: URL + método → controlador
│   ├── config/
│   │   ├── database.php      # Clase Database (conexión PDO)
│   │   └── init.sql          # Estructura de la BD y datos de prueba
│   └── src/
│       ├── Controllers/      # Reciben la petición, validan y responden JSON
│       ├── Models/           # Consultas SQL a la base de datos
│       └── Utils/
│           ├── Router.php    # Enrutador propio
│           └── EnvLoader.php # Lector del archivo .env
│
└── front/                    # FRONTEND — HTML, CSS y JavaScript
    ├── index.html            # Página principal (landing)
    └── dist/
        ├── Paginas/
        │   ├── acceso.html   # Inicio de sesión y registro
        │   ├── Productos.html# Tienda de productos y reseñas
        │   └── roles/
        │       ├── administrador/  # Vistas del panel de administrador
        │       ├── entrenador/     # Vistas del panel de entrenador
        │       └── socio/          # Vistas del panel de socio
        ├── JS/
        │   ├── api.js        # Cliente HTTP único para hablar con la API
        │   ├── i18n.js       # Traducciones español / inglés
        │   ├── login.js, perfil.js, productos.js, resenas.js, planes.js, ...
        │   └── roles/
        │       ├── Administrador/  # Lógica de cada vista del administrador
        │       ├── Entrenador/     # Lógica de cada vista del entrenador
        │       └── Socio/          # Lógica de cada vista del socio
        ├── CSS/              # Estilos generales, por rol y responsive (mobile.css)
        └── assets/           # Imágenes, íconos, fotos de perfil y de ejercicios
```

---

## Arquitectura por capas

El sistema separa claramente la **presentación** (frontend) de la **lógica y los datos** (API). Los dos se comunican solo mediante peticiones HTTP con JSON.

```
 Navegador
    │  HTML + CSS (Paginas/, CSS/)
    │  JavaScript de la vista (JS/roles/...)
    ▼
 api.js  ──── fetch /api/... (JSON) ────►  Apache (.htaccess)
                                              │
                                              ▼
                                         api/index.php
                                              │
                                              ▼
                                         Router.php  ── routes.php
                                              │
                                              ▼
                                         Controllers/   (validan y arman la respuesta)
                                              │
                                              ▼
                                         Models/        (consultas SQL con PDO)
                                              │
                                              ▼
                                         MySQL (fitpower_tucson)
```

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **Vista** | `front/dist/Paginas`, `front/dist/CSS` | Estructura y diseño de cada pantalla. |
| **Lógica de interfaz** | `front/dist/JS` | Eventos, filtros, modales y renderizado de tablas. Cada vista tiene su propio archivo JS. |
| **Cliente HTTP** | `front/dist/JS/api.js` | Único punto que llama a la API. Maneja errores de conexión y respuestas no válidas. |
| **Enrutamiento** | `api/index.php`, `api/routes.php`, `api/src/Utils/Router.php` | Recibe la URL y el método HTTP y los dirige al controlador correspondiente. |
| **Controladores** | `api/src/Controllers` | Verifican la sesión y el rol, validan los datos de entrada y devuelven JSON (`status`, `message`, `data`). |
| **Modelos** | `api/src/Models` | Acceso a datos: consultas SQL preparadas con PDO. |
| **Configuración** | `api/config`, `.env` | Conexión a la base de datos y script de inicialización. |

**Ejemplo de flujo, login:** `acceso.html` → `login.js` → `API.request('/acceso', 'POST', datos)` → `routes.php` → `AuthController` → `AuthModel` → tabla `USUARIO` → respuesta JSON con el rol → `login.js` redirige al panel del rol.

---

## Endpoints de la API

Todas las rutas empiezan con `/api` y responden en formato JSON.

| Área | Método | Ruta |
|---|---|---|
| **Autenticación** | POST | `/registro`, `/acceso`, `/logout` |
| | GET | `/sesion` |
| **Socios (admin)** | GET, POST | `/socios` |
| | PUT | `/socios/:id` |
| **Entrenadores (admin)** | GET, POST | `/entrenadores` |
| | PUT | `/entrenadores/:id` |
| | GET, PUT | `/entrenadores/:id/socios` |
| **Pagos (admin)** | GET | `/pagos` |
| | PUT | `/pagos/:id` |
| **Productos (admin)** | GET, POST | `/productos` |
| | DELETE | `/productos/:id` |
| **Ejercicios (admin)** | GET | `/ejercicios` |
| **Inicio (admin)** | GET | `/inicio-administrador` |
| **Mis socios (entrenador)** | GET | `/mis-socios` |
| **Rutinas (entrenador)** | GET, POST | `/rutinas` |
| | GET, PUT, DELETE | `/rutinas/:id` |
| **Ejercicios (entrenador)** | GET, POST | `/ejercicio` |
| | PUT, DELETE | `/ejercicio/:id` |
| | POST | `/ejercicio/:id/imagen` |
| | PUT | `/ejercicio/:id/reactivar` |
| **Tienda y reseñas** | GET | `/producto`, `/producto/:id/resenas` |
| | POST | `/producto/:id/resenas` |
| **Perfil (todos)** | GET, PUT | `/perfil` |
| | POST | `/perfil/foto` |
| **Panel del socio** | GET | `/inicio-socio`, `/mis-rutinas`, `/entrenamientos`, `/membresia`, `/progreso`, `/logros` |
| | POST | `/progreso/peso`, `/asistencia` |
| | DELETE | `/mis-rutinas/:id` |
| **Objetivos (socio)** | GET, POST | `/objetivos` |
| | DELETE | `/objetivos/:id` |
| **Planes (público)** | GET | `/planes` |

La lista completa, con el controlador y el método de cada ruta, está en `api/routes.php`.

---

## Base de datos

- **Nombre:** `fitpower_tucson`
- **Script:** `api/config/init.sql`. Crea las tablas y carga los datos de prueba. MySQL lo ejecuta automáticamente **solo la primera vez** que se crea el volumen `db_data`.
- **Tablas principales:** `USUARIO`, `TIPOUSUARIO` (roles), `PERSONA`, `PLAN`, `COMPRA`, `PRODUCTO`, `CATEGORIA`, `DETALLECOMPRA`, `RESENA`, `RUTINA`, `CREA`, `DETALLERUTINA`, `EJERCICIO`, `PROGRESO`, `OBJETIVO`, `LOGRO`, `OBTIENE`, `ASISTENCIA`, `SUPERVISA` (asignación entrenador–socio con horario), `ASIGNA`, `SALA` y `MENSAJE`.
- **Datos de prueba:** 1 administrador, 6 entrenadores y 303 socios (242 con membresía activa y 61 vencidas). Los planes son Básico ($1200), Pro ($1500) y Elite ($2100).

---

## Comandos útiles

| Acción | Comando |
|---|---|
| Levantar el proyecto | `docker compose up -d --build` |
| Ver si los contenedores están corriendo | `docker compose ps` |
| Ver los registros de PHP / Apache | `docker compose logs -f app` |
| Detener el proyecto | `docker compose down` |
| **Reiniciar la base de datos desde cero** (borra todos los datos) | `docker compose down -v` y después `docker compose up -d --build` |
| Entrar a MySQL por consola | `docker compose exec db mysql -u usuario -ppassword fitpower_tucson` |

---

## Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| `port is already allocated` al levantar | Otro programa usa el puerto 8080, 8081 o 3306 (por ejemplo, XAMPP o un MySQL local). Cerralo o cambiá el puerto en `docker-compose.yml`. |
| La página muestra "No se pudo conectar con la API" o "Error crítico de BD" | El contenedor de MySQL todavía está iniciando. Esperá unos segundos y recargá. Si sigue, revisá `docker compose logs db`. |
| Cambié `init.sql` y no se ven los cambios | El script solo corre al crear el volumen. Ejecutá `docker compose down -v` y volvé a levantar. |
| La URL `/api/...` devuelve 404 de Apache | `mod_rewrite` o `AllowOverride` no están activos. Reconstruí la imagen con `docker compose up -d --build`. |
| No se guarda la foto de perfil o la imagen de un ejercicio (Linux) | Apache no tiene permiso de escritura en `front/dist/assets/`. Ejecutá `chmod -R 777 front/dist/assets/perfiles front/dist/assets/Ejercicios`. |
| Los contenedores se llaman `_app`, `_db` | Falta el archivo `.env` de la raíz con `APP_NAME`. Crealo (paso 2 de la instalación). |