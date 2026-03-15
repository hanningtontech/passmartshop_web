import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

const STORAGE_KEY = "passmartshop_behavior";
const MAX_VIEWS = 50;
const MAX_SEARCHES = 30;

export interface ProductView {
  productId: string;
  categoryId: string | null;
  timestamp: number;
}

export interface SearchEntry {
  query: string;
  timestamp: number;
}

interface StoredBehavior {
  productViews: ProductView[];
  searches: SearchEntry[];
}

function loadBehavior(): StoredBehavior {
  if (typeof window === "undefined")
    return { productViews: [], searches: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { productViews: [], searches: [] };
    const parsed = JSON.parse(raw) as StoredBehavior;
    return {
      productViews: Array.isArray(parsed.productViews) ? parsed.productViews : [],
      searches: Array.isArray(parsed.searches) ? parsed.searches : [],
    };
  } catch {
    return { productViews: [], searches: [] };
  }
}

function saveBehavior(data: StoredBehavior) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

interface BehaviorContextType {
  recordProductView: (productId: string, categoryId: string | null) => void;
  recordSearch: (query: string) => void;
  recentSearches: string[];
  getRecentSearches: () => string[];
  getViewedCategoryIds: () => string[];
  getViewedProductIds: () => string[];
}

const BehaviorContext = createContext<BehaviorContextType | undefined>(undefined);

export function BehaviorProvider({ children }: { children: ReactNode }) {
  const [behavior, setBehavior] = useState<StoredBehavior>(loadBehavior);

  useEffect(() => {
    saveBehavior(behavior);
  }, [behavior]);

  const recordProductView = useCallback((productId: string, categoryId: string | null) => {
    setBehavior((prev) => {
      const next = {
        ...prev,
        productViews: [
          { productId, categoryId, timestamp: Date.now() },
          ...prev.productViews.filter((v) => v.productId !== productId),
        ].slice(0, MAX_VIEWS),
      };
      return next;
    });
  }, []);

  const recordSearch = useCallback((query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;
    setBehavior((prev) => {
      const next = {
        ...prev,
        searches: [
          { query: trimmed, timestamp: Date.now() },
          ...prev.searches.filter((s) => s.query !== trimmed),
        ].slice(0, MAX_SEARCHES),
      };
      return next;
    });
  }, []);

  const getRecentSearches = useCallback(() => {
    return behavior.searches.map((s) => s.query);
  }, [behavior.searches]);

  const getViewedCategoryIds = useCallback(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const v of behavior.productViews) {
      if (v.categoryId && !seen.has(v.categoryId)) {
        seen.add(v.categoryId);
        order.push(v.categoryId);
      }
    }
    return order;
  }, [behavior.productViews]);

  const getViewedProductIds = useCallback(() => {
    return behavior.productViews.map((v) => v.productId);
  }, [behavior.productViews]);

  const recentSearches = behavior.searches.map((s) => s.query);

  const value: BehaviorContextType = {
    recordProductView,
    recordSearch,
    recentSearches,
    getRecentSearches,
    getViewedCategoryIds,
    getViewedProductIds,
  };

  return (
    <BehaviorContext.Provider value={value}>
      {children}
    </BehaviorContext.Provider>
  );
}

export function useBehavior() {
  const ctx = useContext(BehaviorContext);
  if (ctx === undefined)
    throw new Error("useBehavior must be used within BehaviorProvider");
  return ctx;
}
