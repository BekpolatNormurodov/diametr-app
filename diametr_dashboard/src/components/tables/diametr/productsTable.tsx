import TableActions, { ConfirmDeleteModal } from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { Fragment, useEffect, useRef, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";
import ImageField, { ImageFieldResult } from "../../common/ImageField";
import ColorPalette from "../../common/ColorPalette";
import TranslateButton from "../../common/TranslateButton";

/* ─── Types ────────────────────────────────────────────────── */
export interface VariantProps {
  id: number;
  name?: string;
  desc?: string;
  image?: string;
  color?: string;
  size?: string;
  value?: number | string | null;
  unit_type?: { id: number; name: string; name_uz?: string | null; name_ru?: string | null; symbol: string } | null;
  _count?: { shop_products?: number };
  createdt?: string;
  createdAt?: string;
}

export interface ProductItemProps {
  id: number;
  name_uz?: string;
  name_ru?: string;
  name?: string;
  image?: string;
  category?: { id: number; name_uz?: string; name?: string };
  categoryId?: number;
  unit_type?: { id: number; name: string; name_uz?: string | null; name_ru?: string | null; symbol: string } | null;
  unit_type_id?: number;
  items?: VariantProps[];
  product_items?: VariantProps[];
  _count?: { items?: number; product_items?: number };
  createdt?: string;
  createdAt?: string;
}

const emptyProductForm = { name_uz: "", name_ru: "", category_id: "", unit_type_id: "" };
const emptyVariantForm = { name: "", desc: "", color: "", size: "", value: "", size_x: "", size_y: "", size_z: "" };

export default function ProductsTable({
  data,
  onRefetch,
  unitTypes = [],
  categoryOptions = [],
  autoExpandId,
  onAutoExpandHandled,
  onCategoryFilterChange,
}: {
  data: ProductItemProps[];
  onRefetch?: () => void;
  unitTypes: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  autoExpandId?: number | null;
  onAutoExpandHandled?: () => void;
  onCategoryFilterChange?: (categoryId: string) => void;
}) {
  const [tableData, setTableData] = useState(data);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  /* product edit modal */
  const { isOpen: editOpen, openModal: openEdit, closeModal: closeEdit } = useModal();
  const [editItem, setEditItem] = useState<ProductItemProps | null>(null);
  const [pForm, setPForm] = useState({ ...emptyProductForm });
  const [pSaving, setPSaving] = useState(false);
  const pImgRef = useRef<ImageFieldResult | null>(null);
  const pImgKey = useRef(0);

  /* variant add/edit modal */
  const { isOpen: varOpen, openModal: openVar, closeModal: closeVar } = useModal();
  const [editVariant, setEditVariant] = useState<VariantProps | null>(null);
  const [varProductId, setVarProductId] = useState<number>(0);
  const [varUnitSymbol, setVarUnitSymbol] = useState<string>("");
  const [vForm, setVForm] = useState({ ...emptyVariantForm });
  const [vSaving, setVSaving] = useState(false);
  const varImgRef = useRef<ImageFieldResult | null>(null);
  const varImgKey = useRef(0);
  const [varImgChanged, setVarImgChanged] = useState(false);

  /* variant delete confirm */
  const [variantToDelete, setVariantToDelete] = useState<VariantProps | null>(null);

  /* table state */
  const [optionValue, setOptionValue] = useState("20");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilterState] = useState<string>(""); // "" = hammasi
  const setCategoryFilter = (v: string) => { setCategoryFilterState(v); onCategoryFilterChange?.(v); };
  const [groupByCategory, setGroupByCategory] = useState(false);
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue, categoryFilter, groupByCategory]);

  // Auto-expand newly created product
  useEffect(() => {
    if (autoExpandId && data.some(p => p.id === autoExpandId)) {
      setExpandedId(autoExpandId);
      onAutoExpandHandled?.();
    }
  }, [autoExpandId, data]);

  // Kategoriya bo'yicha mahsulotlar soni (chip ko'rsatish uchun)
  const categoryCounts = (() => {
    const m = new Map<string, number>();
    tableData.forEach((p) => {
      const id = p.category?.id ? String(p.category.id) : (p.categoryId ? String(p.categoryId) : "");
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    });
    return m;
  })();

  const filteredData = tableData.filter((s) => {
    // Kategoriya filter
    if (categoryFilter) {
      const cid = s.category?.id ? String(s.category.id) : (s.categoryId ? String(s.categoryId) : "");
      if (cid !== categoryFilter) return false;
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.name_uz ?? "").toLowerCase().includes(q) ||
        (s.name_ru ?? "").toLowerCase().includes(q) ||
        (s.category?.name_uz ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });
  // Guruhlash yoqilganda: butun filteredData bo'yicha guruhlaymiz, pagination o'chadi
  const maxPage = groupByCategory
    ? 1
    : Math.max(1, Math.ceil(filteredData.length / +optionValue));
  const currentItems = groupByCategory
    ? filteredData
    : filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  // Group by category: filteredData'ning hammasini kategoriya bo'yicha guruhlash
  const groupedItems = (() => {
    if (!groupByCategory) return null;
    const groups = new Map<string, { label: string; items: ProductItemProps[] }>();
    filteredData.forEach((p) => {
      const id = p.category?.id ? String(p.category.id) : (p.categoryId ? String(p.categoryId) : "none");
      const label = p.category?.name_uz ?? p.category?.name ?? "Kategoriyasiz";
      if (!groups.has(id)) groups.set(id, { label, items: [] });
      groups.get(id)!.items.push(p);
    });
    // Guruhlarni kategoriya ID bo'yicha o'sish tartibida saralash
    // ("none" guruhi — kategoriyasiz mahsulotlar — eng oxirida)
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "none") return 1;
      if (b[0] === "none") return -1;
      return Number(a[0]) - Number(b[0]);
    });
  })();

  // Raqamli pagination: ko'rsatish kerak bo'lgan sahifalarni hisoblash
  const pageNumbers = (() => {
    const pages: (number | "...")[] = [];
    const total = maxPage;
    const cur = currentPage;
    const window = 1; // joriy sahifa atrofidagi sahifalar
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= cur - window && i <= cur + window)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  })();

  /* ─── Product CRUD ────────────────────────────────────── */
  const startEditProduct = (item: ProductItemProps) => {
    setEditItem(item);
    setPForm({
      name_uz: item.name_uz ?? item.name ?? "",
      name_ru: item.name_ru ?? "",
      category_id: item.category?.id ? String(item.category.id) : (item.categoryId ? String(item.categoryId) : ""),
      unit_type_id: item.unit_type?.id ? String(item.unit_type.id) : (item.unit_type_id ? String(item.unit_type_id) : ""),
    });
    pImgRef.current = null;
    pImgKey.current++;
    openEdit();
  };

  const saveProduct = async () => {
    setPSaving(true);
    try {
      let imageFilename: string | undefined;
      const imgResult = pImgRef.current;
      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/product/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageFilename = res.data?.data?.image ?? res.data?.image;
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/product/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }
      const payload: any = { name_uz: pForm.name_uz, name_ru: pForm.name_ru };
      if (pForm.category_id) payload.category_id = Number(pForm.category_id);
      if (pForm.unit_type_id) payload.unit_type_id = Number(pForm.unit_type_id);
      else payload.unit_type_id = null;
      if (imageFilename) payload.image = imageFilename;
      if (editItem) {
        await axiosClient.put(`/product/${editItem.id}`, payload);
        toast.success("Mahsulot yangilandi");
      }
      onRefetch?.();
      closeEdit();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setPSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await axiosClient.delete(`/product/${id}`);
      toast.success("Mahsulot o'chirildi");
      onRefetch?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  /* ─── Variant CRUD ────────────────────────────────────── */
  const startAddVariant = (productId: number) => {
    setEditVariant(null);
    setVarProductId(productId);
    const product = tableData.find(p => p.id === productId);
    setVarUnitSymbol(product?.unit_type?.symbol ?? "");
    setVForm({ ...emptyVariantForm });
    varImgRef.current = null;
    varImgKey.current++;
    setVarImgChanged(false);
    openVar();
  };

  const startEditVariant = (v: VariantProps, productId: number) => {
    setEditVariant(v);
    setVarProductId(productId);
    const product = tableData.find(p => p.id === productId);
    const sym = product?.unit_type?.symbol ?? "";
    setVarUnitSymbol(sym);
    let size_x = "", size_y = "", size_z = "";
    if (v.size && (sym === "x*y" || sym === "x*y*z")) {
      const parts = v.size.split("x");
      size_x = parts[0] ?? "";
      size_y = parts[1] ?? "";
      size_z = parts[2] ?? "";
    }
    setVForm({
      name: v.name ?? "",
      desc: v.desc ?? "",
      color: v.color ?? "",
      size: v.size ?? "",
      value: v.value != null ? String(v.value) : "",
      size_x,
      size_y,
      size_z,
    });
    varImgRef.current = null;
    varImgKey.current++;
    setVarImgChanged(false);
    openVar();
  };

  const saveVariant = async () => {
    if (!vForm.name.trim()) {
      toast.error("Variant nomi kiritish shart");
      return;
    }
    setVSaving(true);
    try {
      let imageFilename: string | undefined;
      const imgResult = varImgRef.current;
      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/product-item/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageFilename = res.data?.data?.image ?? res.data?.image;
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/product-item/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }
      const payload: any = {
        name: vForm.name,
        desc: vForm.desc || undefined,
        color: vForm.color || undefined,
        product_id: varProductId,
      };
      // Unit type ga qarab value/size yuborish
      if (varUnitSymbol === "x*y" && vForm.size_x && vForm.size_y) {
        payload.size = `${vForm.size_x}x${vForm.size_y}`;
      } else if (varUnitSymbol === "x*y*z" && vForm.size_x && vForm.size_y && vForm.size_z) {
        payload.size = `${vForm.size_x}x${vForm.size_y}x${vForm.size_z}`;
      } else if (varUnitSymbol && varUnitSymbol !== "dona" && varUnitSymbol !== "x*y" && varUnitSymbol !== "x*y*z" && vForm.value) {
        payload.value = Number(vForm.value);
      }
      if (imageFilename) payload.image = imageFilename;

      if (editVariant) {
        await axiosClient.put(`/product-item/${editVariant.id}`, payload);
        toast.success("Variant yangilandi");
      } else {
        await axiosClient.post("/product-item", payload);
        toast.success("Variant qo'shildi");
      }
      onRefetch?.();
      closeVar();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setVSaving(false);
    }
  };

  const requestDeleteVariant = (v: VariantProps) => {
    setVariantToDelete(v);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return;
    const id = variantToDelete.id;
    setVariantToDelete(null);
    try {
      await axiosClient.delete(`/product-item/${id}`);
      toast.success("Variant o'chirildi");
      onRefetch?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  /* ─── Export ──────────────────────────────────────────── */
  const handleExport = () => {
    const rows: any[] = [];
    tableData.forEach((p) => {
      rows.push({
        ID: p.id,
        "Nomi (UZ)": p.name_uz ?? p.name ?? "",
        "Nomi (RU)": p.name_ru ?? "",
        Kategoriya: p.category?.name_uz ?? p.category?.name ?? "",
        Variantlar: p._count?.items ?? p._count?.product_items ?? p.items?.length ?? p.product_items?.length ?? 0,
        Yaratilgan: Moment(p.createdt ?? p.createdAt).format("DD.MM.YYYY"),
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Qidirish..."
          showValue={optionValue}
          onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }}
          onExport={handleExport}
          action={
            <button
              onClick={() => setGroupByCategory((g) => !g)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                groupByCategory
                  ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800/40"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-400 dark:border-white/[0.08] dark:hover:bg-white/[0.05]"
              }`}
              title="Kategoriya bo'yicha guruhlash"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              {groupByCategory ? "Guruhlash: ON" : "Guruhlash"}
            </button>
          }
        />
        {/* Kategoriya chip filter */}
        {categoryOptions.length > 0 && (
          <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
            <button
              onClick={() => setCategoryFilter("")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                categoryFilter === ""
                  ? "bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/25"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-white/[0.03] dark:text-gray-400 dark:border-white/[0.08] dark:hover:bg-white/[0.05]"
              }`}
            >
              Hammasi
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                categoryFilter === "" ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
              }`}>
                {tableData.length}
              </span>
            </button>
            {categoryOptions.map((c) => {
              const count = categoryCounts.get(c.value) ?? 0;
              const active = categoryFilter === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setCategoryFilter(c.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/25"
                      : count === 0
                      ? "bg-white text-gray-400 border-gray-200 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-gray-500 dark:border-white/[0.08]"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-white/[0.03] dark:text-gray-400 dark:border-white/[0.08] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {c.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (UZ)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (RU)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Kategoriya</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">O'lchov</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Variantlar</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell>
              </TableRow>
            ) : (groupedItems ?? [["__flat__", { label: "", items: currentItems }] as [string, { label: string; items: ProductItemProps[] }]]).map(([gid, group]) => (
              <Fragment key={gid}>
                {groupedItems && (
                  <TableRow className="bg-gradient-to-r from-brand-50/60 to-transparent dark:from-brand-900/10">
                    <TableCell colSpan={9} className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-600 dark:text-brand-400">
                          <path d="M3 7h18M3 12h18M3 17h10" />
                        </svg>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{group.label}</span>
                        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">
                          {group.items.length} ta
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {group.items.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              const variants = item.items ?? item.product_items ?? [];
              return (
                <Fragment key={item.id}>
                  {/* Product row */}
                  <TableRow
                    className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? "bg-brand-50/50 dark:bg-brand-900/10" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {(currentPage - 1) * +optionValue + idx + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {item.image ? (
                        <img
                          src={`${staticUrl}/static/products/${item.image}`}
                          alt={item.name_uz}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600">
                            <rect x="3" y="3" width="18" height="18" rx="4" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.name_uz ?? item.name ?? "-"}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.name_ru ?? "-"}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
                        {item.category?.name_uz ?? item.category?.name ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {item.unit_type ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-xs font-semibold text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-800/30">
                          {item.unit_type.symbol} — {item.unit_type.name_uz ?? item.unit_type.name}
                        </span>
                      ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        variants.length > 0
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 border border-brand-100 dark:border-brand-800/30"
                          : "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border border-gray-100 dark:border-gray-700"
                      }`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        {variants.length} ta
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}
                    </TableCell>
                    <TableCell className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <TableActions onEdit={() => startEditProduct(item)} onDelete={() => deleteProduct(item.id)} />
                    </TableCell>
                  </TableRow>

                  {/* Expanded variants */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0">
                        <div className="bg-gradient-to-b from-gray-50 to-white dark:from-white/[0.03] dark:to-white/[0.01] border-t border-b border-gray-100 dark:border-white/[0.05]">
                          <div className="px-6 py-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600 dark:text-brand-400">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  </svg>
                                </div>
                                <h5 className="text-sm font-bold text-gray-800 dark:text-white">
                                  Variantlar
                                  <span className="ml-1.5 text-gray-400 dark:text-gray-500 font-normal">— {item.name_uz ?? item.name}</span>
                                </h5>
                              </div>
                              <button
                                onClick={() => startAddVariant(item.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm shadow-brand-500/25"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                                Variant qo'shish
                              </button>
                            </div>
                            {variants.length === 0 ? (
                              <div className="py-8 text-center">
                                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <path d="M12 22V12M3.27 6.96 12 12l8.73-5.04" />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Variantlar hali yo'q</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Yuqoridagi tugmani bosib yangi variant qo'shing</p>
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-sm">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100/80 dark:bg-white/[0.04]">
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nomi</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">O'lchov</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rang</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">O'lcham</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Do'konlar</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amallar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variants.map((v) => (
                                      <tr key={v.id} className="border-t border-gray-100 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                                          <div className="flex items-center gap-2.5">
                                            {v.image ? (
                                              <img src={`${staticUrl}/static/product-items/${v.image}`} className="w-8 h-8 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            ) : (
                                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                                                  <rect x="3" y="3" width="18" height="18" rx="4" />
                                                </svg>
                                              </div>
                                            )}
                                            <span>{v.name ?? "-"}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                          {v.unit_type ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-xs font-semibold">
                                              {v.unit_type.symbol}
                                            </span>
                                          ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                          {v.color ? (
                                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                              <span className="w-5 h-5 rounded-md shadow-inner ring-1 ring-black/10" style={{ background: v.color }} />
                                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{v.color}</span>
                                            </span>
                                          ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                          {v.value != null && String(v.value) !== "0" ? (
                                            <span className="text-sm font-medium">{String(v.value)}</span>
                                          ) : v.size ? (
                                            <span className="text-sm">{v.size}</span>
                                          ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            (v._count?.shop_products ?? 0) > 0
                                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30"
                                              : "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border border-gray-100 dark:border-gray-700"
                                          }`}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                            </svg>
                                            {v._count?.shop_products ?? 0}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => startEditVariant(v, item.id)}
                                              className="group inline-flex items-center justify-center w-8 h-8 rounded-lg
                                                bg-blue-50 text-blue-600 border border-blue-100
                                                hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/30
                                                dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
                                                dark:hover:bg-blue-500 dark:hover:text-white dark:hover:border-blue-500
                                                transition-all duration-150"
                                              title="Tahrirlash"
                                            >
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() => requestDeleteVariant(v)}
                                              className="group inline-flex items-center justify-center w-8 h-8 rounded-lg
                                                bg-red-50 text-red-600 border border-red-100
                                                hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-500/30
                                                dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20
                                                dark:hover:bg-red-500 dark:hover:text-white dark:hover:border-red-500
                                                transition-all duration-150"
                                              title="O'chirish"
                                            >
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex flex-wrap gap-3 justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredData.length} ta ichidan {Math.min((currentPage - 1) * +optionValue + 1, filteredData.length)}–{Math.min(currentPage * +optionValue, filteredData.length)} ko'rsatilmoqda
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Birinchi"
            >«</button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Oldingi"
            >‹</button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-gray-400 text-xs">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                    currentPage === p
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={currentPage >= maxPage}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Keyingi"
            >›</button>
            <button
              disabled={currentPage >= maxPage}
              onClick={() => setCurrentPage(maxPage)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Oxirgi"
            >»</button>
          </div>
        </div>
      </div>

      {/* ─── Product Edit Modal ──────────────────────────── */}
      <Modal isOpen={editOpen} onClose={closeEdit} className="max-w-[600px] m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-white">Mahsulotni tahrirlash</h4>
            </div>
          </div>
          {/* Body */}
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Nomi (O'zbek)</Label>
                  <TranslateButton
                    source={pForm.name_ru}
                    direction="ru->uz"
                    onResult={(t) => setPForm({ ...pForm, name_uz: t })}
                  />
                </div>
                <Input type="text" placeholder="Uzbekcha nomi" value={pForm.name_uz} onChange={(e) => setPForm({ ...pForm, name_uz: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Nomi (Ruscha)</Label>
                  <TranslateButton
                    source={pForm.name_uz}
                    direction="uz->ru"
                    onResult={(t) => setPForm({ ...pForm, name_ru: t })}
                  />
                </div>
                <Input type="text" placeholder="Ruscha nomi" value={pForm.name_ru} onChange={(e) => setPForm({ ...pForm, name_ru: e.target.value })} />
              </div>
              {categoryOptions.length > 0 && (
                <div>
                  <Label>Kategoriya</Label>
                  <Select options={categoryOptions} defaultValue={pForm.category_id} onChange={(v) => setPForm({ ...pForm, category_id: v })} />
                </div>
              )}
              {unitTypes.length > 0 && (
                <div>
                  <Label>O'lchov birligi</Label>
                  <Select options={[{ value: "", label: "Tanlanmagan" }, ...unitTypes]} defaultValue={pForm.unit_type_id} onChange={(v) => setPForm({ ...pForm, unit_type_id: v })} placeholder="kg, L, m..." />
                </div>
              )}
              <div>
                <Label>Rasm (barcha variantlar uchun)</Label>
                <ImageField key={pImgKey.current} label="" onChange={(r) => { pImgRef.current = r; }} />
                {editItem?.image && !pImgRef.current && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={`${staticUrl}/static/products/${editItem.image}`} className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-xs text-gray-400">Joriy rasm</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button size="sm" variant="outline" onClick={closeEdit}>Bekor qilish</Button>
              <Button size="sm" onClick={saveProduct} disabled={pSaving}>
                {pSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saqlanmoqda...
                  </span>
                ) : "Saqlash"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── Variant Add/Edit Modal ──────────────────────── */}
      <Modal isOpen={varOpen} onClose={closeVar} className="max-w-[640px] m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className={`px-6 py-4 ${editVariant
            ? "bg-gradient-to-r from-blue-500 to-blue-600"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600"
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
                {editVariant ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {editVariant ? "Variantni tahrirlash" : "Yangi variant qo'shish"}
                </h4>
                <p className="text-sm text-white/70">Rang, o'lcham va boshqa xususiyatlarni belgilang</p>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>Variant nomi *</Label>
                <Input type="text" placeholder="Cola 1.5L, Qizil 5kg..." value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} />
              </div>

              {/* Unit type ga qarab miqdor inputlar */}
              {varUnitSymbol === "x*y" ? (
                <>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>X (eni)</Label>
                      <Input type="number" placeholder="120" value={vForm.size_x} onChange={(e) => setVForm({ ...vForm, size_x: e.target.value })} />
                    </div>
                    <span className="pb-2.5 text-gray-400 font-bold">x</span>
                    <div className="flex-1">
                      <Label>Y (bo'yi)</Label>
                      <Input type="number" placeholder="80" value={vForm.size_y} onChange={(e) => setVForm({ ...vForm, size_y: e.target.value })} />
                    </div>
                  </div>
                </>
              ) : varUnitSymbol === "x*y*z" ? (
                <>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>X</Label>
                      <Input type="number" placeholder="120" value={vForm.size_x} onChange={(e) => setVForm({ ...vForm, size_x: e.target.value })} />
                    </div>
                    <span className="pb-2.5 text-gray-400 font-bold">x</span>
                    <div className="flex-1">
                      <Label>Y</Label>
                      <Input type="number" placeholder="80" value={vForm.size_y} onChange={(e) => setVForm({ ...vForm, size_y: e.target.value })} />
                    </div>
                    <span className="pb-2.5 text-gray-400 font-bold">x</span>
                    <div className="flex-1">
                      <Label>Z</Label>
                      <Input type="number" placeholder="50" value={vForm.size_z} onChange={(e) => setVForm({ ...vForm, size_z: e.target.value })} />
                    </div>
                  </div>
                </>
              ) : varUnitSymbol && varUnitSymbol !== "dona" ? (
                <div>
                  <Label>Miqdor ({varUnitSymbol})</Label>
                  <Input type="number" placeholder={`Masalan: 1.5 ${varUnitSymbol}`} value={vForm.value} onChange={(e) => setVForm({ ...vForm, value: e.target.value })} />
                </div>
              ) : null}

              <ColorPalette
                value={vForm.color}
                onChange={(hex) => setVForm({ ...vForm, color: hex })}
                onClear={() => setVForm({ ...vForm, color: "" })}
              />
              <div className="lg:col-span-2">
                <Label>Tavsif</Label>
                <Input type="text" placeholder="Ixtiyoriy tavsif" value={vForm.desc} onChange={(e) => setVForm({ ...vForm, desc: e.target.value })} />
              </div>
              <div className="lg:col-span-2">
                <ImageField key={varImgKey.current} label="Rasm (ixtiyoriy)" onChange={(r) => { varImgRef.current = r; if (r?.file || r?.url) setVarImgChanged(true); }} />
                {editVariant?.image && !varImgChanged && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={`${staticUrl}/static/product-items/${editVariant.image}`} className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-xs text-gray-400">Joriy rasm</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button size="sm" variant="outline" onClick={closeVar}>Bekor qilish</Button>
              <Button size="sm" onClick={saveVariant} disabled={vSaving}>
                {vSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saqlanmoqda...
                  </span>
                ) : editVariant ? "Saqlash" : "Qo'shish"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Variant delete confirm */}
      {variantToDelete && (
        <ConfirmDeleteModal
          title="Variantni o'chirishni tasdiqlaysizmi?"
          desc={
            (variantToDelete._count?.shop_products ?? 0) > 0
              ? `Diqqat! Bu variant ${variantToDelete._count?.shop_products} ta do'kon mahsulotida ishlatilgan. O'chirilsa, do'konlardagi tegishli mahsulotlar ham o'chiriladi. Davom etilsinmi?`
              : "Bu amalni qaytarib bo'lmaydi."
          }
          onConfirm={confirmDeleteVariant}
          onCancel={() => setVariantToDelete(null)}
        />
      )}
    </div>
  );
}