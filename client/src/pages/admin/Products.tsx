import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save } from "lucide-react";
import { toast } from "sonner";

interface ProductForm {
  categoryId: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductForm = { categoryId: 0, name: "", description: "", price: "", imageUrl: "" };

export default function AdminProducts() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const { data: products } = trpc.products.listAll.useQuery();
  const { data: categories } = trpc.categories.listAll.useQuery();

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.listAll.invalidate(); setShowForm(false); setForm(EMPTY_FORM); toast.success("Produto criado!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.listAll.invalidate(); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); toast.success("Produto atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.listAll.invalidate(); toast.success("Produto removido!"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.products.update.useMutation({
    onSuccess: () => utils.products.listAll.invalidate(),
  });

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({ categoryId: p.categoryId, name: p.name, description: p.description ?? "", price: p.price, imageUrl: p.imageUrl ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Preencha nome, preço e categoria"); return; }
    
    let imageUrl = form.imageUrl;
    
    // Se a imagem for base64 (upload direto), fazer upload para S3
    if (form.imageUrl?.startsWith('data:')) {
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: form.imageUrl, fileName: `product-${Date.now()}.jpg` })
        });
        const data = await response.json();
        imageUrl = data.url;
      } catch (error) {
        toast.error("Erro ao fazer upload da imagem");
        return;
      }
    }
    
    const dataToSend = { ...form, imageUrl };
    
    if (editId) {
      updateMutation.mutate({ id: editId, ...dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
            <h1 className="font-display text-white text-xl font-bold">Cardápio</h1>
          </div>
          <button
            onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="bg-[#c0392b] text-white p-2 rounded-xl"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="bg-[#111] border-t border-[#222] rounded-t-3xl w-full p-5 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">{editId ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#666]"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[#888] text-xs mb-1 block">Categoria *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
                >
                  <option value={0}>Selecione...</option>
                  {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {[
                { key: "name", label: "Nome *", placeholder: "Ex: LV Classic" },
                { key: "price", label: "Preço *", placeholder: "Ex: 29.90" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[#888] text-xs mb-1 block">{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
                  />
                </div>
              ))}
              <div>
                <label className="text-[#888] text-xs mb-1 block">Foto do Produto</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setForm({ ...form, imageUrl: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b] file:text-[#d4af37] file:bg-transparent file:border-0 file:cursor-pointer"
                  />
                </div>
                {form.imageUrl && form.imageUrl.startsWith('data:') && (
                  <img src={form.imageUrl} alt="Preview" className="w-full h-32 rounded-xl object-cover mt-2" />
                )}
              </div>
              <div>
                <label className="text-[#888] text-xs mb-1 block">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b] resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : <><Save size={16} /> {editId ? "Salvar Alterações" : "Criar Produto"}</> }
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {(products ?? []).map((p) => (
          <div key={p.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 flex gap-3">
            <img
              src={p.imageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80"}
              alt={p.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white font-medium text-sm leading-tight">{p.name}</p>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleEdit(p)} className="text-[#888] p-1"><Edit2 size={14} /></button>
                  <button onClick={() => deleteMutation.mutate({ id: p.id })} className="text-[#c0392b] p-1"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-[#d4af37] font-bold text-sm mt-1">
                R$ {parseFloat(p.price).toFixed(2).replace(".", ",")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => toggleMutation.mutate({ id: p.id, blocked: !p.blocked })}
                  className={`flex items-center gap-1 text-xs ${p.blocked ? "text-[#c0392b]" : "text-[#27ae60]"}`}
                >
                  {p.blocked ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {p.blocked ? "Bloqueado" : "Disponível"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
