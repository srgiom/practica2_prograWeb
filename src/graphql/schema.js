import { buildSchema } from "graphql";

const schema = buildSchema(`
  type Product {
    _id: ID!
    nombre: String!
    precio: Float!
    descripcion: String
    imagen: String
  }

  type OrderItem {
    product: Product!
    quantity: Int!
  }

  type Order {
    _id: ID!
    user: User!
    items: [OrderItem!]!
    total: Float!
    status: String!
    createdAt: String!
  }

  # =======================
  # AÑADIDO PRACTICA 2
  # =======================
  type User {
    _id: ID!
    username: String!
    role: String!
    color: String
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  type Query {
    products: [Product!]!
    orders: [Order!]!
    order(id: ID!): Order
    users: [User!]!
    myOrders: [Order!]!
  }

  type Mutation {
    createOrder(items: [OrderItemInput!]!): Order!
    updateUserRole(userId: ID!, role: String!): User!
    deleteUser(userId: ID!): Boolean!

    updateOrderStatus(orderId: ID!, status: String!): Order!
  }

`);

export default schema;