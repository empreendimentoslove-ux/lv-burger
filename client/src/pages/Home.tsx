import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { ChevronRight, Star, Clock, Truck, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: promotions = [], isLoading: promosLoading, error: promosError } = trpc.promotions.getActive.useQuery();
  const { data: companyInfo } = trpc.company.getInfo.useQuery();

  const firstName = user?.name?.split(" ")[0] ?? "Cliente";

  // Calculate if store is open based on businessHours
  const getStoreStatus = () => {
    try {
      if (!companyInfo?.businessHours || companyInfo.businessHours.length === 0) {
        return { open: true, nextChange: "Horários não configurados" };
      }
      
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const todayHours = (companyInfo.businessHours as any[]).find((h: any) => h.dayOfWeek === dayOfWeek);
      
      if (!todayHours || !todayHours.isOpen) {
        return { open: false, nextChange: `Abre ${dayNames[(dayOfWeek + 1) % 7]}` };
      }
      
      const [openHour, openMin] = todayHours.openTime.split(":").map(Number);
      const [closeHour, closeMin] = todayHours.closeTime.split(":").map(Number);
      const openTimeInMinutes = openHour * 60 + openMin;
      const closeTimeInMinutes = closeHour * 60 + closeMin;
      
      if (currentTime >= openTimeInMinutes && currentTime < closeTimeInMinutes) {
        return { open: true, nextChange: `Fecha às ${todayHours.closeTime}` };
      } else if (currentTime < openTimeInMinutes) {
        return { open: false, nextChange: `Abre às ${todayHours.openTime}` };
      } else {
        return { open: false, nextChange: `Abre ${dayNames[(dayOfWeek + 1) % 7]}` };
      }
    } catch (error) {
      return { open: true, nextChange: "" };
    }
  };

  const storeStatus = getStoreStatus();

  // Auto-rotate promotions every 5 seconds
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-nav">
      {/* Header */}
      <div className="bg-[#0a0a0a] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[#888] text-sm">Olá, {firstName} 👋</p>
            <h1 className="font-display text-white text-2xl font-bold">O que vai querer hoje?</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#c0392b] flex items-center justify-center">
            <span className="text-white font-bold text-sm">{firstName[0]?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Store Status Badge */}
      <div className="px-4 mb-4">
        <div className={`rounded-2xl p-3 flex items-center gap-3 ${
          storeStatus.open 
            ? "bg-gradient-to-r from-[#1a4d2e] to-[#0f3d24] border border-[#2d7a4f]" 
            : "bg-gradient-to-r from-[#4d1a1a] to-[#3d0f0f] border border-[#7a2d2d]"
        }`}>
          {storeStatus.open ? (
            <CheckCircle2 size={20} className="text-[#4ade80] flex-shrink-0" />
          ) : (
            <XCircle size={20} className="text-[#ef4444] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-xs sm:text-sm ${storeStatus.open ? "text-[#4ade80]" : "text-[#ef4444]"}`}>
              {storeStatus.open ? "Aberto" : "Fechado"}
            </p>
            <p className={`text-xs ${storeStatus.open ? "text-[#86efac]" : "text-[#fca5a5]"}`}>
              {storeStatus.nextChange}
            </p>
            {companyInfo?.businessHours && companyInfo.businessHours.length > 0 && (() => {
              const today = (companyInfo.businessHours as any[]).find((h: any) => h.dayOfWeek === new Date().getDay());
              return today && today.isOpen ? (
                <p className={`text-[10px] mt-1 ${storeStatus.open ? "text-[#4ade80]/70" : "text-[#fca5a5]/70"}`}>
                  {today.openTime} - {today.closeTime}
                </p>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* Promotions Banner - Loading State */}
      {promosLoading && (
        <div className="px-4 mb-6">
          <div className="rounded-2xl bg-[#111] border border-[#222] p-4 h-32 animate-pulse" />
        </div>
      )}
      
      {/* Promotions Banner - Error State */}
      {promosError && (
        <div className="px-4 mb-6">
          <div className="rounded-2xl bg-[#1a0a0a] border border-[#c0392b]/30 p-4 flex items-center gap-3 text-[#c0392b]">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm">Erro ao carregar promoções</p>
          </div>
        </div>
      )}
      
      {/* Promotions Banner - Success State */}
      {!promosLoading && !promosError && promotions.length > 0 && (
        <div className="px-4 mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#c0392b] to-[#a02d24] p-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[#ffcc00] text-xs font-bold uppercase tracking-widest mb-1">Promoção</p>
                <h3 className="font-display text-lg font-bold mb-1">{promotions[currentPromoIndex]?.title}</h3>
                <p className="text-sm text-white/90 mb-3">{promotions[currentPromoIndex]?.description}</p>
                {promotions[currentPromoIndex]?.discountPercentage && (
                  <span className="inline-block bg-[#ffcc00] text-[#c0392b] font-bold px-3 py-1 rounded-full text-sm">
                    {promotions[currentPromoIndex].discountPercentage}% OFF
                  </span>
                )}
              </div>
            </div>
            
            {/* Carousel indicators */}
            {promotions.length > 1 && (
              <div className="flex gap-1.5 mt-4 justify-center">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPromoIndex(idx)}
                    className={`transition-all rounded-full ${
                      idx === currentPromoIndex ? "bg-white w-6 h-2" : "bg-white/50 w-2 h-2"
                    }`}
                    aria-label={`Promoção ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="px-4 mb-6">
        <div
          className="relative rounded-2xl overflow-hidden h-44 cursor-pointer active:opacity-90 transition-opacity"
          onClick={() => navigate("/menu")}
          style={{
            background: "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"
            alt="LV Burger"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <div className="flex items-center gap-1 mb-1">
              <div className="h-px w-4 bg-[#d4af37]" />
              <span className="text-[#d4af37] text-[10px] tracking-widest uppercase font-medium">Destaque</span>
            </div>
            <h2 className="font-display text-white text-xl font-bold leading-tight">LV Gold</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Wagyu 200g com queijo brie e aioli trufado</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[#d4af37] font-bold text-sm">R$ 52,90</span>
              <button
                onClick={() => navigate("/menu")}
                className="bg-[#c0392b] hover:bg-[#a02d24] active:scale-95 text-white text-[10px] px-2 py-0.5 rounded-full font-medium transition-all"
              >
                Ver cardápio →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info chips */}
      <div className="px-4 mb-6 flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
        {[
          { icon: Clock, text: "30-45 min", sub: "Entrega" },
          { icon: Star, text: "4.9", sub: "Avaliação" },
          { icon: Truck, text: "Grátis", sub: "Frete" },
        ].map((chip) => (
          <div
            key={chip.text}
            className="flex-shrink-0 bg-[#111] border border-[#222] rounded-xl px-3 sm:px-4 py-2.5 flex items-center gap-2 min-w-max"
          >
            <chip.icon size={14} className="text-[#c0392b]" />
            <div>
              <p className="text-white text-xs font-semibold">{chip.text}</p>
              <p className="text-[#666] text-[10px]">{chip.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-base">Categorias</h2>
          <button onClick={() => navigate("/menu")} className="text-[#c0392b] text-sm flex items-center gap-0.5 active:opacity-70 transition-opacity">
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(categories ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/menu?category=${cat.id}`)}
              className="bg-[#111] border border-[#222] rounded-xl p-4 text-left active:scale-95 active:bg-[#1a1a1a] transition-all w-full"
            >
              <p className="text-white font-medium text-sm">{cat.name}</p>
              <p className="text-[#666] text-[10px] mt-0.5">{cat.description}</p>
              <ChevronRight size={14} className="text-[#c0392b] mt-2" />
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
      <FloatingCart />
    </div>
  );
}
