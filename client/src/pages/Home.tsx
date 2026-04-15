import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { ChevronRight, Star, Clock, Truck } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: categories } = trpc.categories.list.useQuery();

  const firstName = user?.name?.split(" ")[0] ?? "Cliente";

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

      {/* Hero Banner */}
      <div className="px-4 mb-6">
        <div
          className="relative rounded-2xl overflow-hidden h-44 cursor-pointer"
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
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#d4af37] font-bold text-sm">R$ 52,90</span>
              <span className="bg-[#c0392b] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                Ver cardápio →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info chips */}
      <div className="px-4 mb-6 flex gap-3 overflow-x-auto scrollbar-hide">
        {[
          { icon: Clock, text: "30-45 min", sub: "Entrega" },
          { icon: Star, text: "4.9", sub: "Avaliação" },
          { icon: Truck, text: "Grátis", sub: "Frete" },
        ].map((chip) => (
          <div
            key={chip.text}
            className="flex-shrink-0 bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 flex items-center gap-2"
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
          <button onClick={() => navigate("/menu")} className="text-[#c0392b] text-sm flex items-center gap-0.5">
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(categories ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/menu?category=${cat.id}`)}
              className="bg-[#111] border border-[#222] rounded-xl p-4 text-left active:scale-95 transition-transform"
            >
              <p className="text-white font-medium text-sm">{cat.name}</p>
              <p className="text-[#666] text-xs mt-0.5">{cat.description}</p>
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
