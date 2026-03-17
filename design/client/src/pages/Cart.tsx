import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { TAX_RATE } from "@/config/checkout";
import { formatCurrency } from "@/lib/imageUtils";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } =
    useCart();

  useEffect(() => {
    // Ensure cart opens from the top (SPA nav can preserve scroll position)
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-8">Your cart is empty</p>
            <Link href="/shop">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header (desktop/tablet only) */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gray-50 border-b font-semibold text-sm">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {/* Items */}
              {items.map((item) => {
                const price = parseFloat(item.basePrice);
                const itemTotal = price * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6 border-b items-start md:items-center hover:bg-gray-50 transition"
                  >
                    {/* Product */}
                    <div className="md:col-span-5 flex gap-3">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-2 text-sm">
                          {item.name}
                        </h3>
                        {(item.variantName != null && item.variantName !== "") && (
                          <p className="text-sm text-gray-600">
                            {item.variantName}
                            {item.variantSku ? ` · ${item.variantSku}` : ""}
                          </p>
                        )}
                        <p className="hidden md:block text-sm text-gray-600">
                          KSh {formatCurrency(price)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity (desktop) */}
                    <div className="hidden md:block md:col-span-2">
                      <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg w-fit mx-auto text-sm">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1, item.variantId)
                          }
                          className="px-2 py-1 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1, item.variantId)
                          }
                          className="px-2 py-1 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price (desktop) */}
                    <div className="hidden md:block md:col-span-2 text-right text-sm">
                      KSh {formatCurrency(price)}
                    </div>

                    {/* Total & Remove (desktop) */}
                    <div className="hidden md:flex md:col-span-3 items-center justify-between">
                      <span className="font-semibold text-sm">
                        KSh {formatCurrency(itemTotal)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Compact controls & totals for mobile */}
                    <div className="flex md:hidden flex-col gap-2 col-span-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg w-fit text-xs px-2 py-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1, item.variantId)
                            }
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="px-2">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1, item.variantId)
                            }
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.variantId)}
                          className="text-red-500 hover:text-red-700 transition ml-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-gray-600">
                          Price: <span className="font-semibold">KSh {formatCurrency(price)}</span>
                        </span>
                        <span className="text-gray-900 font-semibold">
                          Total: KSh {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link href="/shop">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">KSh {formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">Calculated at checkout</span>
                </div>
                {TAX_RATE > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold">
                      KSh {formatCurrency(totalPrice * TAX_RATE)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-6 text-xl font-bold">
                <span>Total</span>
                <span className="text-orange-600">
                  KSh {formatCurrency(totalPrice * (1 + TAX_RATE))}
                </span>
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-3"
                onClick={() => setLocation("/checkout")}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
