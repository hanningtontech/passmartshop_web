import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ChevronRight, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { INLINE_SHOP_BANNER } from "@/config/promotions";

export default function Shop() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [filters, setFilters] = useState({
    categoryId: undefined as string | undefined,
    search: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: "newest" as "price_asc" | "price_desc" | "newest" | "rating",
    inStockOnly: false,
    isNewOnly: false,
    onSaleOnly: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  /** All categories by id (for building category path in search) */
  const [allCategoriesById, setAllCategoriesById] = useState<Record<string, { id: string; name: string; parentId?: string | null }>>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Derived pricing helper to keep filtering & sorting consistent with ProductCard
  const getProductPrice = (product: any) => {
    if (typeof product.price === "number") return product.price;
    if (product.basePrice) {
      const parsed = parseFloat(product.basePrice);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  useEffect(() => {
    setLoadError(null);
    async function load() {
      try {
        const [categoriesSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
        ]);

        const allCats = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
        const byId: Record<string, { id: string; name: string; parentId?: string | null }> = {};
        allCats.forEach((c: any) => {
          byId[c.id] = { id: c.id, name: c.name || "", parentId: c.parentId };
        });
        setAllCategoriesById(byId);

        const rootCats = allCats
          .filter(
            (c: any) =>
              (c.active !== false && (c.isActive === undefined || c.isActive !== false)) &&
              (c.parentId === null || c.parentId === undefined)
          )
          .sort(
            (a: any, b: any) =>
              (Number(a.displayOrder) ?? 999) - (Number(b.displayOrder) ?? 999)
          );
        setCategories(rootCats);

        const prods = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProducts(prods);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load products";
        setLoadError(message);
        setAllProducts([]);
        setCategories([]);
        setAllCategoriesById({});
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Apply URL params (?category=slug, ?search=query) once categories are loaded
  useEffect(() => {
    const params = new URLSearchParams(searchString || "");
    const categorySlug = params.get("category");
    const searchParam = params.get("search");
    if (categories.length > 0 && categorySlug) {
      const bySlug = categories.find(
        (c: any) => (c.slug || c.id) === categorySlug
      );
      if (bySlug) {
        setFilters((prev) =>
          prev.categoryId === bySlug.id ? prev : { ...prev, categoryId: bySlug.id }
        );
      }
    }
    if (searchParam != null && searchParam !== "") {
      setFilters((prev) =>
        prev.search === searchParam ? prev : { ...prev, search: searchParam }
      );
    }
  }, [categories, searchString]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleResetFilters = () => {
    setFilters({
      categoryId: undefined,
      search: "",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "newest",
      inStockOnly: false,
      isNewOnly: false,
      onSaleOnly: false,
    });
    setPage(0);
  };

  // Build category path (root → … → leaf) for search: categories as search tags (SHOP_UPDATE_GUIDE)
  const getCategoryPathNames = (categoryId: string | undefined): string[] => {
    if (!categoryId || !allCategoriesById[categoryId]) return [];
    const cat = allCategoriesById[categoryId];
    const parentPath =
      cat.parentId != null ? getCategoryPathNames(cat.parentId) : [];
    return [...parentPath, cat.name];
  };

  // Root category id for a given category (walk up parentId); so products in subcategories still match when root is selected
  const getRootCategoryId = (categoryId: string | undefined): string | undefined => {
    if (!categoryId || !allCategoriesById[categoryId]) return undefined;
    const cat = allCategoriesById[categoryId];
    if (cat.parentId == null || cat.parentId === "") return cat.id;
    return getRootCategoryId(cat.parentId);
  };

  const getProductSearchText = (product: any): string => {
    const name = (product.name || "").toString();
    const description = (product.description || "").toString().replace(/\s+/g, " ");
    const tags = Array.isArray(product.tags) ? product.tags.join(" ") : "";
    const categoryPath = getCategoryPathNames(
      product.categoryId != null ? String(product.categoryId) : undefined
    ).join(" ");
    return [name, description, tags, categoryPath].filter(Boolean).join(" ").toLowerCase();
  };

  // Apply filters, sorting and pagination on the loaded products
  const pageSize = 20;

  const filteredAndSorted = allProducts
    .filter((product) => {
      // Category filter: show product if it's in the selected category OR in any subcategory under it
      if (filters.categoryId) {
        const productCategoryId =
          product.categoryId !== undefined && product.categoryId !== null
            ? String(product.categoryId)
            : undefined;
        const productRootId = getRootCategoryId(productCategoryId);
        if (productRootId !== filters.categoryId && productCategoryId !== filters.categoryId) {
          return false;
        }
      }

      // Search: name, description, tags, category name/path (SHOP_UPDATE_GUIDE)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const searchText = getProductSearchText(product);
        const terms = query.split(/\s+/).filter(Boolean);
        const matches = terms.every((term) => searchText.includes(term));
        if (!matches) return false;
      }

      // Price range filter – only when user has set min/max (no default; products above 10000 show until user filters)
      const price = getProductPrice(product);
      if (filters.minPrice != null && price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice != null && price > filters.maxPrice) {
        return false;
      }

      if (filters.inStockOnly && !product.inStock) return false;
      if (filters.isNewOnly && !product.isNew) return false;
      if (filters.onSaleOnly) {
        const compare = product.compareAtPrice ?? (product.originalPrice ? parseFloat(product.originalPrice) : null);
        if (compare == null || getProductPrice(product) >= Number(compare)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);

      if (filters.sortBy === "price_asc") {
        return priceA - priceB;
      }
      if (filters.sortBy === "price_desc") {
        return priceB - priceA;
      }
      if (filters.sortBy === "rating") {
        const ratingA = typeof a.rating === "number" ? a.rating : 0;
        const ratingB = typeof b.rating === "number" ? b.rating : 0;
        return ratingB - ratingA;
      }

      // "newest" – try to sort by createdAt if present, otherwise leave as-is
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    });

  const totalProducts = filteredAndSorted.length;
  const paginatedProducts = filteredAndSorted.slice(
    page * pageSize,
    (page + 1) * pageSize
  );
  const hasNextPage = (page + 1) * pageSize < totalProducts;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Shop</h1>
          <p className="text-gray-300">Browse our extensive collection of products</p>
        </div>
      </div>

      {loadError && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3">
            <p className="font-medium">Could not load products</p>
            <p className="text-sm mt-1">{loadError}</p>
            <p className="text-sm mt-2">Check that the shop uses the same Firebase project as the admin (see .env VITE_FIREBASE_*) and that Firestore allows read access to the &quot;products&quot; and &quot;categories&quot; collections.</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <Link href="/">
            <a className="hover:text-orange-600 transition">Home</a>
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium">
            {filters.categoryId
              ? categories.find((c: any) => c.id === filters.categoryId)?.name ?? "Shop"
              : "Shop"}
          </span>
        </nav>

        {/* Results count */}
        <p className="text-gray-600 mb-6">
          {filters.search.trim()
            ? `Showing ${totalProducts} results for "${filters.search}"`
            : `Showing ${totalProducts} results`}
        </p>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } md:block w-full md:w-64 flex-shrink-0`}
          >
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="md:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-6"
                onClick={handleResetFilters}
              >
                Clear All
              </Button>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={filters.categoryId || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "categoryId",
                      e.target.value ? e.target.value : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range – only filters when user sets values */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Price Range (optional)</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">Min Price</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Any"
                      value={filters.minPrice ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          handleFilterChange("minPrice", undefined);
                        } else {
                          const n = parseInt(v, 10);
                          handleFilterChange("minPrice", Number.isNaN(n) ? undefined : n);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Max Price</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Any"
                      value={filters.maxPrice ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          handleFilterChange("maxPrice", undefined);
                        } else {
                          const n = parseInt(v, 10);
                          handleFilterChange("maxPrice", Number.isNaN(n) ? undefined : n);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* In Stock / New / On Sale toggles */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-sm font-medium">In stock only</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters.inStockOnly}
                    onClick={() => handleFilterChange("inStockOnly", !filters.inStockOnly)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      filters.inStockOnly ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        filters.inStockOnly ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-sm font-medium">New arrivals only</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters.isNewOnly}
                    onClick={() => handleFilterChange("isNewOnly", !filters.isNewOnly)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      filters.isNewOnly ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        filters.isNewOnly ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-sm font-medium">On sale only</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters.onSaleOnly}
                    onClick={() => handleFilterChange("onSaleOnly", !filters.onSaleOnly)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      filters.onSaleOnly ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        filters.onSaleOnly ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Products Grid */}
            <div className="flex-1 min-w-0">
            {/* Sort tab bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex flex-wrap gap-1 border-b border-gray-200">
                {[
                  { value: "rating", label: "Popularity" },
                  { value: "newest", label: "Newest" },
                  { value: "price_asc", label: "Price: Low → High" },
                  { value: "price_desc", label: "Price: High → Low" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleFilterChange("sortBy", value)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                      filters.sortBy === value
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-600 hover:text-orange-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid with optional inline promo banner after every 8 items */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full min-w-0 rounded-lg" />
                ))}
              </div>
            ) : totalProducts > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {paginatedProducts.slice(0, 8).map((product: any) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                {INLINE_SHOP_BANNER.enabled && paginatedProducts.length > 8 && (
                  <div className="my-6">
                    <Link href={INLINE_SHOP_BANNER.ctaLink}>
                      <a
                        className={`block rounded-lg bg-gradient-to-r ${INLINE_SHOP_BANNER.backgroundColor} p-6 text-white text-center`}
                      >
                        <h3 className="text-xl font-bold mb-1">
                          {INLINE_SHOP_BANNER.headline}
                        </h3>
                        <p className="text-white/90 text-sm mb-4">
                          {INLINE_SHOP_BANNER.subtext}
                        </p>
                        <span className="inline-block bg-white text-orange-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                          {INLINE_SHOP_BANNER.ctaText}
                        </span>
                      </a>
                    </Link>
                  </div>
                )}
                {paginatedProducts.length > 8 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-6">
                    {paginatedProducts.slice(8).map((product: any) => (
                      <div key={product.id} className="min-w-0">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Page {page + 1}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
