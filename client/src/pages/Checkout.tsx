import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, MapPin, Banknote, QrCode, ChevronRight, Loader2, MapPinIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

type Step = "address" | "payment";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState(user?.address ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix">("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createOrder = trpc.orders.create.useMutation();
  const { data: shopOpen } = trpc.shop.isOpen.useQuery();

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Try to reverse geocode using Google Maps Geocoder (if available)
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
            if (status === "OK" && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              reject(new Error("Geocoding failed"));
            }
          });
        });
        setAddress(result as string);
        toast.success("Endereço preenchido!");
      } catch (geocodeError) {
        // Fallback: show coordinates if geocoding fails
        const locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setAddress(locationText);
        toast.success("Localização capturada! Digite o endereço completo.");
      }
    } catch (error) {
      toast.error("Não foi possível obter sua localização");
    } finally {
      setIsLocating(false);
    }
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máx 5MB)");
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProofPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (!address.trim()) {
      toast.error("Informe o endereço de entrega");
      return;
    }
    setStep("payment");
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    
    if (!shopOpen) {
      toast.error("Loja fechada no momento. Pedidos não podem ser realizados.");
      return;
    }

    if (paymentMethod === "pix" && !proofImage) {
      toast.error("Envie o comprovante do Pix");
      return;
    }

    setIsSubmitting(true);
    try {
      let proofUrl: string | undefined;
      
      // Upload proof for Pix payment
      if (paymentMethod === "pix" && proofImage) {
        const formData = new FormData();
        formData.append("file", proofImage);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        proofUrl = uploadData.url;
      }
      
      const order = await createOrder.mutateAsync({
        paymentMethod,
        changeAmount: paymentMethod === "cash" && changeAmount ? changeAmount : undefined,
        deliveryAddress: address,
        subtotal: totalPrice.toFixed(2),
        deliveryFee: "0",
        total: totalPrice.toFixed(2),
        proofUrl,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.product?.name ?? "",
          productPrice: item.product?.price ?? "0",
          quantity: item.quantity,
          notes: item.notes ?? undefined,
          subtotal: (parseFloat(item.product?.price ?? "0") * item.quantity).toFixed(2),
        })),
      });
      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === "payment" ? setStep("address") : navigate("/cart"))}
            className="text-[#888]"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-white text-xl font-bold">
            {step === "address" ? "Endereço" : "Pagamento"}
          </h1>
        </div>
        {/* Steps indicator */}
        <div className="flex gap-2 mt-3">
          <div className={`flex-1 h-1 rounded-full ${step === "address" || step === "payment" ? "bg-[#c0392b]" : "bg-[#222]"}`} />
          <div className={`flex-1 h-1 rounded-full ${step === "payment" ? "bg-[#c0392b]" : "bg-[#222]"}`} />
        </div>
      </div>

      <div className="px-4 py-4">
        {step === "address" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-[#c0392b]" />
                <span className="text-white font-medium text-sm">Endereço de entrega</span>
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade..."
                rows={4}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl p-3 text-white text-sm placeholder-[#555] outline-none focus:border-[#c0392b] resize-none"
              />
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full mt-3 bg-[#3498db] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLocating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Localizando...
                  </>
                ) : (
                  <>
                    <MapPinIcon size={16} /> Usar minha localização
                  </>
                )}
              </button>
            </div>

            {/* Order summary */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <p className="text-[#888] text-xs mb-2">Resumo do pedido</p>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-[#aaa]">{item.quantity}x {item.product?.name}</span>
                  <span className="text-white">
                    R$ {(parseFloat(item.product?.price ?? "0") * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
              <div className="border-t border-[#222] mt-2 pt-2 flex justify-between">
                <span className="text-white font-semibold text-sm">Total</span>
                <span className="text-[#d4af37] font-bold">
                  R$ {totalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="flex flex-col gap-4">
            <p className="text-[#888] text-sm">Selecione a forma de pagamento</p>

            {/* Pix */}
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`bg-[#111] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
                paymentMethod === "pix" ? "border-[#c0392b]" : "border-[#1e1e1e]"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                paymentMethod === "pix" ? "bg-[#c0392b]" : "bg-[#1e1e1e]"
              }`}>
                <QrCode size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Pix</p>
                <p className="text-[#666] text-xs">Pagamento instantâneo</p>
              </div>
              {paymentMethod === "pix" && (
                <div className="w-5 h-5 rounded-full bg-[#c0392b] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>

            {/* Pix Key Display */}
            {paymentMethod === "pix" && (
              <div className="bg-[#1a1a1a] border border-[#c0392b]/30 rounded-2xl p-4 mb-4">
                <p className="text-[#d4af37] font-medium text-sm mb-2">Chave Pix (Telefone)</p>
                <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-white font-mono text-sm">91987283780</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("91987283780");
                      toast.success("Chave Pix copiada!");
                    }}
                    className="text-[#c0392b] text-xs font-semibold hover:text-[#d4af37] transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-[#666] text-xs mt-3">Faça a transferência para esta chave e envie o comprovante abaixo</p>
              </div>
            )}

            {/* Pix Proof Upload */}
            {paymentMethod === "pix" && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                <p className="text-white font-medium text-sm mb-3">Enviar comprovante</p>
                
                {proofPreview ? (
                  <div className="relative mb-3">
                    <img src={proofPreview} alt="Comprovante" className="w-full h-40 object-cover rounded-xl" />
                    <button
                      onClick={() => {
                        setProofImage(null);
                        setProofPreview("");
                      }}
                      className="absolute top-2 right-2 bg-[#c0392b] text-white p-1 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:border-[#c0392b] transition-colors"
                  >
                    <Upload size={24} className="text-[#666] mx-auto mb-2" />
                    <p className="text-[#888] text-sm">Toque para enviar foto</p>
                    <p className="text-[#555] text-xs mt-1">Câmera ou galeria</p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProofSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Dinheiro */}
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`bg-[#111] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
                paymentMethod === "cash" ? "border-[#c0392b]" : "border-[#1e1e1e]"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                paymentMethod === "cash" ? "bg-[#c0392b]" : "bg-[#1e1e1e]"
              }`}>
                <Banknote size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Dinheiro</p>
                <p className="text-[#666] text-xs">Pagamento na entrega</p>
              </div>
              {paymentMethod === "cash" && (
                <div className="w-5 h-5 rounded-full bg-[#c0392b] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>

            {paymentMethod === "cash" && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                <label className="text-[#888] text-xs mb-2 block">Troco para (opcional)</label>
                <input
                  type="number"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#555] outline-none focus:border-[#c0392b]"
                />
              </div>
            )}

            {/* Total */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total a pagar</span>
                <span className="text-[#d4af37] font-bold text-lg">
                  R$ {totalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-4">
        <button
          onClick={step === "address" ? handleNext : handleSubmit}
          disabled={isSubmitting || !shopOpen}
          className="w-full max-w-md mx-auto block bg-[#c0392b] text-white py-4 rounded-2xl font-semibold text-base active:scale-95 transition-transform lv-shadow disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando...
            </span>
          ) : !shopOpen ? (
            "Loja Fechada"
          ) : step === "address" ? (
            "Continuar para Pagamento"
          ) : (
            "Confirmar Pedido"
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
