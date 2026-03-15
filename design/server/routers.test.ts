import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getCategories: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Home Appliances",
      slug: "home-appliances",
      description: "Home appliances",
      image: "https://example.com/image.jpg",
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getCategoryBySlug: vi.fn().mockResolvedValue({
    id: 1,
    name: "Home Appliances",
    slug: "home-appliances",
    description: "Home appliances",
    image: "https://example.com/image.jpg",
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      categoryId: 1,
      name: "Test Product",
      slug: "test-product",
      description: "A test product",
      shortDescription: "Test",
      basePrice: "99.99",
      originalPrice: "149.99",
      images: ["https://example.com/image.jpg"],
      featured: true,
      isNew: true,
      inStock: true,
      stockCount: 10,
      rating: "4.5",
      reviewCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProductById: vi.fn().mockResolvedValue({
    id: 1,
    categoryId: 1,
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
    shortDescription: "Test",
    basePrice: "99.99",
    originalPrice: "149.99",
    images: ["https://example.com/image.jpg"],
    featured: true,
    isNew: true,
    inStock: true,
    stockCount: 10,
    rating: "4.5",
    reviewCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getProductVariants: vi.fn().mockResolvedValue([
    {
      id: 1,
      productId: 1,
      name: "Color: Red",
      sku: "TEST-RED",
      price: "99.99",
      stockCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProductReviews: vi.fn().mockResolvedValue([
    {
      id: 1,
      productId: 1,
      userId: 1,
      customerName: "John Doe",
      rating: 5,
      title: "Great product!",
      comment: "Excellent quality",
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  createReview: vi.fn().mockResolvedValue({ insertId: 1 }),
  createOrder: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  getOrderById: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "ORD-123",
    userId: 1,
    customerEmail: "test@example.com",
    customerName: "John Doe",
    customerPhone: "1234567890",
    shippingAddress: "123 Main St",
    shippingCity: "New York",
    shippingPostalCode: "10001",
    shippingCountry: "USA",
    subtotal: "99.99",
    shippingCost: "10.00",
    tax: "10.00",
    total: "119.99",
    status: "pending",
    paymentStatus: "pending",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  }),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue({}),
}));

function createMockContext(user?: any): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
  };
}

describe("appRouter", () => {
  describe("categories", () => {
    it("should list all categories", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.categories.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("name", "Home Appliances");
    });

    it("should get category by slug", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.categories.getBySlug({
        slug: "home-appliances",
      });

      expect(result).toBeDefined();
      expect(result?.slug).toBe("home-appliances");
    });
  });

  describe("products", () => {
    it("should list products with default parameters", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.products.list({
        limit: 20,
        offset: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("name", "Test Product");
    });

    it("should get product by id", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.products.getById({ id: 1 });

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe("Test Product");
    });

    it("should get product variants", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.products.getVariants({ productId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("sku", "TEST-RED");
    });
  });

  describe("reviews", () => {
    it("should get reviews by product", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.reviews.getByProduct({ productId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("customerName", "John Doe");
      expect(result[0]).toHaveProperty("rating", 5);
    });

    it("should create a review", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.reviews.create({
        productId: 1,
        customerName: "Jane Doe",
        rating: 4,
        title: "Good product",
        comment: "Very satisfied",
      });

      expect(result).toBeDefined();
    });
  });

  describe("orders", () => {
    it("should create an order", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.orders.create({
        customerEmail: "test@example.com",
        customerName: "John Doe",
        shippingAddress: "123 Main St",
        items: [
          {
            productId: 1,
            productName: "Test Product",
            quantity: 1,
            price: 99.99,
          },
        ],
        subtotal: 99.99,
        total: 119.99,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("orderId");
      expect(result).toHaveProperty("orderNumber");
    });

    it("should get order by id", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.orders.getById({ id: 1 });

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.orderNumber).toBe("ORD-123");
    });

    it("should get user orders when authenticated", async () => {
      const user = {
        id: 1,
        openId: "test-user",
        name: "John Doe",
        email: "test@example.com",
        phone: null,
        loginMethod: "manus",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const caller = appRouter.createCaller(createMockContext(user));
      const result = await caller.orders.getMyOrders();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should not allow non-admin to update order status", async () => {
      const user = {
        id: 1,
        openId: "test-user",
        name: "John Doe",
        email: "test@example.com",
        phone: null,
        loginMethod: "manus",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const caller = appRouter.createCaller(createMockContext(user));

      await expect(
        caller.orders.updateStatus({
          orderId: 1,
          status: "shipped",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should allow admin to update order status", async () => {
      const admin = {
        id: 1,
        openId: "admin-user",
        name: "Admin",
        email: "admin@example.com",
        phone: null,
        loginMethod: "manus",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const caller = appRouter.createCaller(createMockContext(admin));
      const result = await caller.orders.updateStatus({
        orderId: 1,
        status: "shipped",
      });

      expect(result).toBeDefined();
    });
  });

  describe("auth", () => {
    it("should return current user", async () => {
      const user = {
        id: 1,
        openId: "test-user",
        name: "John Doe",
        email: "test@example.com",
        phone: null,
        loginMethod: "manus",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const caller = appRouter.createCaller(createMockContext(user));
      const result = await caller.auth.me();

      expect(result).toEqual(user);
    });

    it("should return null for unauthenticated user", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });
});
