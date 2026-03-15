export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
          <p className="text-gray-300 max-w-2xl">
            Please read these terms carefully before using Passmartshop.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Use of the Website</h2>
            <p>
              By accessing or using this website, you agree to comply with these Terms &amp;
              Conditions and all applicable laws. If you do not agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Orders &amp; Pricing</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>All prices are displayed in the relevant local currency and may change without notice.</li>
              <li>We reserve the right to cancel or reject an order if a product is mispriced or unavailable.</li>
              <li>An order is confirmed only after you receive an order confirmation from us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Payments</h2>
            <p>
              We support various payment methods including mobile money and card payments. All
              payments must be authorized and completed before we dispatch your order, unless
              otherwise agreed (e.g., payment on delivery or pickup where available).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Limitation of Liability</h2>
            <p>
              Passmartshop is not liable for indirect, incidental, or consequential damages arising
              from the use of our website or products, to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Changes to These Terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. Continued use of the
              website after changes means you accept the updated terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

