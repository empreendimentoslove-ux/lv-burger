import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  cartItems,
  categories,
  companyInfo,
  deliveries,
  InsertUser,
  orderItems,
  orders,
  productStock,
  products,
  promotions,
  shopSettings,
  stock,
  stockItems,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _lastConnectionAttempt = 0;
const CONNECTION_RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRY_ATTEMPTS = 5;

async function createPool(): Promise<mysql.Pool> {
  if (!process.env.DATABASE_URL) {
    throw new Error("[Database] DATABASE_URL not set");
  }

  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 30000, // 30 seconds
  });

  // Test the pool connection
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  
  console.log("[Database] Pool created successfully");
  return pool;
}

export async function getDb() {
  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL not set");
    return null;
  }

  // If we have a working connection, return it
  if (_db && _pool) {
    try {
      // Test the connection with a simple query
      await _db.select().from(users).limit(1);
      return _db;
    } catch (error) {
      console.warn("[Database] Connection test failed, attempting to reconnect:", error);
      _db = null;
      _pool = null;
    }
  }

  // Prevent rapid reconnection attempts
  const now = Date.now();
  if (now - _lastConnectionAttempt < CONNECTION_RETRY_DELAY) {
    console.warn("[Database] Reconnection attempt too soon, waiting...");
    return null;
  }

  _lastConnectionAttempt = now;

  // Try to establish a new connection
  let attempts = 0;
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      // Close old pool if exists
      if (_pool) {
        await _pool.end();
        _pool = null;
      }

      // Create new pool
      _pool = await createPool();
      _db = drizzle(_pool);

      // Test the connection
      await _db.select().from(users).limit(1);
      console.log("[Database] Successfully connected with connection pool");
      return _db;
    } catch (error) {
      attempts++;
      console.warn(
        `[Database] Connection attempt ${attempts}/${MAX_RETRY_ATTEMPTS} failed:`,
        error
      );
      if (attempts < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 16000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    "[Database] Failed to connect after",
    MAX_RETRY_ATTEMPTS,
    "attempts"
  );
  _db = null;
  _pool = null;
  return null;
}

// Graceful shutdown
export async function closeDb() {
  if (_pool) {
    try {
      await _pool.end();
      console.log("[Database] Connection pool closed");
    } catch (error) {
      console.error("[Database] Error closing pool:", error);
    }
    _pool = null;
    _db = null;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  await db
    .insert(users)
    .values(values as any)
    .onDuplicateKeyUpdate({ set: updateSet as any });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId));
  return result[0] || null;
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  return await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(categories.createdAt);
}

export async function getCategoryById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.active, true)));
  return result[0] || null;
}

export async function createCategory(name: string, description: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const id = crypto.randomUUID();
  await db.insert(categories).values({
    id,
    name,
    description,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, name, description, active: true };
}

export async function updateCategory(
  id: string,
  name: string,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(categories)
    .set({ name, description, updatedAt: new Date() })
    .where(eq(categories.id, id));
  return { id, name, description };
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(categories)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(categories.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getAllProducts() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  return await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.createdAt);
}

export async function getProductById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.active, true)));
  return result[0] || null;
}

export async function createProduct(
  categoryId: string,
  name: string,
  description: string,
  price: number,
  imageUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const id = crypto.randomUUID();
  await db.insert(products).values({
    id,
    categoryId,
    name,
    description,
    price,
    imageUrl,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, categoryId, name, description, price, imageUrl, active: true };
}

export async function updateProduct(
  id: string,
  categoryId: string,
  name: string,
  description: string,
  price: number,
  imageUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(products)
    .set({
      categoryId,
      name,
      description,
      price,
      imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));
  return { id, categoryId, name, description, price, imageUrl };
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(products)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(products.id, id));
}

// ─── Cart Items ───────────────────────────────────────────────────────────────
export async function getCartItems(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  return await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.sessionId, sessionId));
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const id = crypto.randomUUID();
  await db.insert(cartItems).values({
    id,
    sessionId,
    productId,
    quantity,
    createdAt: new Date(),
  });
}

export async function updateCartItem(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, id));
}

