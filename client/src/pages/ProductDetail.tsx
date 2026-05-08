import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const { addItem } = useCart();

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: Number(params.id) });

  const handleAdd = async () => {
    if (!product) return;
    try {
      await addItem(product.id, qty, notes || undefined);
      toast.success(`${product.name} adicionado ao carrinho!`);
      navigate("/menu");
    } catch {
      toast.error("Erro ao adicionar item");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Hero image */}
      <div className="relative h-72">
        <img
          src={product.imageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <button
          onClick={() => navigate("/menu")}
          className="absolute top-12 left-4 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative">
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mb-4">
          <h1 className="font-display text-white text-2xl font-bold">{product.name}</h1>
          <p className="text-[#888] text-sm mt-2 leading-relaxed">{product.description}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[#d4af37] font-bold text-2xl">
              R$ {parseFloat(product.price).toFixed(2).replace(".", ",")}
            </span>
            {product.blocked && (
              <span className="bg-[#c0392b]/20 text-[#c0392b] text-xs px-3 py-1 rounded-full">
                Indisponível
              </span>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="mb-4">
          <label className="text-[#888] text-sm mb-2 block">Observações (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: sem cebola, ponto da carne..."
            rows={3}
            className="w-full bg-[#111] border border-[#222] rounded-xl p-3 text-white text-sm placeholder-[#555] outline-none focus:border-[#c0392b] resize-none"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      {!product.blocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-4 pb-safe">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl px-3 py-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-[#888]">
                <Minus size={16} />
              </button>
              <span className="text-white font-bold w-6 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="text-[#c0392b]">
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform lv-shadow"
            >
              <ShoppingCart size={18} />
              Adicionar · R$ {(parseFloat(product.price) * qty).toFixed(2).replace(".", ",")}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      <FloatingCart />
    </div>
  );
}
