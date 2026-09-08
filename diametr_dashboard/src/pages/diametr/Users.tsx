import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable, { UserItemProps } from "../../components/tables/diametr/usersTable";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import axiosClient from "../../service/axios.service";

export default function UsersPage() {
  const { data, isLoading, refetch } = useFetchWithLoader<UserItemProps[]>({
    fetcher: () => axiosClient.get("/user/all").then((r) => r.data),
  });

  usePolling(refetch, 15_000);

  const users: UserItemProps[] = Array.isArray(data) ? data : [];

  return (
    <>
      <PageMeta
        title="Foydalanuvchilar – Diametr"
        description="Barcha ro'yxatdan o'tgan foydalanuvchilar"
      />
      <PageBreadcrumb pageTitle="Foydalanuvchilar" />
      <ComponentCard title={`Foydalanuvchilar (${users.length})`}>
        {isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <UsersTable data={users} onRefetch={refetch} />
        )}
      </ComponentCard>
    </>
  );
}
