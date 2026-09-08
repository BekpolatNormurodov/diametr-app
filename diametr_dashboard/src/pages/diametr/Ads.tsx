import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useCallback, useRef } from "react";

import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import AdsTable, {
  AdItemProps,
  AdsTableHandle,
} from "../../components/tables/diametr/adsTable";
import { usePolling } from "../../hooks/usePolling";

export default function AdsPage() {
  // The rich add/edit modal (banner image + link target) lives inside AdsTable.
  // The "Add" button here just opens it in create mode via this ref, so there is
  // a single form for both adding and editing.
  const adsRef = useRef<AdsTableHandle>(null);

  const fetchAds = useCallback(
    () => axiosClient.get("/ad/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<AdItemProps[]>({
    fetcher: fetchAds,
  });
  usePolling(refetch, 15_000);

  const adsData: AdItemProps[] = Array.isArray(data) ? data : [];

  return (
    <>
      <PageMeta title="Reklamalar | Diametr" description="Diametr boshqaruv paneli" />
      <PageBreadcrumb pageTitle="Reklamalar" />

      <div className="space-y-6">
        <ComponentCard
          title="Reklamalar"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => adsRef.current?.openCreate()}
            >
              Reklama qo'shish
            </Button>
          }
        >
          {isLoading ? (
            <SkeletonTable cols={6} rows={7} />
          ) : (
            <AdsTable ref={adsRef} data={adsData} onRefetch={refetch} />
          )}
        </ComponentCard>
      </div>
    </>
  );
}
