import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";

// Pages
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";

// Motoboy
import MotoboyDashboard from "./pages/motoboy/Dashboard";
import DeliveryDetail from "./pages/motoboy/DeliveryDetail";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminStock from "./pages/admin/Stock";
import AdminTeam from "./pages/admin/Team";
import AdminReports from "./pages/admin/Reports";
import CompanySettings from "./pages/admin/CompanySettings";
import DeliveryZonesAdmin from "./pages/DeliveryZonesAdmin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/home" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/order/:id" component={OrderTracking} />
      <Route path="/orders" component={MyOrders} />
      <Route path="/profile" component={Profile} />

      {/* Motoboy */}
      <Route path="/motoboy" component={MotoboyDashboard} />
      <Route path="/motoboy/delivery/:id" component={DeliveryDetail} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/stock" component={AdminStock} />
      <Route path="/admin/team" component={AdminTeam} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/settings" component={CompanySettings} />
      <Route path="/admin/delivery-zones" component={DeliveryZonesAdmin} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <CartProvider>
          <TooltipProvider>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#f5f5f5",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
