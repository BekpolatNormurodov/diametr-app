import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useCallback, useRef } from "react";

import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import NewsTable, {
  NewsItemProps,
  NewsTableHandle,
} from "../../components/tables/diametr/newsTable";
import { usePolling } from "../../hooks/usePolling";

export default function NewsPage() {
  // The rich add/edit modal (image + date) lives inside NewsTable; the "Add"
  // button opens it in create mode via this ref — one form for add and edit.
  const newsRef = useRef<NewsTableHandle>(null);

  const fetchNews = useCallback(
    () => axiosClient.get("/new/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<NewsItemProps[]>({
    fetcher: fetchNews,
  });
  usePolling(refetch, 15_000);

  const newsData: NewsItemProps[] = Array.isArray(data) ? data : [];

  return (
    <>
      <PageMeta title="Yangiliklar | Diametr" description="Diametr boshqaruv paneli" />
      <PageBreadcrumb pageTitle="Yangiliklar" />

      <div className="space-y-6">
        <ComponentCard
          title="Yangiliklar"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => newsRef.current?.openCreate()}
            >
              Yangilik qo'shish
            </Button>
          }
        >
          {isLoading ? (
            <SkeletonTable cols={7} rows={7} />
          ) : (
            <NewsTable ref={newsRef} data={newsData} onRefetch={refetch} />
          )}
        </ComponentCard>
      </div>
    </>
  );
}
