import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { User, Phone, MapPin, LogOut, Save } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({ name, phone, address });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <h1 className="font-display text-white text-xl font-bold">Meu Perfil</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-[#c0392b] flex items-center justify-center mb-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name ?? ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl font-display">
                {(user?.name ?? "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-white font-semibold">{user?.name}</p>
          <p className="text-[#888] text-sm">{user?.email}</p>
        </div>

        {/* Form */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex flex-col gap-4">
          <div>
            <label className="text-[#888] text-xs mb-1.5 flex items-center gap-1.5">
              <User size={12} /> Nome
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
            />
          </div>
          <div>
            <label className="text-[#888] text-xs mb-1.5 flex items-center gap-1.5">
              <Phone size={12} /> Telefone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b]"
            />
          </div>
          <div>
            <label className="text-[#888] text-xs mb-1.5 flex items-center gap-1.5">
              <MapPin size={12} /> Endereço padrão
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro..."
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#c0392b] resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#c0392b] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 lv-shadow disabled:opacity-60"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} /> Salvar Alterações
            </>
          )}
        </button>

        <button
          onClick={logout}
          className="w-full bg-[#111] border border-[#222] text-[#888] py-3 rounded-2xl font-medium flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>

      <BottomNav />
      <FloatingCart />
    </div>
  );
}
