import { Truck, Shield, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">About Passmartshop</h1>
          <p className="text-xl text-gray-300">
            Your trusted partner for quality home goods and electronics
          </p>
        </div>
      </div>

      {/* Company Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold mb-6">Who We Are</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Passmart Shop is a local retail powerhouse designed to bring the marketplace directly to the
                doorsteps of customers across Kenya. By curating an extensive selection of essential electrical
                appliances, stylish clothing, and premium bedding, we serve as a one stop destination for home
                and lifestyle upgrades.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The experience is defined by a commitment to reliability and physical convenience, allowing
                shoppers to browse a diverse inventory with the peace of mind that comes from a dedicated cash
                on delivery model. Every interaction is built on the promise that what you see is exactly what
                you get, delivered with a speed that respects the fast paced lives of modern consumers.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Operating with a deep focus on the Nairobi and Thika corridors, Passmart Shop bridges the gap
                between digital browsing and physical ownership. Our brand identity is anchored in a vibrant
                orange and white palette, reflecting an energetic and transparent approach to commerce.
              </p>
              <p className="text-gray-600 leading-relaxed">
                With 24/7 support and a delivery network that runs Monday to Saturday, we make sure essential
                goods are never out of reach. Passmart Shop is fueled by positive customer stories, where the
                thrill of unboxing a perfect find is matched only by the efficiency of the journey from the
                warehouse to the home.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-white max-w-md mx-auto md:mx-0">
              <img
                src="/about-who-we-are.png"
                alt="Passmartshop customer support"
                className="w-full h-56 sm:h-72 md:h-96 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Award className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Quality</h3>
              <p className="text-gray-600">
                We only stock products that meet our high standards for quality
                and durability.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Users className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Customer First</h3>
              <p className="text-gray-600">
                Your satisfaction is our top priority. We're here to help 24/7.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Truck className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                We deliver quickly and reliably across the country.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Shield className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">Trust & Security</h3>
              <p className="text-gray-600">
                Your data and transactions are safe with us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Snapshot */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Passmart Shop at a Glance</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 text-sm text-gray-700 space-y-2">
            <p><span className="font-semibold">Name:</span> Passmart Shop</p>
            <p><span className="font-semibold">Schema:</span> LocalBusiness</p>
            <p><span className="font-semibold">Offerings:</span> Electrical appliances, clothing, and bedding items</p>
            <p><span className="font-semibold">Geography:</span> Primary delivery to Nairobi and Thika with extended delivery available for a fee</p>
            <p><span className="font-semibold">Contact Phone:</span> 0740730781</p>
            <p><span className="font-semibold">Contact Email:</span> support@passmartshop.com</p>
            <p><span className="font-semibold">WhatsApp:</span> +254740730781</p>
            <p><span className="font-semibold">Inquiry Hours:</span> 24/7 customer reach out</p>
            <p><span className="font-semibold">Delivery Schedule:</span> Monday to Saturday</p>
            <p><span className="font-semibold">Pricing Model:</span> Product based pricing with cash on delivery options</p>
            <p><span className="font-semibold">Trust Signals:</span> Positive customer reviews highlighting delivery speed and product accuracy</p>
            <p>
              <span className="font-semibold">Social Media:</span>{" "}
              <a
                href="https://www.tiktok.com/@elima.holdings?_r=1&_t=ZS-94lPR2CEjKi"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 hover:underline"
              >
                TikTok @elima.holdings
              </a>
            </p>
            <p><span className="font-semibold">Visual Identity:</span> Orange and white color scheme</p>
            <p>
              <span className="font-semibold">Keywords:</span> Nairobi delivery, Thika shopping, home appliances Kenya,
              bedding and clothes, cash on delivery shop
            </p>
            <p>
              <span className="font-semibold">Policies:</span> Deliveries outside Nairobi and Thika are subject to
              additional charges
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're a dedicated team of professionals committed to bringing you the
            best shopping experience possible. With years of experience in retail
            and e-commerce, we know what it takes to deliver excellence.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Shop?</h2>
          <p className="text-xl mb-8">
            Explore our wide selection of quality products today
          </p>
          <Link href="/shop">
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              Start Shopping
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
