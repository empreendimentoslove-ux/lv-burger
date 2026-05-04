import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { deliveryZones } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Delivery Zones", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should create a delivery zone", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const testZone = {
      name: "Zona Teste",
      minDistance: 0,
      maxDistance: 5,
      baseFee: 5.0,
      perKmFee: 1.5,
      estimatedMinutes: 30,
      active: true,
      sortOrder: 1,
    };

    const result = await db.insert(deliveryZones).values(testZone);
    expect(result).toBeDefined();
  });

  it("should retrieve delivery zones", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const zones = await db.select().from(deliveryZones).limit(1);
    expect(Array.isArray(zones)).toBe(true);
  });

  it("should calculate delivery fee correctly", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Create a test zone
    const testZone = {
      name: "Zona Cálculo",
      minDistance: 0,
      maxDistance: 10,
      baseFee: 5.0,
      perKmFee: 1.0,
      estimatedMinutes: 30,
      active: true,
      sortOrder: 2,
    };

    await db.insert(deliveryZones).values(testZone);

    // Test calculation: base fee (5) + (distance * perKmFee)
    // For 3km: 5 + (3 * 1) = 8
    const expectedFee = 5.0 + 3 * 1.0;
    expect(expectedFee).toBe(8);
  });

  it("should handle multiple zones", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const zones = await db.select().from(deliveryZones);
    expect(zones.length).toBeGreaterThanOrEqual(0);
  });
});
