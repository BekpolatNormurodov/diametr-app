import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useLang } from "../../context/LangContext";

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
  const { t } = useLang();

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
      toast.error(t("Region nomi kamida 4 ta belgi bo'lishi kerak", "Название региона должно содержать не менее 4 символов"));
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/region", { name: Region.name });
      toast.success(t("Region qo'shildi", "Регион добавлен"));
      refetch();
      closeModal();
      setRegion(emptyRegion);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik yuz berdi", "Произошла ошибка"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title={t("Hududlar | Diametr", "Регионы | Diametr")} description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle={t.k("regions")} />

      <div className="space-y-6">
        <ComponentCard
          title={t.k("regions")}
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setRegion(emptyRegion); openModal(); }}
            >
              {t("Hudud qo'shish", "Добавить регион")}
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={4} rows={7} /> : <RegionsTable data={regionsData} onRefetch={refetch} />}
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{t.k("addRegion")}</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">{t("Yangi region qo'shish.", "Добавление нового региона.")}</p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>{t("Region nomi", "Название региона")}</Label>
                  <Input
                    type="text"
                    placeholder={t("Masalan: Toshkent shahri", "Например: город Ташкент")}
                    value={Region.name}
                    onChange={(e) => setRegion({ ...Region, name: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>{t("Yopish", "Закрыть")}</Button>
              <Button size="sm" onClick={handleAdding} disabled={saving}>
                {saving ? t("Saqlanmoqda...", "Сохранение...") : t("Saqlash", "Сохранить")}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}