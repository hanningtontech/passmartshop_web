export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-300 max-w-2xl">
            Learn how Passmartshop collects, uses, and protects your personal information.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
            <p>
              This Privacy Policy explains how we collect, use, store, and share your information
              when you use our website and services. By using Passmartshop, you agree to the
              practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Contact details such as your name, email address, and phone number</li>
              <li>Delivery information such as shipping address and location</li>
              <li>Order details and payment status (we do not store full card details)</li>
              <li>Technical data such as IP address, device type, and browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To process and deliver your orders</li>
              <li>To communicate with you about your orders and support requests</li>
              <li>To improve our products, services, and website experience</li>
              <li>To send you marketing messages where you have given consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Data Security</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information
              from unauthorized access, loss, misuse, or disclosure. However, no online system is
              completely secure, and you use our services at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data, subject
              to applicable law. To exercise your rights, please contact us using the details on
              the Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

