import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useMemo, useState } from "react";
import { fetchOwnStock } from "../../service/ownStock";
import { toast } from "../../components/ui/toast";
import ShopProductsTable, { ShopProductItemProps, isCatalogArchived } from "../../components/tables/shopProductsTable";
import { usePolling, useRequestSeq } from "../../hooks/usePolling";
import { useShopId } from "../../context/ShopSessionContext";
import { useLang } from "../../context/LangContext";

export default function ShopProductsPage() {
  const { t } = useLang();

  const [data, setData] = useState<ShopProductItemProps[]>([]);
  const shopId = useShopId();
  const req = useRequestSeq();

  // Only the newest request may write (a slow poll never overwrites a post-save refetch).
  const fetchData = async () => {
    const id = req.next();
    try {
      // Own stock via /shop-product/my: still listed while the shop is BLOCKED.
      const all: ShopProductItemProps[] = await fetchOwnStock();
      if (!req.isLatest(id)) return;
      // Always scope to the owner's own shop (never show other shops' stock).
      setData(all.filter((p) => p.shop_id === shopId));
    } catch {
      if (!req.isLatest(id)) return;
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  // usePolling runs immediately on mount (and again when the shop id changes).
  usePolling(fetchData, 20000, true, shopId);

  // Stock whose catalog product/variant was deleted is not sellable — keep it out of the stats.
  const liveData = useMemo(() => data.filter((p) => !isCatalogArchived(p)), [data]);

  const stats = useMemo(() => {
    const totalProducts = liveData.length;
    const totalStock = liveData.reduce((s, p) => s + (p.count ?? 0), 0);
    const totalValue = liveData.reduce((s, p) => s + (p.count ?? 0) * (p.price ?? 0), 0);
    const totalSold = liveData.reduce((s, p) => s + (p.sold_count ?? 0), 0);
    const lowStock = liveData.filter((p) => (p.count ?? 0) > 0 && (p.count ?? 0) <= 5).length;
    const outOfStock = liveData.filter((p) => (p.count ?? 0) === 0).length;
    return { totalProducts, totalStock, totalValue, totalSold, lowStock, outOfStock };
  }, [liveData]);

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

  const catStats = useMemo(() => {
    const map = new Map<number, { name: string; count: number; stock: number; value: number; sold: number }>();
    for (const p of liveData) {
      const cat = p.product_item?.product?.category;
      const catId = cat?.id ?? 0;
      const catName = cat?.name_uz ?? cat?.name ?? 'Boshqa';
      if (!map.has(catId)) map.set(catId, { name: catName, count: 0, stock: 0, value: 0, sold: 0 });
      const entry = map.get(catId)!;
      entry.count++;
      entry.stock += p.count ?? 0;
      entry.value += (p.count ?? 0) * (p.price ?? 0);
      entry.sold += p.sold_count ?? 0;
    }
    return [...map.values()].sort((a, b) => b.stock - a.stock);
  }, [liveData]);

  return (
    <>
      <PageMeta title={t.k("shopProducts")} description="Do'kon tovarlar ro'yxati" />
      <PageBreadcrumb pageTitle={t.k("products")} />
      <div className="space-y-6">
        {/* Inventory Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t("Jami tovarlar", "Всего товаров")}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProducts}</p>
            <p className="text-[11px] text-gray-400">xil tovar</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t.k("stock")}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalStock.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400">ta mahsulot</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t.k("stockValue")}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{fmt(stats.totalValue)}</p>
            <p className="text-[11px] text-gray-400">so'm</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t.k("soldItems")}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSold.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400">ta jami</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t.k("lowStock")}</p>
            <p className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`}>{stats.lowStock}</p>
            <p className="text-[11px] text-gray-400">≤5 ta qolgan</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{t.k("outOfStock")}</p>
            <p className={`text-2xl font-bold ${stats.outOfStock > 0 ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}>{stats.outOfStock}</p>
            <p className="text-[11px] text-gray-400">0 ta qolgan</p>
          </div>
        </div>
        {/* Category Stats */}
        {catStats.length > 1 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/3">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kategoriyalar bo'yicha</h3>
            </div>
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/2">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategoriya</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tovarlar</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t.k("stock")}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t.k("soldItems")}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qiymati</th>
                  </tr>
                </thead>
                <tbody>
                  {catStats.slice(0, 3).map((c, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/2">
                      <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{c.name}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">{c.count}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`font-semibold ${c.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{c.stock.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-2 text-center text-blue-600 dark:text-blue-400 font-semibold">{c.sold.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{fmt(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <ShopProductsTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
