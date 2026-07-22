import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useCallback } from "react";
import SalesTable, { SaleItemProps } from "../../components/tables/diametr/salesTable";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";

export default function SalesPage() {
  const fetchOrders = useCallback(
    () => axiosClient.get("/order/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<SaleItemProps[]>({
    fetcher: fetchOrders,
  });
  usePolling(refetch, 10_000);

  const saleData: SaleItemProps[] = Array.isArray(data) ? data : [];

  return (
    <>
      <PageMeta title="Buyurtmalar | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Buyurtmalar" />
      <div className="space-y-6">
        <ComponentCard title="Buyurtmalar">
          {isLoading ? <SkeletonTable cols={7} rows={7} /> : <SalesTable data={saleData} onRefetch={refetch} />}
        </ComponentCard>
      </div>
    </>
  );
}