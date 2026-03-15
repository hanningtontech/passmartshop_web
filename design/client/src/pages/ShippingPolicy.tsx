export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Shipping &amp; Delivery Policy</h1>
          <p className="text-gray-300 max-w-2xl">
            Learn about our delivery timelines, coverage areas, and shipping fees.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Delivery Areas</h2>
            <p>
              We deliver within Nairobi and to major towns across Kenya through trusted courier
              partners. Some remote locations may attract additional fees or longer delivery times.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Delivery Timelines</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Within Nairobi: typically 1–2 business days after order confirmation</li>
              <li>Outside Nairobi: typically 2–5 business days depending on location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Shipping Fees</h2>
            <p>
              Shipping costs depend on your delivery location and order size. Any applicable fees
              will be shown during checkout before you confirm your order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Order Tracking</h2>
            <p>
              Once your order has been dispatched, we will share tracking information where
              available or contact you via phone/SMS with delivery updates.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

