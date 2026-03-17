import { useState, useEffect, ReactNode, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useProductTags } from "@/hooks/useProductTags";
import { useBehavior } from "@/contexts/BehaviorContext";
import FlashSaleStrip from "@/components/FlashSaleStrip";
import { useAuth } from "@/contexts/AuthContext";
import { UiProvider } from "@/contexts/UiContext";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { totalItems } = useCart();
  const { tags: productTags, loading: tagsLoading } = useProductTags();
  const { recordSearch, recentSearches } = useBehavior();
  const [displayTags, setDisplayTags] = useState<string[]>([]);
  const { user } = useAuth();
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
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
  }, [tagsLoading, productTags, recentSearches]);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY || window.pageYOffset;
      const delta = currentY - lastScrollY.current;

      // avoid frequent updates
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          // scroll down and passed threshold -> hide features
          if (delta > 20 && currentY > 100) {
            setHideFeatures(true);
          } else if (delta < -10) {
            // scrolling up -> show features
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
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Flash Sale", path: "/flash-sale" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Utility Bar - hidden when printing (e.g. order confirmation) */}
      <div className="bg-gray-900 text-gray-300 text-sm print:hidden">
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
            <a href="#" className="hover:text-orange-500 transition">Download App</a>
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium print:hidden">
        Free delivery in Nairobi & Thika. Countrywide delivery available.
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-white shadow-sm print:hidden transform transition-transform duration-300 will-change-transform ${hideFeatures ? "-translate-y-full" : "translate-y-0"
          }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                  PS
                </div>
                <span className="font-bold text-xl hidden sm:inline">
                  Passmartshop
                </span>
              </div>
            </Link>

            {/* Search Bar – prominent, ~40% width on desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0 max-w-xl">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
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
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
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
        {!hideFeatures && (tagsLoading || displayTags.length > 0) && (
          <div className="container mx-auto px-4 pb-3 border-t border-gray-200" style={{ paddingTop: "20px" }}>
            <div
              className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide"
              style={{ minHeight: "32px" }}
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
        {!hideFeatures && <FlashSaleStrip />}
      </header>

      {/* Main Content */}
      <UiProvider value={{ hideFeatures }}>
        <main className="flex-1">{children}</main>
      </UiProvider>

      {/* Footer */}
      {!hideFeatures && (
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
                    <p>+254 726 972 218</p>
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
                    <p>Moi Avenue, Kenya Cinema Plaza</p>
                    <p>5th Floor, Nairobi, Kenya</p>
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
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          </div>
        </footer>
      )}
    </div>
  );
}
