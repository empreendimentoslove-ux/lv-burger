import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  acceptDelivery,
  addCartItem,
  clearCart,
  confirmDelivery,
  createCategory,
  createOrder,
  createProduct,
  createStockItem,
  deleteCategory,
  deleteProduct,
  getAllCategories,
  getAllOrders,
  getAllProducts,
  getAllUsers,
  getAvailableDeliveries,
  getCartItems,
  getCategories,
  getDailyReport,
  getDeliveriesByMotoboy,
  getDeliveryByOrderId,
  getOrderById,
  getOrderItems,
  getOrdersByUser,
  getProductById,
  getProducts,
  getSalesReport,
  getShopSettings,
  getStockItems,
  isShopOpen,
  startDeliveryRoute,
  updateCartItem,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateShopSettings,
  updateStockItem,
  updateUserProfile,
  updateUserRole,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  return next({ ctx });
});

// ─── Motoboy guard ────────────────────────────────────────────────────────────
const motoboyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "motoboy" && ctx.user.role !== "admin")
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a motoboys" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          avatarUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `avatars/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateUserProfile(ctx.user.id, { avatarUrl: url });
        return { url };
      }),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getCategories()),
    listAll: adminProcedure.query(() => getAllCategories()),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCategory(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateCategory(id, data);
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.input(z.object({ categoryId: z.number().optional() }).optional()).query(({ input }) =>
      getProducts(input?.categoryId)
    ),
    listAll: adminProcedure.query(() => getAllProducts()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getProductById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.string(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProduct(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
          active: z.boolean().optional(),
          blocked: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateProduct(id, data);
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteProduct(input.id);
      return { success: true };
    }),
  }),

  // ─── Cart ──────────────────────────────────────────────────────────────────
  cart: router({
    get: protectedProcedure.query(({ ctx }) => getCartItems(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1).default(1),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addCartItem(ctx.user.id, input.productId, input.quantity, input.notes);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(0), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await updateCartItem(input.id, ctx.user.id, input.quantity, input.notes);
        return { success: true };
      }),
    clear: protectedProcedure.mutation(({ ctx }) => clearCart(ctx.user.id)),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          paymentMethod: z.enum(["cash", "pix"]),
          changeAmount: z.string().optional(),
          deliveryAddress: z.string().min(1),
          subtotal: z.string(),
          deliveryFee: z.string(),
          total: z.string(),
          proofUrl: z.string().optional(),
          notes: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              productPrice: z.string(),
              quantity: z.number().min(1),
              notes: z.string().optional(),
              subtotal: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if shop is open
        const settings = await getShopSettings();
        if (!isShopOpen(settings)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Loja fechada no momento. Pedidos não podem ser realizados." });
        }
        const order = await createOrder({ ...input, userId: ctx.user.id });
        await clearCart(ctx.user.id);
        return order;
      }),
    myOrders: protectedProcedure.query(({ ctx }) => getOrdersByUser(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "motoboy")
        throw new TRPCError({ code: "FORBIDDEN" });
      const items = await getOrderItems(order.id);
      const delivery = await getDeliveryByOrderId(order.id);
      return { ...order, items, delivery };
    }),
    listAll: adminProcedure.query(() => getAllOrders()),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending_payment", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ─── Deliveries ────────────────────────────────────────────────────────────
  deliveries: router({
    available: motoboyProcedure.query(async () => {
      const delivs = await getAvailableDeliveries();
      const enriched = await Promise.all(
        delivs.map(async (d) => {
          const order = await getOrderById(d.orderId);
          const items = order ? await getOrderItems(order.id) : [];
          return { ...d, order, items };
        })
      );
      return enriched;
    }),
    myDeliveries: motoboyProcedure.query(async ({ ctx }) => {
      const delivs = await getDeliveriesByMotoboy(ctx.user.id);
      const enriched = await Promise.all(
        delivs.map(async (d) => {
          const order = await getOrderById(d.orderId);
          const items = order ? await getOrderItems(order.id) : [];
          return { ...d, order, items };
        })
      );
      return enriched;
    }),
    accept: motoboyProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await acceptDelivery(input.deliveryId, ctx.user.id);
        return { success: true };
      }),
    startRoute: motoboyProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await startDeliveryRoute(input.deliveryId, ctx.user.id);
        return { success: true };
      }),
    confirm: motoboyProcedure
      .input(z.object({ deliveryId: z.number(), code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        await confirmDelivery(input.deliveryId, ctx.user.id, input.code);
        return { success: true };
      }),
  }),

  // ─── Stock ─────────────────────────────────────────────────────────────────
  stock: router({
    list: adminProcedure.query(() => getStockItems()),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          unit: z.string().optional(),
          quantity: z.string().optional(),
          minQuantity: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateStockItem(id, data);
        return { success: true };
      }),
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), unit: z.string(), quantity: z.string(), minQuantity: z.string() }))
      .mutation(async ({ input }) => {
        await createStockItem(input);
        return { success: true };
      }),
  }),

  // ─── Team ──────────────────────────────────────────────────────────────────
  team: router({
    list: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      return allUsers.filter((u) => u.role === "motoboy" || u.role === "admin");
    }),
    listAll: adminProcedure.query(() => getAllUsers()),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["customer", "motoboy", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    daily: adminProcedure.query(() => getDailyReport()),
    sales: adminProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        return getSalesReport(start, end);
      }),
  }),

  // ─── Shop Settings ─────────────────────────────────────────────────────────
  shop: router({
    settings: publicProcedure.query(() => getShopSettings()),
    isOpen: publicProcedure.query(async () => {
      const settings = await getShopSettings();
      return isShopOpen(settings);
    }),
    updateSettings: adminProcedure
      .input(z.object({ isOpen: z.boolean().optional(), openTime: z.string().optional(), closeTime: z.string().optional(), operatingDays: z.string().optional() }))
      .mutation(async ({ input }) => {
        const dataToUpdate: any = { ...input };
        if (input.isOpen !== undefined) {
          dataToUpdate.manualOverride = true;
        }
        await updateShopSettings(dataToUpdate);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
