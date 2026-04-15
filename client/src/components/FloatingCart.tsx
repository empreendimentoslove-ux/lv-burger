import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

export function FloatingCart() {
  const [location, navigate] = useLocation();
  const { totalItems, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  if (totalItems === 0) return null;
  if (location === "/cart" || location === "/checkout" || location === "/") return null;
  if (location.startsWith("/motoboy") || location.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => navigate("/cart")}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-3 bg-[#c0392b] text-white px-4 py-3 rounded-2xl shadow-lg lv-shadow transition-all active:scale-95"
    >
      <div className="relative">
        <ShoppingCart size={20} />
        <span className="absolute -top-2 -right-2 bg-white text-[#c0392b] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {totalItems}
        </span>
      </div>
      <span className="font-semibold text-sm">
        R$ {totalPrice.toFixed(2).replace(".", ",")}
      </span>
    </button>
  );
}
