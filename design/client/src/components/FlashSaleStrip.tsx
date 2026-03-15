import { useState, useEffect } from "react";
import { X, Flame } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import FlashSaleCompactCard from "@/components/FlashSaleCompactCard";
import { FLASH_SALE_END_DATE } from "@/config/flashSale";

const DISMISS_STORAGE_KEY = "flash-sale-strip-dismissed";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

export default function FlashSaleStrip() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(DISMISS_STORAGE_KEY) === "1";
  });
  const countdown = useCountdown(FLASH_SALE_END_DATE);

  useEffect(() => {
    getDocs(collection(db, "products"))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.flashSale === true);
        setProducts(shuffle(list));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch (_) {}
  };

  if (dismissed || loading || products.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50/80 print:hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-orange-600 shrink-0">
              <span className="inline-flex items-center gap-0.5" aria-hidden>
                <Flame className="h-4 w-4 text-orange-500 animate-flame-flicker" />
                <Flame className="h-3 w-3 text-orange-400 animate-flame-flicker opacity-80" style={{ animationDelay: "0.2s" }} />
                <Flame className="h-2.5 w-2.5 text-amber-500 animate-flame-flicker opacity-70" style={{ animationDelay: "0.4s" }} />
              </span>
              Flash deals
            </span>
            <div className="flex items-center gap-1 shrink-0" role="timer" aria-live="polite">
              <span className="bg-orange-500/20 text-orange-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums">
                {countdown.days}d
              </span>
              <span className="bg-orange-500/20 text-orange-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums">
                {countdown.hours}h
              </span>
              <span className="bg-orange-500/20 text-orange-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums">
                {countdown.minutes}m
              </span>
              <span className="bg-orange-500/20 text-orange-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums">
                {countdown.seconds}s
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-orange-200/50 text-gray-500 hover:text-gray-700 transition shrink-0"
            aria-label="Dismiss flash deals"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-1">
          {products.map((p) => (
            <FlashSaleCompactCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
