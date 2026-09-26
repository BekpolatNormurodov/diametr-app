import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import PromoCodesTable, { PromoCodeItemProps } from "../../components/tables/promoCodesTable";
import { usePolling, useRequestSeq } from "../../hooks/usePolling";
import { useLang } from "../../context/LangContext";

export default function PromoCodesPage() {
  const { t } = useLang();

  const [data, setData] = useState<PromoCodeItemProps[]>([]);
  const req = useRequestSeq();

  const fetchData = async () => {
    const id = req.next();
    try {
      const res = await axiosClient.get("/promo-code/all");
      if (!req.isLatest(id)) return;
      setData(res.data?.data ?? res.data ?? []);
    } catch {
      if (!req.isLatest(id)) return;
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  // usePolling also runs immediately on mount.
  usePolling(fetchData, 20000);

  return (
    <>
      <PageMeta title={t.k("promoCodes")} description="Do'kon promo kodlari" />
      <PageBreadcrumb pageTitle={t.k("promoCodes")} />
      <div className="space-y-6">
        <PromoCodesTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
