import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  { value: "confirmed", label: "Confirmado", color: "bg-[#3498db]/20 text-[#3498db]" },
  { value: "preparing", label: "Preparando", color: "bg-[#e67e22]/20 text-[#e67e22]" },
  { value: "ready", label: "Pronto", color: "bg-[#27ae60]/20 text-[#27ae60]" },
  { value: "out_for_delivery", label: "Em Rota", color: "bg-[#9b59b6]/20 text-[#9b59b6]" },
  { value: "delivered", label: "Entregue", color: "bg-[#27ae60]/20 text-[#27ae60]" },
  { value: "cancelled", label: "Cancelado", color: "bg-[#c0392b]/20 text-[#c0392b]" },
] as const;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando", color: "bg-[#f39c12]/20 text-[#f39c12]" },
  confirmed: { label: "Confirmado", color: "bg-[#3498db]/20 text-[#3498db]" },
  preparing: { label: "Preparando", color: "bg-[#e67e22]/20 text-[#e67e22]" },
  ready: { label: "Pronto", color: "bg-[#27ae60]/20 text-[#27ae60]" },
  out_for_delivery: { label: "Em Rota", color: "bg-[#9b59b6]/20 text-[#9b59b6]" },
  delivered: { label: "Entregue", color: "bg-[#27ae60]/20 text-[#27ae60]" },
  cancelled: { label: "Cancelado", color: "bg-[#c0392b]/20 text-[#c0392b]" },
};

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: orders, isLoading } = trpc.orders.listAll.useQuery(undefined, { refetchInterval: 15000 });

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.listAll.invalidate(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const cleanupMutation = trpc.orders.cleanupHistory.useMutation({
    onSuccess: (result) => {
      utils.orders.listAll.invalidate();
      toast.success(`Limpeza concluída! ${result.ordersDeleted} pedidos arquivados.`);
    },
    onError: (e) => toast.error("Erro ao limpar histórico: " + e.message),
  });

  const handleCleanupToday = () => {
    const today = new Date().toISOString().split('T')[0];
    if (confirm(`Tem certeza? Isso vai arquivar todos os pedidos anteriores a ${today} e gerar um relatório.`)) {
      cleanupMutation.mutate({ beforeDate: today });
    }
  };

  const filtered = (orders ?? []).filter(
    (o) => filterStatus === "all" || o.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
          <h1 className="font-display text-white text-xl font-bold">Pedidos</h1>
          {orders && <span className="ml-auto text-[#888] text-xs">{orders.length} total</span>}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterStatus("all")}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${filterStatus === "all" ? "bg-[#c0392b] text-white" : "bg-[#111] border border-[#222] text-[#888]"}`}
          >
            Todos
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${filterStatus === s.value ? "bg-[#c0392b] text-white" : "bg-[#111] border border-[#222] text-[#888]"}`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={handleCleanupToday}
            disabled={cleanupMutation.isPending}
            className="flex-shrink-0 ml-auto px-3 py-1 rounded-full text-xs font-medium bg-[#27ae60]/20 text-[#27ae60] hover:bg-[#27ae60]/30 disabled:opacity-50"
          >
            {cleanupMutation.isPending ? "Limpando..." : "🗑️ Limpar"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#555]">Nenhum pedido encontrado</div>
          )}
          {filtered.map((order) => {
            const status = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-[#333] text-[#888]" };
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[#d4af37] font-bold font-display text-sm">{order.orderNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[#888] text-xs">
                      {new Date(order.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-white font-semibold text-sm mt-1">
                      R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`text-[#555] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-[#1a1a1a] p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-[#666] text-xs mb-1">Endereço</p>
                      <p className="text-white text-sm">{order.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-1">Pagamento</p>
                      <p className="text-white text-sm">{order.paymentMethod === "cash" ? "Dinheiro" : "Pix"}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs mb-2">Alterar Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus.mutate({ id: order.id, status: s.value })}
                            disabled={order.status === s.value || updateStatus.isPending}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              order.status === s.value
                                ? s.color + " opacity-100 ring-1 ring-current"
                                : "bg-[#1e1e1e] text-[#888] hover:bg-[#2a2a2a]"
                            } disabled:opacity-50`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
