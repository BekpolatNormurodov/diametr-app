import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useCallback } from "react";
import SalesTable, { SaleItemProps } from "../../components/tables/diametr/salesTable";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import { useLang } from "../../context/LangContext";

export default function SalesPage() {
  const { t } = useLang();

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
      <PageMeta title={`${t.k("orderList")} | Diametr Dashboard`} description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle={t.k("orderList")} />
      <div className="space-y-6">
        <ComponentCard title={t.k("orderList")}>
          {isLoading ? <SkeletonTable cols={7} rows={7} /> : <SalesTable data={saleData} onRefetch={refetch} />}
        </ComponentCard>
      </div>
    </>
  );
}