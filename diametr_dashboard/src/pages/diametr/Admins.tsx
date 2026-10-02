import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AdminsTable, { AdminItemProps } from "../../components/tables/diametr/adminsTable";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import axiosClient from "../../service/axios.service";

import { useLang } from "../../context/LangContext";
export default function AdminsPage() {
  const { t } = useLang();
  const { data, isLoading, refetch } = useFetchWithLoader<AdminItemProps[]>({
    fetcher: () => axiosClient.get("/admin/all").then((r) => r.data),
  });

  usePolling(refetch, 15_000);

  const admins: AdminItemProps[] = Array.isArray(data)
    ? data
    : (data as any)?.data ?? [];

  return (
    <>
      <PageMeta
        title={t("Do'kon Adminlari – Diametr", "Админы магазинов – Diametr")}
        description={t("Barcha do'kon adminlari ro'yxati", "Список всех админов магазинов")}
      />
      <PageBreadcrumb pageTitle={t("Do'kon Adminlari", "Админы магазинов")} />
      <ComponentCard title={t(`Do'kon Adminlari (${admins.length})`, `Админы магазинов (${admins.length})`)}>
        {isLoading ? (
          <SkeletonTable rows={8} cols={8} />
        ) : (
          <AdminsTable data={admins} onRefetch={refetch} />
        )}
      </ComponentCard>
    </>
  );
}
