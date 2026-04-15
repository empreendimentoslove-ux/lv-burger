import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Truck, Shield, User } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  customer: { label: "Cliente", icon: User, color: "text-[#888]" },
  motoboy: { label: "Motoboy", icon: Truck, color: "text-[#9b59b6]" },
  admin: { label: "Admin", icon: Shield, color: "text-[#d4af37]" },
};

export default function AdminTeam() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: allUsers } = trpc.team.listAll.useQuery();

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => { utils.team.listAll.invalidate(); toast.success("Função atualizada!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
          <h1 className="font-display text-white text-xl font-bold">Equipe</h1>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-[#666] text-xs">Gerencie as funções dos usuários. Promova clientes a motoboys ou administradores.</p>
        {(allUsers ?? []).map((user) => {
          const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.customer;
          const Icon = roleInfo.icon;
          return (
            <div key={user.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#c0392b] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{(user.name ?? "U")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{user.name ?? "Sem nome"}</p>
                  <p className="text-[#666] text-xs truncate">{user.email}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs ${roleInfo.color}`}>
                  <Icon size={12} />
                  <span>{roleInfo.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {(["customer", "motoboy", "admin"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => updateRole.mutate({ userId: user.id, role })}
                    disabled={user.role === role || updateRole.isPending}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      user.role === role
                        ? "bg-[#c0392b] text-white"
                        : "bg-[#1e1e1e] text-[#888]"
                    } disabled:opacity-50`}
                  >
                    {ROLE_LABELS[role].label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
