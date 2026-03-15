export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Refund &amp; Returns Policy</h1>
          <p className="text-gray-300 max-w-2xl">
            Understand how refunds, returns, and exchanges work at Passmartshop.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Eligibility for Returns</h2>
            <p>
              You may request a return within 7–30 days of delivery (depending on product type),
              provided the item is unused, in its original packaging, and in resellable condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Non-Returnable Items</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Personal care items where hygiene is a concern</li>
              <li>Opened software, digital products, or download codes</li>
              <li>Items marked as “Final Sale”</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Refunds</h2>
            <p>
              Once your return is received and inspected, we will notify you of the approval or
              rejection of your refund. Approved refunds will be processed to your original payment
              method or mobile wallet, subject to processing times of your provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Exchanges</h2>
            <p>
              If you received a defective or damaged item, we will arrange a replacement where
              possible. Please contact our support team with your order number and photos of the
              item.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

