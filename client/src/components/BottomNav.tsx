import { useLocation } from "wouter";
import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

export function BottomNav() {
  const [location, navigate] = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  if (location === "/" || location.startsWith("/motoboy") || location.startsWith("/admin")) return null;

  const tabs = [
    { path: "/home", icon: Home, label: "Início" },
    { path: "/menu", icon: ShoppingBag, label: "Cardápio" },
    { path: "/orders", icon: ClipboardList, label: "Pedidos" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111] border-t border-[#222]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path || (tab.path === "/menu" && location.startsWith("/product"));
          const isCart = tab.path === "/menu";
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 relative transition-all ${
                isActive ? "text-[#c0392b]" : "text-[#666]"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#c0392b] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-[#c0392b]" : "text-[#666]"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#c0392b] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
