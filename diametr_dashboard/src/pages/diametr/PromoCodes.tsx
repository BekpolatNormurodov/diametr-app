import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useCallback } from "react";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import { useLang } from "../../context/LangContext";
import PromoCodesTable, {
  PromoCodeItemProps,
} from "../../components/tables/diametr/promoCodesTable";

export default function PromoCodesPage() {
  const { t } = useLang();

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
      <PageMeta title={`${t.k("promoCodes")} | Diametr Dashboard`} description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle={t.k("promoCodes")} />
      <div className="space-y-6">
        <ComponentCard title={t.k("promoCodes")}>
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <PromoCodesTable data={promoData} onRefetch={refetch} />}
        </ComponentCard>
      </div>
    </>
  );
}
