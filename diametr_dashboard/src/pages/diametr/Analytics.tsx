import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { LoadSpinner } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import { formatMoney } from "../../service/formatters/money.format";
import Moment from "moment";
import * as XLSX from "xlsx";
import { DownloadIcon } from "../../icons";
import Button from "../../components/ui/button/Button";

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  amount?: number;
  payment_type?: string;
  status?: string;
  createdt?: string;
  createdAt?: string;
  shop?: { id?: number; name?: string };
  products?: {
    count?: number;
    amount?: number;
    shop_product?: {
      price?: number;
      product_item?: {
        name?: string;
        product?: { name?: string; name_uz?: string };
      };
    };
  }[];
}

interface ShopStat {
  shop: string;
  totalOrders: number;
  totalRevenue: number;
  products: Record<string, { count: number; revenue: number }>;
  payments: Record<string, number>;
}

interface PaymentStat {
  type: string;
  count: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getProductName(p: NonNullable<OrderItem["products"]>[number]): string {
  return (
    p?.shop_product?.product_item?.product?.name_uz ??
    p?.shop_product?.product_item?.product?.name ??
    p?.shop_product?.product_item?.name ??
    "Noma'lum"
  );
}

function buildStats(orders: OrderItem[]) {
  const shopMap: Record<string, ShopStat> = {};
  const paymentMap: Record<string, { count: number; total: number }> = {};

  orders.forEach((o) => {
    const shop = o.shop?.name ?? "Noma'lum do'kon";
    const payType = o.payment_type ?? "Noma'lum";
    const orderAmount = o.amount ?? 0;

    if (!shopMap[shop]) {
      shopMap[shop] = { shop, totalOrders: 0, totalRevenue: 0, products: {}, payments: {} };
    }
    shopMap[shop].totalOrders += 1;
    shopMap[shop].totalRevenue += orderAmount;
    shopMap[shop].payments[payType] = (shopMap[shop].payments[payType] ?? 0) + 1;

    (o.products ?? []).forEach((p) => {
      const name = getProductName(p);
      if (!shopMap[shop].products[name]) shopMap[shop].products[name] = { count: 0, revenue: 0 };
      shopMap[shop].products[name].count += p.count ?? 1;
      shopMap[shop].products[name].revenue += (p.amount ?? 0);
    });

    if (!paymentMap[payType]) paymentMap[payType] = { count: 0, total: 0 };
    paymentMap[payType].count += 1;
    paymentMap[payType].total += orderAmount;
  });

  return {
    shopStats: Object.values(shopMap).sort((a, b) => b.totalRevenue - a.totalRevenue),
    paymentStats: Object.entries(paymentMap).map(([type, v]) => ({ type, ...v })) as PaymentStat[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
function exportOverview(orders: OrderItem[]) {
  const { shopStats, paymentStats } = buildStats(orders);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Jami buyurtmalar", orders.length],
    ["Jami tushum", orders.reduce((s, o) => s + (o.amount ?? 0), 0)],
    ["Faol do'konlar", shopStats.length],
    ["Sanasi", Moment().format("DD.MM.YYYY HH:mm")],
  ]), "Umumiy");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Do'kon", "Buyurtmalar", "Tushum", "Asosiy to'lov"],
    ...shopStats.map((s) => {
      const topPay = Object.entries(s.payments).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
      return [s.shop, s.totalOrders, s.totalRevenue, topPay];
    }),
  ]), "Do'konlar");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["To'lov usuli", "Soni", "Jami summa"],
    ...paymentStats.map((p) => [p.type, p.count, p.total]),
  ]), "To'lov usullari");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["ID", "Do'kon", "Summa", "To'lov", "Status", "Sana"],
    ...orders.map((o) => [
      o.id, o.shop?.name ?? "-", o.amount ?? 0, o.payment_type ?? "-",
      o.status ?? "-", Moment(o.createdt ?? o.createdAt).format("DD.MM.YYYY HH:mm"),
    ]),
  ]), "Buyurtmalar");

  XLSX.writeFile(wb, `diametr-analytics-${Moment().format("YYYY-MM-DD")}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(Moment().startOf("month").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(Moment().format("YYYY-MM-DD"));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/order/all");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  usePolling(fetchOrders, 30_000);

  const filtered = orders.filter((o) => {
    const d = Moment(o.createdt ?? o.createdAt);
    return d.isSameOrAfter(dateFrom, "day") && d.isSameOrBefore(dateTo, "day");
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.amount ?? 0), 0);
  const { shopStats, paymentStats } = buildStats(filtered);

  const statusConfig: Record<string, string> = {
    STARTED: "Yangi", CONFIRMED: "Tasdiqlangan", FINISHED: "Yakunlangan", CANCELED: "Bekor qilingan",
  };

  return (
    <>
      <PageMeta title="Analitika | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Analitika & Statistika" />

      {/* Date filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Dan</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Gacha</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white" />
        </div>
        <Button size="sm" variant="primary" endIcon={<DownloadIcon className="size-4 fill-white" />} onClick={() => exportOverview(filtered)}>
          Excel eksport
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex justify-center items-center"><LoadSpinner /></div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Jami buyurtmalar", value: filtered.length },
              { label: "Jami tushum", value: formatMoney(totalRevenue) },
              { label: "Faol do'konlar", value: shopStats.length },
              { label: "To'lov usullari", value: paymentStats.length },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">To'lov usullari bo'yicha</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.05]">
                    <th className="pb-2 pr-4">To'lov usuli</th>
                    <th className="pb-2 pr-4">Soni</th>
                    <th className="pb-2 pr-4">Jami summa</th>
                    <th className="pb-2">Ulush</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                  {paymentStats.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 font-medium text-gray-800 dark:text-white">{p.type}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{p.count}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{formatMoney(p.total)}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-300">
                        {filtered.length > 0 ? ((p.count / filtered.length) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shop stats */}
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Do'konlar bo'yicha hisobot</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.05]">
                    <th className="pb-2 pr-4">Do'kon</th>
                    <th className="pb-2 pr-4">Buyurtmalar</th>
                    <th className="pb-2 pr-4">Tushum</th>
                    <th className="pb-2 pr-4">Mahsulotlar</th>
                    <th className="pb-2">Asosiy to'lov</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                  {shopStats.map((s, i) => {
                    const topPay = Object.entries(s.payments).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
                    return (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium text-gray-800 dark:text-white">{s.shop}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{s.totalOrders}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{formatMoney(s.totalRevenue)}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{Object.keys(s.products).length}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{topPay}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-shop product breakdown */}
          {shopStats.map((s, si) => (
            <div key={si} className="rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{s.shop} – mahsulotlar bo'yicha</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="pb-2 pr-4">Mahsulot</th>
                      <th className="pb-2 pr-4">Soni</th>
                      <th className="pb-2">Tushum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {Object.entries(s.products).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, v], pi) => (
                      <tr key={pi}>
                        <td className="py-2 pr-4 text-gray-800 dark:text-white">{name}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{v.count}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{formatMoney(v.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}