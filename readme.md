# 🧾 Portal de Productos — Práctica 2

## 👨‍💻 Datos
**Nombre:** Sergio Moreno  
**Asignatura:** Programación Web  

---

## 🎯 Objetivo de la práctica 2

Ampliar la aplicación desarrollada en la **Práctica 1** incorporando:

- Sistema completo de **pedidos (Orders)**.
- **Carrito de compra** persistente.
- Gestión de pedidos para **usuarios** y **administradores**.
- Gestión de **usuarios (admin)**.
- API **GraphQL** protegida por JWT.

Manteniendo:
- Persistencia en base de datos.
- Control de roles.
- Seguridad y validación en backend y frontend.

---

## ⚙️ Instalación y ejecución local

### 📋 Requisitos
- Node.js 18+
- MongoDB 

### 🧰 Instalación
```bash
npm install

▶️ Ejecutar

npm start

Acceso local: http://localhost:3000

⸻

🧩 Estructura del proyecto

src/
 ├── models/
 │   ├── User.js
 │   ├── Product.js
 │   ├── Order.js          ← NUEVO (Práctica 2)
 │   └── ChatMessage.js
 ├── routes/
 │   ├── authRoutes.js
 │   ├── productRoutes.js
 │   └── chatRoutes.js
 ├── graphql/
 │   ├── schema.js         ← NUEVO
 │   └── resolvers.js      ← NUEVO
 ├── middleware/
 │   └── authenticateJWT.js
 ├── public/
 │   ├── index.html
 │   ├── chat.html
 │   ├── client.js
 │   └── styles.css
 ├── server.js
 └── config.js
.env


⸻

🔐 Autenticación y roles
	•	Autenticación mediante JWT.
	•	Token almacenado en localStorage.
	•	Roles disponibles:
	•	user
	•	admin

El rol se valida:
	•	En backend (middlewares y resolvers GraphQL).
	•	En frontend (visibilidad y acciones permitidas).

⸻

🛒 Carrito de compra (Práctica 2)
	•	Visible solo para usuarios autenticados.
	•	Persistente en localStorage.
	•	Funcionalidades:
	•	Añadir productos.
	•	Eliminar productos.
	•	Calcular total.
	•	Vaciar carrito tras compra.
	•	La compra genera un pedido real en base de datos vía GraphQL.

⸻

📦 Modelo Order (Práctica 2)

Cada pedido contiene:
	•	Referencia al usuario.
	•	Array de productos:
	•	Producto
	•	Cantidad
	•	Precio en el momento de la compra
	•	Estado:
	•	pending
	•	completed
	•	Fecha de creación (createdAt).
	•	Total del pedido.

Persistido en MongoDB mediante Order.js.

⸻

👤 Historial de pedidos (User)

Cada usuario autenticado dispone de:
	•	Historial propio de pedidos.
	•	Solo puede ver sus pedidos.
	•	Información mostrada:
	•	Fecha
	•	Estado
	•	Total
	•	Persistente tras recargar la página.

Consulta realizada mediante GraphQL protegido por JWT.

⸻

🧑‍💼 Gestión de pedidos (Admin)

El administrador puede:
	•	Ver todos los pedidos del sistema.
	•	Filtrar pedidos por estado:
	•	pending
	•	completed
	•	Ver detalle completo del pedido:
	•	Usuario que lo realizó.
	•	Productos comprados.
	•	Cantidades y precios.
	•	Total.
	•	Fecha.
	•	Marcar pedidos como completed.

Todo gestionado desde el frontend con GraphQL.

⸻

👥 Gestión de usuarios (Admin)

El administrador puede:
	•	Listar todos los usuarios registrados.
	•	Eliminar usuarios no administradores.
	•	Cambiar rol de usuarios (user ↔ admin), con restricciones:
	•	❌ No puede cambiar su propio rol.
	•	❌ No puede eliminar un usuario con rol admin.

Restricciones validadas en backend y frontend.

⸻

🔗 API GraphQL (Práctica 2)
	•	Endpoint: /graphql
	•	Protegida por JWT (Authorization: Bearer <token>).
	•	Queries y mutations implementadas:
	•	orders
	•	order
	•	myOrders
	•	createOrder
	•	updateOrderStatus
	•	users
	•	updateUserRole
	•	deleteUser

⸻

💬 Chat en tiempo real (Práctica 1 mantenida)
	•	Chat con Socket.IO.
	•	Persistencia en MongoDB.
	•	Envío de texto e imágenes.
	•	Usuarios autenticados.
	•	Historial persistente.

⸻

💾 Persistencia de datos
	•	Usuarios: MongoDB + bcrypt.
	•	Productos: MongoDB (imágenes Base64).
	•	Pedidos: MongoDB (Order).
	•	Chat: MongoDB.
	•	Ningún dato se pierde tras recargar o redeployar.

⸻

🧠 Decisiones técnicas destacadas
	•	Arquitectura modular.
	•	Separación clara REST / GraphQL.
	•	JWT compartido entre REST, GraphQL y Socket.IO.
	•	Seguridad en backend y frontend.
	•	Persistencia completa.
	•	Preparado para despliegue en Render.
