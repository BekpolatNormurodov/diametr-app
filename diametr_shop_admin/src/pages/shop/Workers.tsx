import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import WorkersTable, { WorkerItemProps } from "../../components/tables/workersTable";
import { usePolling } from "../../hooks/usePolling";

export default function WorkersPage() {
  const [data, setData] = useState<WorkerItemProps[]>([]);
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get("/worker/all");
      const all: WorkerItemProps[] = res.data?.data ?? res.data ?? [];
      setData(all.filter((w: any) => w.shop_id === shopId));
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  useEffect(() => { fetchData(); }, []);
  usePolling(fetchData, 20000);

  return (
    <>
      <PageMeta title="Xodimlar" description="Do'kon xodimlari" />
      <PageBreadcrumb pageTitle="Xodimlar" />
      <div className="space-y-6">
        <WorkersTable data={data} onRefetch={fetchData} />
      </div>
    </>
  );
}
