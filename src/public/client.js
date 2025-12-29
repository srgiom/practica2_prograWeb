// -------------------- API --------------------
const API = {
  headersJSON() {
    const t = localStorage.getItem("jwt");
    return t ? { "Authorization": `Bearer ${t}` } : {};
  },
  headers() {
    const t = localStorage.getItem("jwt");
    return t
      ? { "Content-Type": "application/json", "Authorization": `Bearer ${t}` }
      : { "Content-Type": "application/json" };
  },
  async register(username, password, role = "user") {
    const r = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });
    const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || "Registro inválido"); return true;
  },
async login(username, password) {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const j = await r.json();
  if (!r.ok || !j.ok) {
    throw new Error(j.error || "Login inválido");
  }

  localStorage.setItem("jwt", j.token);

  return j.token;
},
  async me() {
    const r = await fetch("/api/auth/me", { headers: this.headers() });
    if (!r.ok) return null; const j = await r.json(); return j.user;
  },
  async listProducts() {
    const r = await fetch("/api/products", { headers: this.headersJSON() });
    return r.json();
  },
  async getProduct(id) {
    const r = await fetch(`/api/products/${id}`, { headers: this.headersJSON() });
    if (!r.ok) throw new Error("No encontrado"); return r.json();
  },
  async createProduct({ nombre, precio, descripcion, imagenFile }) {
    const fd = new FormData();
    fd.append("nombre", nombre);
    fd.append("precio", precio);
    fd.append("descripcion", descripcion);
    if (imagenFile) fd.append("imagen", imagenFile);
    const r = await fetch("/api/products", { method: "POST", headers: this.headersJSON(), body: fd });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || "No autorizado"); return j;
  },
  async updateProduct(id, { nombre, precio, descripcion, imagenFile }) {
    const fd = new FormData();
    if (nombre != null) fd.append("nombre", nombre);
    if (precio != null) fd.append("precio", precio);
    if (descripcion != null) fd.append("descripcion", descripcion);
    if (imagenFile) fd.append("imagen", imagenFile);
    const r = await fetch(`/api/products/${id}`, { method: "PUT", headers: this.headersJSON(), body: fd });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || "No se pudo editar"); return j;
  },
  async delProduct(id) {
    const r = await fetch(`/api/products/${id}`, { method: "DELETE", headers: this.headersJSON() });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || "No autorizado"); return j;
  }
};

// -------------------- DOM refs --------------------
const $ = (s) => document.querySelector(s);
const authCard = $("#auth-card");
const authMsg = $("#auth-msg");
const btnAuth = $("#btn-auth");
const btnToggle = $("#btn-toggle");
const btnLogout = $("#btn-logout");
const userPill = $("#user-pill");
const linkChat = $("#link-chat");

const list = $("#list");
const empty = $("#empty");

// Modales
const modalDetail = document.getElementById("modal-detail");
const detailBody = document.getElementById("detail-body");
const detailClose = document.getElementById("detail-close");

const modalEdit = document.getElementById("modal-edit");
const editTitle = document.getElementById("edit-title");
const fNombre = document.getElementById("f-nombre");
const fPrecio = document.getElementById("f-precio");
const fDesc = document.getElementById("f-desc");
const fImg = document.getElementById("f-img");
const editCancel = document.getElementById("edit-cancel");
const editSave = document.getElementById("edit-save");

let mode = "login";
let editingId = null;

// -------------------- Helpers UI --------------------
function open(el){ el.classList.remove("hidden"); }
function close(el){ el.classList.add("hidden"); }

