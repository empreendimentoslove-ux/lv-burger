import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BottomNav } from "@/components/BottomNav";
import { FloatingCart } from "@/components/FloatingCart";
import { ClipboardList, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "text-[#f39c12]" },
  confirmed: { label: "Confirmado", color: "text-[#3498db]" },
  preparing: { label: "Em Preparo", color: "text-[#e67e22]" },
  ready: { label: "Pronto", color: "text-[#27ae60]" },
  out_for_delivery: { label: "Saiu para Entrega", color: "text-[#9b59b6]" },
  delivered: { label: "Entregue", color: "text-[#27ae60]" },
  cancelled: { label: "Cancelado", color: "text-[#c0392b]" },
};

export default function MyOrders() {
  const [, navigate] = useLocation();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-nav">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <h1 className="font-display text-white text-xl font-bold">Meus Pedidos</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (orders ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-20 h-20 rounded-full bg-[#111] flex items-center justify-center">
            <ClipboardList size={32} className="text-[#333]" />
          </div>
          <p className="text-[#888]">Nenhum pedido ainda</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-[#c0392b] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Fazer Pedido
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3">
          {(orders ?? []).map((order) => {
            const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "text-[#888]" };
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3 text-left w-full"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#d4af37] font-bold font-display text-sm">{order.orderNumber}</p>
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-[#888] text-xs">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-white font-semibold text-sm mt-1">
                    R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#555]" />
              </button>
            );
          })}
        </div>
      )}

      <BottomNav />
      <FloatingCart />
    </div>
  );
}
