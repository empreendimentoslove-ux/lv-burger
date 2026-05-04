import { and, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cartItems,
  categories,
  companyInfo,
  deliveries,
  deliveryZones,
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
let _lastConnectionAttempt = 0;
const CONNECTION_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_ATTEMPTS = 3;

export async function getDb() {
  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL not set");
    return null;
  }

  // If we have a connection, try to use it
  if (_db) {
    try {
      // Test the connection with a simple query
      await _db.select().from(users).limit(1);
      return _db;
    } catch (error) {
      console.warn("[Database] Connection lost, attempting to reconnect:", error);
      _db = null;
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
      _db = drizzle(process.env.DATABASE_URL);
      // Test the connection
      await _db.select().from(users).limit(1);
      console.log("[Database] Successfully connected");
      return _db;
    } catch (error) {
      attempts++;
      console.warn(`[Database] Connection attempt ${attempts}/${MAX_RETRY_ATTEMPTS} failed:`, error);
      if (attempts < MAX_RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("[Database] Failed to connect after", MAX_RETRY_ATTEMPTS, "attempts");
  _db = null;
  return null;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

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
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; phone?: string; avatarUrl?: string; address?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "customer" | "motoboy" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(categories).values(data);
  // Get the last inserted ID
  const inserted = await db.select().from(categories).where(eq(categories.slug, data.slug)).limit(1);
  return inserted[0];
}

export async function updateCategory(
  id: number,
  data: { name?: string; description?: string; imageUrl?: string; sortOrder?: number; active?: boolean }
) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(categories).set(data).where(eq(categories.id, id));
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set({ active: false }).where(eq(categories.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(products.active, true)];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(products.sortOrder);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.active, true)).orderBy(products.categoryId, products.sortOrder);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: {
  categoryId: number;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(products).values(data);
  // Get the last inserted ID by finding the product with matching name and categoryId
  const inserted = await db.select().from(products).where(eq(products.name, data.name)).orderBy(desc(products.id)).limit(1);
  return inserted[0];
}

export async function updateProduct(
  id: number,
  data: {
    categoryId?: number;
    name?: string;
    description?: string;
    price?: string;
    imageUrl?: string;
    active?: boolean;
    blocked?: boolean;
    sortOrder?: number;
  }
) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(products).set(data).where(eq(products.id, id));
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ active: false }).where(eq(products.id, id));
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  // Enrich with product info
  const enriched = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      return { ...item, product };
    })
  );
  return enriched;
}

export async function addCartItem(userId: number, productId: number, quantity: number, notes?: string) {
  const db = await getDb();
  if (!db) return;
  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity, notes: notes ?? existing[0].notes })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity, notes });
  }
}

export async function updateCartItem(id: number, userId: number, quantity: number, notes?: string) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity, notes })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `LV${timestamp}${random}`.substring(0, 12);
}

function generateDeliveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOrder(data: {
  userId: number;
  paymentMethod: "cash" | "pix";
  changeAmount?: string;
  deliveryAddress: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  notes?: string;
  items: Array<{
    productId: number;
    productName: string;
    productPrice: string;
    quantity: number;
    notes?: string;
    subtotal: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const orderNumber = generateOrderNumber();
  const deliveryCode = generateDeliveryCode();

  await db.insert(orders).values({
    orderNumber,
    userId: data.userId,
    paymentMethod: data.paymentMethod,
    changeAmount: data.changeAmount,
    deliveryAddress: data.deliveryAddress,
    deliveryCode,
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    total: data.total,
    notes: data.notes,
    status: "confirmed",
    paymentStatus: data.paymentMethod === "pix" ? "pending" : "pending",
  });

  // Get the created order
  const created = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const order = created[0];
  if (!order) throw new Error("Order creation failed");

  // Insert order items
  for (const item of data.items) {
    await db.insert(orderItems).values({ ...item, orderId: order.id });
  }

  // Create delivery record
  await db.insert(deliveries).values({ orderId: order.id });

  // Deduct stock
  await deductStockForOrder(data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  return order;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(
  id: number,
  status: "pending_payment" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
export async function getAvailableDeliveries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveries).where(eq(deliveries.status, "waiting")).orderBy(deliveries.createdAt);
}

export async function getDeliveryByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId)).limit(1);
  return result[0];
}

export async function getDeliveriesByMotoboy(motoboyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deliveries)
    .where(eq(deliveries.motoboyId, motoboyId))
    .orderBy(desc(deliveries.createdAt));
}

export async function acceptDelivery(deliveryId: number, motoboyId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(deliveries)
    .set({ motoboyId, status: "accepted", acceptedAt: new Date() })
    .where(and(eq(deliveries.id, deliveryId), eq(deliveries.status, "waiting")));
  // Update order status
  const delivery = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
  if (delivery[0]) {
    await updateOrderStatus(delivery[0].orderId, "out_for_delivery");
  }
}

export async function startDeliveryRoute(deliveryId: number, motoboyId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(deliveries)
    .set({ status: "in_route" })
    .where(and(eq(deliveries.id, deliveryId), eq(deliveries.motoboyId, motoboyId)));
}

