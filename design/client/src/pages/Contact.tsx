import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Thank you for your message! We'll get back to you soon.");
      e.currentTarget.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">
            We'd love to hear from you. Get in touch with us today.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Mail className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email</h3>
                  <p className="text-gray-600">support@passmartshop.com</p>
                  <p className="text-gray-600">info@passmartshop.com</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Phone className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Phone</h3>
                  <p className="text-gray-600">0740730781</p>
                  <p className="text-gray-600">WhatsApp: +254740730781</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Coverage</h3>
                  <p className="text-gray-600">
                    Countrywide deliveries with a special focus on Nairobi and Thika.
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Business Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday: 10:00 AM - 4:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+254 700 000 000"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Message *</label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Please tell us more about your inquiry..."
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    required
                    className="mt-1"
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    I agree to the privacy policy and terms of service
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "What is your return policy?",
                a: "We offer a 30-day money-back guarantee on all products. If you're not satisfied, simply contact us for a return authorization.",
              },
              {
                q: "How long does shipping take?",
                a: "Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.",
              },
              {
                q: "Do you offer international shipping?",
                a: "Currently, we ship within Kenya. We're working on expanding to other countries soon.",
              },
              {
                q: "How can I track my order?",
                a: "You'll receive a tracking number via email once your order ships. You can use it to track your package in real-time.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
