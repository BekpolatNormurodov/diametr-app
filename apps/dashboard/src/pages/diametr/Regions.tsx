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
import RegionsTable, { RegionItemProps } from "../../components/tables/diametr/regionsTable";
import { usePolling } from "../../hooks/usePolling";
import { toast } from "../../components/ui/toast";

export interface Region {
  name?: string;
}
export default function RegionsPage() {
  const { isOpen, openModal, closeModal } = useModal();

  const emptyRegion: Region = { name: "" };
  const [Region, setRegion] = useState<Region>(emptyRegion);
  const [saving, setSaving] = useState(false);

  const fetchRegions = useCallback(
    () => axiosClient.get("/region/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<RegionItemProps[]>({
    fetcher: fetchRegions,
  });
  usePolling(refetch, 15_000);

  const regionsData: RegionItemProps[] = Array.isArray(data) ? data : [];

  const handleAdding = async () => {
    if (!Region.name || Region.name.length < 4) {
      toast.error("Region nomi kamida 4 ta belgi bo'lishi kerak");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/region", { name: Region.name });
      toast.success("Region qo'shildi");
      refetch();
      closeModal();
      setRegion(emptyRegion);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Regions | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Regions" />

      <div className="space-y-6">
        <ComponentCard
          title="Regions Table"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setRegion(emptyRegion); openModal(); }}
            >
              Add Region
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={4} rows={7} /> : <RegionsTable data={regionsData} onRefetch={refetch} />}
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Add Region</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Yangi region qo'shish.</p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Region nomi</Label>
                  <Input
                    type="text"
                    placeholder="Masalan: Toshkent shahri"
                    value={Region.name}
                    onChange={(e) => setRegion({ ...Region, name: e.target.value })}
                  />
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