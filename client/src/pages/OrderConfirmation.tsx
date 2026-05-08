import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Copy, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function OrderConfirmation() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: Number(params.id) });

  const copyCode = () => {
    if (order?.deliveryCode) {
      navigator.clipboard.writeText(order.deliveryCode);
      toast.success("Código copiado!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-4 pt-16 pb-8">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-[#c0392b]/20 flex items-center justify-center mb-4">
        <CheckCircle2 size={40} className="text-[#c0392b]" />
      </div>
      <h1 className="font-display text-white text-2xl font-bold mb-1">Pedido Confirmado!</h1>
      <p className="text-[#888] text-sm text-center mb-6">
        Seu pedido foi recebido e está sendo preparado
      </p>

      {/* Order number */}
      <div className="w-full bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mb-4">
        <p className="text-[#888] text-xs mb-1">Número do pedido</p>
        <p className="text-[#d4af37] font-bold font-display text-xl">{order.orderNumber}</p>
      </div>

      {/* Delivery code */}
      <div className="w-full bg-[#111] border border-[#c0392b]/30 rounded-2xl p-4 mb-4">
        <p className="text-[#888] text-xs mb-1">Código de confirmação de entrega</p>
        <div className="flex items-center justify-between">
          <p className="text-white font-bold font-display text-3xl tracking-widest">{order.deliveryCode}</p>
          <button
            onClick={copyCode}
            className="bg-[#1e1e1e] border border-[#333] rounded-xl p-2 text-[#888]"
          >
            <Copy size={16} />
          </button>
        </div>
        <p className="text-[#666] text-xs mt-2">
          Guarde este código. O motoboy precisará dele para confirmar a entrega.
        </p>
      </div>

      {/* Details */}
      <div className="w-full bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-[#c0392b]" />
          <span className="text-[#888] text-xs">Endereço de entrega</span>
        </div>
        <p className="text-white text-sm">{order.deliveryAddress}</p>
      </div>

      <div className="w-full bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-[#c0392b]" />
          <span className="text-[#888] text-xs">Tempo estimado</span>
        </div>
        <p className="text-white text-sm font-semibold">30 – 45 minutos</p>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => navigate(`/order/${order.id}`)}
          className="w-full bg-[#c0392b] text-white py-4 rounded-2xl font-semibold lv-shadow"
        >
          Acompanhar Pedido
        </button>
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-[#111] border border-[#222] text-[#888] py-3 rounded-2xl font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
