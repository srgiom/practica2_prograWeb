import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

const resolvers = {
  products: async () => {
    return await Product.find();
  },

  orders: async (args, context) => {
    if (!context.user || context.user.role !== "admin") {
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

  createOrder: async ({ items }, context) => {
    if (!context.user) {
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
      user: context.user._id,
      items: populatedItems,
      total,
      status: "pending"
    });

    await order.save();

    const saved = await Order.findById(order._id)
      .populate("items.product")
      .populate("user");

    // 🔧 CONVERSIÓN createdAt → string
    const obj = saved.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  // =======================
  // AÑADIDO PRACTICA 2
  // =======================

  users: async (args, context) => {
    if (!context.user || context.user.role !== "admin") {
      throw new Error("No autorizado");
    }
    return await User.find();
  },

  updateUserRole: async ({ userId, role }, context) => {
    if (!context.user || context.user.role !== "admin") {
      throw new Error("No autorizado");
    }

    if (context.user._id === userId) {
      throw new Error("No puedes cambiar tu propio rol");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) throw new Error("Usuario no encontrado");
    return user;
  },

  updateOrderStatus: async (args, context) => {
    const { orderId, status } = args;

    if (!context.user || context.user.role !== "admin") {
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

    // 🔧 CONVERSIÓN createdAt → string
    const obj = updated.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  order: async (args, context) => {
    const { id } = args;

    if (!context.user || context.user.role !== "admin") {
      throw new Error("No autorizado");
    }

    const order = await Order.findById(id)
      .populate("user")
      .populate("items.product");

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    // 🔧 CONVERSIÓN createdAt → string
    const obj = order.toObject();
    return {
      ...obj,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null
    };
  },

  myOrders: async (args, context) => {
  if (!context.user) {
    throw new Error("No autenticado");
  }

  const orders = await Order.find({ user: context.user._id })
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

  deleteUser: async ({ userId }, context) => {
    if (!context.user || context.user.role !== "admin") {
      throw new Error("No autorizado");
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      throw new Error("Usuario no encontrado");
    }

    if (userToDelete.role === "admin") {
      throw new Error("No se puede eliminar un administrador");
    }

    const res = await User.findByIdAndDelete(userId);
    return !!res;
  }
};

export default resolvers;