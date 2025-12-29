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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || "Login inválido"); return j.token;
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
const btnAuth = $("#btn-auth");     // único botón de acción
const btnToggle = $("#btn-toggle"); // alternar modo
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

let mode = "login"; // "login" o "register"
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

    // Ver detalle
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
  } else {
    window.__role = "guest";
    userPill.classList.add("hidden");
    btnLogout.classList.add("hidden");
    authCard.classList.remove("hidden");
  }

  await loadProducts();
}

document.getElementById("detail-close")?.addEventListener("click", () => close(modalDetail));
updateAuthUI();
boot();
