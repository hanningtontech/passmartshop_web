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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Passmartshop was founded with a simple mission: to make quality
                home goods and electronics accessible to everyone. We believe that
                everyone deserves to have access to high-quality products at
                affordable prices.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Since our launch, we've grown to become a trusted online retailer
                serving thousands of customers across the country. Our commitment
                to excellence, customer satisfaction, and innovation drives
                everything we do.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we're proud to offer a curated selection of products from
                trusted brands, backed by our commitment to quality and customer
                service.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg h-96" />
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
