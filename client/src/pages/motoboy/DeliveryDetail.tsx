import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, MapPin, Package, CheckCircle2, Navigation } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [confirmCode, setConfirmCode] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: myDeliveries } = trpc.deliveries.myDeliveries.useQuery();
  const delivery = (myDeliveries ?? []).find((d) => d.id === Number(params.id));

  const startRouteMutation = trpc.deliveries.startRoute.useMutation({
    onSuccess: () => {
      utils.deliveries.myDeliveries.invalidate();
      toast.success("Rota iniciada!");
    },
  });

  const confirmMutation = trpc.deliveries.confirm.useMutation({
    onSuccess: () => {
      utils.deliveries.myDeliveries.invalidate();
      toast.success("Entrega confirmada com sucesso!");
      navigate("/motoboy");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!delivery) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleConfirm = () => {
    if (confirmCode.length !== 6) {
      toast.error("O código deve ter 6 dígitos");
      return;
    }
    confirmMutation.mutate({ deliveryId: delivery.id, code: confirmCode });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/motoboy")} className="text-[#888]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-white text-xl font-bold">Detalhes da Entrega</h1>
            <p className="text-[#666] text-xs">{delivery.order?.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Status */}
        <div className={`rounded-2xl p-3 text-center ${
          delivery.status === "in_route"
            ? "bg-[#9b59b6]/10 border border-[#9b59b6]/30"
            : "bg-[#3498db]/10 border border-[#3498db]/30"
        }`}>
          <p className={`font-semibold text-sm ${
            delivery.status === "in_route" ? "text-[#9b59b6]" : "text-[#3498db]"
          }`}>
            {delivery.status === "in_route" ? "Em Rota" : "Entrega Aceita"}
          </p>
        </div>

        {/* Address */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-[#c0392b]" />
            <span className="text-[#888] text-xs">Endereço de entrega</span>
          </div>
          <p className="text-white text-sm">{delivery.order?.deliveryAddress}</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(delivery.order?.deliveryAddress ?? "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#c0392b] text-xs mt-2"
          >
            <Navigation size={12} /> Abrir no Maps
          </a>
        </div>

        {/* Items */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-[#c0392b]" />
            <span className="text-[#888] text-xs">Itens do pedido</span>
          </div>
          {delivery.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-[#1a1a1a] last:border-0">
              <span className="text-[#aaa]">{item.quantity}x {item.productName}</span>
              <span className="text-white">R$ {parseFloat(item.subtotal).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="flex justify-between mt-3 pt-2">
            <span className="text-white font-semibold text-sm">Total</span>
            <span className="text-[#d4af37] font-bold">
              R$ {parseFloat(delivery.order?.total ?? "0").toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Confirm delivery */}
        {delivery.status !== "delivered" && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
            <p className="text-white font-medium text-sm mb-3">Confirmar Entrega</p>
            <p className="text-[#888] text-xs mb-3">
              Solicite o código de 6 dígitos ao cliente para confirmar a entrega
            </p>
            <input
              type="text"
              maxLength={6}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-3 text-white text-center text-2xl font-bold tracking-widest outline-none focus:border-[#c0392b] mb-3"
            />
            <button
              onClick={handleConfirm}
              disabled={confirmCode.length !== 6 || confirmMutation.isPending}
              className="w-full bg-[#c0392b] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Confirmar Entrega
            </button>
          </div>
        )}

        {delivery.status === "accepted" && (
          <button
            onClick={() => startRouteMutation.mutate({ deliveryId: delivery.id })}
            disabled={startRouteMutation.isPending}
            className="w-full bg-[#9b59b6] text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Navigation size={16} />
            Iniciar Rota
          </button>
        )}
      </div>
    </div>
  );
}
