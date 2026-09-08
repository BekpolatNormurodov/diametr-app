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
import { usePolling } from "../../hooks/usePolling";
import ProductItemsTable, { ProductItemRowProps } from "../../components/tables/diametr/productItemsTable";
import { toast } from "../../components/ui/toast";
import ImageField, { ImageFieldResult } from "../../components/common/ImageField";
import ColorPalette from "../../components/common/ColorPalette";

export default function ProductItemsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({ name: "", desc: "", color: "", size: "", value: "", unit_type_id: "", product_id: "" });
  const [saving, setSaving] = useState(false);
  const imageResultRef = useRef<ImageFieldResult | null>(null);

  const fetchItems = useCallback(
    () => axiosClient.get("/product-item/all").then((res) => res.data?.data ?? res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<ProductItemRowProps[]>({ fetcher: fetchItems });
  usePolling(refetch, 15_000);
  const itemData: ProductItemRowProps[] = Array.isArray(data) ? data : [];

  const fetchUnitTypes = useCallback(() => axiosClient.get("/unit-type/all").then((res) => res.data), []);
  const { data: utData } = useFetchWithLoader<{ id: number; name: string; name_uz?: string | null; name_ru?: string | null; symbol: string }[]>({ fetcher: fetchUnitTypes });
  const unitTypeOptions = Array.isArray(utData)
    ? utData.map((u) => ({ value: String(u.id), symbol: u.symbol, label: `${u.name_uz ?? u.name} (${u.symbol})` }))
    : [];

  const selectedUnitType = Array.isArray(utData) && form.unit_type_id
    ? utData.find((u) => String(u.id) === form.unit_type_id)
    : undefined;
  const selectedUnitSymbol = selectedUnitType?.symbol ?? "";
  const isDimensionUnit = selectedUnitSymbol === "x*y" || selectedUnitSymbol === "x*y*z";
  const selectedSizePlaceholder = selectedUnitSymbol === "x*y"
    ? "120x60, 50x30 ..."
    : selectedUnitSymbol === "x*y*z"
      ? "120x60x30, 2x2x2 ..."
      : "120x80, XL, 50x50 sm...";
  const selectedSizeLabel = isDimensionUnit ? "O'lcham (majburiy)" : "O'lcham (ixtiyoriy)";
  const selectedValueLabel = isDimensionUnit ? "Qiymat (miqdor, ixtiyoriy)" : "Qiymat";

  const fetchProducts = useCallback(() => axiosClient.get("/product/all").then((res) => res.data?.data ?? res.data), []);
  const { data: prodData } = useFetchWithLoader<{ id: number; name_uz?: string; name?: string }[]>({ fetcher: fetchProducts });
  const productOptions = Array.isArray(prodData)
    ? prodData.map((p) => ({ value: String(p.id), label: p.name_uz ?? p.name ?? String(p.id) }))
    : [];

  const handleAdd = async () => {
    if (!form.name.trim() || !form.product_id) {
      toast.error("Variant nomi va mahsulot tanlash shart");
      return;
    }
    setSaving(true);
    try {
      let imageFilename: string | undefined;
      const imgResult = imageResultRef.current;
      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/product-item/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageFilename = res.data?.data?.image ?? res.data?.image;
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/product-item/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }
      await axiosClient.post("/product-item", {
        name: form.name,
        desc: form.desc || undefined,
        color: form.color || undefined,
        size: form.size || undefined,
        value: isDimensionUnit ? undefined : form.value ? Number(form.value) : undefined,
        unit_type_id: form.unit_type_id ? Number(form.unit_type_id) : undefined,
        product_id: Number(form.product_id),
        image: imageFilename,
      });
      toast.success("Variant qo'shildi");
      refetch();
      closeModal();
      setForm({ name: "", desc: "", color: "", size: "", value: "", unit_type_id: "", product_id: "" });
      imageResultRef.current = null;
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Tovar Variantlari | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Tovar Variantlari" />

      <div className="space-y-6">
        <ComponentCard
          title="Tovar Variantlari"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => {
                setForm({ name: "", desc: "", color: "", size: "", value: "", unit_type_id: "", product_id: "" });
                imageResultRef.current = null;
                openModal();
              }}
            >
              Variant qo'shish
            </Button>
          }
        >
          {isLoading
            ? <SkeletonTable cols={9} rows={7} />
            : <ProductItemsTable data={itemData} onRefetch={refetch} unitTypes={unitTypeOptions} products={productOptions} />
          }
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-2">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Variant qo'shish</h4>
            <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
              Masalan: Cola 1.5L, Qizil Kraska 2kg, Galichka 120x80
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-2">
            <div>
              <Label>Variant nomi *</Label>
              <Input type="text" placeholder="Cola 1.5L" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Mahsulot *</Label>
              <Select options={productOptions} value={form.product_id} onChange={(v) => setForm({ ...form, product_id: v })} placeholder="Mahsulot tanlang" />
            </div>
            <div>
              <Label>O'lchov birligi</Label>
              <Select options={unitTypeOptions} value={form.unit_type_id} onChange={(v) => setForm({ ...form, unit_type_id: v })} placeholder="kg, L, m..." />
            </div>
            <div className="lg:col-span-2 text-sm text-gray-500 dark:text-gray-400">
              {selectedUnitSymbol
                ? isDimensionUnit
                  ? `Tanlangan birlik: ${selectedUnitSymbol}. Iltimos, o'lchamni mos ravishda kiriting.`
                  : `Tanlangan birlik: ${selectedUnitSymbol}. Qiymat raqamli bo'lishi kerak.`
                : "O'lchov birligini tanlang."
              }
            </div>
            {!isDimensionUnit && (
              <div>
                <Label>{selectedValueLabel}</Label>
                <Input type="number" placeholder="1.5, 2, 0.5..." value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            )}
            <div>
              <Label>{selectedSizeLabel}</Label>
              <Input type="text" placeholder={selectedSizePlaceholder} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </div>
            <ColorPalette
              value={form.color}
              onChange={(hex) => setForm({ ...form, color: hex })}
              onClear={() => setForm({ ...form, color: '' })}
            />
            <div className="lg:col-span-2">
              <Label>Tavsif</Label>
              <Input type="text" placeholder="Ixtiyoriy tavsif" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <ImageField label="Rasm (ixtiyoriy)" onChange={(r) => { imageResultRef.current = r; }} />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saqlanmoqda..." : "Qo'shish"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
