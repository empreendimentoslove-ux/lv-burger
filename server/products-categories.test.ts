import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Products and Categories CRUD", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  const timestamp = Date.now();

  beforeAll(() => {
    const ctx = createAdminContext();
    adminCaller = appRouter.createCaller(ctx);
  });

  describe("Categories - Create", () => {
    it("should create a category successfully", async () => {
      const result = await adminCaller.categories.create({
        name: `Test Category ${timestamp}`,
        slug: `test-cat-${timestamp}`,
        description: "Test category for CRUD operations",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toContain("Test Category");
    });
  });

  describe("Categories - Read", () => {
    it("should list all categories", async () => {
      const result = await adminCaller.categories.listAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Products - Create", () => {
    it("should create a product successfully", async () => {
      // First, get or create a category
      const categories = await adminCaller.categories.listAll();
      const categoryId = categories[0]?.id;

      if (!categoryId) {
        const newCat = await adminCaller.categories.create({
          name: `Product Test Category ${timestamp}`,
          slug: `prod-cat-${timestamp}`,
          description: "Test category for products",
        });
        categoryId = newCat.id;
      }

      const result = await adminCaller.products.create({
        categoryId: categoryId!,
        name: `Test Product ${timestamp}`,
        description: "Test product for CRUD operations",
        price: "29.90",
        imageUrl: "https://example.com/burger.jpg",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toContain("Test Product");
      expect(result.categoryId).toBe(categoryId);
    });
  });

  describe("Products - Read", () => {
    it("should list all products", async () => {
      const result = await adminCaller.products.listAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Products - Update", () => {
    it("should update a product successfully", async () => {
      const products = await adminCaller.products.listAll();
      const product = products[0];

      if (!product) {
        throw new Error("No products found");
      }

      const result = await adminCaller.products.update({
        id: product.id,
        categoryId: product.categoryId,
        name: `Updated Product ${timestamp}`,
        description: "Updated test product",
        price: "34.90",
        imageUrl: "https://example.com/burger-updated.jpg",
      });

      expect(result).toBeDefined();
      expect(result.name).toContain("Updated Product");
      expect(result.price).toBe("34.90");
    });
  });

  describe("Products - Toggle Status", () => {
    it("should toggle product blocked status", async () => {
      const products = await adminCaller.products.listAll();
      const product = products[0];

      if (!product) {
        throw new Error("No products found");
      }

      const blocked = await adminCaller.products.update({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        imageUrl: product.imageUrl ?? "",
        blocked: true,
      });

      expect(blocked.blocked).toBe(true);

      const unblocked = await adminCaller.products.update({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        imageUrl: product.imageUrl ?? "",
        blocked: false,
      });

      expect(unblocked.blocked).toBe(false);
    });
  });

  describe("Categories - Update", () => {
    it("should update a category successfully", async () => {
      const categories = await adminCaller.categories.listAll();
      const category = categories[0];

      if (!category) {
        throw new Error("No categories found");
      }

      const result = await adminCaller.categories.update({
        id: category.id,
        name: `Updated Category ${timestamp}`,
        description: "Updated test category",
      });

      expect(result).toBeDefined();
      expect(result.name).toContain("Updated Category");
    });
  });

  describe("Delete Operations", () => {
    it("should delete a product and remove it from list", async () => {
      const categories = await adminCaller.categories.listAll();
      const categoryId = categories[0]?.id;

      if (!categoryId) {
        throw new Error("No categories found");
      }

      const product = await adminCaller.products.create({
        categoryId,
        name: `Delete Test Product ${timestamp}`,
        description: "Product to be deleted",
        price: "19.90",
        imageUrl: "https://example.com/burger.jpg",
      });

      expect(product).toBeDefined();
      const productId = product!.id;

      let products = await adminCaller.products.listAll();
      expect(products.some((p) => p.id === productId)).toBe(true);

      await adminCaller.products.delete({ id: productId });

      products = await adminCaller.products.listAll();
      expect(products.some((p) => p.id === productId)).toBe(false);
    });

    it("should delete a category and remove it from list", async () => {
      const category = await adminCaller.categories.create({
        name: `Delete Test Category ${timestamp}`,
        slug: `delete-test-${timestamp}`,
        description: "Category to be deleted",
      });

      expect(category).toBeDefined();
      const categoryId = category!.id;

      let categories = await adminCaller.categories.listAll();
      expect(categories.some((c) => c.id === categoryId)).toBe(true);

      await adminCaller.categories.delete({ id: categoryId });

      categories = await adminCaller.categories.listAll();
      expect(categories.some((c) => c.id === categoryId)).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle product creation with non-existent category", async () => {
      try {
        await adminCaller.products.create({
          categoryId: 99999,
          name: "Invalid Product",
          description: "Product with invalid category",
          price: "29.90",
          imageUrl: "https://example.com/burger.jpg",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it("should handle product update with invalid data", async () => {
      try {
        await adminCaller.products.update({
          id: 99999,
          categoryId: 99999,
          name: "",
          description: "",
          price: "",
          imageUrl: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });
});
