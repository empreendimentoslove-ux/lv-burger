import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X } from "lucide-react";

export default function DeliveryZonesAdmin() {
  const { data: zones = [], refetch } = trpc.deliveryZones.getAll.useQuery();
  const createZone = trpc.deliveryZones.create.useMutation();
  const updateZone = trpc.deliveryZones.update.useMutation();
  const deleteZone = trpc.deliveryZones.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    minDistance: "",
    maxDistance: "",
    baseFee: "",
    perKmFee: "",
    estimatedMinutes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateZone.mutateAsync({
          id: editingId,
          name: formData.name,
          minDistance: parseFloat(formData.minDistance),
          maxDistance: parseFloat(formData.maxDistance),
          baseFee: parseFloat(formData.baseFee),
          perKmFee: parseFloat(formData.perKmFee),
          estimatedMinutes: parseInt(formData.estimatedMinutes),
        });
        toast.success("Zona atualizada!");
      } else {
        await createZone.mutateAsync({
          name: formData.name,
          minDistance: parseFloat(formData.minDistance),
          maxDistance: parseFloat(formData.maxDistance),
          baseFee: parseFloat(formData.baseFee),
          perKmFee: parseFloat(formData.perKmFee),
          estimatedMinutes: parseInt(formData.estimatedMinutes),
        });
        toast.success("Zona criada!");
      }
      setFormData({
        name: "",
        minDistance: "",
        maxDistance: "",
        baseFee: "",
        perKmFee: "",
        estimatedMinutes: "",
      });
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Erro ao salvar zona");
    }
  };

  const handleEdit = (zone: any) => {
    setFormData({
      name: zone.name,
      minDistance: zone.minDistance.toString(),
      maxDistance: zone.maxDistance.toString(),
      baseFee: zone.baseFee.toString(),
      perKmFee: zone.perKmFee.toString(),
      estimatedMinutes: zone.estimatedMinutes.toString(),
    });
    setEditingId(zone.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta zona?")) {
      try {
        await deleteZone.mutateAsync({ id });
        toast.success("Zona deletada!");
        refetch();
      } catch (error: any) {
        toast.error(error?.message ?? "Erro ao deletar zona");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <h1 className="font-display text-white text-2xl font-bold">Zonas de Entrega</h1>
      </div>

      <div className="px-4 py-6">
        {/* Add Button */}
        <button
          onClick={() => {
            setFormData({
              name: "",
              minDistance: "",
              maxDistance: "",
              baseFee: "",
              perKmFee: "",
              estimatedMinutes: "",
            });
            setEditingId(null);
            setShowForm(true);
          }}
          className="w-full mb-6 bg-[#c0392b] text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#a03225] transition-colors"
        >
          <Plus size={20} /> Nova Zona
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold">{editingId ? "Editar Zona" : "Nova Zona"}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#666] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nome da zona (ex: Centro)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Distância mín (km)"
                  value={formData.minDistance}
                  onChange={(e) => setFormData({ ...formData, minDistance: e.target.value })}
                  className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                  step="0.1"
                  required
                />
                <input
                  type="number"
                  placeholder="Distância máx (km)"
                  value={formData.maxDistance}
                  onChange={(e) => setFormData({ ...formData, maxDistance: e.target.value })}
                  className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                  step="0.1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Taxa base (R$)"
                  value={formData.baseFee}
                  onChange={(e) => setFormData({ ...formData, baseFee: e.target.value })}
                  className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  placeholder="Taxa por km (R$)"
                  value={formData.perKmFee}
                  onChange={(e) => setFormData({ ...formData, perKmFee: e.target.value })}
                  className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                  step="0.01"
                  required
                />
              </div>

              <input
                type="number"
                placeholder="Tempo estimado (minutos)"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white placeholder-[#555] focus:border-[#c0392b] outline-none"
                required
              />

              <button
                type="submit"
                disabled={createZone.isPending || updateZone.isPending}
                className="w-full bg-[#c0392b] text-white py-2 rounded-xl font-semibold hover:bg-[#a03225] disabled:opacity-60 transition-colors"
              >
                {editingId ? "Atualizar" : "Criar"}
              </button>
            </form>
          </div>
        )}

        {/* Zones List */}
        <div className="space-y-3">
          {zones.length === 0 ? (
            <div className="text-center py-8 text-[#666]">
              <p>Nenhuma zona de entrega configurada</p>
            </div>
          ) : (
            zones.map((zone: any) => (
              <div key={zone.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{zone.name}</h3>
                    <p className="text-[#888] text-sm">
                      {zone.minDistance}km - {zone.maxDistance}km
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="text-[#3498db] hover:text-[#2980b9] p-2"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="text-[#e74c3c] hover:text-[#c0392b] p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-[#0a0a0a] rounded-xl p-2">
                    <p className="text-[#888] text-xs">Taxa Base</p>
                    <p className="text-white font-semibold">R$ {zone.baseFee}</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-2">
                    <p className="text-[#888] text-xs">Por km</p>
                    <p className="text-white font-semibold">R$ {zone.perKmFee}</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-2">
                    <p className="text-[#888] text-xs">Tempo</p>
                    <p className="text-white font-semibold">{zone.estimatedMinutes}min</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-[#1a2e2e] border border-[#2d5555] rounded-2xl p-4">
          <p className="text-[#88cccc] text-sm">
            <strong>Como funciona:</strong> A taxa de entrega é calculada como: Taxa Base + (Distância em km × Taxa por km)
          </p>
        </div>
      </div>
    </div>
  );
}
