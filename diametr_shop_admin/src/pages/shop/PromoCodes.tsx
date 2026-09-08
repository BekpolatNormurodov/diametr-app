import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import PromoCodesTable, { PromoCodeItemProps } from "../../components/tables/promoCodesTable";
import { usePolling } from "../../hooks/usePolling";

export default function PromoCodesPage() {
  const [data, setData] = useState<PromoCodeItemProps[]>([]);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get("/promo-code/all");
      setData(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  useEffect(() => { fetchData(); }, []);
  usePolling(fetchData, 20000);

  return (
    <>
      <PageMeta title="Promo Kodlar" description="Do'kon promo kodlari" />
      <PageBreadcrumb pageTitle="Promo Kodlar" />
      <div className="space-y-6">
        <PromoCodesTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
