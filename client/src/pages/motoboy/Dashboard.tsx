import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapPin, Package, ChevronRight, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

export default function MotoboyDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: available, isLoading: loadingAvailable } = trpc.deliveries.available.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );
  const { data: myDeliveries } = trpc.deliveries.myDeliveries.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );

  const acceptMutation = trpc.deliveries.accept.useMutation({
    onSuccess: () => {
      utils.deliveries.available.invalidate();
      utils.deliveries.myDeliveries.invalidate();
      toast.success("Entrega aceita!");
    },
    onError: (err) => toast.error(err.message),
  });

  const activeDeliveries = (myDeliveries ?? []).filter(
    (d) => d.status === "accepted" || d.status === "in_route"
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#888] text-xs">Painel do Motoboy</p>
            <h1 className="font-display text-white text-xl font-bold">{user?.name}</h1>
          </div>
          <button onClick={logout} className="text-[#555]">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Active deliveries */}
        {activeDeliveries.length > 0 && (
          <div>
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c0392b] animate-pulse" />
              Entregas Ativas
            </h2>
            <div className="flex flex-col gap-3">
              {activeDeliveries.map((delivery) => (
                <button
                  key={delivery.id}
                  onClick={() => navigate(`/motoboy/delivery/${delivery.id}`)}
                  className="bg-[#111] border border-[#c0392b]/30 rounded-2xl p-4 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#d4af37] font-bold font-display text-sm">
                      {delivery.order?.orderNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      delivery.status === "in_route"
                        ? "bg-[#9b59b6]/20 text-[#9b59b6]"
                        : "bg-[#3498db]/20 text-[#3498db]"
                    }`}>
                      {delivery.status === "in_route" ? "Em Rota" : "Aceita"}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin size={12} className="text-[#c0392b] mt-0.5 flex-shrink-0" />
                    <p className="text-[#aaa] text-xs">{delivery.order?.deliveryAddress}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white font-semibold text-sm">
                      R$ {parseFloat(delivery.order?.total ?? "0").toFixed(2).replace(".", ",")}
                    </span>
                    <ChevronRight size={14} className="text-[#555]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available deliveries */}
        <div>
          <h2 className="text-white font-semibold text-sm mb-2">
            Entregas Disponíveis
            {available && available.length > 0 && (
              <span className="ml-2 bg-[#c0392b] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {available.length}
              </span>
            )}
          </h2>

          {loadingAvailable ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (available ?? []).length === 0 ? (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 text-center">
              <Package size={32} className="text-[#333] mx-auto mb-2" />
              <p className="text-[#666] text-sm">Nenhuma entrega disponível</p>
              <p className="text-[#444] text-xs mt-1">Aguarde novos pedidos...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(available ?? []).map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#d4af37] font-bold font-display text-sm">
                      {delivery.order?.orderNumber}
                    </span>
                    <div className="flex items-center gap-1 text-[#888] text-xs">
                      <Clock size={11} />
                      <span>
                        {new Date(delivery.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 mb-2">
                    <MapPin size={12} className="text-[#c0392b] mt-0.5 flex-shrink-0" />
                    <p className="text-[#aaa] text-xs">{delivery.order?.deliveryAddress}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        R$ {parseFloat(delivery.order?.total ?? "0").toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[#666] text-xs">
                        {delivery.items?.length ?? 0} {delivery.items?.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <button
                      onClick={() => acceptMutation.mutate({ deliveryId: delivery.id })}
                      disabled={acceptMutation.isPending}
                      className="bg-[#c0392b] text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {(myDeliveries ?? []).filter((d) => d.status === "delivered").length > 0 && (
          <div>
            <h2 className="text-white font-semibold text-sm mb-2">Histórico</h2>
            <div className="flex flex-col gap-2">
              {(myDeliveries ?? [])
                .filter((d) => d.status === "delivered")
                .slice(0, 3)
                .map((delivery) => (
                  <div
                    key={delivery.id}
                    className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[#888] text-xs font-display">{delivery.order?.orderNumber}</p>
                      <p className="text-white text-sm font-semibold">
                        R$ {parseFloat(delivery.order?.total ?? "0").toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <span className="text-[#27ae60] text-xs bg-[#27ae60]/10 px-2 py-0.5 rounded-full">
                      Entregue
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
