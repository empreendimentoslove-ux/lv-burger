import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Edit2, AlertTriangle, X, Save } from "lucide-react";
import { toast } from "sonner";

interface StockForm { name: string; unit: string; quantity: string; minQuantity: string; }
const EMPTY: StockForm = { name: "", unit: "unidade", quantity: "0", minQuantity: "5" };

export default function AdminStock() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StockForm>(EMPTY);

  const { data: items } = trpc.stock.list.useQuery();

  const createMutation = trpc.stock.create.useMutation({
    onSuccess: () => { utils.stock.list.invalidate(); setShowForm(false); setForm(EMPTY); toast.success("Item criado!"); },
  });
  const updateMutation = trpc.stock.update.useMutation({
    onSuccess: () => { utils.stock.list.invalidate(); setShowForm(false); setEditId(null); toast.success("Estoque atualizado!"); },
  });

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setForm({ name: item.name, unit: item.unit, quantity: item.quantity, minQuantity: item.minQuantity });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    if (editId) updateMutation.mutate({ id: editId, quantity: form.quantity, minQuantity: form.minQuantity });
    else createMutation.mutate(form);
  };

  const isLow = (item: any) => parseFloat(item.quantity) <= parseFloat(item.minQuantity);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
            <h1 className="font-display text-white text-xl font-bold">Estoque</h1>
          </div>
          <button onClick={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }} className="bg-[#c0392b] text-white p-2 rounded-xl">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="bg-[#111] border-t border-[#222] rounded-t-3xl w-full p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">{editId ? "Editar Item" : "Novo Item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#666]"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {!editId && (
                <>
                  <div>
                    <label className="text-[#888] text-xs mb-1 block">Nome *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pão de hambúrguer" className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]" />
                  </div>
                  <div>
                    <label className="text-[#888] text-xs mb-1 block">Unidade</label>
                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="unidade, kg, litro..." className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]" />
                  </div>
                </>
              )}
              <div>
                <label className="text-[#888] text-xs mb-1 block">Quantidade</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]" />
              </div>
              <div>
                <label className="text-[#888] text-xs mb-1 block">Quantidade Mínima</label>
                <input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]" />
              </div>
              <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2">
                <Save size={16} /> {editId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {(items ?? []).map((item) => {
          const low = isLow(item);
          return (
            <div key={item.id} className={`bg-[#111] border rounded-2xl p-4 flex items-center justify-between ${low ? "border-[#f39c12]/30" : "border-[#1e1e1e]"}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  {low && <AlertTriangle size={12} className="text-[#f39c12]" />}
                </div>
                <p className="text-[#888] text-xs mt-0.5">
                  {item.quantity} {item.unit} · Mín: {item.minQuantity}
                </p>
                {low && <p className="text-[#f39c12] text-xs mt-0.5">Estoque baixo!</p>}
              </div>
              <button onClick={() => handleEdit(item)} className="text-[#888] p-2 bg-[#1e1e1e] rounded-xl">
                <Edit2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
