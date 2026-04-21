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
  createPromotion,
  createStock,
  createStockItem,
  deleteCategory,
  deleteProduct,
  deletePromotion,
  deleteStock,
  getAllCategories,
  getAllOrders,
  getAllProducts,
  getAllPromotions,
  getAllStock,
  getAllUsers,
  getActivePromotions,
  getAvailableDeliveries,
  getCartItems,
  getCategories,
  getCompanyInfo,
  getDailyReport,
  getDeliveriesByMotoboy,
  getDeliveryByOrderId,
  getOrderById,
  getOrderItems,
  getOrdersByUser,
  getProductById,
  getProducts,
  getPromotionById,
  getStockByProductId,
  getSalesReport,
  getShopSettings,
  getStockItems,
  isShopOpen,
  startDeliveryRoute,
  updateCartItem,
  updateCategory,
  updateCompanyInfo,
  updateOrderStatus,
  updateProduct,
  updatePromotion,
  updateStock,
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
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCategory(input.name, input.description || '');
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateCategory(input.id, input.name || '', input.description || '');
      }),
    delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.input(z.object({ categoryId: z.string().optional() }).optional()).query(({ input }) =>
      getAllProducts()
    ),
    listAll: adminProcedure.query(() => getAllProducts()),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getProductById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          categoryId: z.string(),
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.number(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProduct(input.categoryId, input.name, input.description || '', input.price, input.imageUrl || '');
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          categoryId: z.string().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, categoryId, name, description, price, imageUrl } = input;
        return await updateProduct(id, categoryId || '', name || '', description || '', price || 0, imageUrl || '');
      }),
    delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
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
        await addCartItem(ctx.user.id, input.productId, input.quantity);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.string(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        await updateCartItem(input.id, input.quantity);
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
              productId: z.string(),
              quantity: z.number().min(1),
            })
          ),
          totalPrice: z.number(),
          status: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if shop is open
        if (!await isShopOpen()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Loja fechada no momento. Pedidos não podem ser realizados." });
        }
        const order = await createOrder(ctx.user.id, input.totalPrice, input.status, input.items);
        await clearCart(ctx.user.id);
        return { id: order };
      }),
    myOrders: protectedProcedure.query(({ ctx }) => getOrdersByUser(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if ((order as any).userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "motoboy")
        throw new TRPCError({ code: "FORBIDDEN" });
      const items = await getOrderItems((order as any).id);
      const delivery = await getDeliveryByOrderId((order as any).id);
      return { ...order, items, delivery };
    }),
    listAll: adminProcedure.query(() => getAllOrders()),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.string(),
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
      return [];
    }),
    myDeliveries: motoboyProcedure.query(async ({ ctx }) => {
      return [];
    }),
    accept: motoboyProcedure
      .input(z.object({ deliveryId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return { success: true };
      }),
    startRoute: motoboyProcedure
      .input(z.object({ deliveryId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return { success: true };
      }),
    confirm: motoboyProcedure
      .input(z.object({ deliveryId: z.string(), code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
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
      .input(z.object({ userId: z.string(), role: z.enum(["customer", "motoboy", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    daily: adminProcedure.query(async () => getDailyReport(new Date())),
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
      return isShopOpen();
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

  // ─── Company Settings ──────────────────────────────────────────────────────
  company: router({
    getInfo: publicProcedure.query(async () => {
      return await getCompanyInfo();
    }),
    updateInfo: adminProcedure
      .input(
        z.object({
          name: z.string().optional(),
          logo: z.string().optional(),
          description: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          businessHours: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateCompanyInfo(input as any);
      }),
    uploadLogo: adminProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `company/logo-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateCompanyInfo({ logo: url });
        return { url };
      }),
  }),

  // ─── Promotions ────────────────────────────────────────────────────────────
  promotions: router({
    getAll: publicProcedure.query(async () => {
      return await getAllPromotions();
    }),
    getActive: publicProcedure.query(async () => {
      return await getActivePromotions();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getPromotionById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          imageUrl: z.string(),
          discount: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        return await createPromotion(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          discount: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePromotion(id, data as any);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deletePromotion(input.id);
        return { success: true };
      }),
    uploadImage: adminProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `promotions/${nanoid(12)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
       }),
  }),

  // ─── Stock Management ──────────────────────────────────────────────────────
  stock: router({
    getAll: adminProcedure.query(async () => {
      return await getAllStock();
    }),
    getByProductId: adminProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getStockByProductId(input.productId);
      }),
    create: adminProcedure
      .input(z.object({
        productId: z.string(),
        quantity: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        return await createStock(input.productId, input.quantity);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.string(),
        quantity: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        return await updateStock(input.id, input.quantity);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await deleteStock(input.id);
      }),
  }),
});
export type AppRouter = typeof appRouter;
