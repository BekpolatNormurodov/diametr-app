import { useCallback, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import axiosClient from "../../service/axios.service";
import { usePolling } from "../../hooks/usePolling";
import { formatMoney } from "../../service/formatters/money.format";
import Moment from "moment";

// ─── helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  STARTED:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  FINISHED:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELED:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const statusLabels: Record<string, string> = {
  STARTED:   "Yangi",
  CONFIRMED: "Tasdiqlangan",
  FINISHED:  "Bajarildi",
  CANCELED:  "Bekor",
};

// Build last-N-days revenue array
function buildWeeklyData(orders: any[]) {
  const days: { label: string; date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = Moment().subtract(i, "days");
    const date = d.format("YYYY-MM-DD");
    const amount = orders
      .filter((o) => o.status === "FINISHED" && Moment(o.createdAt ?? o.createdt).format("YYYY-MM-DD") === date)
      .reduce((s, o) => s + (Number(o.amount) || 0), 0);
    days.push({ label: d.format("DD/MM"), date, amount });
  }
  return days;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, colorClass, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode; colorClass: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorClass}`}>{icon}</div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
        {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Weekly bar chart (pure SVG/CSS) ─────────────────────────────────────────
function WeeklyChart({ days }: { days: { label: string; amount: number }[] }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Haftalik Daromad</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">So&apos;nggi 7 kun (Bajarilgan buyurtmalar)</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Jami</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {formatMoney(days.reduce((s, d) => s + d.amount, 0))} so&apos;m
          </p>
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {days.map((d) => {
          const heightPct = max > 0 ? (d.amount / max) * 100 : 0;
          const isToday = d.label === Moment().format("DD/MM");
          return (
            <div key={d.label} className="flex flex-col items-center flex-1 gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                {formatMoney(d.amount)} so&apos;m
              </div>
              <div className="w-full flex items-end justify-center h-28">
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? "bg-brand-500 dark:bg-brand-500"
                      : d.amount > 0
                        ? "bg-brand-200 dark:bg-brand-800/60 group-hover:bg-brand-400"
                        : "bg-gray-100 dark:bg-gray-800"
                  }`}
                  style={{ height: `${Math.max(heightPct, d.amount > 0 ? 8 : 4)}%` }}
                />
              </div>
              <span className={`text-xs ${isToday ? "text-brand-600 dark:text-brand-400 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Monthly revenue mini-stat ────────────────────────────────────────────────
function MonthlyRevenue({ orders }: { orders: any[] }) {
  const thisMonth = Moment().format("YYYY-MM");
  const lastMonth = Moment().subtract(1, "month").format("YYYY-MM");
  const this_total = orders
    .filter((o) => o.status === "FINISHED" && Moment(o.createdAt ?? o.createdt).format("YYYY-MM") === thisMonth)
    .reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const last_total = orders
    .filter((o) => o.status === "FINISHED" && Moment(o.createdAt ?? o.createdt).format("YYYY-MM") === lastMonth)
    .reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const pct = last_total > 0 ? Math.round(((this_total - last_total) / last_total) * 100) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">Oylik Daromad</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">{Moment().format("MMMM YYYY")}</p>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatMoney(this_total)} so&apos;m</p>
        {pct !== null && (
          <p className={`mt-1 text-sm font-medium ${pct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {pct >= 0 ? "+" : ""}{pct}% o&apos;tgan oyga nisbatan
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">O&apos;tgan oy: {formatMoney(last_total)} so&apos;m</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, shopProductsRes, paymentsRes] = await Promise.allSettled([
        axiosClient.get("/order/all"),
        axiosClient.get("/shop-product/all"),
        axiosClient.get("/payment/all"),
      ]);

      if (ordersRes.status === "fulfilled") {
        const all: any[] = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : ordersRes.value.data?.data ?? [];
        setOrders(all.filter((o) => o.shop?.id === shopId || o.shop_id === shopId));
      }
      if (shopProductsRes.status === "fulfilled") {
        const all: any[] = Array.isArray(shopProductsRes.value.data) ? shopProductsRes.value.data : shopProductsRes.value.data?.data ?? [];
        setProducts(all.filter((p) => p.shop_id === shopId || p.shop?.id === shopId));
      }
      if (paymentsRes.status === "fulfilled") {
        const all: any[] = Array.isArray(paymentsRes.value.data) ? paymentsRes.value.data : paymentsRes.value.data?.data ?? [];
        const myPayments = all.filter((p) => p.shop_id === shopId || p.shop?.id === shopId);
        setPaymentsTotal(myPayments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0));
      }
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  usePolling(fetchData, 15_000);

  const finishedOrders = orders.filter((o) => o.status === "FINISHED");
  const activeOrders   = orders.filter((o) => o.status === "STARTED" || o.status === "CONFIRMED");
  const revenue        = finishedOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const recentOrders   = [...orders]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  // Recently sold products from finished orders
  const recentlySold: { name: string; count: number; revenue: number }[] = (() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    finishedOrders.forEach((o) => {
      const items: any[] = o.order_items ?? o.items ?? [];
      items.forEach((item: any) => {
        const piId = String(item.shop_product?.product_item_id ?? item.product_item_id ?? item.product_item?.id ?? "?");
        const name = item.shop_product?.product_item?.product?.name_uz
          ?? item.shop_product?.product_item?.product?.name
          ?? item.product_item?.product?.name_uz
          ?? item.product_item?.product?.name
          ?? item.name
          ?? "Noma'lum";
        if (!map[piId]) map[piId] = { name, count: 0, revenue: 0 };
        map[piId].count += Number(item.count ?? item.quantity ?? 1);
        map[piId].revenue += Number(item.amount ?? item.price ?? 0) * Number(item.count ?? item.quantity ?? 1);
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  const weeklyData = buildWeeklyData(orders);
  const skel = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  return (
    <>
      <PageMeta title="Dashboard" description="Do'kon statistikasi" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Do&apos;koningizning umumiy ko&apos;rsatkichlari</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            label="Jami Buyurtmalar"
            value={loading ? <span className={skel + " h-6 w-16 block"} /> : orders.length}
            colorClass="bg-brand-50 dark:bg-brand-500/15"
            sub={`${activeOrders.length} ta aktiv`}
            icon={<svg className="w-6 h-6 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
          />
          <StatCard
            label="Jami Tushumlar"
            value={loading ? <span className={skel + " h-6 w-28 block"} /> : `${formatMoney(revenue)} so'm`}
            colorClass="bg-success-50 dark:bg-success-500/15"
            sub={`${finishedOrders.length} ta bajarildi`}
            icon={<svg className="w-6 h-6 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"/></svg>}
          />
          <StatCard
            label="Do'kon Tovarlar"
            value={loading ? <span className={skel + " h-6 w-12 block"} /> : products.length}
            colorClass="bg-blue-50 dark:bg-blue-500/15"
            sub={`${products.filter((p) => (p.count ?? 0) > 0).length} ta mavjud`}
            icon={<svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>}
          />
          <StatCard
            label="To'lovlar Jami"
            value={loading ? <span className={skel + " h-6 w-28 block"} /> : `${formatMoney(paymentsTotal)} so'm`}
            colorClass="bg-purple-50 dark:bg-purple-500/15"
            icon={<svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <WeeklyChart days={weeklyData} />
          </div>
          <MonthlyRevenue orders={orders} />
        </div>

        {/* Bottom row: recent orders + recently sold */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Recent orders */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800 dark:text-white">Oxirgi Buyurtmalar</h3>
              <a href="/orders" className="text-xs text-brand-500 hover:underline">Barchasi</a>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className={skel + " w-full h-8"} />)}</div>
            ) : recentOrders.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Buyurtmalar yo&apos;q</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-800">
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Mijoz</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Summa</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{order.user?.fullname ?? order.phone ?? "—"}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white">{order.amount ? `${formatMoney(Number(order.amount))} so'm` : "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status ?? ""] ?? "bg-gray-100 text-gray-500"}`}>
                            {statusLabels[order.status ?? ""] ?? order.status ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recently sold products */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800 dark:text-white">Ko&apos;p Sotilgan Tovarlar</h3>
              <a href="/shop-products" className="text-xs text-brand-500 hover:underline">Tovarlar</a>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className={skel + " w-full h-8"} />)}</div>
            ) : recentlySold.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Ma&apos;lumot yo&apos;q</div>
            ) : (
              <div className="p-4 space-y-3">
                {recentlySold.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.count} ta sotildi</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatMoney(item.revenue)} so&apos;m</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* All products in shop */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-800 dark:text-white">Do&apos;kon Tovarlar ({products.length})</h3>
            <a href="/shop-products" className="text-xs text-brand-500 hover:underline">Barchasi</a>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className={skel + " w-full h-8"} />)}</div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Tovarlar yo&apos;q</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Tovar</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Soni</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase">Narx</th>
                  </tr>
                </thead>
                <tbody>
                  {[...products].slice(0, 8).map((sp, i) => {
                    const pi = sp.product_item;
                    const name = pi?.product?.name_uz ?? pi?.product?.name ?? pi?.name ?? "—";
                    const variant = [
                      pi?.value != null && pi?.unit_type?.symbol ? `${pi.value} ${pi.unit_type.symbol}` : "",
                      pi?.color ?? "",
                      pi?.size ?? "",
                    ].filter(Boolean).join(" · ");
                    return (
                      <tr key={sp.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3 text-sm text-gray-800 dark:text-white">
                          <div className="font-medium">{name}</div>
                          {variant && <div className="text-xs text-gray-400">{variant}</div>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className={(sp.count ?? 0) > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                            {sp.count ?? 0} ta
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white">
                          {sp.bonus_price ? (
                            <span>
                              <span className="text-brand-600 dark:text-brand-400">{formatMoney(sp.bonus_price)}</span>
                              <span className="text-xs text-gray-400 line-through ml-1">{formatMoney(sp.price)}</span>
                              <span className="text-xs"> so&apos;m</span>
                            </span>
                          ) : (
                            <span>{sp.price != null ? `${formatMoney(sp.price)} so'm` : "—"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