function cacheBust(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

function asImgSrc(raw, bust = false) {
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  const url = (raw.startsWith("http") || raw.startsWith("/")) ? raw : ("/" + raw.replace(/^\/+/, ""));
  return bust ? cacheBust(url) : url;
}

// -------------------- Auth UI --------------------
function updateAuthUI() {
  $("#auth-title").textContent = mode === "login" ? "Iniciar sesión" : "Registro";
  btnAuth.textContent = mode === "login" ? "Entrar" : "Registrarme";
  btnToggle.textContent = mode === "login" ? "Cambiar a registro" : "Cambiar a login";
  authMsg.textContent = "";
}

btnToggle.onclick = () => {
  mode = mode === "login" ? "register" : "login";
  updateAuthUI();
};

btnAuth.onclick = async () => {
  try {
    const u = $("#u").value.trim();
    const p = $("#p").value;
    if (!u || !p) throw new Error("Rellena usuario y contraseña");

    if (mode === "login") {
      const token = await API.login(u, p);
      localStorage.setItem("jwt", token);

      console.log("JWT TOKEN:", token);

      authMsg.textContent = "Login correcto ✓";
      await boot();
    } else {
      const role = u === "admin" ? "admin" : "user";
      await API.register(u, p, role);
      authMsg.textContent = "Registro correcto. Inicia sesión.";
      mode = "login";
      updateAuthUI();
    }
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

btnLogout.onclick = () => { localStorage.removeItem("jwt"); location.reload(); };
linkChat.onclick = () => { location.href = "chat.html"; };

// -------------------- Productos --------------------
document.getElementById("btn-reload").onclick = loadProducts;

document.getElementById("btn-new").onclick = () => {
  editingId = null;
  editTitle.textContent = "Nuevo producto";
  fNombre.value = ""; fPrecio.value = ""; fDesc.value = ""; fImg.value = "";
  open(modalEdit);
};

editCancel.onclick = () => close(modalEdit);

editSave.onclick = async () => {
  try {
    const nombre = fNombre.value.trim();
    const precio = parseFloat(fPrecio.value || "0");
    const descripcion = fDesc.value.trim();
    const imagenFile = fImg.files && fImg.files[0] ? fImg.files[0] : null;
    if (!nombre) throw new Error("Nombre requerido");
    if (editingId) {
      await API.updateProduct(editingId, { nombre, precio, descripcion, imagenFile });
    } else {
      await API.createProduct({ nombre, precio, descripcion, imagenFile });
    }
    close(modalEdit);
    await loadProducts(true);
  } catch (e) { alert(e.message); }
};

async function loadProducts(forceBust = false) {
  const items = await API.listProducts();
  list.innerHTML = "";

  if (!items || items.length === 0) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  for (const p of items) {
    const li = document.createElement("li");
    li.className = "row item";

    const rawImg = p.imagen ?? p.image ?? p.foto ?? null;
    const thumb  = asImgSrc(rawImg, forceBust);

    const imgHTML = thumb
      ? `<img src="${thumb}" alt="" style="height:40px;width:40px;object-fit:cover;border-radius:8px;margin-right:8px;border:1px solid #1f2937">`
      : "";

    li.innerHTML =
      `<div class="grow row">
         ${imgHTML}
         <div>
           <div class="title">${p.nombre}</div>
           <div class="sub">${Number(p.precio).toFixed(2)} € — ${p.descripcion || ""}</div>
         </div>
       </div>
       <div class="actions">
         <button class="btn" data-act="view">Ver</button>
         <button class="btn success" data-role="admin" data-act="edit">Editar</button>
         <button class="btn danger" data-role="admin" data-act="del">Eliminar</button>
       </div>`;

    li.querySelector('[data-act="view"]').onclick = async () => {
      const d = await API.getProduct(p._id);
      const dImg = asImgSrc(d.imagen ?? d.image ?? d.foto, true);
      detailBody.innerHTML = `
        ${dImg ? `<div style="margin-bottom:10px"><img src="${dImg}" style="max-width:100%;border-radius:10px;border:1px solid #1f2937"></div>` : ""}
        <div><strong>Nombre:</strong> ${d.nombre}</div>
        <div><strong>Precio:</strong> ${Number(d.precio).toFixed(2)} €</div>
        <div><strong>Descripción:</strong> ${d.descripcion || ""}</div>`;
      open(modalDetail);
    };

    li.querySelector('[data-act="edit"]').onclick = () => {
      editingId = p._id;
      editTitle.textContent = "Editar producto";
      fNombre.value = p.nombre || "";
      fPrecio.value = p.precio != null ? p.precio : "";
      fDesc.value = p.descripcion || "";
      fImg.value = "";
      open(modalEdit);
    };

    li.querySelector('[data-act="del"]').onclick = async () => {
      if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
      await API.delProduct(p._id);
      await loadProducts(true);
    };

    const btnAddCart = document.createElement("button");
    btnAddCart.className = "btn ghost";
    btnAddCart.textContent = "Añadir al carrito";
    btnAddCart.onclick = () => addToCart(p);
    li.querySelector(".actions").appendChild(btnAddCart);

    if (!localStorage.getItem("jwt")) {
      btnAddCart.style.display = "none";
    }

    list.appendChild(li);
  }

  applyRoleVisibility();
}

function applyRoleVisibility() {
  const role = window.__role || "guest";
  document.querySelectorAll("[data-role]").forEach((el) => {
    const need = el.getAttribute("data-role");
    const visible = role === "admin";
    el.style.display = need === "admin" && !visible ? "none" : "";
  });
}

// -------------------- Boot --------------------
async function boot() {
  const token = localStorage.getItem("jwt");
  const user = token ? await API.me() : null;

  if (user) {
    window.__role = user.role;
    userPill.textContent = `${user.username} · ${user.role}`;
    userPill.style.background = user.color || "#334155";
    userPill.classList.remove("hidden");
    btnLogout.classList.remove("hidden");
    authCard.classList.add("hidden");
    btnCart.classList.remove("hidden");
renderCart();
  } else {
    window.__role = "guest";
    userPill.classList.add("hidden");
    btnLogout.classList.add("hidden");
    authCard.classList.remove("hidden");
  }

  await loadProducts();

  if (user.role === "admin") {
    document.getElementById("admin-orders").classList.remove("hidden");
    loadOrders();
  }
}

document.getElementById("detail-close")?.addEventListener("click", () => close(modalDetail));
updateAuthUI();
boot();

/* =========================================================
   === PRACTICA 2: CARRITO + CHECKOUT (AÑADIDO) ============
   ========================================================= */

// refs del modal carrito (ya existen en index.html)
const btnCart = document.getElementById("btn-cart");
const modalCart = document.getElementById("modal-cart");
const cartList = document.getElementById("cart-list");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const cartBuy = document.getElementById("cart-buy");
const cartClose = document.getElementById("cart-close");

// estado carrito
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function addToCart(product) {
  const f = cart.find(i => i._id === product._id);
  if (f) f.qty++;
  else cart.push({ _id: product._id, nombre: product.nombre, precio: product.precio, qty: 1 });
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i._id !== productId);
  saveCart();
}

function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += i.precio * i.qty;
    const li = document.createElement("li");
    li.className = "row item";

    li.innerHTML = `
      <div class="grow">
        <div class="title">${i.nombre}</div>
        <div class="sub">${i.qty} × ${i.precio} €</div>
      </div>
      <button class="btn danger">✕</button>
    `;

    // botón eliminar (AÑADIDO)
    li.querySelector("button").onclick = () => removeFromCart(i._id);

    cartList.appendChild(li);
  });

  cartTotal.textContent = total.toFixed(2);
  cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

