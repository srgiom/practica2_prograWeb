import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

const resolvers = {
  products: async () => {
    return await Product.find();
  },

  orders: async (args, req) => {
    const user = req?.user;
    if (!user || user.role !== "admin") {
      throw new Error("No autorizado");
    }

    const orders = await Order.find()
      .populate("user")
      .populate("items.product");

    // 🔧 CONVERSIÓN createdAt → string (buildSchema)
    return orders.map(o => {
      const obj = o.toObject();
      return {
        ...obj,
        createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
      };
    });
  },

  createOrder: async ({ items }, req) => {
    const user = req?.user;
    if (!user) {
      throw new Error("No autenticado");
    }

    let total = 0;
    const populatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error("Producto no encontrado");

      total += product.precio * item.quantity;
      populatedItems.push({
        product,
        quantity: item.quantity
      });
    }

    const order = new Order({
      user: user._id,
      items: populatedItems,
      total,
      status: "pending"
    });

    await order.save();

    const saved = await Order.findById(order._id)
      .populate("items.product")
      .populate("user");

    const obj = saved.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  // =======================
  // AÑADIDO PRACTICA 2
  // =======================

  users: async (args, req) => {
    const user = req?.user;
    if (!user || user.role !== "admin") {
      throw new Error("No autorizado");
    }
    return await User.find();
  },

  updateUserRole: async ({ userId, role }, req) => {
    const userReq = req?.user;
    if (!userReq || userReq.role !== "admin") {
      throw new Error("No autorizado");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // 🔒 Bloquear SOLO el usuario admin “raíz”
    if (user.username === "admin") {
      throw new Error("No se puede cambiar el rol del usuario admin");
    }

    user.role = role;
    await user.save();

    return user;
  },

  updateOrderStatus: async (args, req) => {
    const user = req?.user;
    const { orderId, status } = args;

    if (!user || user.role !== "admin") {
      throw new Error("No autorizado");
    }

    if (!["pending", "completed"].includes(status)) {
      throw new Error("Estado inválido");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    order.status = status;
    await order.save();

    const updated = await Order.findById(orderId)
      .populate("user")
      .populate("items.product");

    const obj = updated.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  order: async (args, req) => {
    const user = req?.user;
    const { id } = args;

    if (!user || user.role !== "admin") {
      throw new Error("No autorizado");
    }

    const order = await Order.findById(id)
      .populate("user")
      .populate("items.product");

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    const obj = order.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  myOrders: async (args, req) => {
    const user = req?.user;
    if (!user) {
      throw new Error("No autenticado");
    }

    const orders = await Order.find({ user: user._id })
      .populate("items.product")
      .populate("user")
      .sort({ createdAt: -1 });

    return orders.map(o => {
      const obj = o.toObject();
      return {
        ...obj,
        createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
      };
    });
  },

  deleteUser: async ({ userId }, req) => {
    const userReq = req?.user;
    if (!userReq || userReq.role !== "admin") {
      throw new Error("No autorizado");
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      throw new Error("Usuario no encontrado");
    }

    if (userToDelete.username === "admin") {
      throw new Error("No se puede eliminar el usuario admin");
    }

    const res = await User.findByIdAndDelete(userId);
    return !!res;
  },

  myOrder: async ({ id }, req) => {
    const user = req?.user;
    if (!user) {
      throw new Error("No autenticado");
    }

    const order = await Order.findOne({
      _id: id,
      user: user._id
    })
      .populate("items.product")
      .populate("user");

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    const obj = order.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  }
};

export default resolvers;