import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedAdmin = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedAdmin = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Stock Management CRUD", () => {
  let testProductId: number;
  let testStockId: number;

  it("should create a product for stock testing", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.create({
      name: `Test Product Stock ${Date.now()}`,
      description: "Test product for stock",
      price: "10.00",
      categoryId: 1,
      imageUrl: "https://example.com/image.jpg",
    });

    expect(product).toBeDefined();
    expect(product.id).toBeDefined();
    testProductId = product.id;
  });

  it("should create stock item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.create({
      productId: testProductId,
      quantity: 100,
      minQuantity: 10,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].productId).toBe(testProductId);
    expect(result[0].quantity).toBe(100);
    expect(result[0].minQuantity).toBe(10);
    testStockId = result[0].id;
  });

  it("should get all stock items", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.stock.getAll();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("should get stock by product id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.stock.getByProductId({ productId: testProductId });
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].productId).toBe(testProductId);
  });

  it("should update stock item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.update({
      id: testStockId,
      quantity: 50,
      minQuantity: 5,
    });

    expect(result).toBeDefined();
    expect(result?.quantity).toBe(50);
    expect(result?.minQuantity).toBe(5);
  });

  it("should delete stock item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.stock.delete({ id: testStockId });

    // Verify deletion by checking if we can't find it
    const items = await caller.stock.getByProductId({ productId: testProductId });
    const deleted = items.find((item: any) => item.id === testStockId);
    expect(deleted).toBeUndefined();
  });
});
