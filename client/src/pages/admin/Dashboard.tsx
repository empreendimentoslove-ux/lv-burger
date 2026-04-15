import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ShoppingBag, Users, Package, TrendingUp, ChevronRight,
  BarChart2, LogOut, Layers, Truck, ClipboardList
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: report } = trpc.reports.daily.useQuery();
  const { data: recentOrders } = trpc.orders.listAll.useQuery();

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
          <h2 className="text-white font-semibold text-sm mb-3">Gerenciar</h2>
          <div className="grid grid-cols-3 gap-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color.split(" ")[0]}`}>
                  <item.icon size={18} className={item.color.split(" ")[1]} />
                </div>
                <span className="text-white text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm">Pedidos Recentes</h2>
            <button onClick={() => navigate("/admin/orders")} className="text-[#c0392b] text-xs flex items-center gap-0.5">
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(recentOrders ?? []).map((order) => (
              <button
                key={order.id}
                onClick={() => navigate("/admin/orders")}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex items-center justify-between text-left w-full"
              >
                <div>
                  <p className="text-[#d4af37] font-bold text-xs font-display">{order.orderNumber}</p>
                    <p className="text-[#888] text-xs mt-0.5">{(order as any).userId}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">
                    R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                  </p>
                  <p className={`text-xs ${STATUS_COLORS[order.status] ?? "text-[#888]"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
