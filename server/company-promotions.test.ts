import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
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

describe("Company Settings and Promotions", () => {
  describe("Company Info", () => {
    it("should get company info", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const info = await caller.company.getInfo();
      expect(info).toBeDefined();
      expect(info?.name).toBeDefined();
    });

    it("should update company info", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const updated = await caller.company.updateInfo({
        name: "LV BURGER TEST",
        description: "Hamburgueria Artesanal Premium",
        phone: "(11) 99999-9999",
        email: "contact@lvburger.com",
        address: "Rua das Flores, 123",
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("LV BURGER TEST");
      expect(updated?.description).toBe("Hamburgueria Artesanal Premium");
      expect(updated?.phone).toBe("(11) 99999-9999");
    });
  });

  describe("Promotions", () => {
    it("should create a promotion", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const promotion = await caller.promotions.create({
        title: "Mega Promoção de Teste",
        description: "Desconto especial em todos os hamburgueres",
        discountPercentage: 20,
        startDate,
        endDate,
      });

      expect(promotion).toBeDefined();
      expect(promotion?.title).toBe("Mega Promoção de Teste");
      expect(promotion?.discountPercentage).toBe(20);
      expect(promotion?.isActive).toBe(true);
    });

    it("should get all promotions", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const promotions = await caller.promotions.getAll();
      expect(Array.isArray(promotions)).toBe(true);
      expect(promotions.length).toBeGreaterThanOrEqual(0);
    });

    it("should get active promotions", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const activePromotions = await caller.promotions.getActive();
      expect(Array.isArray(activePromotions)).toBe(true);
    });

    it("should delete a promotion", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a promotion
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const promotion = await caller.promotions.create({
        title: "Promoção para Deletar",
        description: "Esta será deletada",
        discountPercentage: 15,
        startDate,
        endDate,
      });

      expect(promotion).toBeDefined();
      const promotionId = promotion!.id;

      // Then delete it
      const result = await caller.promotions.delete({ id: promotionId });
      expect(result.success).toBe(true);
    });
  });
});