export async function removeFromCart(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db.delete(cartItems).where(eq(cartItems.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(
  userId: string,
  totalPrice: number,
  status: string,
  items: Array<{ productId: string; quantity: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const orderId = crypto.randomUUID();
  await db.insert(orders).values({
    id: orderId,
    userId,
    totalPrice,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  for (const item of items) {
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  return orderId;
}

export async function getOrdersByUserId(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt);
}

export async function getOrderById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const order = await db.select().from(orders).where(eq(orders.id, id));
  if (!order[0]) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return { ...order[0], items };
}

// ─── Company Info ─────────────────────────────────────────────────────────────
export async function getCompanyInfo() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db.select().from(companyInfo).limit(1);
  return result[0] || null;
}

export async function updateCompanyInfo(data: {
  name?: string;
  logo?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: Record<string, { open: string; close: string }>;
  isOpen?: boolean;
  manualOverride?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const existing = await getCompanyInfo();

  if (existing) {
    await db
      .update(companyInfo)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(companyInfo.id, existing.id));
  } else {
    await db.insert(companyInfo).values({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export async function getAllPromotions() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  return await db
    .select()
    .from(promotions)
    .where(eq(promotions.active, true))
    .orderBy(promotions.createdAt);
}

export async function createPromotion(data: {
  title: string;
  description: string;
  imageUrl: string;
  discount: number;
  startDate: Date;
  endDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const id = crypto.randomUUID();
  await db.insert(promotions).values({
    id,
    ...data,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, ...data, active: true };
}

export async function updatePromotion(
  id: string,
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    discount?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(promotions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(promotions.id, id));
}

export async function deletePromotion(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(promotions)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(promotions.id, id));
}

// ─── Stock Management ──────────────────────────────────────────────────────────
export async function getStockByProductId(productId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db
    .select()
    .from(stock)
    .where(eq(stock.productId, productId));
  return result;
}

export async function createStock(productId: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const id = crypto.randomUUID();
  await db.insert(stock).values({
    id,
    productId,
    quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, productId, quantity };
}

export async function updateStock(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db
    .update(stock)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(stock.id, id));
}

export async function deleteStock(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  await db.delete(stock).where(eq(stock.id, id));
}

// ─── Shop Settings ────────────────────────────────────────────────────────────
export async function getShopSettings() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const result = await db.select().from(shopSettings).limit(1);
  return result[0] || null;
}

export async function updateShopSettings(data: {
  isOpen?: boolean;
  manualOverride?: boolean;
  operatingDays?: number[];
  openTime?: string;
  closeTime?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");

  const existing = await getShopSettings();

  if (existing) {
    await db
      .update(shopSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, existing.id));
  } else {
    await db.insert(shopSettings).values({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Re-export Drizzle utilities
export { eq, and, or } from "drizzle-orm";

// ─── Missing Functions (Stub Implementations) ──────────────────────────────────

export async function getAllOrders() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  return await db.select().from(orders).orderBy(orders.createdAt);
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  return await db.select().from(users);
}

export async function getAllStock() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  return await db.select().from(stock);
}

export async function getCategories() {
  return await getAllCategories();
}

export async function getProducts() {
  return await getAllProducts();
}

export async function getActivePromotions() {
  return await getAllPromotions();
}

export async function getPromotionById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  const result = await db
    .select()
    .from(promotions)
    .where(and(eq(promotions.id, id), eq(promotions.active, true)));
  return result[0] || null;
}

export async function getOrdersByUser(userId: string) {
  return await getOrdersByUserId(userId);
}

export async function getOrderItems(orderId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  return await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

export async function addCartItem(sessionId: string, productId: string, quantity: number) {
  return await addToCart(sessionId, productId, quantity);
}

export async function clearCart(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
}

export async function updateOrderStatus(orderId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserRole(userId: string, role: string) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function isShopOpen() {
  const settings = await getShopSettings();
  if (!settings) return true;
  
  if (settings.manualOverride) {
    return settings.isOpen ?? true;
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;

  const operatingDays = settings.operatingDays || [2, 3, 4, 5, 6, 0];
  if (!operatingDays.includes(dayOfWeek)) {
    return false;
  }

  const openTime = settings.openTime || "10:00";
  const closeTime = settings.closeTime || "22:00";

  return currentTime >= openTime && currentTime < closeTime;
}

// Delivery functions (stubs for now)
export async function startDeliveryRoute(motoboyCpf: string) {
  return { success: true };
}

export async function getAvailableDeliveries() {
  return [];
}

export async function getDeliveriesByMotoboy(motoboyId: string) {
  return [];
}

export async function getDeliveryByOrderId(orderId: string) {
  return null;
}

export async function acceptDelivery(deliveryId: string, motoboyId: string) {
  return { success: true };
}

export async function confirmDelivery(deliveryId: string) {
  return { success: true };
}

// Stock items functions
export async function getStockItems() {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  return await db.select().from(stockItems);
}

export async function createStockItem(stockId: string, name: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  const id = crypto.randomUUID();
  await db.insert(stockItems).values({
    id,
    stockId,
    name,
    quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, stockId, name, quantity };
}

export async function updateStockItem(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("[Database] Connection failed");
  await db
    .update(stockItems)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(stockItems.id, id));
}

// Report functions
export async function getDailyReport(date: Date) {
  return { orders: 0, revenue: 0, date };
}

export async function getSalesReport(startDate: Date, endDate: Date) {
  return { totalSales: 0, totalOrders: 0, startDate, endDate };
}
