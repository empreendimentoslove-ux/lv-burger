import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Edit2, AlertTriangle, X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface StockForm {
  productId: number;
  quantity: number;
  minQuantity: number;
}

const EMPTY: StockForm = { productId: 0, quantity: 0, minQuantity: 5 };

export default function AdminStock() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StockForm>(EMPTY);

  const { data: stockItems } = trpc.stock.getAll.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  const createMutation = trpc.stock.create.useMutation({
    onSuccess: () => {
      utils.stock.getAll.invalidate();
      setShowForm(false);
      setForm(EMPTY);
      toast.success("Estoque criado!");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.stock.update.useMutation({
    onSuccess: () => {
      utils.stock.getAll.invalidate();
      setShowForm(false);
      setEditId(null);
      toast.success("Estoque atualizado!");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.stock.delete.useMutation({
    onSuccess: () => {
      utils.stock.getAll.invalidate();
      toast.success("Estoque deletado!");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      productId: item.productId,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.productId) {
      toast.error("Selecione um produto");
      return;
    }
    if (form.quantity < 0) {
      toast.error("Quantidade não pode ser negativa");
      return;
    }

    if (editId) {
      updateMutation.mutate({
        id: editId,
        quantity: form.quantity,
        minQuantity: form.minQuantity,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este item de estoque?")) {
      deleteMutation.mutate({ id });
    }
  };

  const isLow = (item: any) => item.quantity <= item.minQuantity;
  const getProductName = (productId: number) => {
    return products?.find((p: any) => p.id === productId)?.name || "Produto desconhecido";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="text-[#888] hover:text-white transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-white text-xl font-bold">Estoque</h1>
          </div>
          <button
            onClick={() => {
              setEditId(null);
              setForm(EMPTY);
              setShowForm(true);
            }}
            className="bg-[#c0392b] text-white p-2 rounded-xl hover:bg-[#a93226] transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="bg-[#111] border-t border-[#222] rounded-t-3xl w-full p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">
                {editId ? "Editar Estoque" : "Novo Estoque"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#666] hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {!editId && (
                <div>
                  <label className="text-[#888] text-xs mb-1 block">Produto *</label>
                  <select
                    value={form.productId}
                    onChange={(e) =>
                      setForm({ ...form, productId: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
                  >
                    <option value={0}>Selecione um produto</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[#888] text-xs mb-1 block">Quantidade</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs mb-1 block">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  value={form.minQuantity}
                  onChange={(e) =>
                    setForm({ ...form, minQuantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2 hover:bg-[#a93226] transition disabled:opacity-50"
              >
                <Save size={16} /> {editId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {(stockItems ?? []).map((item: any) => {
          const low = isLow(item);
          return (
            <div
              key={item.id}
              className={`bg-[#111] border rounded-2xl p-4 flex items-center justify-between ${
                low ? "border-[#f39c12]/30" : "border-[#1e1e1e]"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">
                    {getProductName(item.productId)}
                  </p>
                  {low && (
                    <AlertTriangle size={12} className="text-[#f39c12]" />
                  )}
                </div>
                <p className="text-[#888] text-xs mt-0.5">
                  {item.quantity} / {item.minQuantity} mín
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-[#888] hover:text-[#4ade80] transition p-2"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[#888] hover:text-[#ef4444] transition p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
