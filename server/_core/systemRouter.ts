import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(async () => {
      try {
        const db = await getDb();
        const isDbHealthy = db !== null;
        return {
          ok: true,
          database: isDbHealthy ? "connected" : "disconnected",
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error("[Health Check] Error:", error);
        return {
          ok: false,
          database: "error",
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
