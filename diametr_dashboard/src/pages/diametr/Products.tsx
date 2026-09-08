import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useRef, useState } from "react";

import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import ProductsTable, {
  ProductItemProps,
} from "../../components/tables/diametr/productsTable";
import { usePolling } from "../../hooks/usePolling";
import ImageField, { ImageFieldResult } from "../../components/common/ImageField";
import TranslateButton from "../../components/common/TranslateButton";
import { toast } from "../../components/ui/toast";

export interface Product {
  name?: string;
  name_uz?: string;
  name_ru?: string;
  image?: string;
  category_id?: string;
  unit_type_id?: string;
}
export default function ProductsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const [autoExpandId, setAutoExpandId] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("");

  // Unit type add modal
  const { isOpen: utOpen, openModal: openUtModal, closeModal: closeUtModal } = useModal();
  const [utForm, setUtForm] = useState({ name_uz: "", name_ru: "", symbol: "" });
  const [utSaving, setUtSaving] = useState(false);

  let emptyProduct: Product = {
    name: "",
    name_uz: "",
    name_ru: "",
    image: "",
    category_id: "",
    unit_type_id: "",
  };

  let [Product, setProduct] = useState<Product>(emptyProduct);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(
    () => axiosClient.get("/product/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<ProductItemProps[]>({
    fetcher: fetchProducts,
  });
  usePolling(refetch, 10_000);

  const productData: ProductItemProps[] = Array.isArray(data) ? data : [];

  // Fetch categories for select
  const fetchCats = useCallback(
    () => axiosClient.get("/category/all").then((res) => res.data),
    []
  );
  const { data: catsData } = useFetchWithLoader<{ id: number; name_uz?: string; name_ru?: string; name?: string }[]>({
    fetcher: fetchCats,
  });
  const category_options = Array.isArray(catsData)
    ? catsData.map((c) => ({ value: String(c.id), label: c.name_uz ?? c.name ?? c.name_ru ?? "" }))
    : [];

  // Fetch unit types for variant forms
  const fetchUnitTypes = useCallback(
    () => axiosClient.get("/unit-type/all").then((res) => res.data),
    []
  );
  const { data: utData, refetch: refetchUt } = useFetchWithLoader<{ id: number; name: string; name_uz?: string | null; name_ru?: string | null; symbol: string }[]>({
    fetcher: fetchUnitTypes,
  });
  const unitTypeOptions = Array.isArray(utData)
    ? utData.map((u) => ({ value: String(u.id), label: `${u.symbol} — ${u.name_uz ?? u.name}` }))
    : [];

  // "dona" ni default qilish
  const donaOption = unitTypeOptions.find((o) => o.label.toLowerCase().includes("dona"));
  const defaultUnitTypeId = donaOption?.value ?? "";

  const handleAddUnitType = async () => {
    if (!utForm.name_uz.trim() || !utForm.symbol.trim()) {
      toast.error("Nom va belgi kiritish shart");
      return;
    }
    setUtSaving(true);
    try {
      await axiosClient.post("/unit-type", { ...utForm, name: utForm.name_uz });
      toast.success("O'lchov birligi qo'shildi");
      refetchUt();
      closeUtModal();
      setUtForm({ name_uz: "", name_ru: "", symbol: "" });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setUtSaving(false);
    }
  };

  const handleAdding = async () => {
    if (!Product.category_id) {
      toast.error("Kategoriya tanlash shart!");
      return;
    }
    if (!Product.name_uz?.trim()) {
      toast.error("Mahsulot nomini kiriting!");
      return;
    }
    setSaving(true);
    try {
      let imageFilename = Product.image ?? "";
      const imgResult = imageResultRef.current;

      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/product/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? "";
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/product/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }

      const created = await axiosClient.post("/product", {
        name_uz: Product.name_uz,
        name_ru: Product.name_ru,
        image: imageFilename,
        category_id: Number(Product.category_id),
        unit_type_id: Product.unit_type_id ? Number(Product.unit_type_id) : undefined,
      });
      const newId = created.data?.id ?? created.data?.data?.id;
      toast.success("Mahsulot qo'shildi! Endi variantlar qo'shing");
      refetch();
      closeModal();
      setProduct(emptyProduct);
      imageResultRef.current = null;
      // Auto-expand the new product so user can add variants
      if (newId) setAutoExpandId(newId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Mahsulotlar | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Mahsulotlar" />

      <div className="space-y-6 ">
        {/* O'lchov birligi qo'shish tugmasi */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setUtForm({ name_uz: "", name_ru: "", symbol: "" }); openUtModal(); }}
          >
            + O'lchov birligi qo'shish
          </Button>
        </div>

        <ComponentCard
          title="Mahsulotlar"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => {
                setProduct({
                  ...emptyProduct,
                  unit_type_id: defaultUnitTypeId,
                  category_id: activeCategoryFilter || "",
                });
                imageResultRef.current = null;
                openModal();
              }}
            >
              Mahsulot qo'shish
            </Button>
          }
        >
          {isLoading ? (
            <SkeletonTable cols={8} rows={7} />
          ) : (
            <ProductsTable
              data={productData ?? []}
              onRefetch={refetch}
              unitTypes={unitTypeOptions}
              categoryOptions={category_options}
              autoExpandId={autoExpandId}
              onAutoExpandHandled={() => setAutoExpandId(null)}
              onCategoryFilterChange={setActiveCategoryFilter}
            />
          )}
        </ComponentCard>
      </div>

      {/* ─── Add Product Modal ───────────────────────────── */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="M12 22V12M3.27 6.96 12 12l8.73-5.04" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Yangi mahsulot</h4>
                <p className="text-sm text-white/70">Mahsulot yarating, keyin variantlarni qo'shing</p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Nomi (O'zbek) *</Label>
                  <TranslateButton
                    source={Product.name_ru ?? ""}
                    direction="ru->uz"
                    onResult={(t) => setProduct({ ...Product, name_uz: t })}
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Masalan: Sement, Bo'yoq..."
                  value={Product.name_uz}
                  onChange={(e) => setProduct({ ...Product, name_uz: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Nomi (Ruscha)</Label>
                  <TranslateButton
                    source={Product.name_uz ?? ""}
                    direction="uz->ru"
                    onResult={(t) => setProduct({ ...Product, name_ru: t })}
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Ruscha nomini kiriting"
                  value={Product.name_ru}
                  onChange={(e) => setProduct({ ...Product, name_ru: e.target.value })}
                />
              </div>
              <div>
                <Label>Kategoriya *</Label>
                <Select
                  options={category_options}
                  className="dark:bg-dark-900"
                  placeholder="Kategoriyani tanlang"
                  defaultValue={Product.category_id}
                  onChange={(v) => setProduct({ ...Product, category_id: v })}
                />
                {!Product.category_id && (
                  <p className="mt-1.5 text-xs text-amber-500 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Kategoriya tanlash shart
                  </p>
                )}
              </div>
              <div>
                <Label>O'lchov birligi</Label>
                <Select
                  options={unitTypeOptions}
                  className="dark:bg-dark-900"
                  placeholder="kg, L, m..."
                  defaultValue={Product.unit_type_id}
                  onChange={(v) => setProduct({ ...Product, unit_type_id: v })}
                />
              </div>
              <div className="lg:col-span-2">
                <ImageField
                  label="Rasm"
                  onChange={(result) => { imageResultRef.current = result; }}
                />
              </div>
            </div>

            {/* Hint */}
            <div className="mt-5 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30">
              <p className="text-xs text-brand-700 dark:text-brand-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                Mahsulot yaratilgandan keyin avtomatik ravishda variantlar qo'shish oynasi ochiladi
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Bekor qilish</Button>
              <Button size="sm" onClick={handleAdding} disabled={saving || !Product.category_id || !Product.name_uz?.trim()}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saqlanmoqda...
                  </span>
                ) : "Yaratish va davom etish"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── Unit Type Add Modal ────────────────────────── */}
      <Modal isOpen={utOpen} onClose={closeUtModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              O'lchov birligi qo'shish
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Masalan: Kilogramm → kg, Litr → L, Metr → m
            </p>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Nomi (O'zbek) *</Label>
                <TranslateButton
                  source={utForm.name_ru}
                  direction="ru->uz"
                  onResult={(t) => setUtForm({ ...utForm, name_uz: t })}
                />
              </div>
              <Input
                type="text"
                placeholder="Kilogramm, Litr, Metr..."
                value={utForm.name_uz}
                onChange={(e) => setUtForm({ ...utForm, name_uz: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Nomi (Ruscha)</Label>
                <TranslateButton
                  source={utForm.name_uz}
                  direction="uz->ru"
                  onResult={(t) => setUtForm({ ...utForm, name_ru: t })}
                />
              </div>
              <Input
                type="text"
                placeholder="Килограмм, Литр, Метр..."
                value={utForm.name_ru}
                onChange={(e) => setUtForm({ ...utForm, name_ru: e.target.value })}
              />
            </div>
            <div>
              <Label>Belgi (qisqa) *</Label>
              <Input
                type="text"
                placeholder="kg, L, m..."
                value={utForm.symbol}
                onChange={(e) => setUtForm({ ...utForm, symbol: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeUtModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleAddUnitType} disabled={utSaving}>
              {utSaving ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

