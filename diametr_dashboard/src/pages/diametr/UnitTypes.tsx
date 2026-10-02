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
import { usePolling } from "../../hooks/usePolling";
import UnitTypesTable, { UnitTypeItemProps } from "../../components/tables/diametr/unitTypesTable";
import TranslateButton from "../../components/common/TranslateButton";
import { toast } from "../../components/ui/toast";

import { useLang } from "../../context/LangContext";
export default function UnitTypesPage() {
  const { t } = useLang();
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({ name_uz: "", name_ru: "", symbol: "" });
  const [saving, setSaving] = useState(false);

  const fetchUnitTypes = useCallback(
    () => axiosClient.get("/unit-type/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<UnitTypeItemProps[]>({
    fetcher: fetchUnitTypes,
  });
  usePolling(refetch, 30_000);

  const unitTypeData: UnitTypeItemProps[] = Array.isArray(data) ? data : [];

  const handleAdd = async () => {
    if (!form.name_uz.trim() || !form.symbol.trim()) {
      toast.error(t("Nom va belgi kiritish shart", "Укажите название и обозначение"));
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/unit-type", { ...form, name: form.name_uz });
      toast.success(t("O'lchov birligi qo'shildi", "Единица измерения добавлена"));
      refetch();
      closeModal();
      setForm({ name_uz: "", name_ru: "", symbol: "" });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik yuz berdi", "Произошла ошибка"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title={t("O'lchov birliklari | Diametr", "Единицы измерения | Diametr")} description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle={t("O'lchov Birliklari", "Единицы измерения")} />

      <div className="space-y-6">
        <ComponentCard
          title={t("O'lchov Birliklari Jadval", "Таблица единиц измерения")}
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setForm({ name_uz: "", name_ru: "", symbol: "" }); openModal(); }}
            >
              {t("Qo'shish", "Добавить")}
            </Button>
          }
        >
          {isLoading
            ? <SkeletonTable cols={5} rows={7} />
            : <UnitTypesTable data={unitTypeData} onRefetch={refetch} />
          }
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {t("O'lchov birligi qo'shish", "Добавить единицу измерения")}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("Masalan: Kilogramm → kg, Litr → L, Metr → m", "Например: Килограмм → kg, Литр → L, Метр → m")}
            </p>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>{t("Nomi (O'zbek) *", "Название (узбекский) *")}</Label>
                <TranslateButton
                  source={form.name_ru}
                  direction="ru->uz"
                  onResult={(t) => setForm({ ...form, name_uz: t })}
                />
              </div>
              <Input
                type="text"
                placeholder="Kilogramm, Litr, Metr..."
                value={form.name_uz}
                onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>{t("Nomi (Ruscha)", "Название (русский)")}</Label>
                <TranslateButton
                  source={form.name_uz}
                  direction="uz->ru"
                  onResult={(t) => setForm({ ...form, name_ru: t })}
                />
              </div>
              <Input
                type="text"
                placeholder="Килограмм, Литр, Метр..."
                value={form.name_ru}
                onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("Belgi (qisqa) *", "Обозначение (кратко) *")}</Label>
              <Input
                type="text"
                placeholder="kg, L, m..."
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>{t("Bekor qilish", "Отмена")}</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? t("Saqlanmoqda...", "Сохранение...") : t("Qo'shish", "Добавить")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
