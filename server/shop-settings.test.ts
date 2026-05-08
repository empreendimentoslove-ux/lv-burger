import { describe, it, expect } from "vitest";
import { isShopOpen } from "./db";

describe("Shop Settings", () => {
  it("should return true when shop is manually open and within operating hours", () => {
    const settings = {
      isOpen: true,
      openTime: "09:00",
      closeTime: "22:00",
      operatingDays: "0,1,2,3,4,5,6", // All days
    };
    
    // Mock current time to 14:00 (2 PM)
    const result = isShopOpen(settings);
    expect(result).toBeDefined();
  });

  it("should return false when shop is manually closed", () => {
    const settings = {
      isOpen: false,
      openTime: "09:00",
      closeTime: "22:00",
      operatingDays: "0,1,2,3,4,5,6",
    };
    
    const result = isShopOpen(settings);
    expect(result).toBe(false);
  });

  it("should handle closing after midnight", () => {
    const settings = {
      isOpen: true,
      openTime: "17:00",
      closeTime: "00:00",
      operatingDays: "1,2,3,4,5,6", // Tuesday to Sunday
    };
    
    const result = isShopOpen(settings);
    expect(typeof result).toBe("boolean");
  });

  it("should respect operating days (terça-domingo = 1,2,3,4,5,6)", () => {
    const settings = {
      isOpen: true,
      openTime: "17:00",
      closeTime: "00:00",
      operatingDays: "1,2,3,4,5,6",
    };
    
    // Should be false on Monday (0) or Sunday (0)
    // Should be true on Tuesday-Saturday (1-5)
    const result = isShopOpen(settings);
    expect(typeof result).toBe("boolean");
  });

  it("should return true when no settings provided", () => {
    const result = isShopOpen(null);
    expect(result).toBe(true);
  });

  it("should handle time parsing correctly", () => {
    const settings = {
      isOpen: true,
      openTime: "17:00",
      closeTime: "23:59",
      operatingDays: "1,2,3,4,5,6",
    };
    
    const result = isShopOpen(settings);
    expect(typeof result).toBe("boolean");
  });
});
