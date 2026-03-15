import { useState } from "react";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: backend orders.getStatus can be wired later
    if (!orderId.trim() || !email.trim()) return;
    // For now show static message; tRPC orders.getStatus can be added when backend is ready
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-md">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-gray-600 mb-8">
          Enter your order ID and email to check delivery status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Search className="h-4 w-4 mr-2 inline" />
            Track Order
          </Button>
        </form>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start gap-3">
            <Package className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Order tracking coming soon</p>
              <p className="text-sm text-gray-600 mt-1">
                We're setting up order tracking. For now, contact support with your order ID and email for updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
