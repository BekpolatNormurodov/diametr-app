import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import OrdersTable, { OrderItemProps } from "../../components/tables/ordersTable";
import { usePolling, useRequestSeq } from "../../hooks/usePolling";
import { useShopId } from "../../context/ShopSessionContext";
import { useLang } from "../../context/LangContext";

export default function OrdersPage() {
  const { t } = useLang();

  const [data, setData] = useState<OrderItemProps[]>([]);
  const shopId = useShopId();
  const req = useRequestSeq();

  // Poll ticks and post-mutation refetches can overlap: only the newest request may
  // write, so a slow older poll never puts back a status the owner just changed.
  const fetchData = async () => {
    const id = req.next();
    try {
      const res = await axiosClient.get("/order/all");
      if (!req.isLatest(id)) return;
      const all: OrderItemProps[] = res.data?.data ?? res.data ?? [];
      setData(all.filter((o: any) => o.shop_id === shopId));
    } catch {
      if (!req.isLatest(id)) return;
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  // usePolling runs immediately on mount (and again when the shop id changes).
  usePolling(fetchData, 15000, true, shopId);

  return (
    <>
      <PageMeta title={t.k("orderList")} description="Do'kon buyurtmalari" />
      <PageBreadcrumb pageTitle={t.k("orderList")} />
      <div className="space-y-6">
        <OrdersTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
