import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useCallback } from "react";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import PromoCodesTable, {
  PromoCodeItemProps,
} from "../../components/tables/diametr/promoCodesTable";

export default function PromoCodesPage() {
  const fetchPromoCodes = useCallback(
    () => axiosClient.get("/promo-code/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<PromoCodeItemProps[]>({
    fetcher: fetchPromoCodes,
  });
  usePolling(refetch, 15_000);

  const promoData: PromoCodeItemProps[] = Array.isArray(data) ? data : [];

  return (
    <>
      <PageMeta title="Promo Kodlar | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Promo Kodlar" />
      <div className="space-y-6">
        <ComponentCard title="Promo Kodlar">
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <PromoCodesTable data={promoData} onRefetch={refetch} />}
        </ComponentCard>
      </div>
    </>
  );
}
