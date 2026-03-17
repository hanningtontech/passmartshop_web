import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { PaymentMethod } from "@/types/order";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD_KSH,
  SHIPPING_COST_KSH,
  FREE_SHIPPING_AREAS,
  SHIPPING_COST_OUTSIDE_KSH,
} from "@/config/checkout";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const MPESA_TILL_NUMBER = "0740730781";
const POLICY_VERSION = 1;
const GUEST_POLICY_KEY = `passmartshop-policy-acceptance-v${POLICY_VERSION}`;

function getShippingCostKsh(deliveryArea: string): number {
  if (FREE_SHIPPING_AREAS.some((a) => a.toLowerCase() === deliveryArea.trim().toLowerCase()))
    return 0;
  return SHIPPING_COST_OUTSIDE_KSH;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placedOrderSummary, setPlacedOrderSummary] = useState<{
    itemCount: number;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    customerName: string;
    items: Array<{ productName: string; quantity: number; price: number }>;
  } | null>(null);
  const [paymentMethodForConfirmation, setPaymentMethodForConfirmation] = useState<PaymentMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa");
  const [mpesaTransactionCode, setMpesaTransactionCode] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<string>("");
  const { user, profile, updateProfile } = useAuth();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptRefund, setAcceptRefund] = useState(false);
  const [acceptShipping, setAcceptShipping] = useState(false);

  const userPolicyAccepted = useMemo(() => {
    const pa = profile?.policyAcceptance;
    return Boolean(pa?.terms && pa?.privacy && pa?.refund && pa?.shipping);
  }, [profile?.policyAcceptance]);

  const guestPolicyAccepted = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(GUEST_POLICY_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as any;
      return Boolean(data?.terms && data?.privacy && data?.refund && data?.shipping);
    } catch {
      return false;
    }
  }, []);

  const mustAcceptPolicies = !userPolicyAccepted && !guestPolicyAccepted;
  const canAcceptNow = acceptTerms && acceptPrivacy && acceptRefund && acceptShipping;

  const subtotal = totalPrice;
  const tax = subtotal * TAX_RATE;
  const shippingCost = getShippingCostKsh(deliveryArea);
  const orderTotal = subtotal + tax + shippingCost;

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: async (data, variables) => {
      setOrderId(data.orderId as number);
      setOrderNumber(data.orderNumber ?? null);
      setPlacedOrderSummary({
        itemCount: variables.items.length,
        subtotal: variables.subtotal,
        tax: variables.tax ?? 0,
        shipping: variables.shippingCost ?? 0,
        total: variables.total,
        customerName: variables.customerName,
        items: variables.items.map((i) => ({ productName: i.productName, quantity: i.quantity, price: i.price })),
      });
      setPaymentMethodForConfirmation(variables.paymentMethod);
      setOrderPlaced(true);
      clearCart();
      toast.success("Order placed successfully!");

      // Mirror order to Firestore so the admin panel (which reads from Firestore `orders`) can show it
      const paymentStatus = variables.paymentMethod === "M-Pesa" ? "awaiting_verification" : "pending";
      const orderData = {
        orderId: data.orderId,
        orderNumber: data.orderNumber ?? "",
        customerName: variables.customerName,
        customerEmail: variables.customerEmail,
        customerPhone: variables.customerPhone ?? "",
        shippingAddress: variables.shippingAddress ?? "",
        shippingCity: variables.shippingCity ?? "",
        shippingPostalCode: variables.shippingPostalCode ?? "",
        shippingCountry: variables.shippingCountry ?? "",
        subtotal: variables.subtotal,
        shippingCost: variables.shippingCost ?? 0,
        tax: variables.tax ?? 0,
        total: variables.total,
        paymentMethod: variables.paymentMethod,
        paymentStatus,
        mpesaTransactionCode: variables.mpesaTransactionCode ?? null,
        status: "pending",
        userId: (variables as any).userId ?? null,
        username: (variables as any).username ?? null,
        items: variables.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          variantId: (i as any).variantId ?? null,
          variantName: (i as any).variantName ?? null,
          variantSku: (i as any).variantSku ?? null,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await addDoc(collection(db, "orders"), orderData);
      } catch (err) {
        console.warn("[Checkout] Failed to write order to Firestore (admin may not show it):", err);
      }
    },
    onError: (error) => {
      toast.error("Failed to place order. Please try again.");
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const city =
      deliveryArea && deliveryArea !== "Other"
        ? deliveryArea
        : (formData.get("city") as string) || "";

    if (items.length === 0) {
      toast.error("Your cart is empty");
      setIsProcessing(false);
      return;
    }

    if (mustAcceptPolicies && !canAcceptNow) {
      toast.error("Please accept Terms, Privacy, Refund, and Shipping policies to place your order.");
      setIsProcessing(false);
      return;
    }

    if (mustAcceptPolicies && canAcceptNow) {
      const acceptance = {
        terms: true,
        privacy: true,
        refund: true,
        shipping: true,
        acceptedAt: new Date().toISOString(),
        version: POLICY_VERSION,
      };
      if (user?.uid) {
        try {
          await updateProfile({ policyAcceptance: acceptance } as any);
        } catch (err) {
          console.warn("[Checkout] Failed to save policy acceptance to profile:", err);
        }
      } else {
        try {
          localStorage.setItem(GUEST_POLICY_KEY, JSON.stringify(acceptance));
        } catch {
          // ignore
        }
      }
    }

    const orderItems = items.map((item) => ({
      productId: Number(item.id) || 0,
      productName:
        item.variantName != null && item.variantName !== ""
          ? `${item.name} (${item.variantName})`
          : item.name,
      quantity: item.quantity,
      price: parseFloat(item.basePrice),
      variantId: item.variantId,
      variantName: item.variantName,
      variantSku: item.variantSku,
    }));

    const computedShipping = getShippingCostKsh(deliveryArea || city);

    createOrderMutation.mutate({
      customerEmail: formData.get("email") as string,
      customerName: formData.get("name") as string,
      customerPhone: formData.get("phone") as string,
      shippingAddress: city,
      shippingCity: city,
      shippingPostalCode: "",
      shippingCountry: "",
      items: orderItems,
      subtotal,
      shippingCost: computedShipping,
      tax,
      total: subtotal + tax + computedShipping,
      paymentMethod,
      mpesaTransactionCode: paymentMethod === "M-Pesa" ? mpesaTransactionCode.trim() : undefined,
      userId: user?.uid,
      username: profile?.username ?? null,
    } as any);
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Add items to your cart before checking out
            </p>
            <Button
              onClick={() => setLocation("/shop")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced && placedOrderSummary) {
    const isMpesa = paymentMethodForConfirmation === "M-Pesa";
    const { subtotal, tax, shipping, total, customerName, items: orderItems } = placedOrderSummary;
    const displayOrderNumber = orderNumber ?? `PSM-${orderId}`;

    return (
      <div className="min-h-screen bg-background">
        {/* Non-print: actions */}
        <div className="container mx-auto px-4 py-4 flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} className="shrink-0">
            Download / Print
          </Button>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Order confirmation - Amazon-style layout (printable) */}
        <div id="order-confirmation" className="container mx-auto px-4 py-8 max-w-2xl border border-orange-200 rounded-lg bg-white shadow-sm print:border print:shadow-none print:max-w-none">
          {/* Header: logo left, title right */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
            <Link href="/" className="print:pointer-events-none">
              <div className="flex items-center gap-2">
                <img
                  src="/favicon.png"
                  alt="Passmartshop"
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-orange-100"
                />
                <span className="font-bold text-xl text-gray-900">Passmartshop</span>
              </div>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Order Confirmation</h1>
          </div>

          {/* Greeting */}
          <p className="text-orange-600 font-semibold mb-1">
            Hello {customerName.trim() || "Customer"},
          </p>
          <p className="text-gray-700 mb-6">
            {isMpesa
              ? "Thank you for shopping with us. We'll process your order once the M-Pesa payment is verified."
              : "Thank you for shopping with us. We'll send a confirmation when your order ships. Payment will be collected on delivery."}
          </p>

          {/* Order number + Manage Order */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <p className="text-gray-900">
              <span className="font-semibold">Order #</span>{" "}
              <span className="text-orange-600 font-mono font-semibold">{displayOrderNumber}</span>
            </p>
            <Link href="/track-order" className="print:hidden">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                Manage Order
              </Button>
            </Link>
          </div>

          {/* Product list */}
          <div className="space-y-4 mb-6">
            {orderItems.map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × KSh {item.price.toFixed(0)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 whitespace-nowrap">
                    KSh {(item.quantity * item.price).toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cost summary - right-aligned like Amazon */}
          <div className="flex justify-end">
            <div className="text-right space-y-1 min-w-[180px]">
              <p className="flex justify-between gap-6 text-gray-700">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `KSh ${shipping.toFixed(0)}`}</span>
              </p>
              {TAX_RATE > 0 && (
                <p className="flex justify-between gap-6 text-gray-700">
                  <span>Tax</span>
                  <span>KSh {tax.toFixed(0)}</span>
                </p>
              )}
              <p className="flex justify-between gap-6 text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>KSh {total.toFixed(0)}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        <div className="container mx-auto px-4 py-6 flex gap-4 justify-center print:hidden">
          <Button
            variant="outline"
            onClick={() => setLocation("/shop")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Billing Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Billing Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Area</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">
                      Delivery area *
                    </label>
                    <select
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select area</option>
                      <option value="Nairobi">Nairobi (Free delivery)</option>
                      <option value="Thika">Thika (Free delivery)</option>
                      <option value="Other">Other – Outside Nairobi &amp; Thika (KSh 200+)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Countrywide deliveries. Additional courier charges may apply outside Nairobi and Thika.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">
                        {deliveryArea === "Other" ? "City / Town *" : "City (optional)"}
                      </label>
                      <input
                        type="text"
                        name="city"
                        required={deliveryArea === "Other"}
                        placeholder={deliveryArea === "Other" ? "e.g. Mombasa, Kisumu" : "e.g. Nairobi CBD"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                      paymentMethod === "M-Pesa"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="M-Pesa"
                      checked={paymentMethod === "M-Pesa"}
                      onChange={() => {
                        setPaymentMethod("M-Pesa");
                        setMpesaTransactionCode("");
                      }}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="ml-3 font-semibold">M-Pesa</span>
                  </label>
                  <label
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                      paymentMethod === "Cash on Delivery"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === "Cash on Delivery"}
                      onChange={() => setPaymentMethod("Cash on Delivery")}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="ml-3 font-semibold">Cash on Delivery (CoD)</span>
                  </label>
                </div>

                {paymentMethod === "M-Pesa" && (
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">M-Pesa payment instructions</p>
                    <p className="text-sm text-gray-700 mb-2">
                      Pay the order total below via your M-Pesa app using the Paybill/Till number:
                    </p>
                    <p className="text-xl font-bold text-orange-600 mb-2">{MPESA_TILL_NUMBER}</p>
                    <p className="text-sm text-gray-700 mb-4">
                      Amount to pay: <span className="font-semibold">KSh {orderTotal.toFixed(0)}</span>
                    </p>
                    <label className="block font-semibold text-gray-900 mb-2">
                      M-Pesa Transaction Code *
                    </label>
                    <input
                      type="text"
                      value={mpesaTransactionCode}
                      onChange={(e) => setMpesaTransactionCode(e.target.value)}
                      placeholder="Enter the code from your M-Pesa confirmation SMS"
                      required={paymentMethod === "M-Pesa"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {paymentMethod === "Cash on Delivery" && (
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-gray-700">
                      You will pay the exact amount of <span className="font-semibold">KSh {orderTotal.toFixed(0)}</span> to the delivery agent upon receiving your order.
                    </p>
                  </div>
                )}
              </div>

              {/* Policies acceptance (required for first-time / guests) */}
              {mustAcceptPolicies && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-100">
                  <h2 className="text-2xl font-bold mb-2">Policies</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Please accept our policies to place your order.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                      <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} />
                      <span>
                        I accept the{" "}
                        <Link href="/terms">
                          <a className="text-orange-600 hover:underline">Terms &amp; Conditions</a>
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                      <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))} />
                      <span>
                        I accept the{" "}
                        <Link href="/privacy-policy">
                          <a className="text-orange-600 hover:underline">Privacy Policy</a>
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                      <Checkbox checked={acceptRefund} onCheckedChange={(v) => setAcceptRefund(Boolean(v))} />
                      <span>
                        I accept the{" "}
                        <Link href="/refund-policy">
                          <a className="text-orange-600 hover:underline">Refund Policy</a>
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                      <Checkbox checked={acceptShipping} onCheckedChange={(v) => setAcceptShipping(Boolean(v))} />
                      <span>
                        I accept the{" "}
                        <Link href="/shipping-policy">
                          <a className="text-orange-600 hover:underline">Shipping Policy</a>
                        </Link>
                        .
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  isProcessing ||
                  (paymentMethod === "M-Pesa" && !mpesaTransactionCode.trim())
                }
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Place Order"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">
                      KSh {(parseFloat(item.basePrice) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">KSh {totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {deliveryArea && (deliveryArea === "Nairobi" || deliveryArea === "Thika")
                      ? "Free"
                      : deliveryArea === "Other"
                        ? `KSh ${SHIPPING_COST_OUTSIDE_KSH}+`
                        : "Select area"}
                  </span>
                </div>
                {TAX_RATE > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({TAX_RATE * 100}%)</span>
                    <span className="font-semibold">
                      KSh {(totalPrice * TAX_RATE).toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xl font-bold pt-6 border-t">
                <span>Total</span>
                <span className="text-orange-600">
                  KSh {orderTotal.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
