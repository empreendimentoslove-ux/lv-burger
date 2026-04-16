import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["customer", "motoboy", "admin"]).default("customer").notNull(),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  active: boolean("active").default(true).notNull(),
  blocked: boolean("blocked").default(false).notNull(), // bloqueado por falta de estoque
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ─── Stock Items ──────────────────────────────────────────────────────────────
export const stockItems = mysqlTable("stock_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("un").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  minQuantity: decimal("minQuantity", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockItem = typeof stockItems.$inferSelect;

// ─── Product Stock Composition ────────────────────────────────────────────────
export const productStock = mysqlTable("product_stock", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  stockItemId: int("stockItemId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
});

// ─── Cart Items ───────────────────────────────────────────────────────────────
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "pending_payment",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]).default("pending_payment").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pix"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }), // troco para dinheiro
  pixProofUrl: text("pixProofUrl"),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryCode: varchar("deliveryCode", { length: 6 }).notNull(), // código de confirmação
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  estimatedDelivery: timestamp("estimatedDelivery"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 200 }).notNull(),
  productPrice: decimal("productPrice", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  motoboyId: int("motoboyId"),
  status: mysqlEnum("status", [
    "waiting",
    "accepted",
    "in_route",
    "delivered",
  ]).default("waiting").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;

// ─── Shop Settings ────────────────────────────────────────────────────────────
export const shopSettings = mysqlTable("shop_settings", {
  id: int("id").autoincrement().primaryKey(),
  isOpen: boolean("isOpen").default(true).notNull(), // controle manual
  openTime: varchar("openTime", { length: 5 }).default("17:00").notNull(), // HH:mm
  closeTime: varchar("closeTime", { length: 5 }).default("00:00").notNull(), // HH:mm
  operatingDays: varchar("operatingDays", { length: 20 }).default("2,3,4,5,6,0").notNull(), // 0=domingo, 1=segunda, ..., 6=sábado (terça-domingo)
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopSettings = typeof shopSettings.$inferSelect;
