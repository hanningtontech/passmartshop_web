import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FLASH_SALE_END_DATE, FLASH_SALE_TITLE, FLASH_SALE_SUBTITLE } from "@/config/flashSale";

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

export default function FlashSale() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown(FLASH_SALE_END_DATE);

  useEffect(() => {
    getDocs(collection(db, "products"))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.flashSale === true);
        setProducts(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <Flame className="h-10 w-10 text-orange-400" />
                {FLASH_SALE_TITLE}
              </h1>
              <p className="text-gray-300">{FLASH_SALE_SUBTITLE}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[4rem]">
                <span className="block text-2xl font-bold text-orange-300">{countdown.days}</span>
                <span className="text-xs">Days</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[4rem]">
                <span className="block text-2xl font-bold text-orange-300">{countdown.hours}</span>
                <span className="text-xs">Hours</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[4rem]">
                <span className="block text-2xl font-bold text-orange-300">{countdown.minutes}</span>
                <span className="text-xs">Mins</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[4rem]">
                <span className="block text-2xl font-bold text-orange-300">{countdown.seconds}</span>
                <span className="text-xs">Secs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-4">No flash sale products at the moment.</p>
            <Link href="/shop">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Browse Shop</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
