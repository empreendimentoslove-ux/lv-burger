import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";

interface CatForm { name: string; slug: string; description: string; }
const EMPTY: CatForm = { name: "", slug: "", description: "" };

export default function AdminCategories() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);

  const { data: categories } = trpc.categories.listAll.useQuery();

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); setShowForm(false); setForm(EMPTY); toast.success("Categoria criada!"); },
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); setShowForm(false); setEditId(null); toast.success("Categoria atualizada!"); },
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); toast.success("Categoria removida!"); },
  });

  const handleEdit = (c: any) => {
    setEditId(c.id);
    setForm({ name: c.name, slug: c.slug ?? "", description: c.description ?? "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
    if (editId) updateMutation.mutate({ id: editId, name: form.name, description: form.description });
    else createMutation.mutate({ name: form.name, slug, description: form.description });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
            <h1 className="font-display text-white text-xl font-bold">Categorias</h1>
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
              <h2 className="text-white font-bold">{editId ? "Editar Categoria" : "Nova Categoria"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#666]"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: "name", label: "Nome *", placeholder: "Ex: Hambúrgueres" },
                { key: "slug", label: "Slug (auto)", placeholder: "Ex: hamburgueres" },
                { key: "description", label: "Descrição", placeholder: "Descrição da categoria" },
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
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
              >
                <Save size={16} /> {editId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {(categories ?? []).map((c) => (
          <div key={c.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{c.name}</p>
              <p className="text-[#666] text-xs mt-0.5">{c.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(c)} className="text-[#888] p-1.5 bg-[#1e1e1e] rounded-lg"><Edit2 size={14} /></button>
              <button onClick={() => deleteMutation.mutate({ id: c.id })} className="text-[#c0392b] p-1.5 bg-[#c0392b]/10 rounded-lg"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