export async function confirmDelivery(deliveryId: number, motoboyId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const delivery = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
  if (!delivery[0]) throw new Error("Entrega não encontrada");
  if (delivery[0].motoboyId !== motoboyId) throw new Error("Não autorizado");

  const order = await getOrderById(delivery[0].orderId);
  if (!order) throw new Error("Pedido não encontrado");
  if (order.deliveryCode !== code) throw new Error("Código de entrega inválido");

  await db
    .update(deliveries)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(deliveries.id, deliveryId));
  await updateOrderStatus(order.id, "delivered");
  return true;
}

// ─── Stock ────────────────────────────────────────────────────────────────────
export async function getStockItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stockItems).orderBy(stockItems.name);
}

export async function updateStockItem(
  id: number,
  data: { name?: string; unit?: string; quantity?: string; minQuantity?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(stockItems).set(data).where(eq(stockItems.id, id));
}

export async function createStockItem(data: { name: string; unit: string; quantity: string; minQuantity: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(stockItems).values(data);
}

export async function deductStockForOrder(
  items: Array<{ productId: number; quantity: number }>
) {
  const db = await getDb();
  if (!db) return;

  for (const item of items) {
    const compositions = await db
      .select()
      .from(productStock)
      .where(eq(productStock.productId, item.productId));

    for (const comp of compositions) {
      const needed = parseFloat(comp.quantity) * item.quantity;
      await db
        .update(stockItems)
        .set({ quantity: sql`GREATEST(0, quantity - ${needed})` })
        .where(eq(stockItems.id, comp.stockItemId));
    }
  }

  // Check and block products with zero stock
  await checkAndBlockProducts();
}

export async function checkAndBlockProducts() {
  const db = await getDb();
  if (!db) return;

  const allProducts = await db.select().from(products).where(eq(products.active, true));
  for (const product of allProducts) {
    const compositions = await db
      .select()
      .from(productStock)
      .where(eq(productStock.productId, product.id));

    if (compositions.length === 0) continue;

    let shouldBlock = false;
    for (const comp of compositions) {
      const stock = await db.select().from(stockItems).where(eq(stockItems.id, comp.stockItemId)).limit(1);
      if (stock[0] && parseFloat(stock[0].quantity) <= 0) {
        shouldBlock = true;
        break;
      }
    }
    if (shouldBlock !== product.blocked) {
      await db.update(products).set({ blocked: shouldBlock }).where(eq(products.id, product.id));
    }
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getDailyReport(date?: Date) {
  const db = await getDb();
  if (!db) return null;

  const targetDate = date ?? new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dayOrders = await db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)));

  const totalOrders = dayOrders.length;
  const revenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

  // Top products
  const allItems = await db
    .select()
    .from(orderItems)
    .where(
      sql`orderId IN (SELECT id FROM orders WHERE createdAt >= ${startOfDay} AND createdAt <= ${endOfDay})`
    );

  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of allItems) {
    if (!productMap[item.productName]) {
      productMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
    }
    productMap[item.productName].quantity += item.quantity;
    productMap[item.productName].revenue += parseFloat(item.subtotal);
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return { totalOrders, revenue, avgOrder, topProducts, orders: dayOrders };
}

export async function getSalesReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, ordersByDay: [] };

  const rawOrders = await db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
    .orderBy(orders.createdAt);

  const delivered = rawOrders.filter((o) => o.status === 'delivered');
  const totalRevenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);

  // Group by day
  const dayMap: Record<string, { orders: number; revenue: number }> = {};
  for (const o of rawOrders) {
    const day = o.createdAt.toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { orders: 0, revenue: 0 };
    dayMap[day].orders++;
    if (o.status === 'delivered') dayMap[day].revenue += parseFloat(o.total);
  }

  const ordersByDay = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), orders: v.orders, revenue: v.revenue }));

  return { totalOrders: rawOrders.length, totalRevenue, ordersByDay };
}


// ─── Shop Settings ────────────────────────────────────────────────────────────
export async function getShopSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(shopSettings).limit(1);
  return result[0] || null;
}

export async function updateShopSettings(data: { isOpen?: boolean; openTime?: string; closeTime?: string; operatingDays?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopSettings).set(data).where(eq(shopSettings.id, 1));
}

export function isShopOpen(settings: any): boolean {
  if (!settings) return true;
  
  // If manually closed, always return false
  if (settings.isOpen === false) return false;
  
  // If manually opened (manualOverride=true), return true
  if (settings.manualOverride && settings.isOpen === true) return true;
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
  
  // Check operating days (2,3,4,5,6,0 = terça a domingo)
  const operatingDays = settings.operatingDays.split(',').map((d: string) => parseInt(d));
  if (!operatingDays.includes(dayOfWeek)) return false;
  
  // Check time range
  const [openHour, openMin] = settings.openTime.split(':').map(Number);
  const [closeHour, closeMin] = settings.closeTime.split(':').map(Number);
  const openTimeNum = openHour * 60 + openMin;
  const closeTimeNum = closeHour * 60 + closeMin;
  const currentTimeNum = now.getHours() * 60 + now.getMinutes();
  
  // Handle closing at or after midnight (00:00)
  if (closeTimeNum <= openTimeNum) {
    if (closeTimeNum === 0) {
      return currentTimeNum >= openTimeNum;
    }
    return currentTimeNum >= openTimeNum || currentTimeNum < closeTimeNum;
  }
  
  return currentTimeNum >= openTimeNum && currentTimeNum < closeTimeNum;
}


