import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import OrdersTable, { OrderItemProps } from "../../components/tables/ordersTable";
import { usePolling } from "../../hooks/usePolling";

export default function OrdersPage() {
  const [data, setData] = useState<OrderItemProps[]>([]);
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get("/order/all");
      const all: OrderItemProps[] = res.data?.data ?? res.data ?? [];
      setData(all.filter((o: any) => o.shop_id === shopId));
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  useEffect(() => { fetchData(); }, []);
  usePolling(fetchData, 15000);

  return (
    <>
      <PageMeta title="Buyurtmalar" description="Do'kon buyurtmalari" />
      <PageBreadcrumb pageTitle="Buyurtmalar" />
      <div className="space-y-6">
        <OrdersTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
