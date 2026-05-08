import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Circle, Copy } from "lucide-react";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "confirmed", label: "Pedido Recebido", desc: "Seu pedido foi confirmado" },
  { key: "preparing", label: "Em Preparo", desc: "Estamos preparando seu lanche" },
  { key: "out_for_delivery", label: "Saiu para Entrega", desc: "O motoboy está a caminho" },
  { key: "delivered", label: "Entregue", desc: "Bom apetite!" },
] as const;

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    pending_payment: -1,
    confirmed: 0,
    preparing: 1,
    ready: 1,
    out_for_delivery: 2,
    delivered: 3,
    cancelled: -1,
  };
  return map[status] ?? 0;
}

export default function OrderTracking() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: Number(params.id) },
    { refetchInterval: 15000 }
  );

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

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/orders")} className="text-[#888]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-white text-xl font-bold">Acompanhe seu Pedido</h1>
            <p className="text-[#666] text-xs">{order.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Status tracker */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isDone ? "bg-[#c0392b]" : "bg-[#1e1e1e] border border-[#333]"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-white" />
                    ) : (
                      <Circle size={16} className="text-[#555]" />
                    )}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 ${idx < currentStep ? "bg-[#c0392b]" : "bg-[#222]"}`}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`font-medium text-sm ${isDone ? "text-white" : "text-[#555]"}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[#888] text-xs mt-0.5">{step.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery code */}
        {order.status !== "delivered" && (
          <div className="bg-[#111] border border-[#c0392b]/30 rounded-2xl p-4">
            <p className="text-[#888] text-xs mb-2">Código de confirmação de entrega</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-bold font-display text-3xl tracking-widest">{order.deliveryCode}</p>
              <button onClick={copyCode} className="bg-[#1e1e1e] border border-[#333] rounded-xl p-2 text-[#888]">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[#555] text-xs mt-2">Forneça este código ao motoboy na entrega</p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          <p className="text-[#888] text-xs mb-3">Itens do pedido</p>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-[#1a1a1a] last:border-0">
              <span className="text-[#aaa]">{item.quantity}x {item.productName}</span>
              <span className="text-white">R$ {parseFloat(item.subtotal).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="flex justify-between mt-3 pt-2">
            <span className="text-white font-semibold text-sm">Total</span>
            <span className="text-[#d4af37] font-bold">
              R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {order.status === "delivered" && (
          <div className="bg-[#c0392b]/10 border border-[#c0392b]/30 rounded-2xl p-4 text-center">
            <p className="text-[#c0392b] font-semibold">Pedido entregue com sucesso!</p>
            <p className="text-[#888] text-xs mt-1">Obrigado por escolher o LV Burger</p>
          </div>
        )}

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
