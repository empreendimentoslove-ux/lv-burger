import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { useCart } from "@/contexts/CartContext";
import { Plus, Minus, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

export default function Menu() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCat = params.get("category") ? Number(params.get("category")) : null;

  const [, navigate] = useLocation();
  const [activeCat, setActiveCat] = useState<number | null>(initialCat);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products } = trpc.products.list.useQuery(
    activeCat ? { categoryId: activeCat } : undefined
  );
  const { addItem, updateItem, items } = useCart();

  const filteredProducts = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCartItem = (productId: number) => items.find((i) => i.productId === productId);

  const handleAdd = async (productId: number, name: string) => {
    try {
      await addItem(productId, 1);
      toast.success(`${name} adicionado!`, { duration: 1500 });
    } catch {
      toast.error("Erro ao adicionar item");
    }
  };

  const handleDecrement = async (productId: number) => {
    const item = getCartItem(productId);
    if (!item) return;
    await updateItem(item.id, item.quantity - 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/home")} className="text-[#888]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-white text-xl font-bold">Cardápio</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-[#222] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-[#c0392b]"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveCat(null)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeCat === null ? "bg-[#c0392b] text-white" : "bg-[#111] border border-[#222] text-[#888]"
          }`}
        >
          Todos
        </button>
        {(categories ?? []).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCat === cat.id ? "bg-[#c0392b] text-white" : "bg-[#111] border border-[#222] text-[#888]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-[#555]">
            <p>Nenhum produto encontrado</p>
          </div>
        )}
        {filteredProducts.map((product) => {
          const cartItem = getCartItem(product.id);
          const qty = cartItem?.quantity ?? 0;
          const isBlocked = product.blocked;
          return (
            <div
              key={product.id}
              className={`bg-[#111] border rounded-2xl overflow-hidden flex ${
                isBlocked ? "border-[#333] opacity-60" : "border-[#1e1e1e]"
              }`}
            >
              <button
                className="flex-1 flex gap-3 p-3 text-left"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img
                  src={product.imageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80"}
                  alt={product.name}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm leading-tight">{product.name}</h3>
                  <p className="text-[#666] text-xs mt-1 line-clamp-2">{product.description}</p>
                  <p className="text-[#d4af37] font-bold text-sm mt-2">
                    R$ {parseFloat(product.price).toFixed(2).replace(".", ",")}
                  </p>
                  {isBlocked && (
                    <span className="text-[#c0392b] text-[10px] font-medium">Indisponível</span>
                  )}
                </div>
              </button>
              <div className="flex items-end p-3">
                {!isBlocked && (
                  qty > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(product.id)}
                        className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center"
                      >
                        <Minus size={12} className="text-white" />
                      </button>
                      <span className="text-white text-sm font-bold w-4 text-center">{qty}</span>
                      <button
                        onClick={() => handleAdd(product.id, product.name)}
                        className="w-7 h-7 rounded-full bg-[#c0392b] flex items-center justify-center"
                      >
                        <Plus size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(product.id, product.name)}
                      className="w-8 h-8 rounded-full bg-[#c0392b] flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
      <FloatingCart />
    </div>
  );
}
