import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductById,
  getProductVariants,
  getProductReviews,
  createReview,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ CATEGORIES ============
  categories: router({
    list: publicProcedure.query(async () => {
      return getCategories();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getCategoryBySlug(input.slug);
      }),
  }),

  // ============ PRODUCTS ============
  products: router({
    list: publicProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          search: z.string().optional(),
          featured: z.boolean().optional(),
          isNew: z.boolean().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          sortBy: z
            .enum(["price_asc", "price_desc", "newest", "rating"])
            .optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return getProducts({
          categoryId: input.categoryId,
          search: input.search,
          featured: input.featured,
          isNew: input.isNew,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          sortBy: input.sortBy,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProductById(input.id);
      }),

    getVariants: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getProductVariants(input.productId);
      }),
  }),

  // ============ REVIEWS ============
  reviews: router({
    getByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getProductReviews(input.productId);
      }),

    create: publicProcedure
      .input(
        z.object({
          productId: z.number(),
          customerName: z.string().min(1),
          rating: z.number().min(1).max(5),
          title: z.string().optional(),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createReview({
          productId: input.productId,
          userId: ctx.user?.id,
          customerName: input.customerName,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
        });
      }),
  }),

  // ============ ORDERS ============
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          customerEmail: z.string().email(),
          customerName: z.string().min(1),
          customerPhone: z.string().optional(),
          shippingAddress: z.string().min(1),
          shippingCity: z.string().optional(),
          shippingPostalCode: z.string().optional(),
          shippingCountry: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.union([z.number(), z.string()]).transform((v) => (typeof v === "string" ? parseInt(v, 10) || 0 : Number(v) || 0)),
              variantId: z.number().optional(),
              productName: z.string(),
              quantity: z.number().min(1),
              price: z.number().min(0),
            })
          ),
          subtotal: z.number().min(0),
          shippingCost: z.number().min(0).optional(),
          tax: z.number().min(0).optional(),
          total: z.number().min(0),
          paymentMethod: z.enum(["M-Pesa", "Cash on Delivery"]),
          mpesaTransactionCode: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Order reference: PSM-<timestamp ms>-<9 random alphanumeric>, e.g. PSM-1773489579631-PNEN6IMRX
        const orderNumber = `PSM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const isMpesa = input.paymentMethod === "M-Pesa";
        const paymentStatus = isMpesa ? "awaiting_verification" : "pending";

        const orderId = await createOrder({
          orderNumber,
          userId: ctx.user?.id,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          shippingCity: input.shippingCity,
          shippingPostalCode: input.shippingPostalCode,
          shippingCountry: input.shippingCountry,
          subtotal: input.subtotal,
          shippingCost: input.shippingCost,
          tax: input.tax,
          total: input.total,
          paymentMethod: input.paymentMethod,
          mpesaTransactionCode: input.mpesaTransactionCode,
          paymentStatus,
          items: input.items,
        });

        return {
          orderId,
          orderNumber,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrderById(input.id);
      }),

    /** List all orders (admin only). For admin panel to load and display orders. */
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(500).optional().default(200) }).optional())
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return getAllOrders(input?.limit ?? 200);
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      return getOrdersByUserId(ctx.user.id);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
          paymentStatus: z.enum(["pending", "awaiting_verification", "completed", "failed", "refunded"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only admins can update order status
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        return updateOrderStatus(input.orderId, input.status, input.paymentStatus);
      }),
  }),
});

export type AppRouter = typeof appRouter;
