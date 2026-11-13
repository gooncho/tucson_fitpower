/**
 * Traducción español / inglés de todo el sitio.
 *
 * Cómo funciona:
 *  - "en" es un diccionario: texto en español -> texto en inglés.
 *  - "patrones" traduce textos con números variables (ej: "Página 2 de 5").
 *  - Al cambiar de idioma recorre la página y reemplaza los textos;
 *    el original se guarda para poder volver al español.
 *  - Un MutationObserver traduce también lo que el JavaScript agrega después.
 *  - El idioma elegido se guarda en localStorage.
 * Para traducir un texto nuevo, alcanza con agregarlo al diccionario.
 */

(function () {
    // Diccionario de textos fijos.
    const en = {
        "Inicio": "Home",
        "Productos": "Products",
        "Contacto": "Contact",
        "Iniciar sesión": "Log in",
        "Cerrar sesión": "Log out",
        "Fitpower": "Fitpower",
        "TRANSFÓRMATE EN TU": "TRANSFORM INTO YOUR",
        "MEJOR VERSIÓN": "BEST VERSION",
        "Entrenamiento profesional, personalizado y": "Professional, personalized training and",
        "una comunidad que potencia todas tus metas": "a community that powers all your goals",
        "COMENZAR AHORA": "START NOW",
        "VER PLANES": "VIEW PLANS",
        "BENEFICIOS": "BENEFITS",
        "Todo lo que necesitas para lograr tus objetivos": "Everything you need to achieve your goals",
        "SEGUIMIENTO": "TRACKING",
        "Planificación 100% adaptada a tus objetivos personales.": "Planning 100% tailored to your personal goals.",
        "EQUIPAMIENTO": "EQUIPMENT",
        "Contamos con las mejores máquinas para tu comodidad y seguridad.": "We have the best machines for your comfort and safety.",
        "EFECTIVIDAD": "EFFECTIVENESS",
        "Rutinas diseñadas por profesionales para maximizar tus resultados.": "Routines designed by professionals to maximize your results.",
        "COMUNIDAD": "COMMUNITY",
        "Una comunidad unida que te impulsa a superarte día a día.": "A close-knit community that pushes you to improve every day.",
        "PLANES": "PLANS",
        "Elegí el plan ideal para vos": "Choose the ideal plan for you",
        "BÁSICO": "BASIC",
        "/mes": "/month",
        "Acceso al gimnasio": "Gym access",
        "Rutinas personalizadas": "Personalized routines",
        "Ayuda de entrenadores": "Trainer support",
        "Elegir plan": "Choose plan",
        "MÁS ELEGIDO": "MOST POPULAR",
        "PRO": "PRO",
        "Entrenador Personal": "Personal Trainer",
        "Seguimiento Mensual": "Monthly Tracking",
        "ELITE": "ELITE",
        "Rutinas Personalizadas": "Personalized Routines",
        "Plan Nutricional": "Nutrition Plan",
        "ENTRENADORES": "TRAINERS",
        "Profesionales dispuestos a ayudarte": "Professionals ready to help you",
        "Musculación": "Bodybuilding",
        "Especialista en hipertrofia y fuerza.": "Hypertrophy and strength specialist.",
        "Especialidad:": "Specialty:",
        "Ibai es especialista en hipertrofia y entrenamientos de fuerza. Con más de 10 años de experiencia, ayuda a los alumnos a superar sus límites.": "Ibai specializes in hypertrophy and strength training. With over 10 years of experience, he helps students break their limits.",
        "Funcional": "Functional",
        "Entrenamiento funcional y eficiente.": "Functional and efficient training.",
        "Diseñando rutinas que mejoran la movilidad, resistencia y fuerza general de sus alumnos.": "Designing routines that improve the mobility, endurance and overall strength of his students.",
        "CrossFit": "CrossFit",
        "Entrenamiento físico general.": "General physical training.",
        "Combina intensidad y variedad para maximizar tus resultados día a día.": "Combines intensity and variety to maximize your results every day.",
        "Nutricionista": "Nutritionist",
        "Planes para impulsar tu progreso.": "Plans to boost your progress.",
        "Nutrición": "Nutrition",
        "Diseña planes de nutrición personalizados que complementan el entrenamiento físico.": "Designs personalized nutrition plans that complement physical training.",
        "¿LISTO PARA TU": "READY FOR YOUR",
        "MEJOR VERSIÓN?": "BEST VERSION?",
        "Sumate a FitPower y empezá hoy. Dejanos tus datos y te contactaremos.": "Join FitPower and start today. Leave us your details and we will contact you.",
        "Nombre completo": "Full name",
        "Correo electrónico": "Email address",
        "Teléfono de contacto": "Contact phone",
        "Enviar solicitud": "Send request",
        "Todo lo que necesitas para tu entrenamiento": "Everything you need for your training",
        "Cargando productos...": "Loading products...",
        "Ver mas Productos": "See more products",
        "Reserva y retiralo en el gimnasio": "Reserve and pick it up at the gym",
        "Hace tu reserva online y retira tu producto en el mostrador cuando vengas a entrenar.": "Reserve online and pick up your product at the counter when you come to train.",
        "Stock:": "Stock:",
        "Reseñas de clientes": "Customer reviews",
        "Escribir reseña": "Write a review",
        "Inicia sesion": "Log in",
        "para escribir una reseña": "to write a review",
        "Tu puntuacion": "Your rating",
        "contanos que te parecio el producto": "tell us what you thought of the product",
        "Publicar reseña": "Post review",
        "Cancelar": "Cancel",
        "Transformamos tu esfuerzo en resultados. Entrenamiento, comunidad y disciplina es todo lo que necesitas para alcanzar tu mejor versión.": "We turn your effort into results. Training, community and discipline is all you need to reach your best version.",
        "NAVEGACIÓN": "NAVIGATION",
        "Planes": "Plans",
        "Entrenadores": "Trainers",
        "Beneficios": "Benefits",
        "CONTACTO": "CONTACT",
        "Entre calle 19 y C.16": "Between 19th street and C.16",
        "Atlántida, Uruguay": "Atlántida, Uruguay",
        "HORARIO": "OPENING HOURS",
        "Lun a Vie": "Mon to Fri",
        "Sábados": "Saturdays",
        "Domingos": "Sundays",
        "© 2026 FitPower. Todos los derechos reservados.": "© 2026 FitPower. All rights reserved.",
        "Acceso": "Access",
        "Fondo Login": "Login background",
        "Logo FitPower": "FitPower logo",
        "Fondo Registro": "Registration background",
        "INICIAR SESIÓN": "LOG IN",
        "Accedé a tu cuenta para continuar": "Log in to your account to continue",
        "Usuario": "User",
        "Ingresá tu nombre de usuario": "Enter your username",
        "Contraseña": "Password",
        "Ingresá tu contraseña": "Enter your password",
        "o continuá con": "or continue with",
        "Continuar con Google": "Continue with Google",
        "Continuar con Facebook": "Continue with Facebook",
        "¿No tenés cuenta?": "Don't have an account?",
        "Registrate": "Sign up",
        "REGISTRO": "SIGN UP",
        "Crea tu usuario para tener acceso a todas las funcionalidades": "Create your user to access all features",
        "Nombre de usuario": "Username",
        "Email": "Email",
        "Ingresá tu email": "Enter your email",
        "CREAR USUARIO": "CREATE USER",
        "¿Ya tienes cuenta?": "Already have an account?",
        "Inicia Sesión": "Log in",
        "Usuario o contraseña incorrectos": "Incorrect username or password",
        "Tipo de usuario no válido": "Invalid user type",
        "Usuario y contraseña son obligatorios": "Username and password are required",
        "No se pudo conectar con la API": "Could not connect to the API",
        "Socios": "Members",
        "Pagos e ingresos": "Payments and income",
        "Ejercicios": "Exercises",
        "Mi Perfil": "My Profile",
        "Perfil": "Profile",
        "Mi perfil": "My profile",
        "Mis socios": "My members",
        "Mis Socios": "My Members",
        "Rutinas": "Routines",
        "Mi progreso": "My progress",
        "Mis logros": "My achievements",
        "Revisá todos los logros que has obtenido": "Review all the achievements you have earned",
        "Almanaque de asistencias": "Attendance calendar",
        "Tus visitas al gimnasio organizadas por semana": "Your gym visits organized by week",
        "Día con asistencia registrada": "Day with recorded attendance",
        "Asistió": "Attended",
        "Sin registro": "No record",
        "Ejercicios Disponibles": "Available Exercises",
        "Ejercicios activos en el sistema": "Active exercises in the system",
        "Estado del socio": "Member status",
        "Inactivo / En suspenso": "Inactive / Suspended",

        "Entrenamientos": "Workouts",
        "Asistencia": "Attendance",
        "Membresía": "Membership",
        "Mis logros": "My achievements",
        "Objetivos": "Goals",
        "Abrir menú": "Open menu",
        "Close": "Close",
        "Cerrar": "Close",
        "Detalles": "Details",
        "Acciones": "Actions",
        "Ver": "View",
        "Editar": "Edit",
        "Eliminar": "Delete",
        "Guardar": "Save",
        "Guardar Cambios": "Save Changes",
        "Actualizar": "Update",
        "Gestionar ejercicios": "Manage exercises",
        "Administrar ejercicios del gimnasio": "Manage the gym exercises",
        "Nuevo ejercicio": "New exercise",
        "Nuevo Ejercicio": "New Exercise",
        "+ Nuevo ejercicio": "+ New exercise",
        "Buscar ejercicio...": "Search exercise...",
        "Buscar ejercicio o musculo": "Search exercise or muscle",
        "Todos los grupos musculares": "All muscle groups",
        "Ejercicio": "Exercise",
        "Grupo muscular": "Muscle group",
        "Grupo Muscular": "Muscle Group",
        "Grupo Muscular:": "Muscle Group:",
        "Dificultad": "Difficulty",
        "Dificultad:": "Difficulty:",
        "Detalles del Ejercicio": "Exercise Details",
        "Editar Ejercicio": "Edit Exercise",
        "Editar ejercicio": "Edit exercise",
        "Nombre del Ejercicio": "Exercise Name",
        "Sin descripción": "No description",
        "Sin descripcion": "No description",
        "No hay ejercicios que coincidan con la búsqueda": "No exercises match the search",
        "Todavía no hay ejercicios registrados": "There are no exercises registered yet",
        "Gestionar entrenadores": "Manage trainers",
        "Administrar los entrenadores del gimnasio": "Manage the gym trainers",
        "Nuevo entrenador": "New trainer",
        "Nuevo Entrenador": "New Trainer",
        "Buscar entrenador...": "Search trainer...",
        "Todas las especialidades": "All specialties",
        "Todos los estados": "All statuses",
        "Activo": "Active",
        "Inactivo": "Inactive",
        "Nombre": "Name",
        "Nombre:": "Name:",
        "Especialidad": "Specialty",
        "Socios asignados": "Assigned members",
        "Socios asignados:": "Assigned members:",
        "Horario": "Schedule",
        "Estado": "Status",
        "Estado:": "Status:",
        "Detalles del Entrenador": "Trainer Details",
        "Editar Entrenador": "Edit Trainer",
        "Nombre de Usuario": "Username",
        "Apellido": "Last name",
        "Asignar socios y horarios": "Assign members and schedules",
        "Cargando socios...": "Loading members...",
        "No hay socios registrados": "There are no registered members",
        "Día": "Day",
        "No hay entrenadores que coincidan con la búsqueda": "No trainers match the search",
        "Todavía no hay entrenadores registrados": "There are no trainers registered yet",
        "Gestionar productos": "Manage products",
        "Administrar productos": "Manage products",
        "Nuevo producto": "New product",
        "Nuevo Producto": "New Product",
        "Buscar producto...": "Search product...",
        "Todas las categorías": "All categories",
        "Disponible": "Available",
        "Bajo stock": "Low stock",
        "Sin stock": "Out of stock",
        "Producto": "Product",
        "Categoría": "Category",
        "Categoría:": "Category:",
        "Stock": "Stock",
        "Precio": "Price",
        "Precio ($)": "Price ($)",
        "Precio:": "Price:",
        "Descripción": "Description",
        "Detalles del Producto": "Product Details",
        "Editar Producto": "Edit Product",
        "Suplementos": "Supplements",
        "Indumentaria": "Clothing",
        "Accesorios": "Accessories",
        "¿Seguro? Confirmar": "Sure? Confirm",
        "No se pudo eliminar": "Could not delete",
        "No se pudo guardar": "Could not save",
        "No hay productos que coincidan con la búsqueda": "No products match the search",
        "Todavía no hay productos registrados": "There are no products registered yet",
        "No se puede eliminar: el producto tiene compras asociadas": "Cannot delete: the product has associated purchases",
        "Gestionar socios": "Manage members",
        "Administrar socios del gimnasio": "Manage the gym members",
        "Nuevo socio": "New member",
        "Nuevo Socio": "New Member",
        "Buscar socio...": "Search member...",
        "Buscar socio": "Search member",
        "Filtrar por plan": "Filter by plan",
        "Filtrar por estado": "Filter by status",
        "Todos los planes": "All plans",
        "Básico": "Basic",
        "Premium": "Premium",
        "Trimestral": "Quarterly",
        "Plan Basico": "Basic Plan",
        "Plan Premium": "Premium Plan",
        "Plan Trimestral": "Quarterly Plan",
        "Plan Pro": "Pro Plan",
        "Pendiente": "Pending",
        "Vencido": "Expired",
        "ID": "ID",
        "ID:": "ID:",
        "Usuario:": "User:",
        "Email:": "Email:",
        "Plan": "Plan",
        "Plan:": "Plan:",
        "Sin plan": "No plan",
        "Vencimiento": "Expiration",
        "Vencimiento:": "Expiration:",
        "Detalles del Socio": "Member Details",
        "Editar Socio": "Edit Member",
        "No hay socios que coincidan con la búsqueda.": "No members match the search.",
        "El usuario o el email ya existen": "The username or email already exists",
        "Completá todos los campos con datos válidos": "Fill in all fields with valid data",
        "No se pudo guardar el socio": "Could not save the member",
        "No se pudo guardar el entrenador": "Could not save the trainer",
        "No se pudo guardar el producto": "Could not save the product",
        "No se pudo eliminar el producto": "Could not delete the product",
        "No se pudieron guardar las asignaciones": "Could not save the assignments",
        "No autorizado": "Unauthorized",
        "Pagos": "Payments",
        "Últimos pagos": "Latest payments",
        "Todos los pagos": "All payments",
        "Membresías": "Memberships",
        "Pagada": "Paid",
        "Fecha": "Date",
        "Fecha:": "Date:",
        "Razón": "Reason",
        "Razón:": "Reason:",
        "Monto": "Amount",
        "Monto:": "Amount:",
        "Socio/Nombre:": "Member/Name:",
        "Detalles del Pago": "Payment Details",
        "Editar Estado de Pago": "Edit Payment Status",
        "No hay pagos que coincidan con la búsqueda": "No payments match the search",
        "Todavía no hay pagos registrados": "There are no payments registered yet",
        "Panel administrador": "Administrator panel",
        "¡Hola": "Hello",
        "Resumen del sistema": "System summary",
        "Resumen": "Summary",
        "Socios registrados": "Registered members",
        "Entrenadores disponibles": "Available trainers",
        "Membresías activas": "Active memberships",
        "Ingresos este mes": "Income this month",
        "Distribución de membresías": "Membership distribution",
        "Por tipo de membresía": "By membership type",
        "Activas": "Active",
        "● Básica 92 (43%)": "● Basic 92 (43%)",
        "● Pro 78 (37%)": "● Pro 78 (37%)",
        "● Elite 32 (15%)": "● Elite 32 (15%)",
        "Productos bajos de stock": "Low stock products",
        "Proteína Whey": "Whey Protein",
        "Botellas de agua": "Water bottles",
        "Creatina Whey": "Whey Creatine",
        "Bajo": "Low",
        "Alto": "High",
        "Crítico": "Critical",
        "Ver todos los productos →": "View all products →",
        "Membresías próximas a vencer": "Memberships about to expire",
        "Ver todas →": "View all →",
        "Accesos rápidos": "Quick access",
        "Gestionar membresías": "Manage memberships",
        "Gestionar pagos": "Manage payments",
        "Lista de ejercicios": "Exercise list",
        "Cargando ejercicios": "Loading exercises",
        "Cargando ejercicios...": "Loading exercises...",
        "Ej: Pecho, Piernas, Espalda": "E.g.: Chest, Legs, Back",
        "Nivel": "Level",
        "Principiante": "Beginner",
        "Intermedio": "Intermediate",
        "Avanzado": "Advanced",
        "Descripción (opcional)": "Description (optional)",
        "Imagen (opcional)": "Image (optional)",
        "No se encontraron ejercicios": "No exercises found",
        "Los ejercicios no cargan": "Exercises could not be loaded",
        "No hay ejercicios cargados": "There are no exercises loaded",
        "Completá el nombre y el grupo muscular.": "Fill in the name and the muscle group.",
        "No se pudo guardar el ejercicio.": "Could not save the exercise.",
        "error desconocido": "unknown error",
        "Gestion de socios": "Member management",
        "Socio": "Member",
        "Objetivo": "Goal",
        "Estado del Objetivo": "Goal Status",
        "Estado de la membresia": "Membership status",
        "Vence": "Expires",
        "No hay socios Cargados": "There are no members loaded",
        "No se encontraron socios": "No members found",
        "Cargando...": "Loading...",
        "Editar perfil": "Edit profile",
        "Sobre mí": "About me",
        "Fecha de nacimiento": "Date of birth",
        "Altura (cm)": "Height (cm)",
        "Coloca una descripcion tuya.": "Add a description about yourself.",
        "No se pudo cargar el perfil.": "Could not load the profile.",
        "El apellido es obligatorio.": "Last name is required.",
        "No se pudo guardar el perfil.": "Could not save the profile.",
        "Gestiona las rutinas": "Manage routines",
        "+ Crear rutina": "+ Create routine",
        "Buscar rutina...": "Search routine...",
        "Rutina": "Routine",
        "N°ejercicios": "No. of exercises",
        "Series": "Sets",
        "Repeticiones": "Repetitions",
        "Descanso": "Rest",
        "Descanso (s)": "Rest (s)",
        "Crear Rutina": "Create Routine",
        "Crear rutina": "Create routine",
        "Editar rutina": "Edit routine",
        "Descripcion (opcion)": "Description (optional)",
        "+ Agregar ejercicio": "+ Add exercise",
        "Elige un ejercicio": "Choose an exercise",
        "Elige un socio": "Choose a member",
        "Esta rutina no tiene ejercicios": "This routine has no exercises",
        "No se pudo eliminar la rutina": "Could not delete the routine",
        "No se encontraron rutinas": "No routines found",
        "No se pudieron cargar los socios.": "Could not load the members.",
        "No se pudieron cargar los ejercicios": "Could not load the exercises",
        "Completa el nombre o elige un socio": "Fill in the name or choose a member",
        "Revisa los ejercicios, elige uno y completa la rutina": "Review the exercises, choose one and complete the routine",
        "No repitas un ejercicio en la misma rutina": "Do not repeat an exercise in the same routine",
        "Agrega al menos un ejercicio.": "Add at least one exercise.",
        "No se pudo guardar la rutina": "Could not save the routine",
        "Panel entrenador": "Trainer panel",
        "Resumen entrenamiento": "Training summary",
        "socios →": "members →",
        "Rutinas creadas": "Routines created",
        "Ver rutinas →": "View routines →",
        "Mis socios asignados": "My assigned members",
        "Ver todos →": "View all →",
        "Ver todas las rutinas →": "View all routines →",
        "Sin objetivo": "No goal",
        "Ver socio": "View member",
        "Los socios no cargan": "Members could not be loaded",
        "No hay socios cargados": "There are no members loaded",
        "Las rutinas no cargan": "Routines could not be loaded",
        "No hay rutinas cargadas": "There are no routines loaded",
        "Nombre de la rutina": "Routine name",
        "Ej: Hipertrofia - Piernas": "E.g.: Hypertrophy - Legs",
        "Agregar ejercicios": "Add exercises",
        "Ejercicios seleccionados": "Selected exercises",
        "No hay ejercicios seleccionados": "No exercises selected",
        "No hay ejercicios disponibles": "No exercises available",
        "Por favor, ingresa un nombre para la rutina.": "Please enter a name for the routine.",
        "Debes seleccionar al menos un ejercicio para la rutina.": "You must select at least one exercise for the routine.",
        "¡Rutina creada con éxito!": "Routine created successfully!",
        "Hubo un error al conectar con el servidor para guardar la rutina.": "There was an error connecting to the server to save the routine.",
        "Detalle de rutina": "Routine detail",
        "Cargando rutina...": "Loading routine...",
        "Rutina no especificada": "Routine not specified",
        "No se indicó ninguna rutina para visualizar.": "No routine was specified to display.",
        "No hay ejercicios registrados en esta rutina.": "There are no exercises registered in this routine.",
        "Entrenamiento en curso": "Workout in progress",
        "Tiempo transcurrido": "Elapsed time",
        "Finalizar": "Finish",
        "Cargando ejercicio...": "Loading exercise...",
        "+ Añadir serie": "+ Add set",
        "Anterior": "Previous",
        "Siguiente ejercicio": "Next exercise",
        "Serie": "Set",
        "Kg": "Kg",
        "¡Has completado todos los ejercicios del entrenamiento!": "You have completed all the exercises of the workout!",
        "¿Estás seguro de que deseas finalizar el entrenamiento?": "Are you sure you want to finish the workout?",
        "Buscar entrenamiento...": "Search workout...",
        "Historial de tus entrenamientos recientes": "History of your recent workouts",
        "Duración": "Duration",
        "Cargando entrenamientos...": "Loading workouts...",
        "No se encontraron entrenamientos registrados.": "No workouts found.",
        "Sin registros": "No records",
        "Mi membresía": "My membership",
        "Tu plan y estado actual": "Your plan and current status",
        "$1500 / mes": "$1500 / month",
        "Accesso a todas las áreas": "Access to all areas",
        "Entrenamiento personalizado": "Personalized training",
        "Clases grupales": "Group classes",
        "Seguimiento del entrenador": "Trainer follow-up",
        "Activa": "Active",
        "Renovar membresía": "Renew membership",
        "Solicitud de renovación enviada a recepción. Un administrador procesará tu pago.": "Renewal request sent to reception. An administrator will process your payment.",
        "Supera tus límites y alcanza tus metas": "Break your limits and reach your goals",
        "+ NUEVO OBJETIVO": "+ NEW GOAL",
        "TODOS": "ALL",
        "EN PROGRESO": "IN PROGRESS",
        "COMPLETADOS": "COMPLETED",
        "PAUSADOS": "PAUSED",
        "COMPLETADO": "COMPLETED",
        "Cargando objetivos...": "Loading goals...",
        "Nuevo Objetivo": "New Goal",
        "Título del objetivo": "Goal title",
        "Ej: Ganar masa muscular": "E.g.: Gain muscle mass",
        "Describe brevemente tu meta...": "Briefly describe your goal...",
        "Fecha de inicio": "Start date",
        "Fecha límite (Fin)": "Deadline (End)",
        "En curso": "In progress",
        "Pausado": "Paused",
        "Completado": "Completed",
        "Progreso inicial (%)": "Initial progress (%)",
        "Guardar objetivo": "Save goal",
        "No se encontraron objetivos en esta categoría.": "No goals found in this category.",
        "Por favor, completa los campos obligatorios.": "Please fill in the required fields.",
        "¡Objetivo creado con éxito!": "Goal created successfully!",
        "Panel socio": "Member panel",
        "Bienvenido a FitPower": "Welcome to FitPower",
        "Entrenamientos esta semana": "Workouts this week",
        "Completados": "Completed",
        "Asistencia este mes": "Attendance this month",
        "Días": "Days",
        "Racha actual": "Current streak",
        "Logros desbloqueados": "Achievements unlocked",
        "En total": "In total",
        "Progreso general": "Overall progress",
        "¡Empieza ahora!": "Start now!",
        "¡Vas por buen camino!": "You are on the right track!",
        "Próximo entrenamiento": "Next workout",
        "Rutina: Sin rutina asignada": "Routine: No routine assigned",
        "Sin rutina asignada": "No routine assigned",
        "Ver rutina": "View routine",
        "Ver detalles": "View details",
        "Tu membresía": "Your membership",
        "Sin membresía activa": "No active membership",
        "Logros recientes": "Recent achievements",
        "Ver todos": "View all",
        "Todavía no tenés logros": "You have no achievements yet",
        "Primer entrenamiento": "First workout",
        "Primera semana": "First week",
        "Constancia": "Consistency",
        "Primer objetivo": "First goal",
        "Gran progreso": "Great progress",
        "Completó su primer entrenamiento registrado.": "Completed their first registered workout.",
        "Completó una semana de entrenamiento.": "Completed a week of training.",
        "Asistió al gimnasio durante varias semanas.": "Attended the gym for several weeks.",
        "Completó su primer objetivo personal.": "Completed their first personal goal.",
        "Registró una mejora significativa en su progreso.": "Recorded a significant improvement in their progress.",
        "Gestiona y realiza tus rutinas de entrenamiento": "Manage and do your training routines",
        "Iniciar": "Start",
        "Detalles de Rutina": "Routine Details",
        "No se encontraron rutinas registradas.": "No routines found.",
        "Tus estadísticas y objetivos": "Your statistics and goals",
        "Peso actual": "Current weight",
        "Rutinas completadas": "Routines completed",
        "Esta semana": "This week",
        "Asistencia al gimnasio": "Gym attendance",
        "Este mes": "This month",
        "Objetivo personal": "Personal goal",
        "Bajar de peso": "Lose weight",
        "Ganar masa muscular": "Gain muscle mass",
        "Aumentar fuerza": "Increase strength",
        "Mejorar resistencia": "Improve endurance",
        "Cumplimientos de objetivos": "Goal completion",
        "Todavía no hay reseñas. ¡Sé el primero en opinar!": "There are no reviews yet. Be the first to comment!",
        "Cargando reseñas...": "Loading reviews...",
        "No se pudieron cargar las reseñas.": "Could not load the reviews.",
        "Elegí una puntuación de 1 a 5 estrellas.": "Choose a rating from 1 to 5 stars.",
        "Escribí un comentario.": "Write a comment.",
        "No se pudo publicar la reseña.": "Could not post the review.",
        "No se pudieron cargar los productos.": "Could not load the products.",
        "Todavía no hay productos disponibles.": "There are no products available yet.",
        "Hoy": "Today",
        "Lunes": "Monday",
        "Martes": "Tuesday",
        "Miércoles": "Wednesday",
        "Jueves": "Thursday",
        "Viernes": "Friday",
        "Sábado": "Saturday",
        "Domingo": "Sunday",
        "Hipertrofia": "Hypertrophy",
        "Entrenamiento funcional": "Functional training",
        "Agenda": "Schedule",
        "Tus sesiones de la semana": "Your sessions this week",
        "Sin horario asignado": "No schedule assigned",
        "El administrador todavía no les asignó día ni hora.": "The administrator hasn't assigned them a day or time yet.",
        "No tenés sesiones programadas esta semana.": "You have no sessions scheduled this week.",
        "Cargando agenda...": "Loading schedule...",
        "No se pudo cargar la agenda": "Couldn't load the schedule",
        "Solo los entrenadores tienen agenda": "Only trainers have a schedule",
        "Sin hora": "No time",
        "Lun": "Mon", "Mar": "Tue", "Mié": "Wed", "Jue": "Thu", "Vie": "Fri", "Sáb": "Sat", "Dom": "Sun",
        "Activos": "Active",
        "Desactivados": "Deactivated",
        "Reactivar": "Reactivate",
        "No hay ejercicios desactivados": "There are no deactivated exercises",
        "Eliminar ejercicio": "Delete exercise",
        "¿Seguro que querés eliminar": "Are you sure you want to delete",
        "de": "from",
        "Dejará de aparecer en la lista y al crear rutinas. Las rutinas que ya lo usan lo mantienen. Podés reactivarlo desde \"Desactivados\".": "It will no longer appear in the list or when creating routines. Routines that already use it will keep it. You can reactivate it from \"Deactivated\".",
        "Grupo muscular:": "Muscle group:",
        "Descripción:": "Description:",
        "Nombre del ejercicio": "Exercise name",
        "Seleccionar dificultad": "Select difficulty",
        "Guardar ejercicio": "Save exercise",
        "No se pudo eliminar el ejercicio": "Couldn't delete the exercise",
        "No se pudo reactivar el ejercicio": "Couldn't reactivate the exercise",
        "No se pudo cambiar el estado del ejercicio": "Couldn't change the exercise status",
        "No se pudo actualizar el ejercicio": "Couldn't update the exercise",
        "No se pudo guardar el ejercicio": "Couldn't save the exercise",
        "Eliminar rutina": "Delete routine",
        "Se borra la rutina con todos sus ejercicios. Esta acción no se puede deshacer.": "The routine and all its exercises will be deleted. This action can't be undone.",
        "Buscar ejercicio o músculo...": "Search exercise or muscle...",
        "Página anterior": "Previous page",
        "Página siguiente": "Next page",
        "Cambiar foto": "Change photo",
        "No se pudo subir la foto.": "Couldn't upload the photo.",
        "Tus datos de administrador": "Your administrator details",
        "Edad": "Age",
        "Altura": "Height",
        "Peso": "Weight",
        "Tu cuenta está desactivada. Consultá en recepción.": "Your account is deactivated. Please ask at the front desk.",
        "No se pudo crear el usuario": "Couldn't create the user",
        "Ingrese su nombre de usuario": "Enter your username",
        "Ingrese su email": "Enter your email",
        "Minimo 8 caracteres": "At least 8 characters",
        "Agregar socios": "Add members",
        "Este entrenador no tiene socios asignados.": "This trainer has no assigned members.",
        "Escribí un nombre para buscar socios.": "Type a name to search members.",
        "No se encontraron socios.": "No members found.",
        "+ Asignar": "+ Assign",
        "Buscar socio por nombre...": "Search member by name...",
        "· sin entrenador": "· no trainer",
        "No se pudo eliminar el entrenador": "Couldn't delete the trainer",
        "No se pudo eliminar al socio": "Couldn't delete the member",
        "No se pudo actualizar el pago": "Couldn't update the payment",
        "Entrenadores registrados": "Registered trainers",
        "Membresías vigentes": "Active memberships",
        "No hay membresías registradas.": "No memberships registered.",
        "No hay productos con stock bajo.": "No low-stock products.",
        "No hay membresías próximas a vencer.": "No memberships about to expire.",
        "No se pudo cargar la información del panel.": "Couldn't load the dashboard information.",
        "Cargando planes...": "Loading plans...",
        "No hay planes disponibles.": "No plans available.",
        "Icono": "Icon",
        "Cargando rutinas...": "Loading routines...",
        "Cargando logros...": "Loading achievements...",
        "Eliminar de mis rutinas": "Remove from my routines",
        "No hay información disponible para esta rutina.": "No information available for this routine.",
        "No se pudo eliminar la rutina.": "Couldn't delete the routine.",
        "No hay beneficios asociados a una membresía.": "No benefits linked to a membership.",
        "El plan no tiene beneficios descriptos.": "The plan has no listed benefits.",
        "Todavía no obtuviste logros. Seguí entrenando para desbloquearlos.": "You haven't earned any achievements yet. Keep training to unlock them.",
        "Fecha obtenido": "Date earned",
        "Logro desbloqueado por tu esfuerzo": "Achievement unlocked by your effort",
        "Desconocido": "Unknown",
        "Sin estado": "No status",
        "No se pudo conectar con el servidor. El objetivo no fue guardado.": "Couldn't connect to the server. The goal was not saved.",
        "No se pudo eliminar el objetivo.": "Couldn't delete the goal.",
        "Sin mediciones": "No measurements",
        "Sin mediciones registradas": "No measurements recorded",
        "Asistencias esta semana": "Attendance this week",
        "Registrar peso": "Log weight",
        "Guardá una nueva medición en tu progreso": "Save a new measurement to your progress",
        "Peso en kg": "Weight in kg",
        "Ej. 75.5": "E.g. 75.5",
        "Guardar peso": "Save weight",
        "Racha actual:": "Current streak:",
        "Marcá tu visita al gimnasio de hoy": "Check in your gym visit for today",
        "Marcar asistencia de hoy": "Check in today",
        "Sin objetivo activo": "No active goal",
         "Ese usuario o email ya está registrado": "That username or email is already registered",
        "El email o usuario ya está registrado": "That email or username is already registered",
        "Tienes que iniciar sesion": "You have to log in",
        "No tienes permisos de acceso": "You don't have access permissions",
        "El nombre es obligatorio": "The name is required",
        "El grupo muscular es obligatorio": "The muscle group is required",
        "El nivel no es valido": "The level is not valid",
        "Ya existe un ejercicio desactivado con ese nombre. Reactivalo desde \"Desactivados\".": "A deactivated exercise with that name already exists. Reactivate it from \"Deactivated\".",
        "No se recibió ninguna imagen": "No image was received",
        "La imagen pesa más de 2 MB": "The image is larger than 2 MB",
        "Solo se aceptan imágenes PNG, JPG o WEBP": "Only PNG, JPG or WEBP images are accepted",
        "No se pudo subir la imagen": "Couldn't upload the image",
        "No se pudo guardar la imagen": "Couldn't save the image",
        "El apellido es obligatorio (máximo 50 caracteres)": "The last name is required (max 50 characters)",
        "La fecha de nacimiento no es válida": "The date of birth is not valid",
        "La altura debe estar entre 50 y 250 cm": "Height must be between 50 and 250 cm",
        "La especialidad es muy larga (máximo 70 caracteres)": "The specialty is too long (max 70 characters)",
        "\"Sobre mí\" admite hasta 500 caracteres": "\"About me\" allows up to 500 characters",
        "No se pudo actualizar el perfil": "Couldn't update the profile",
        "No se recibió ninguna foto": "No photo was received",
        "La foto pesa más de 2 MB": "The photo is larger than 2 MB",
        "No se pudo guardar la foto": "Couldn't save the photo",
        "El socio no es valido": "The member is not valid",
        "Agrega al menos un ejercicio": "Add at least one exercise",
        "Revisa los datos de los ejercicios": "Check the exercise details",
        "No se pudieron cargar las rutinas": "Couldn't load the routines",
        "No se pudo crear la rutina": "Couldn't create the routine",
        "No se pudo actualizar la rutina": "Couldn't update the routine",
        "Completá título y fechas": "Fill in the title and dates",
        "No se pudo guardar el objetivo": "Couldn't save the goal",
        "Completá nombre, email y estado con datos válidos": "Enter a valid name, email and status",
        "Ingresá un peso válido": "Enter a valid weight",
        "Peso registrado": "Weight recorded",
        "No se pudo guardar el peso": "Couldn't save the weight",
        "La asistencia de hoy ya está registrada": "Today's attendance is already recorded",
        "Asistencia registrada": "Attendance recorded",
        "No se pudo registrar la asistencia": "Couldn't record attendance",
        "Tenes que iniciar sesión para escribir una reseña": "You have to log in to write a review",
        "El comentario es obligatorio (máximo 500 caracteres)": "The comment is required (max 500 characters)",
        "No se pudo guardar la reseña": "Couldn't save the review",
        "Elegir imagen": "Choose image",
        "Ningún archivo seleccionado": "No file selected",
        "Cantidad": "Quantity",
        "Pago en recepción": "Pay at the front desk",
        "Efectivo": "Cash",
        "Tarjeta": "Card",
        "Transferencia": "Bank transfer",
        "Reservar compra": "Reserve purchase",
        "Sin stock": "Out of stock",
        "¡Reserva hecha! Pagá y retirá tu producto en recepción.": "Reservation done! Pay and pick up your product at the front desk.",
        "No se pudo registrar la compra.": "Couldn't register the purchase.",
        "No se pudo registrar la compra": "Couldn't register the purchase",
        "Solo los socios pueden comprar": "Only members can buy",
        "La cantidad tiene que ser entre 1 y 10": "Quantity must be between 1 and 10",
        "Elegí un método de pago válido": "Choose a valid payment method",
        "Reservá y retiralo en el gimnasio": "Reserve it and pick it up at the gym",
        "Hacé tu reserva online y retirá tu producto en el mostrador cuando vengas a entrenar.": "Book online and pick up your product at the front desk when you come to train.",
        "Todo lo que necesitás para tu entrenamiento. Reservá online y retirá en recepción.": "Everything you need for your training. Book online and pick up at the front desk.",
        "Ver más productos": "See more products",
        "Iniciá sesión": "Log in",
        "Tu puntuación": "Your rating",
        "Contanos qué te pareció el producto": "Tell us what you thought of the product",
        "Editar rutina": "Edit routine",
        "Ingresá un nombre para la rutina.": "Enter a name for the routine.",
        "Agregá al menos un ejercicio.": "Add at least one exercise.",
        "No se pudo guardar la rutina.": "Couldn't save the routine.",
        "Solo podés editar las rutinas que creaste.": "You can only edit routines you created.",
        "Solo podés editar las rutinas que creaste": "You can only edit routines you created",
        "Rutina actualizada": "Routine updated",
        "Página anterior": "Previous page",
        "Página siguiente": "Next page",
        "Tu sesión se cerró por inactividad. Iniciá sesión de nuevo.": "Your session was closed due to inactivity. Please log in again.",
        "Eliminar socio": "Delete member",
        "Sí, eliminar": "Yes, delete",
        "Se borran para siempre su cuenta, rutinas, progreso, asistencias, reseñas y compras.": "Their account, routines, progress, attendance, reviews and purchases will be permanently deleted.",
        "No se pudo eliminar al socio": "Couldn't delete the member",
        "Eliminar entrenador": "Delete trainer",
        "No tiene socios asignados.": "Has no assigned members.",
        "No se pudo eliminar el entrenador": "Couldn't delete the trainer",
        "Eliminar producto": "Delete product",
        "No se puede eliminar: el producto tiene compras asociadas": "Can't delete: the product has purchases",
        "No se pudo eliminar el producto": "Couldn't delete the product",
        "Todos los estados": "All statuses",
        "Activos": "Active",
        "Vencidos": "Expired",
        "Sin plan": "No plan",
    };

    const unidades = { "día": "day", "días": "days", "semana": "week", "semanas": "weeks", "mes": "month", "meses": "months", "año": "year", "años": "years" };
    const d = (x) => en[x] !== undefined ? en[x] : x;
    const plural = (n, s, p) => n + " " + (n === "1" ? s : p);

    // Textos con partes variables: [expresión regular, función que arma el texto en inglés].
    const patrones = [
        [/^(\d+) ejercicios?$/, (n) => plural(n, "exercise", "exercises")],
        [/^(\d+) \/ (\d+) ejercicios$/, (a, b) => a + " / " + b + " exercises"],
        [/^Total: (\d+) ejercicios?$/, (n) => "Total: " + plural(n, "exercise", "exercises")],
        [/^(\d+) series - (\d+) rep - (\d+) seg$/, (a, b, c) => a + " sets - " + b + " reps - " + c + " sec"],
        [/^Rutina #(\d+)$/, (n) => "Routine #" + n],
        [/^Rutina: (.+)$/, (x) => "Routine: " + d(x)],
        [/^Día de entrenamiento: (.+)$/, (x) => "Training day: " + d(x)],
        [/^Duración: (.+)$/, (x) => "Duration: " + x],
        [/^Válida hasta: (.+)$/, (x) => "Valid until: " + x],
        [/^Última medición: (.+)$/, (x) => "Last measurement: " + x],
        [/^Objetivo actual: (.*)$/, (x) => "Current goal: " + d(x)],
        [/^Hace (\d+) (día|días|semana|semanas|mes|meses|año|años)$/, (n, u) => n + " " + unidades[u] + " ago"],
        [/^(\d+) (reseña|reseñas)$/, (n) => plural(n, "review", "reviews")],
        [/^(\d+) de 5 estrellas$/, (n) => n + " of 5 stars"],
        [/^(\d+) unidades disponibles$/, (n) => n + " units available"],
        [/^(\d+) años$/, (n) => n + " years old"],
        [/^(\d+) días$/, (n) => n + " days"],
        [/^(.+) · (\d+) días$/, (p, n) => d(p) + " · " + n + " days"],
        [/^Stock actual: (\d+)$/, (n) => "Current stock: " + n],
        [/^([+-]\d+%?) este mes$/, (x) => x + " this month"],
        [/^Página (\d+) de (\d+) · (\d+) resultados$/, (a, b, c) => `Page ${a} of ${b} · ${c} results`],
        [/^· con (.+) \(se le quitará\)$/, (x) => `· with ${x} (will be removed)`],
        [/^El ejercicio se creó, pero la imagen no: (.*)$/, (x) => "The exercise was created, but the image wasn't: " + d(x)],
        [/^Error al guardar la rutina: (.*)$/, (x) => "Error saving the routine: " + d(x)],
        [/^Error al guardar el objetivo: (.*)$/, (x) => "Error saving the goal: " + d(x)],
        [/^Revisá las series, repeticiones y descanso de "(.+)"\.$/, (x) => `Check the sets, reps and rest of "${x}".`],
        [/^La hora de fin de (.+) tiene que ser después de la de inicio\.$/, (x) => `${x}'s end time must be after the start time.`],
        [/^Elegí una cantidad entre 1 y (\d+)\.$/, (n) => `Choose a quantity between 1 and ${n}.`],
        [/^Solo quedan (\d+) unidades$/, (n) => `Only ${n} units left`],
        [/^Página (\d+) de (\d+) · (\d+) resultados$/, (a, b, c) => `Page ${a} of ${b} · ${c} results`],
                [/^Tu sesión se cerrará en (\d+) segundos por inactividad\. Mové el mouse o tocá una tecla para seguir\.$/, (n) => `Your session will close in ${n} seconds due to inactivity. Move the mouse or press a key to continue.`],
    ];

    // Atributos que también se traducen (placeholder, title, etc.).
    const atributos = ["placeholder", "title", "aria-label", "alt"];
    const textos = new WeakMap();
    const attrs = new WeakMap();
    let idioma = localStorage.getItem("idioma") === "en" ? "en" : "es";
    let tituloOriginal = null;

    // Busca la traducción de un texto: primero en el diccionario y después en los patrones.
    function traducir(texto) {
        const limpio = texto.replace(/\s+/g, " ").trim();
        if (!limpio) {
            return texto;
        }
        let res = en[limpio];
        if (res === undefined) {
            for (const [re, fn] of patrones) {
                const m = limpio.match(re);
                if (m) {
                    res = fn(...m.slice(1));
                    break;
                }
            }
        }
        if (res === undefined && limpio.includes(", ")) {
            const partes = limpio.split(", ").map(p => en[p]);
            if (partes.every(p => p !== undefined)) {
                res = partes.join(", ");
            }
        }
        if (res === undefined) {
            return texto;
        }
        return texto.match(/^\s*/)[0] + res + texto.match(/\s*$/)[0];
    }

    // Traduce (o restaura) un nodo de texto, guardando el original.
    function procesarTexto(nodo) {
        const padre = nodo.parentNode;
        if (!padre || padre.nodeName === "SCRIPT" || padre.nodeName === "STYLE") {
            return;
        }
        const reg = textos.get(nodo);
        if (idioma === "en") {
            if (reg && nodo.nodeValue === reg.traducido) {
                return;
            }
            const traducido = traducir(nodo.nodeValue);
            if (traducido !== nodo.nodeValue) {
                textos.set(nodo, { original: nodo.nodeValue, traducido: traducido });
                nodo.nodeValue = traducido;
            }
        } else if (reg && nodo.nodeValue === reg.traducido) {
            nodo.nodeValue = reg.original;
            textos.delete(nodo);
        }
    }

    // Igual que procesarTexto, pero para un atributo.
    function procesarAtributo(el, nombre) {
        const valor = el.getAttribute(nombre);
        if (valor === null) {
            return;
        }
        const regs = attrs.get(el) || {};
        const reg = regs[nombre];
        if (idioma === "en") {
            if (reg && valor === reg.traducido) {
                return;
            }
            const traducido = traducir(valor);
            if (traducido !== valor) {
                regs[nombre] = { original: valor, traducido: traducido };
                attrs.set(el, regs);
                el.setAttribute(nombre, traducido);
            }
        } else if (reg && valor === reg.traducido) {
            el.setAttribute(nombre, reg.original);
            delete regs[nombre];
        }
    }

    // Recorre todos los textos y atributos de un elemento y sus hijos.
    function recorrer(raiz) {
        if (raiz.nodeType === 3) {
            procesarTexto(raiz);
            return;
        }
        if (raiz.nodeType !== 1) {
            return;
        }
        const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
        const nodos = [];
        while (caminante.nextNode()) {
            nodos.push(caminante.currentNode);
        }
        nodos.forEach(procesarTexto);
        const elementos = [raiz, ...raiz.querySelectorAll("[placeholder],[title],[aria-label],[alt]")];
        elementos.forEach(el => atributos.forEach(a => procesarAtributo(el, a)));
    }

    function aplicarTitulo() {
        if (tituloOriginal === null) {
            tituloOriginal = document.title;
        }
        document.title = idioma === "en" ? traducir(tituloOriginal) : tituloOriginal;
    }

    function aplicar() {
        document.documentElement.lang = idioma;
        aplicarTitulo();
        recorrer(document.body);
    }

    // Cambia el idioma, lo guarda y vuelve a traducir la página.
    function cambiarIdioma(nuevo) {
        idioma = nuevo;
        localStorage.setItem("idioma", idioma);
        aplicar();
    }

    // Conecta el botón EN/ES, traduce la página y empieza a observar cambios.
    function iniciar() {
        const boton = document.getElementById("btnIdioma");
        if (boton) {
            boton.textContent = idioma === "en" ? "ES" : "EN";
            boton.addEventListener("click", () => {
                cambiarIdioma(idioma === "en" ? "es" : "en");
                boton.textContent = idioma === "en" ? "ES" : "EN";
            });
        }

        aplicar();

        new MutationObserver((cambios) => {
            for (const c of cambios) {
                if (c.type === "childList") {
                    c.addedNodes.forEach(recorrer);
                } else if (c.type === "characterData") {
                    procesarTexto(c.target);
                } else if (c.type === "attributes") {
                    procesarAtributo(c.target, c.attributeName);
                }
            }
        }).observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: atributos
        });
    }

    // Los alert() y confirm() también se muestran traducidos.
    const alertOriginal = window.alert.bind(window);
    window.alert = (mensaje) => alertOriginal(idioma === "en" ? traducir(String(mensaje)) : mensaje);
    const confirmOriginal = window.confirm.bind(window);
    window.confirm = (mensaje) => confirmOriginal(idioma === "en" ? traducir(String(mensaje)) : mensaje);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
