import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import AdminsTable, { AdminItemProps } from "../../components/tables/diametr/adminsTable";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import axiosClient from "../../service/axios.service";

export default function AdminsPage() {
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
        title="Do'kon Adminlari – Diametr"
        description="Barcha do'kon adminlari ro'yxati"
      />
      <PageBreadcrumb pageTitle="Do'kon Adminlari" />
      <ComponentCard title={`Do'kon Adminlari (${admins.length})`}>
        {isLoading ? (
          <SkeletonTable rows={8} cols={8} />
        ) : (
          <AdminsTable data={admins} onRefetch={refetch} />
        )}
      </ComponentCard>
    </>
  );
}
