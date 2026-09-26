import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import PaymentsTable, { PaymentItemProps } from "../../components/tables/paymentsTable";
import { usePolling, useRequestSeq } from "../../hooks/usePolling";
import { useShopId } from "../../context/ShopSessionContext";
import { useLang } from "../../context/LangContext";

export default function PaymentsPage() {
  const { t } = useLang();

  const [data, setData] = useState<PaymentItemProps[]>([]);
  const shopId = useShopId();
  const req = useRequestSeq();

  const fetchData = async () => {
    const id = req.next();
    try {
      const res = await axiosClient.get("/payment/all");
      if (!req.isLatest(id)) return;
      const all: PaymentItemProps[] = res.data?.data ?? res.data ?? [];
      setData(all.filter((p: any) => p.shop_id === shopId));
    } catch {
      if (!req.isLatest(id)) return;
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  // usePolling runs immediately on mount (and again when the shop id changes).
  usePolling(fetchData, 15000, true, shopId);

  return (
    <>
      <PageMeta title={t.k("payments")} description="Do'kon to'lovlari" />
      <PageBreadcrumb pageTitle={t.k("payments")} />
      <div className="space-y-6">
        <PaymentsTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
