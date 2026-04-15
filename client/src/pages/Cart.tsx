import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const [, navigate] = useLocation();
  const { items, totalPrice, updateItem, removeItem, isLoading } = useCart();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/menu")} className="text-[#888]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-white text-xl font-bold">Meu Carrinho</h1>
          {items.length > 0 && (
            <span className="ml-auto bg-[#c0392b] text-white text-xs px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-8">
          <div className="w-20 h-20 rounded-full bg-[#111] flex items-center justify-center">
            <ShoppingBag size={32} className="text-[#333]" />
          </div>
          <p className="text-[#888] text-center">Seu carrinho está vazio</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-[#c0392b] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Ver Cardápio
          </button>
        </div>
      ) : (
        <>
          {/* Customer info */}
          <div className="px-4 py-3 bg-[#111] border-b border-[#1a1a1a]">
            <p className="text-[#666] text-xs">Pedido para</p>
            <p className="text-white font-medium text-sm">{user?.name}</p>
            <p className="text-[#666] text-xs">{user?.email}</p>
          </div>

          {/* Items */}
          <div className="px-4 py-4 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 flex gap-3">
                <img
                  src={item.product?.imageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80"}
                  alt={item.product?.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-medium text-sm leading-tight">{item.product?.name}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#555] flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {item.notes && (
                    <p className="text-[#666] text-xs mt-0.5 italic">{item.notes}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#d4af37] font-bold text-sm">
                      R$ {(parseFloat(item.product?.price ?? "0") * item.quantity).toFixed(2).replace(".", ",")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center"
                      >
                        <Minus size={10} className="text-white" />
                      </button>
                      <span className="text-white text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center"
                      >
                        <Plus size={10} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="px-4 mb-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#888]">Subtotal</span>
                <span className="text-white">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-[#888]">Taxa de entrega</span>
                <span className="text-[#4caf50]">Grátis</span>
              </div>
              <div className="border-t border-[#222] pt-3 flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-[#d4af37] font-bold text-lg">
                  R$ {totalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-4">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full max-w-md mx-auto block bg-[#c0392b] text-white py-4 rounded-2xl font-semibold text-base active:scale-95 transition-transform lv-shadow"
          >
            Finalizar Pedido · R$ {totalPrice.toFixed(2).replace(".", ",")}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
