import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface CartItem {
  id: string | number;
  name: string;
  basePrice: string;
  images: string[];
  quantity: number;
  /** When product has variants, identifies which variant is in the cart */
  variantId?: string;
  variantName?: string;
  variantSku?: string;
}

function cartItemKey(item: CartItem): string {
  return item.variantId != null && item.variantId !== ""
    ? `${item.id}_${item.variantId}`
    : String(item.id);
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string | number, variantId?: string) => void;
  updateQuantity: (productId: string | number, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, quantity: number = 1) => {
    const newItem: CartItem = {
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      images: product.images || [],
      quantity,
      variantId: product.variantId,
      variantName: product.variantName,
      variantSku: product.variantSku,
    };
    setItems((prev) => {
      const key = cartItemKey(newItem);
      const existing = prev.find((item) => cartItemKey(item) === key);
      if (existing) {
        return prev.map((item) =>
          cartItemKey(item) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string | number, variantId?: string) => {
    setItems((prev) =>
      prev.filter((item) => {
        if (String(item.id) !== String(productId)) return true;
        if (variantId != null) return item.variantId !== variantId;
        return item.variantId == null || item.variantId === "";
      })
    );
  };

  const updateQuantity = (productId: string | number, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(productId)) return item;
        if (variantId != null && item.variantId !== variantId) return item;
        if (variantId == null && (item.variantId != null && item.variantId !== "")) return item;
        return { ...item, quantity };
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.basePrice);
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
