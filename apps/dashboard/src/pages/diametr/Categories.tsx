import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useEffect, useRef, useState } from "react";

import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import CategorysTable, {
  CategoryItemProps,
} from "../../components/tables/diametr/categoriesTable";
import ImageField, { ImageFieldResult } from "../../components/common/ImageField";
import TranslateButton from "../../components/common/TranslateButton";

interface CategoryStat {
  id: number;
  name?: string;
  name_uz?: string;
  name_ru?: string;
  image?: string;
  product_count: number;
  shop_product_count: number;
  total_stock: number;
  total_value: number;
}

function fmtValue(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' mlrd';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + ' K';
  return v.toLocaleString();
}

export interface Category {
  name?: string;
  name_uz?: string;
  name_ru?: string;
  image?: string;
}
export default function CategorysPage() {
  const { isOpen, openModal, closeModal } = useModal();

  let emptyCategory: Category = {
    name: "",
    name_uz: "",
    name_ru: "",
    image: "",
  };

  const fetchCategories = useCallback(
    () => axiosClient.get("/category/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<CategoryItemProps[]>({
    fetcher: fetchCategories,
  });
  usePolling(refetch, 10_000);

  const categoryData: CategoryItemProps[] = Array.isArray(data) ? data : [];

  const fetchStats = useCallback(
    () => axiosClient.get("/category/stats").then((res) => res.data),
    []
  );
  const { data: statsData, refetch: refetchStats } = useFetchWithLoader<CategoryStat[]>({
    fetcher: fetchStats,
  });
  usePolling(refetchStats, 20_000);

  const catStats: CategoryStat[] = Array.isArray(statsData) ? statsData : [];
  const sortedStats = [...catStats].sort((a, b) => b.total_stock - a.total_stock);

  let [Category, setCategory] = useState<Category>(emptyCategory);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const handleAdding = async () => {
    setSaving(true);
    try {
      let imageFilename = Category.image ?? "";
      const imgResult = imageResultRef.current;

      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/category/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? "";
      } else if (imgResult?.mode === "url" && imgResult.url) {
        // Backend will fetch URL and save as PNG
        const res = await axiosClient.post("/category/upload-image-url", {
          url: imgResult.url,
        });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }

      await axiosClient.post("/category", {
        name_uz: Category.name_uz,
        name_ru: Category.name_ru,
        image: imageFilename,
      });
      refetch();
      closeModal();
      setCategory(emptyCategory);
      imageResultRef.current = null;
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Categorys | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Categorys" />

      <div className="space-y-6 ">
        {/* Category Stats */}
        {sortedStats.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setStatsExpanded((v) => !v)}
              className="w-full px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors text-left"
              aria-expanded={statsExpanded}
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Kategoriyalar statistikasi
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({statsExpanded ? `barchasi · ${sortedStats.length} ta` : `top 3 / ${sortedStats.length} ta`})
                </span>
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`w-4 h-4 text-gray-500 transition-transform ${statsExpanded ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Kategoriya</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Tovarlar</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Do'konlarda</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Skladda</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Umumiy qiymati</th>
                  </tr>
                </thead>
                <tbody>
                  {(statsExpanded ? sortedStats : sortedStats.slice(0, 3)).map((cat, idx) => (
                    <tr key={cat.id} className="border-t border-gray-100 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">{cat.name_uz || cat.name || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          {cat.product_count} xil
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                          {cat.shop_product_count} ta
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-semibold ${cat.total_stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {cat.total_stock.toLocaleString()} ta
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-300">
                        {fmtValue(cat.total_value)} so'm
                      </td>
                    </tr>
                  ))}
                  {!statsExpanded && sortedStats.length > 3 && (
                    <tr className="border-t border-gray-100 dark:border-white/[0.04]">
                      <td colSpan={6} className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setStatsExpanded(true)}
                          className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline"
                        >
                          Yana {sortedStats.length - 3} ta kategoriyani ko'rish ↓
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] font-bold">
                    <td className="px-4 py-2.5" colSpan={2}>Jami</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 dark:text-blue-400">
                      {catStats.reduce((s, c) => s + c.product_count, 0)} xil
                    </td>
                    <td className="px-4 py-2.5 text-center text-purple-600 dark:text-purple-400">
                      {catStats.reduce((s, c) => s + c.shop_product_count, 0)} ta
                    </td>
                    <td className="px-4 py-2.5 text-center text-green-600 dark:text-green-400">
                      {catStats.reduce((s, c) => s + c.total_stock, 0).toLocaleString()} ta
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800 dark:text-white">
                      {fmtValue(catStats.reduce((s, c) => s + c.total_value, 0))} so'm
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ComponentCard
          title="Categorys Table"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => {
                setCategory(emptyCategory);
                imageResultRef.current = null;
                openModal();
              }}
            >
              Add Category
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={5} rows={7} /> : <CategorysTable data={categoryData ?? []} onRefetch={refetch} />}
        </ComponentCard>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add Category
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Create new Category with full details.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Nomi (O'zbek)</Label>
                    <TranslateButton
                      source={Category.name_ru ?? ""}
                      direction="ru->uz"
                      onResult={(t) => setCategory({ ...Category, name_uz: t })}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Uzbekcha nomini kiriting"
                    value={Category.name_uz}
                    onChange={(e) =>
                      setCategory({ ...Category, name_uz: e.target.value })
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Nomi (Ruscha)</Label>
                    <TranslateButton
                      source={Category.name_uz ?? ""}
                      direction="uz->ru"
                      onResult={(t) => setCategory({ ...Category, name_ru: t })}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Ruscha nomini kiriting"
                    value={Category.name_ru}
                    onChange={(e) =>
                      setCategory({ ...Category, name_ru: e.target.value })
                    }
                  />
                </div>
                <div className="lg:col-span-2">
                  <ImageField
                    label="Rasm"
                    onChange={(result) => { imageResultRef.current = result; }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
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
