# 🧾 Portal de Productos — Práctica 1

## 👨‍💻 Datos
**Nombre:** Sergio Moreno  
**Asignatura:** Programación Web  

---

## 🌐 Enlace al proyecto desplegado

🔗 **Código de la aplicación:**  
👉 https://github.com/srgiom/practica1_prograWeb

🔗 **Aplicación en producción:**  
👉 [https://practica1-prograweb.onrender.com/index.html](https://practica1-prograweb.onrender.com/index.html)

El proyecto está desplegado en **Render**, conectado a **MongoDB Atlas**, y funciona completamente online con autenticación, CRUD de productos, chat en tiempo real y subida de imágenes persistente.

---

## 🎯 Objetivo de la práctica

Desarrollar una aplicación web completa (**frontend + backend**) que permita:

- Autenticación de usuarios mediante **JWT**.  
- Gestión de roles (`admin` y `user`).  
- CRUD completo de productos con persistencia en **MongoDB Atlas**.  
- Un **chat en tiempo real** con **Socket.IO**.  

Además, se añadieron mejoras:

1. **Persistencia del historial del chat** en la base de datos.  
2. **Subida de imágenes** en productos (almacenadas en Mongo en formato Base64).  
3. **Envío de imágenes en el chat**.  

---

## ⚙️ Instalación y ejecución local

### 📋 Requisitos previos
- [Node.js 18+](https://nodejs.org/en/)  
- Una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 🧰 Instalación

```bash
# 1. Clonar el repositorio
cd portal-productos

# 2. Instalar dependencias
npm install

# 3. Configurar las variables de entorno (.env)
PORT=3000
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/portal
JWT_SECRET=clave-ultrasecreta
JWT_EXPIRES=2h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ALLOW_ADMIN_REGISTER=true

# 4. Iniciar el servidor
npm start

Luego abre en el navegador:
👉 http://localhost:3000￼

⸻

🧩 Estructura del proyecto

src/
 ├── models/
 │   ├── User.js
 │   ├── Product.js
 │   └── ChatMessage.js
 ├── routes/
 │   ├── authRoutes.js
 │   ├── productRoutes.js
 │   └── chatRoutes.js
 ├── middleware/
 │   └── authenticateJWT.js
 ├── public/
 │   ├── index.html       ← Portal de productos
 │   ├── chat.html        ← Chat en tiempo real
 │   ├── client.js        ← Lógica del frontend
 │   └── styles.css       ← Tema oscuro y diseño visual
 ├── config.js
 └── server.js
.env


⸻

🟩 1. Registro y login
	1.	Accede a http://localhost:3000￼ o al despliegue online.
	2.	Regístrate con un nuevo usuario o entra como admin (admin/admin).
	3.	Se genera un token JWT almacenado en localStorage.
	4.	El rol se muestra en la esquina superior derecha.

⸻

🟦 2. Gestión de productos (CRUD)
	•	User: puede ver los productos existentes.
	•	Admin: puede crear, editar y eliminar productos.
	•	Cada producto incluye una imagen persistente, almacenada en MongoDB como Base64.

⸻

💬 3. Chat en tiempo real
	•	Acceso mediante el botón “Chat”.
	•	Solo usuarios autenticados pueden entrar (validación JWT en Socket.IO).
	•	Características:
	•	Mensajes con nombre, color, hora y texto.
	•	Indicador de usuarios conectados.
	•	Eventos de conexión/desconexión (🟢 / 🔴).
	•	Estado “escribiendo…” en tiempo real.
	•	Envío de imágenes (📎).
	•	Historial persistente.

⸻

🗃️ Persistencia de datos
	•	Usuarios: encriptados con bcryptjs.
	•	Productos: colección products (imágenes como Base64).
	•	Chat: colección chatmessages (mensajes y fotos como Base64).
	•	Todo permanece tras reiniciar o redeployar el servidor.

⸻

🧱 Decisiones de desarrollo

🔧 Arquitectura modular
	•	models/: define los esquemas de MongoDB.
	•	routes/: gestiona las rutas REST.
	•	middleware/: valida JWT y roles.
	•	public/: frontend servido por Express.
	•	server.js: núcleo (Express + Socket.IO + Mongo Atlas).

🔐 Autenticación JWT
	•	JWT en rutas REST y sockets.
	•	Incluye _id, username, role, color.
	•	Middlewares authenticateJWT y authorizeRole.

🧠 Roles y seguridad
	•	user: lectura.
	•	admin: CRUD completo.
	•	Validación tanto en backend como en frontend.

💾 Manejo de imágenes
	•	Imágenes convertidas a Base64 y guardadas directamente en MongoDB.
	•	Sin necesidad de carpetas /uploads, lo que permite despliegues en servidores sin disco persistente como Render.

⚙️ Chat con persistencia
	•	Mensajes (texto o imagen) guardados en MongoDB.
	•	Socket.IO mantiene la sincronización en tiempo real.

🎨 Interfaz
	•	Tema oscuro, diseño limpio y responsive.
	•	Animaciones suaves, botones redondeados, modales claros.
