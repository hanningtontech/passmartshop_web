import { useState, useEffect, ReactNode, useRef } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useProductTags } from "@/hooks/useProductTags";
import { useBehavior } from "@/contexts/BehaviorContext";
import FlashSaleStrip from "@/components/FlashSaleStrip";
import { useAuth } from "@/contexts/AuthContext";
import { UiProvider } from "@/contexts/UiContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";

const MAX_TAGS = 20;

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const searchString = useSearch();
  const [productMatch, productParams] = useRoute("/product/:id");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryImagesById, setCategoryImagesById] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(searchString || "");
    return params.get("search") || "";
  });
  const [, setLocation] = useLocation();
  const { totalItems } = useCart();
  const { tags: productTags, loading: tagsLoading } = useProductTags();
  const { recordSearch, recentSearches } = useBehavior();
  const [displayTags, setDisplayTags] = useState<string[]>([]);
  const [productPageTagsLoading, setProductPageTagsLoading] = useState(false);
  const [productPageTags, setProductPageTags] = useState<string[]>([]);
  const { user } = useAuth();
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const hideRef = useRef(false);
  const tagsAutoScrollRef = useRef<HTMLDivElement | null>(null);
  const tagsAutoPausedRef = useRef(false);

  // Product page tags: use the current product's tags (changes automatically with route id).
  useEffect(() => {
    const productId = productMatch ? (productParams as any)?.id : null;
    if (!productId) {
      setProductPageTags([]);
      setProductPageTagsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadProductTags() {
      setProductPageTagsLoading(true);
      try {
        const snap = await getDoc(doc(db, "products", String(productId)));
        const data: any = snap.exists() ? snap.data() : null;
        const tags: string[] = Array.isArray(data?.tags)
          ? (data.tags as unknown[]).map((t) => String(t)).filter(Boolean)
          : [];
        if (!cancelled) setProductPageTags(shuffleArray(tags).slice(0, MAX_TAGS));
      } catch {
        if (!cancelled) setProductPageTags([]);
      } finally {
        if (!cancelled) setProductPageTagsLoading(false);
      }
    }
    loadProductTags();
    return () => {
      cancelled = true;
    };
  }, [productMatch, (productParams as any)?.id]);

  // Tags source:
  // - product page: show the selected product's tags
  // - home/shop/etc: show global/random tags (with recent-search boost)
  useEffect(() => {
    if (productMatch) {
      if (productPageTagsLoading) {
        setDisplayTags([]);
        return;
      }
      setDisplayTags(productPageTags);
      return;
    }

    if (tagsLoading || !productTags.length) {
      setDisplayTags([]);
      return;
    }
    const recent = recentSearches;
    const suggested = productTags.filter((tag) =>
      recent.some((q) => tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase()))
    );
    const other = productTags.filter((t) => !suggested.includes(t));
    const shuffledOther = shuffleArray(other);
    const combined = [...suggested, ...shuffledOther].slice(0, MAX_TAGS);
    setDisplayTags(combined);
  }, [
    productMatch,
    productPageTagsLoading,
    productPageTags,
    tagsLoading,
    productTags,
    recentSearches,
  ]);

  useEffect(() => {
    const el = tagsAutoScrollRef.current;
    if (!el) return;
    if (tagsLoading) return;
    if (displayTags.length < 6) return;

    let raf = 0;
    let lastTs = 0;
    const pxPerSecond = 24; // gentle auto-scroll

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(64, ts - lastTs);
      lastTs = ts;

      if (!tagsAutoPausedRef.current) {
        el.scrollLeft += (pxPerSecond * dt) / 1000;
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0 && el.scrollLeft >= max - 1) {
          el.scrollLeft = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [displayTags, tagsLoading]);

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const snap = await getDocs(collection(db, "categories"));
        const all = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (c: any) =>
              (c.active !== false &&
                (c.isActive === undefined || c.isActive !== false)) &&
              (c.parentId === null || c.parentId === undefined)
          )
          .sort(
            (a: any, b: any) =>
              (Number(a.displayOrder) ?? 999) - (Number(b.displayOrder) ?? 999)
          );
        setCategories(all);

        // Fetch a sample of products and use the first image we find per category.
        // This avoids N queries (one per category) while keeping the drawer fast.
        const productsSnap = await getDocs(query(collection(db, "products"), limit(250)));
        const next: Record<string, string> = {};
        for (const docSnap of productsSnap.docs) {
          const data: any = docSnap.data();
          const categoryId = data.categoryId != null ? String(data.categoryId) : "";
          const img = Array.isArray(data.images) ? data.images[0] : undefined;
          if (!categoryId || !img) continue;
          if (next[categoryId]) continue;
          next[categoryId] = img;
        }
        setCategoryImagesById(next);
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY || window.pageYOffset;
      const delta = currentY - lastScrollY.current;

      // avoid frequent updates
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentlyHidden = hideRef.current;
          // Stronger hysteresis to prevent rapid toggling
          if (!currentlyHidden && delta > 25 && currentY > 140) {
            hideRef.current = true;
            setHideFeatures(true);
          } else if (currentlyHidden && delta < -25) {
            hideRef.current = false;
            setHideFeatures(false);
          }
          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      recordSearch(searchQuery.trim());
      setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: "Home", path: "/home" },
    { label: "Shop", path: "/shop" },
    { label: "Flash Sale", path: "/flash-sale" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Utility Bar - hidden when printing (e.g. order confirmation) */}
      <div
        className={`bg-gray-900 text-gray-300 text-sm print:hidden transition-opacity duration-300 ${
          hideFeatures ? "opacity-0 pointer-events-none select-none" : "opacity-100"
        }`}
      >
        <div className="container mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Link href="/contact">
              <a className="hover:text-orange-500 transition">Help Center</a>
            </Link>
            <Link href="/track-order">
              <a className="hover:text-orange-500 transition">Track Order</a>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span>Kenya 🇰🇪</span>
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div
        className={`bg-orange-500 text-white text-center py-2 text-sm font-medium print:hidden transition-opacity duration-300 ${
          hideFeatures ? "opacity-0 pointer-events-none select-none" : "opacity-100"
        }`}
      >
        Free delivery in Nairobi & Thika. Countrywide delivery available.
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-white shadow-sm print:hidden transform transition-transform duration-300 will-change-transform ${hideFeatures ? "-translate-y-full" : "translate-y-0"
          }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: categories menu button */}
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition h-10 w-10 shrink-0"
              aria-label="Open categories menu"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>

            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src="/favicon.png"
                  alt="Passmartshop"
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-orange-100"
                />
                <span className="font-bold text-xl hidden sm:inline">
                  Passmartshop
                </span>
              </div>
            </Link>

            {/* Search Bar – prominent, ~40% width on desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0 max-w-xl">
              <div className="flex w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-4 py-2.5 rounded-r-lg hover:bg-orange-600 transition"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Account */}
              <Link href="/account">
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                >
                  {user ? "My Account" : "Sign In"}
                </Button>
              </Link>
              {/* Cart Icon */}
              <Link href="/cart">
                <div className="relative cursor-pointer">
                  <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-orange-500" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-r-lg"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Navigation Menu – extra bottom padding so tags row doesn’t touch links */}
        <nav className={`${mobileMenuOpen ? "block" : "hidden"} md:block border-t border-gray-200 md:pb-2`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-8 py-4 md:min-h-[52px] md:pt-4 md:pb-4 md:flex">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 md:py-4 text-gray-700 hover:text-orange-500 font-medium transition"
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Tag chips – thin divider line above, gap below nav */}
        {(tagsLoading || displayTags.length > 0) && (
          <div
            className={`container mx-auto px-4 pb-3 border-t border-gray-200 transition-opacity duration-300 ${
              hideFeatures ? "opacity-0 pointer-events-none select-none" : "opacity-100"
            }`}
            style={{ paddingTop: "20px" }}
          >
            <div
              ref={tagsAutoScrollRef}
              className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide"
              style={{ minHeight: "32px" }}
              onMouseEnter={() => {
                tagsAutoPausedRef.current = true;
              }}
              onMouseLeave={() => {
                tagsAutoPausedRef.current = false;
              }}
              onPointerDown={() => {
                tagsAutoPausedRef.current = true;
              }}
              onPointerUp={() => {
                tagsAutoPausedRef.current = false;
              }}
              onTouchStart={() => {
                tagsAutoPausedRef.current = true;
              }}
              onTouchEnd={() => {
                tagsAutoPausedRef.current = false;
              }}
            >
              {tagsLoading ? (
                <span className="flex-shrink-0 text-sm text-gray-500">Loading tags…</span>
              ) : (
                displayTags.map((tag) => (
                  <Link key={tag} href={`/shop?search=${encodeURIComponent(tag)}`}>
                    <a
                      className="flex-shrink-0 whitespace-nowrap rounded-full border border-gray-300 bg-white text-gray-800 text-sm px-3 py-1.5 hover:border-orange-500 hover:text-orange-600 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {tag}
                    </a>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Flash sale strip – compact cards, dismissible, just below tags */}
        <div
          className={`transition-opacity duration-300 ${
            hideFeatures ? "opacity-0 pointer-events-none select-none" : "opacity-100"
          }`}
        >
          <FlashSaleStrip />
        </div>
      </header>

      {/* Categories drawer */}
      {categoriesOpen && (
        <div className="fixed inset-0 z-[60] print:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setCategoriesOpen(false)}
            aria-label="Close categories menu"
          />
          <div className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">
                  Menu
                </p>
                <h2 className="text-lg font-bold text-gray-900">Categories</h2>
              </div>
              <button
                type="button"
                className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                onClick={() => setCategoriesOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <Link href="/shop">
                <a
                  className="block px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition font-semibold"
                  onClick={() => setCategoriesOpen(false)}
                >
                  All products
                </a>
              </Link>

              <div className="mt-3 border-t border-gray-100 pt-3">
                {categoriesLoading ? (
                  <p className="text-sm text-gray-500 px-3 py-2">Loading categories…</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-gray-500 px-3 py-2">No categories found.</p>
                ) : (
                  <div className="space-y-3">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        href={
                          c.slug
                            ? `/shop?category=${encodeURIComponent(c.slug)}`
                            : "/shop"
                        }
                      >
                        <a
                          className="block rounded-xl overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-sm transition"
                          onClick={() => setCategoriesOpen(false)}
                        >
                          <div
                            className="relative h-20"
                            style={{
                              backgroundImage: categoryImagesById[c.id]
                                ? `url('${categoryImagesById[c.id]}')`
                                : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #0f172a 100%)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                              <div>
                                <p className="text-white font-semibold leading-tight">
                                  {c.name}
                                </p>
                                <p className="text-white/80 text-xs mt-0.5">
                                  Tap to browse
                                </p>
                              </div>
                              <span className="text-white/80 text-sm">›</span>
                            </div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <UiProvider value={{ hideFeatures }}>
        <main className="flex-1">{children}</main>
      </UiProvider>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 mt-16 print:hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* About */}
            <div>
              <h3 className="font-bold text-white mb-4">About Passmartshop</h3>
              <p className="text-sm leading-relaxed">
                Your trusted online store for quality home goods and electronics.
                We're committed to delivering excellence in every purchase.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/shop">
                    <a className="hover:text-orange-500 transition">Shop</a>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <a className="hover:text-orange-500 transition">About Us</a>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <a className="hover:text-orange-500 transition">Contact</a>
                  </Link>
                </li>
                <li>
                  <Link href="/track-order">
                    <a className="hover:text-orange-500 transition">Track Order</a>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="font-bold text-white mb-4">Policies</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy-policy">
                    <a className="hover:text-orange-500 transition">Privacy Policy</a>
                  </Link>
                </li>
                <li>
                  <Link href="/terms">
                    <a className="hover:text-orange-500 transition">Terms &amp; Conditions</a>
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy">
                    <a className="hover:text-orange-500 transition">Refund Policy</a>
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy">
                    <a className="hover:text-orange-500 transition">Shipping Policy</a>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-white mb-4">Get in Touch</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p>0740730781</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p>support@passmartshop.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p>Countrywide Deliveries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="border-t border-slate-700 pt-8 flex justify-between items-center">
            <p className="text-sm">
              &copy; 2026 Passmartshop. All rights reserved.
            </p>
            <div className="flex gap-4 items-center">
              <a
                href="https://wa.me/254740730781"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-gray-400 hover:text-green-500 transition text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://www.tiktok.com/@elima.holdings?_r=1&_t=ZS-94lPR2CEjKi"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition text-sm"
              >
                <span>TikTok</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
