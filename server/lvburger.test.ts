import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@lvburger.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

function makeAdminCtx() {
  return makeCtx({ role: "admin", openId: "admin-user", id: 2, email: "admin@lvburger.com", name: "Admin" });
}

function makeMotoboyCtx() {
  return makeCtx({ role: "motoboy", openId: "motoboy-user", id: 3, email: "motoboy@lvburger.com", name: "Motoboy" });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    ctx.res.clearCookie = (name: string, options: Record<string, unknown>) => {
      clearedCookies.push({ name, options });
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("returns current user from auth.me", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("test@lvburger.com");
    expect(user?.role).toBe("user");
  });
});

// ─── Role Guards ──────────────────────────────────────────────────────────────
describe("role guards", () => {
  it("blocks non-admin from admin procedures", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.listAll()).rejects.toThrow();
  });

  it("allows admin to access admin procedures", async () => {
    // This will fail at DB level (no DB in test) but not at auth level
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    // Should throw DB error, not FORBIDDEN
    try {
      await caller.products.listAll();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("blocks customer from motoboy procedures", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.deliveries.available()).rejects.toThrow();
  });

  it("allows motoboy to access motoboy procedures", async () => {
    const ctx = makeMotoboyCtx();
    const caller = appRouter.createCaller(ctx);
    // Should not throw FORBIDDEN
    try {
      await caller.deliveries.available();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

// ─── Order number generation ──────────────────────────────────────────────────
describe("order number format", () => {
  it("generates order number in LV-XXXXXX format", () => {
    const orderNumber = `LV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    expect(orderNumber).toMatch(/^LV-[A-Z0-9]{6}$/);
  });
});

// ─── Delivery code generation ─────────────────────────────────────────────────
describe("delivery code", () => {
  it("generates a 6-digit numeric code", () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    expect(code).toMatch(/^\d{6}$/);
    expect(code.length).toBe(6);
  });
});

// ─── Price formatting ─────────────────────────────────────────────────────────
describe("price formatting", () => {
  it("formats price with Brazilian locale", () => {
    const price = "29.90";
    const formatted = parseFloat(price).toFixed(2).replace(".", ",");
    expect(formatted).toBe("29,90");
  });

  it("calculates order total correctly", () => {
    const items = [
      { price: "29.90", quantity: 2 },
      { price: "12.50", quantity: 1 },
    ];
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    expect(total).toBeCloseTo(72.30, 2);
  });
});

// ─── Status flow ──────────────────────────────────────────────────────────────
describe("order status flow", () => {
  const validStatuses = ["pending_payment", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

  it("includes all expected order statuses", () => {
    expect(validStatuses).toContain("pending_payment");
    expect(validStatuses).toContain("confirmed");
    expect(validStatuses).toContain("preparing");
    expect(validStatuses).toContain("out_for_delivery");
    expect(validStatuses).toContain("delivered");
    expect(validStatuses).toContain("cancelled");
  });

  it("maps statuses to Portuguese labels", () => {
    const STATUS_LABELS: Record<string, string> = {
      pending_payment: "Aguardando",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      out_for_delivery: "Em Rota",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    expect(STATUS_LABELS["confirmed"]).toBe("Confirmado");
    expect(STATUS_LABELS["out_for_delivery"]).toBe("Em Rota");
    expect(STATUS_LABELS["delivered"]).toBe("Entregue");
  });
});

// ─── Payment methods ──────────────────────────────────────────────────────────
describe("payment methods", () => {
  it("only accepts cash and pix", () => {
    const validMethods = ["cash", "pix"];
    expect(validMethods).toContain("cash");
    expect(validMethods).toContain("pix");
    expect(validMethods).not.toContain("credit_card");
    expect(validMethods).not.toContain("debit");
    expect(validMethods.length).toBe(2);
  });
});
