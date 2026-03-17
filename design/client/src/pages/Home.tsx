import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Truck, Shield, Headphones, RefreshCw, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FLASH_SALE_END_DATE, FLASH_SALE_TITLE } from "@/config/flashSale";

function useCountdown(endDate: Date) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const end = endDate.getTime();
      const diff = Math.max(0, end - now);
      setLeft({
        days: Math.floor(diff / (24 * 60 * 60 * 1000)),
        hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
        seconds: Math.floor((diff % (60 * 1000)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return left;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryImagesById, setCategoryImagesById] = useState<Record<string, string>>({});
  const countdown = useCountdown(FLASH_SALE_END_DATE);
  const [showNewFirst, setShowNewFirst] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [productsSnap, categoriesSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
        ]);

        const allCats = categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
        const catsById: Record<string, { id: string; parentId?: string | null }> = {};
        for (const c of allCats) {
          catsById[String(c.id)] = { id: String(c.id), parentId: c.parentId ?? null };
        }

        const getRootCategoryId = (categoryId: string | undefined): string | undefined => {
          if (!categoryId) return undefined;
          const cat = catsById[categoryId];
          if (!cat) return categoryId;
          if (cat.parentId == null || cat.parentId === "") return cat.id;
          return getRootCategoryId(String(cat.parentId));
        };

        const allProducts = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const featured = allProducts.filter((p: any) => p.featured);
        const isNew = allProducts.filter((p: any) => p.isNew);
        const flashSale = allProducts.filter((p: any) => p.flashSale === true);
        setFeaturedProducts(featured.slice(0, 4));
        setNewProducts(isNew.slice(0, 4));
        setFlashSaleProducts(flashSale.slice(0, 8));

        const allCategories = allCats
          .filter(
            (c: any) =>
              (c.active !== false && (c.isActive === undefined || c.isActive !== false)) &&
              (c.parentId === null || c.parentId === undefined)
          )
          .sort(
            (a: any, b: any) =>
              (Number(a.displayOrder) ?? 999) - (Number(b.displayOrder) ?? 999)
          );
        setCategories(allCategories);

        // Choose one representative product image per root category (including products in subcategories)
        const nextImages: Record<string, string> = {};
        for (const p of allProducts) {
          const img = Array.isArray((p as any).images) ? (p as any).images[0] : undefined;
          if (!img) continue;
          const productCategoryId = (p as any).categoryId != null ? String((p as any).categoryId) : undefined;
          const rootId = getRootCategoryId(productCategoryId);
          if (!rootId) continue;
          if (nextImages[rootId]) continue;
          nextImages[rootId] = img;
        }
        setCategoryImagesById(nextImages);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    try {
      const key = "home_new_first_seen";
      const seen = typeof window !== "undefined" ? window.localStorage.getItem(key) : "1";
      if (!seen) {
        setShowNewFirst(true);
        window.localStorage.setItem(key, "1");
      }
    } catch {
      // if localStorage fails, just default to categories first
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Open directly into content (no static hero image) */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">
              Browse products
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">
              Shop by category
            </h1>
          </div>
          <Link href="/shop">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              View all products <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Shop By Category (similar to Vicmer) */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">
                Categories
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Home essentials for every lifestyle
              </h2>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="hidden md:inline-flex">
                View All Categories <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading && categories.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={
                    category.slug
                      ? `/shop?category=${encodeURIComponent(category.slug)}`
                      : "/shop"
                  }
                >
                  <a className="group block rounded-xl overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-sm transition">
                    <div
                      className="relative h-28"
                      style={{
                        backgroundImage: categoryImagesById[String(category.id)]
                          ? `url('${categoryImagesById[String(category.id)]}')`
                          : "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #0f172a 100%)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />
                      <div className="absolute inset-0 p-3 flex flex-col justify-end">
                        <div className="text-white font-semibold leading-tight group-hover:text-orange-100 transition">
                          {category.name}
                        </div>
                        <div className="text-white/80 text-xs mt-0.5">Shop now</div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Flash Sale Section – only when there are flash sale products */}
      {flashSaleProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Flame className="h-10 w-10 text-orange-500" />
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{FLASH_SALE_TITLE}</h2>
                  <p className="text-gray-600 mt-1">Limited time deals — grab them before they&apos;re gone!</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-orange-500 text-white rounded-lg px-3 py-2 text-center min-w-[3.5rem]">
                  <span className="block text-xl font-bold">{countdown.days}</span>
                  <span className="text-xs">Days</span>
                </div>
                <div className="bg-orange-500 text-white rounded-lg px-3 py-2 text-center min-w-[3.5rem]">
                  <span className="block text-xl font-bold">{countdown.hours}</span>
                  <span className="text-xs">Hrs</span>
                </div>
                <div className="bg-orange-500 text-white rounded-lg px-3 py-2 text-center min-w-[3.5rem]">
                  <span className="block text-xl font-bold">{countdown.minutes}</span>
                  <span className="text-xs">Min</span>
                </div>
                <div className="bg-orange-500 text-white rounded-lg px-3 py-2 text-center min-w-[3.5rem]">
                  <span className="block text-xl font-bold">{countdown.seconds}</span>
                  <span className="text-xs">Sec</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {flashSaleProducts.map((product) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/flash-sale">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  View All Flash Deals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600">We deliver countrywide with reliable shipping</p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
              <p className="text-gray-600">Your transactions are safe and encrypted</p>
            </div>
            <div className="text-center">
              <Headphones className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-gray-600">Customer support available round the clock</p>
            </div>
            <div className="text-center">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold text-lg mb-2">Easy Returns</h3>
              <p className="text-gray-600">Hassle-free returns within 30 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / New Arrivals Sections */}
      {showNewFirst ? (
        <>
          {/* New Arrivals first (only on first visit) */}
          <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-bold">New Arrivals</h2>
                <Link href="/shop?sort=newest">
                  <Button variant="outline">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full min-w-0 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {newProducts.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Featured Products after */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-bold">Featured Products</h2>
                <Link href="/shop">
                  <Button variant="outline">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full min-w-0 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Featured Products first (after first visit) */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-bold">Featured Products</h2>
                <Link href="/shop">
                  <Button variant="outline">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full min-w-0 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* New Arrivals below */}
          <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-bold">New Arrivals</h2>
                <Link href="/shop?sort=newest">
                  <Button variant="outline">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full min-w-0 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {newProducts.map((product) => (
                    <div key={product.id} className="min-w-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Special Offers Available</h2>
          <p className="text-xl mb-8">Sign up for our newsletter to get exclusive deals and updates</p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <Button className="bg-white text-orange-600 hover:bg-gray-100">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