// ─── Company Info ─────────────────────────────────────────────────────────────
export async function getCompanyInfo() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companyInfo).limit(1);
  return result[0] || null;
}

export async function updateCompanyInfo(data: {
  name?: string;
  logoUrl?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Get or create company info
  let company = await getCompanyInfo();
  if (!company) {
    await db.insert(companyInfo).values({ name: "LV BURGER" });
    company = await getCompanyInfo();
  }
  
  if (!company) return null;
  
  const updated = await db
    .update(companyInfo)
    .set(data)
    .where(eq(companyInfo.id, company.id));
  
  return getCompanyInfo();
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export async function getAllPromotions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotions).orderBy(promotions.sortOrder, promotions.createdAt);
}

export async function getActivePromotions() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now)
      )
    )
    .orderBy(promotions.sortOrder, promotions.createdAt);
}

export async function createPromotion(data: {
  title: string;
  description: string;
  imageUrl?: string;
  discountPercentage?: number;
  discountValue?: string;
  startDate: Date;
  endDate: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(promotions).values({
    ...data,
    isActive: true,
    sortOrder: 0,
  });
  
  const created = await db
    .select()
    .from(promotions)
    .where(eq(promotions.title, data.title))
    .orderBy(desc(promotions.createdAt))
    .limit(1);
  
  return created[0] || null;
}

export async function updatePromotion(
  id: number,
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    discountPercentage?: number;
    discountValue?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(promotions).set(data).where(eq(promotions.id, id));
  
  const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
  return result[0] || null;
}

export async function deletePromotion(id: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(promotions).where(eq(promotions.id, id));
  return true;
}

export async function getPromotionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
  return result[0] || null;
}


// ─── Stock Management ─────────────────────────────────────────────────────────
export async function getStockByProductId(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(stock).where(eq(stock.productId, productId));
  return result || [];
}

export async function getAllStock() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(stock);
  return result || [];
}

export async function createStock(data: { productId: number; quantity: number; minQuantity?: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(stock).values({
    productId: data.productId,
    quantity: data.quantity,
    minQuantity: data.minQuantity || 0,
  });
  return await getStockByProductId(data.productId);
}

export async function updateStock(id: number, data: { quantity?: number; minQuantity?: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.update(stock).set(data).where(eq(stock.id, id));
  const result = await db.select().from(stock).where(eq(stock.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteStock(id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.delete(stock).where(eq(stock.id, id));
  return { success: true };
}


// ─── Delivery Zones ─────────────────────────────────────────────────────────

export async function getAllDeliveryZones() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.active, true))
    .orderBy(deliveryZones.sortOrder);
  return result;
}

export async function getDeliveryZoneByDistance(distanceKm: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(deliveryZones)
    .where(
      and(
        eq(deliveryZones.active, true),
        lte(deliveryZones.minDistance, distanceKm.toString()),
        gte(deliveryZones.maxDistance, distanceKm.toString())
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function calculateDeliveryFee(distanceKm: number): Promise<{ fee: string; estimatedMinutes: number } | null> {
  const zone = await getDeliveryZoneByDistance(distanceKm);
  if (!zone) return null;
  
  // Fórmula: taxa base + (distância * taxa por km)
  const fee = parseFloat(zone.baseFee.toString()) + (distanceKm * parseFloat(zone.perKmFee.toString()));
  
  return {
    fee: fee.toFixed(2),
    estimatedMinutes: zone.estimatedMinutes,
  };
}

export async function createDeliveryZone(data: {
  name: string;
  minDistance: number;
  maxDistance: number;
  baseFee: number;
  perKmFee: number;
  estimatedMinutes: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliveryZones).values({
    name: data.name,
    minDistance: data.minDistance.toString(),
    maxDistance: data.maxDistance.toString(),
    baseFee: data.baseFee.toString(),
    perKmFee: data.perKmFee.toString(),
    estimatedMinutes: data.estimatedMinutes,
    active: true,
  });
  return result;
}

export async function updateDeliveryZone(id: number, data: Partial<{
  name: string;
  minDistance: number;
  maxDistance: number;
  baseFee: number;
  perKmFee: number;
  estimatedMinutes: number;
  active: boolean;
}>) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.minDistance !== undefined) updateData.minDistance = data.minDistance.toString();
  if (data.maxDistance !== undefined) updateData.maxDistance = data.maxDistance.toString();
  if (data.baseFee !== undefined) updateData.baseFee = data.baseFee.toString();
  if (data.perKmFee !== undefined) updateData.perKmFee = data.perKmFee.toString();
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
  if (data.active !== undefined) updateData.active = data.active;
  
  await db.update(deliveryZones).set(updateData).where(eq(deliveryZones.id, id));
  const result = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteDeliveryZone(id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  return { success: true };
}
