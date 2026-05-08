import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#c0392b", "#d4af37", "#3498db", "#27ae60", "#9b59b6"];

export default function AdminReports() {
  const [, navigate] = useLocation();
  const today = new Date();
  const [startDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate] = useState(() => today.toISOString().split("T")[0]);

  const { data: daily } = trpc.reports.daily.useQuery();
  const { data: sales } = trpc.reports.sales.useQuery({ startDate, endDate });

  const topProducts = daily?.topProducts ?? [];
  const ordersByDay = sales?.ordersByDay ?? [];
  const totalRevenue = sales?.totalRevenue ?? 0;
  const totalOrders = sales?.totalOrders ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="text-[#888]"><ArrowLeft size={20} /></button>
          <h1 className="font-display text-white text-xl font-bold">Relatórios</h1>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Period summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pedidos (30d)", value: totalOrders, icon: ShoppingBag, color: "text-[#3498db]" },
            { label: "Receita (30d)", value: `R$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: "text-[#d4af37]" },
            { label: "Ticket Médio", value: totalOrders > 0 ? `R$${(totalRevenue / totalOrders).toFixed(0)}` : "R$0", icon: TrendingUp, color: "text-[#27ae60]" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3">
              <kpi.icon size={16} className={kpi.color} />
              <p className="text-white font-bold text-base mt-1">{kpi.value}</p>
              <p className="text-[#666] text-[10px] mt-0.5 leading-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Daily orders chart */}
        {ordersByDay.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-4">Pedidos por Dia (30 dias)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ordersByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                  cursor={{ fill: "rgba(192,57,43,0.1)" }}
                />
                <Bar dataKey="orders" fill="#c0392b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top products */}
        {topProducts.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-4">Produtos Mais Vendidos (Hoje)</p>
            <div className="flex gap-4">
              <ResponsiveContainer width="40%" height={140}>
                <PieChart>
                  <Pie data={topProducts} dataKey="quantity" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col gap-2 justify-center">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-[#aaa] text-xs flex-1 truncate">{p.name}</p>
                    <p className="text-white text-xs font-bold">{p.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue by day */}
        {ordersByDay.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-4">Receita por Dia (30 dias)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ordersByDay} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                  cursor={{ fill: "rgba(212,175,55,0.1)" }}
                  formatter={(v: any) => [`R$ ${parseFloat(v).toFixed(2)}`, "Receita"]}
                />
                <Bar dataKey="revenue" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {ordersByDay.length === 0 && topProducts.length === 0 && (
          <div className="text-center py-12 text-[#555]">
            <TrendingUp size={32} className="mx-auto mb-2 text-[#333]" />
            <p>Nenhum dado disponível ainda</p>
            <p className="text-xs mt-1">Os relatórios aparecerão após os primeiros pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}