// eventos modal
btnCart.onclick = () => { renderCart(); modalCart.classList.remove("hidden"); };
cartClose.onclick = () => modalCart.classList.add("hidden");

// CHECKOUT → GraphQL createOrder
cartBuy.onclick = async () => {
  if (!cart.length) return alert("Carrito vacío");

  const items = cart.map(i => ({ productId: i._id, quantity: i.qty }));
  const token = localStorage.getItem("jwt");
  if (!token) {
    alert("No autenticado");
    return;
  }

  const r = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation ($items:[OrderItemInput!]!) {
          createOrder(items:$items){ _id }
        }
      `,
      variables: { items },
      token // 👈 CLAVE: se envía también en el body
    })
  });

  const j = await r.json();
  if (j.errors) return alert(j.errors[0].message);

  cart = [];
  saveCart();
  modalCart.classList.add("hidden");
  alert("Pedido creado correctamente");
};

// ===== PRACTICA 2: ADMIN PEDIDOS =====
const ordersList = document.getElementById("orders-list");
const toggleCompleted = document.getElementById("toggle-completed");

async function loadOrders() {
  const token = localStorage.getItem("jwt");
  if (!token || window.__role !== "admin") return;

  const r = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        query {
          orders {
            _id
            total
            status
            createdAt
            user { username }
          }
        }
      `
    })
  });

  const j = await r.json();
  if (j.errors) return;

  ordersList.innerHTML = "";
  const showCompleted = toggleCompleted?.checked;

  j.data.orders.forEach(o => {
    if (o.status === "completed" && !showCompleted) return;
    const li = document.createElement("li");
    li.className = "row item";
    li.innerHTML = `
      <div class="grow">
        <div class="title">Pedido de ${o.user.username}</div>
        <div class="sub">
          Total: ${o.total} € | Estado: ${o.status}
        </div>
      </div>
      ${
        o.status === "pending"
          ? `<button class="btn success">Completar</button>`
          : ""
      }
    `;

    const btn = li.querySelector("button");
    if (btn) {
      btn.onclick = async () => {
        await updateOrderStatus(o._id, "completed");
        loadOrders();
      };
    }

    ordersList.appendChild(li);
  });

  document.getElementById("admin-orders").classList.remove("hidden");
}

async function updateOrderStatus(orderId, status) {
  const token = localStorage.getItem("jwt");

  await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation ($orderId: ID!, $status: String!) {
          updateOrderStatus(orderId: $orderId, status: $status) {
            _id
            status
          }
        }
      `,
      variables: { orderId, status }
    })
  });
}

// cargar pedidos al iniciar sesión admin
async function afterLoginAdmin() {
  if (window.__role !== "admin") return;
  await loadOrders();
}

// envolver boot existente
const __boot = boot;
boot = async () => {
  await __boot();
  await afterLoginAdmin();
};

toggleCompleted?.addEventListener("change", loadOrders);