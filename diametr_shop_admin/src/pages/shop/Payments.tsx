import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import PaymentsTable, { PaymentItemProps } from "../../components/tables/paymentsTable";
import { usePolling } from "../../hooks/usePolling";

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentItemProps[]>([]);
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get("/payment/all");
      const all: PaymentItemProps[] = res.data?.data ?? res.data ?? [];
      setData(all.filter((p: any) => p.shop_id === shopId));
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  useEffect(() => { fetchData(); }, []);
  usePolling(fetchData, 15000);

  return (
    <>
      <PageMeta title="To'lovlar" description="Do'kon to'lovlari" />
      <PageBreadcrumb pageTitle="To'lovlar" />
      <div className="space-y-6">
        <PaymentsTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
