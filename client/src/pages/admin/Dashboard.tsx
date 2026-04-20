import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { playNotificationSound, showNotification, requestNotificationPermission } from "@/utils/notificationManager";
import {
  ShoppingBag, Users, Package, TrendingUp, ChevronRight,
  BarChart2, LogOut, Layers, Truck, ClipboardList, Power, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [shopOpen, setShopOpen] = useState(true);
  
  const { data: report, refetch: refetchReport } = trpc.reports.daily.useQuery();
  const { data: recentOrders } = trpc.orders.listAll.useQuery(undefined, { refetchInterval: 5000 });
  const { data: shopSettings } = trpc.shop.settings.useQuery();
  const { data: isOpen } = trpc.shop.isOpen.useQuery(undefined, { refetchInterval: 30000 });
  
  const updateSettingsMutation = trpc.shop.updateSettings.useMutation({
    onSuccess: (_, variables) => {
      if (variables.isOpen !== undefined) {
        setShopOpen(variables.isOpen);
      }
      utils.shop.settings.invalidate();
      utils.shop.isOpen.invalidate();
      toast.success(variables.isOpen ? "Loja aberta!" : "Loja fechada!");
    },
  });
  
  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);
  
  // Monitor for new orders
  useEffect(() => {
    const currentCount = (recentOrders ?? []).filter((o: any) => o.status === 'pending_payment' || o.status === 'confirmed').length;
    if (currentCount > lastOrderCount) {
      playNotificationSound();
      showNotification('🍔 Novo Pedido!', `Você tem ${currentCount} pedido(s) aguardando`);
    }
    setLastOrderCount(currentCount);
  }, [recentOrders, lastOrderCount]);
  
  useEffect(() => {
    setShopOpen(isOpen ?? true);
  }, [isOpen]);

  const STATUS_COLORS: Record<string, string> = {
    pending_payment: "text-[#f39c12]",
    confirmed: "text-[#3498db]",
    preparing: "text-[#e67e22]",
    ready: "text-[#27ae60]",
    out_for_delivery: "text-[#9b59b6]",
    delivered: "text-[#27ae60]",
    cancelled: "text-[#c0392b]",
  };
  const STATUS_LABELS: Record<string, string> = {
    pending_payment: "Aguardando",
    confirmed: "Confirmado",
    preparing: "Preparando",
    ready: "Pronto",
    out_for_delivery: "Em Rota",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const navItems = [
    { path: "/admin/orders", icon: ClipboardList, label: "Pedidos", color: "bg-[#3498db]/20 text-[#3498db]" },
    { path: "/admin/products", icon: ShoppingBag, label: "Cardápio", color: "bg-[#c0392b]/20 text-[#c0392b]" },
    { path: "/admin/categories", icon: Layers, label: "Categorias", color: "bg-[#e67e22]/20 text-[#e67e22]" },
    { path: "/admin/stock", icon: Package, label: "Estoque", color: "bg-[#27ae60]/20 text-[#27ae60]" },
    { path: "/admin/team", icon: Truck, label: "Equipe", color: "bg-[#9b59b6]/20 text-[#9b59b6]" },
    { path: "/admin/reports", icon: BarChart2, label: "Relatórios", color: "bg-[#d4af37]/20 text-[#d4af37]" },
    { path: "/admin/settings", icon: Power, label: "Configurações", color: "bg-[#95a5a6]/20 text-[#95a5a6]" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded bg-[#c0392b] flex items-center justify-center">
                <span className="text-white text-[10px] font-black">LV</span>
              </div>
              <span className="text-[#888] text-xs">Painel Admin</span>
            </div>
            <h1 className="font-display text-white text-xl font-bold">Olá, {user?.name?.split(" ")[0]}</h1>
          </div>
          <button onClick={logout} className="text-[#555]">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Shop Status Alert */}
        {!shopOpen && (
          <div className="bg-[#f39c12]/10 border border-[#f39c12]/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-[#f39c12] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[#f39c12] font-semibold text-sm">Loja Fechada</p>
              <p className="text-[#f39c12]/70 text-xs">Novos pedidos estão bloqueados</p>
            </div>
          </div>
        )}

        {/* Shop Control */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-white font-semibold text-sm">Status da Loja</p>
              <p className={`text-xs mt-0.5 ${shopOpen ? 'text-[#27ae60]' : 'text-[#f39c12]'}`}>
                {shopOpen ? '🟢 Aberta' : '🔴 Fechada'}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => updateSettingsMutation.mutate({ isOpen: true })}
                disabled={shopOpen || updateSettingsMutation.isPending}
                className="flex-1 bg-[#27ae60] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Power size={14} /> Abrir
              </button>
              <button
                onClick={() => updateSettingsMutation.mutate({ isOpen: false })}
                disabled={!shopOpen || updateSettingsMutation.isPending}
                className="flex-1 bg-[#c0392b] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Power size={14} /> Fechar
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pedidos Hoje", value: report?.totalOrders ?? 0, icon: ClipboardList, color: "text-[#3498db]" },
            { label: "Receita Hoje", value: `R$ ${(report?.revenue ?? 0).toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-[#d4af37]" },
            { label: "Em Preparo", value: (report?.orders ?? []).filter((o: any) => o.status === 'preparing').length, icon: Package, color: "text-[#e67e22]" },
            { label: "Entregues", value: (report?.orders ?? []).filter((o: any) => o.status === 'delivered').length, icon: Truck, color: "text-[#27ae60]" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <kpi.icon size={18} className={kpi.color} />
              <p className="text-white font-bold text-xl mt-2">{kpi.value}</p>
              <p className="text-[#666] text-xs mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div>
          <p className="text-[#888] text-xs mb-2">Gerenciar</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`${item.color} rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center`}
              >
                <item.icon size={20} />
                <span className="text-xs font-medium line-clamp-2">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-semibold text-sm">Pedidos Recentes</p>
            <button onClick={() => navigate("/admin/orders")} className="text-[#c0392b] text-xs flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(recentOrders ?? []).slice(0, 5).map((order: any) => (
              <button
                key={order.id}
                onClick={() => navigate(`/admin/orders`)}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-[#d4af37] font-bold text-sm font-display">{order.orderNumber}</p>
                  <p className={`text-xs mt-0.5 ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</p>
                </div>
                <p className="text-white font-semibold text-sm">R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
