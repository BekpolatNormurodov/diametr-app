import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useState } from "react";

import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import NewsTable, {
  NewsItemProps,
} from "../../components/tables/diametr/newsTable";
import { usePolling } from "../../hooks/usePolling";
import { toast } from "../../components/ui/toast";

export interface New {
  title?: string;
  subtitle?: string;
  expired?: string;
}
export default function NewsPage() {
  const { isOpen, openModal, closeModal } = useModal();

  const emptyNew: New = { title: "", subtitle: "", expired: "" };
  const [New, setNew] = useState<New>(emptyNew);
  const [saving, setSaving] = useState(false);

  const fetchNews = useCallback(
    () => axiosClient.get("/new/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<NewsItemProps[]>({
    fetcher: fetchNews,
  });
  usePolling(refetch, 15_000);

  const newsData: NewsItemProps[] = Array.isArray(data) ? data : [];

  const handleAdding = async () => {
    if (!New.title || !New.subtitle || !New.expired) {
      toast.error("Sarlavha, tavsif va muddat kiritish shart");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/new", {
        title: New.title,
        subtitle: New.subtitle,
        expired: New.expired,
      });
      toast.success("Yangilik qo'shildi");
      refetch();
      closeModal();
      setNew(emptyNew);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="News | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="News" />

      <div className="space-y-6">
        <ComponentCard
          title="News Table"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setNew(emptyNew); openModal(); }}
            >
              Add News
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={5} rows={7} /> : <NewsTable data={newsData} onRefetch={refetch} />}
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Add News</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Yangi yangilik qo'shish.</p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Sarlavha</Label>
                  <Input type="text" placeholder="Yangilik sarlavhasi" value={New.title} onChange={(e) => setNew({ ...New, title: e.target.value })} />
                </div>
                <div>
                  <Label>Tavsif</Label>
                  <Input type="text" placeholder="Qisqacha tavsif" value={New.subtitle} onChange={(e) => setNew({ ...New, subtitle: e.target.value })} />
                </div>
                <div>
                  <Label>Muddat (yyyy-MM-dd)</Label>
                  <Input type="date" value={New.expired} onChange={(e) => setNew({ ...New, expired: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleAdding} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
