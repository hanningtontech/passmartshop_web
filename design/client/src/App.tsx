import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { BehaviorProvider } from "./contexts/BehaviorContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TrackOrder from "./pages/TrackOrder";
import FlashSale from "./pages/FlashSale";
import Layout from "./components/Layout";
import Account from "./pages/Account";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Shop} />
      <Route path={"/home"} component={Home} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/flash-sale"} component={FlashSale} />
      <Route path={"/track-order"} component={TrackOrder} />
      <Route path={"/account"} component={Account} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/refund-policy"} component={RefundPolicy} />
      <Route path={"/shipping-policy"} component={ShippingPolicy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <BehaviorProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Layout>
                  <Router />
                </Layout>
              </TooltipProvider>
            </AuthProvider>
          </BehaviorProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
