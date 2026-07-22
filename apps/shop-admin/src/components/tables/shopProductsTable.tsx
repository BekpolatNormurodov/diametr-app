import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Button from "../ui/button/Button";
import { PlusIcon } from "../../icons";
import { useEffect, useMemo, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import { formatMoney } from "../../service/formatters/money.format";
import * as XLSX from "xlsx";
import Moment from "moment";

export interface ShopProductItemProps {
  id: number;
  count?: number;
  price?: number;
  bonus_price?: number;
  sold_count?: number;
  last_sold?: string | null;
  shop_id?: number;
  shop?: { id: number; name?: string };
  product_item_id?: number;
  product_item?: {
    id: number;
    name?: string;
    image?: string;
    value?: number | string;
    color?: string;
    size?: string;
    unit_type?: { id: number; name?: string; symbol?: string };
    product?: {
      id: number;
      name?: string;
      name_uz?: string;
      name_ru?: string;
      image?: string;
      category_id?: number;
      unit_type?: { id: number; name?: string; symbol?: string };
      category?: { id: number; name?: string; name_uz?: string };
    };
  };
}

interface CategoryOption { value: string; label: string }
interface ProductRaw {
  id: number;
  name_uz?: string;
  name?: string;
  name_ru?: string;
  desc?: string;
  desc_uz?: string;
  desc_ru?: string;
  image?: string;
  category_id?: number;
  category?: { id: number; name?: string; name_uz?: string; name_ru?: string };
  type?: string;
  unit_type?: { id: number; name?: string; symbol?: string };
  _count?: { items?: number };
  createdt?: string;
  createdAt?: string;
}
interface ProductItemRaw {
  id: number;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  color?: string;
  size?: string;
  image?: string;
  product_id?: number;
  product?: ProductRaw;
  unit_type?: { id: number; symbol?: string };
}

interface ProductGroup {
  productId: number;
  productName: string;
  productImage?: string;
  categoryName?: string;
  unitType?: { id: number; name?: string; symbol?: string };
  shopItems: ShopProductItemProps[];
  totalCount: number;
  totalSold: number;
}

type VariantRow = { checked: boolean; count: string; price: string; bonus_price: string };

export default function ShopProductsTable({
  data,
  onRefetch,
}: {
  data: ShopProductItemProps[];
  onRefetch?: () => void;
}) {
  const [tableData, setTableData] = useState(data);
  const { isOpen: addOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: editOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: infoOpen, openModal: openInfoModal, closeModal: closeInfoModal } = useModal();
  const [editGroup, setEditGroup] = useState<ProductGroup | null>(null);
  const [infoGroup, setInfoGroup] = useState<ProductGroup | null>(null);
  const [editRows, setEditRows] = useState<Record<number, VariantRow>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [addCatId, setAddCatId] = useState("");
  const [addProdId, setAddProdId] = useState("");
  const [variantRows, setVariantRows] = useState<Record<number, VariantRow>>({});
  const [addSaving, setAddSaving] = useState(false);
  const [expandedAddProds, setExpandedAddProds] = useState<Set<number>>(new Set());
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRaw[]>([]);
  const [allProductItems, setAllProductItems] = useState<ProductItemRaw[]>([]);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  useEffect(() => {
    Promise.allSettled([
      axiosClient.get("/category/all"),
      axiosClient.get("/product/all"),
      axiosClient.get("/product-item/all"),
    ]).then(([catRes, prodRes, itemRes]) => {
      if (catRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(catRes.value.data) ? catRes.value.data : catRes.value.data?.data ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAllCategories(list.map((c: any) => ({ value: String(c.id), label: c.name_uz ?? c.name ?? c.name_ru ?? `#${c.id}` })));
      }
      if (prodRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(prodRes.value.data) ? prodRes.value.data : prodRes.value.data?.data ?? [];
        setAllProducts(list);
      }
      if (itemRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(itemRes.value.data) ? itemRes.value.data : itemRes.value.data?.data ?? [];
        setAllProductItems(list);
      }
    });
  }, []);

  // ─── Group data by product ────────────────────────────
  const groupedData = useMemo(() => {
    const filtered = search.trim() === ""
      ? tableData
      : tableData.filter((s) => {
          const q = search.toLowerCase();
          const pi = s.product_item;
          const pname = pi?.product?.name_uz ?? pi?.product?.name ?? pi?.name ?? "";
          return pname.toLowerCase().includes(q);
        });

    const map = new Map<number, ProductGroup>();
    for (const sp of filtered) {
      const pid = sp.product_item?.product?.id ?? 0;
      if (!map.has(pid)) {
        map.set(pid, {
          productId: pid,
          productName: sp.product_item?.product?.name_uz ?? sp.product_item?.product?.name ?? sp.product_item?.name ?? "—",
          productImage: sp.product_item?.product?.image,
          categoryName: sp.product_item?.product?.category?.name_uz,
          unitType: sp.product_item?.product?.unit_type,
          shopItems: [],
          totalCount: 0,
          totalSold: 0,
        });
      }
      const g = map.get(pid)!;
      g.shopItems.push(sp);
      g.totalCount += sp.count ?? 0;
      g.totalSold += sp.sold_count ?? 0;
    }
    return [...map.values()].sort((a, b) => b.productId - a.productId);
  }, [tableData, search]);

  const maxPage = Math.ceil(groupedData.length / +optionValue) || 1;
  const currentGroups = groupedData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const toggleExpand = (pid: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  // ─── Add modal ─────────────────────────────────────────
  const addFilteredProducts = useMemo(() => {
    let list = allProducts.filter((p) => !addCatId || String(p.category_id) === addCatId);
    if (addProdId) list = list.filter((p) => String(p.id) === addProdId);
    return list;
  }, [allProducts, addCatId, addProdId]);

  const addProductOptions = allProducts
    .filter((p) => !addCatId || String(p.category_id) === addCatId)
    .map((p) => {
      const pName = p.name_uz ?? p.name ?? p.name_ru ?? `#${p.id}`;
      const cnt = p._count?.items ?? 0;
      return { value: String(p.id), label: `${pName} (${cnt} ta variant)` };
    });

  // Init variant rows for ALL visible products
  useEffect(() => {
    const rows: Record<number, VariantRow> = {};
    for (const prod of addFilteredProducts) {
      const variants = allProductItems.filter(
        (pi) => String(pi.product?.id ?? pi.product_id ?? "") === String(prod.id)
      );
      for (const v of variants) {
        if (variantRows[v.id] !== undefined) {
          rows[v.id] = variantRows[v.id];
        } else {
          const existing = data.find(
            (sp) => (sp.product_item_id ?? sp.product_item?.id) === v.id && sp.shop_id === shopId
          );
          rows[v.id] = {
            checked: !!existing,
            count: existing?.count != null ? String(existing.count) : "",
            price: existing?.price != null ? String(existing.price) : "",
            bonus_price: existing?.bonus_price != null ? String(existing.bonus_price) : "",
          };
        }
      }
    }
    setVariantRows(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFilteredProducts, allProductItems]);

  const toggleVariant = (id: number) => setVariantRows((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id]?.checked } }));
  const updateVariantRow = (id: number, field: keyof VariantRow, value: string) => setVariantRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  const checkedCount = Object.values(variantRows).filter((r) => r.checked).length;

  const toggleAddProd = (pid: number) => setExpandedAddProds((prev) => {
    const next = new Set(prev);
    if (next.has(pid)) next.delete(pid); else next.add(pid);
    return next;
  });

  const openAdd = () => { setAddCatId(""); setAddProdId(""); setVariantRows({}); setExpandedAddProds(new Set()); openAddModal(); };

  const handleAddSave = async () => {
    const toSave = Object.entries(variantRows)
      .filter(([, r]) => r.checked && r.price)
      .map(([id, r]) => ({
        product_item_id: Number(id),
        price: Number(r.price),
        count: r.count ? Number(r.count) : 0,
        bonus_price: r.bonus_price && Number(r.bonus_price) > 0 ? Number(r.bonus_price) : undefined,
      }));
    if (toSave.length === 0) { toast.error("Kamida bitta variant tanlang va narx kiriting"); return; }
    setAddSaving(true);
    try {
      let created = 0, updated = 0;
      for (const payload of toSave) {
        const existing = data.find((sp) => (sp.product_item_id ?? sp.product_item?.id) === payload.product_item_id && sp.shop_id === shopId);
        if (existing) { await axiosClient.put(`/shop-product/${existing.id}`, payload); updated++; }
        else { await axiosClient.post("/shop-product", payload); created++; }
      }
      const msgs: string[] = [];
      if (created) msgs.push(`${created} ta yangi qo'shildi`);
      if (updated) msgs.push(`${updated} ta yangilandi`);
      toast.success(msgs.join(", "));
      onRefetch?.(); closeAddModal();
    } catch (e: unknown) { toast.error((e as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message ?? "Xatolik yuz berdi"); }
    finally { setAddSaving(false); }
  };

  // ─── Edit modal (product group) ───────────────────────
  const openEditGroup = (group: ProductGroup) => {
    setEditGroup(group);
    const rows: Record<number, VariantRow> = {};
    const allVariants = allProductItems.filter((pi) => (pi.product?.id ?? pi.product_id) === group.productId);
    for (const v of allVariants) {
      const sp = group.shopItems.find((s) => (s.product_item_id ?? s.product_item?.id) === v.id);
      rows[v.id] = {
        checked: !!sp,
        count: sp?.count != null ? String(sp.count) : "",
        price: sp?.price != null ? String(sp.price) : "",
        bonus_price: sp?.bonus_price != null ? String(sp.bonus_price) : "",
      };
    }
    setEditRows(rows);
    openEditModal();
  };

  const toggleEditVariant = (id: number) => setEditRows((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id]?.checked } }));
  const updateEditRow = (id: number, field: keyof VariantRow, value: string) => setEditRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  const editCheckedCount = Object.values(editRows).filter((r) => r.checked).length;

  const handleEditSave = async () => {
    if (!editGroup) return;
    setEditSaving(true);
    try {
      let created = 0, updated = 0, deleted = 0;
      for (const [idStr, row] of Object.entries(editRows)) {
        const piId = Number(idStr);
        const existingSp = editGroup.shopItems.find((s) => (s.product_item_id ?? s.product_item?.id) === piId);
        if (row.checked && row.price) {
          const payload = {
            product_item_id: piId, price: Number(row.price),
            count: row.count ? Number(row.count) : 0,
            bonus_price: row.bonus_price && Number(row.bonus_price) > 0 ? Number(row.bonus_price) : undefined,
          };
          if (existingSp) { await axiosClient.put(`/shop-product/${existingSp.id}`, payload); updated++; }
          else { await axiosClient.post("/shop-product", payload); created++; }
        } else if (!row.checked && existingSp) {
          await axiosClient.delete(`/shop-product/${existingSp.id}`); deleted++;
        }
      }
      const msgs: string[] = [];
      if (created) msgs.push(`${created} ta qo'shildi`);
      if (updated) msgs.push(`${updated} ta yangilandi`);
      if (deleted) msgs.push(`${deleted} ta o'chirildi`);
      toast.success(msgs.join(", ") || "Saqlandi");
      onRefetch?.(); closeEditModal();
    } catch (e: unknown) { toast.error((e as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message ?? "Xatolik yuz berdi"); }
    finally { setEditSaving(false); }
  };

  // ─── Delete ────────────────────────────────────────────
  const handleDeleteGroup = async (group: ProductGroup) => {
    try {
      for (const sp of group.shopItems) await axiosClient.delete(`/shop-product/${sp.id}`);
      toast.success(`${group.productName} o'chirildi`);
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleDeleteSingle = async (id: number) => {
    try { await axiosClient.delete(`/shop-product/${id}`); toast.success("Variant o'chirildi"); onRefetch?.(); }
    catch { toast.error("Xatolik yuz berdi"); }
  };

  // ─── Inline edit single variant ────────────────────────
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineForm, setInlineForm] = useState({ count: "", price: "", bonus_price: "" });
  const [inlineSaving, setInlineSaving] = useState(false);

  const startInlineEdit = (sp: ShopProductItemProps) => {
    setInlineEditId(sp.id);
    setInlineForm({
      count: sp.count != null ? String(sp.count) : "",
      price: sp.price != null ? String(sp.price) : "",
      bonus_price: sp.bonus_price != null ? String(sp.bonus_price) : "",
    });
  };

  const cancelInlineEdit = () => { setInlineEditId(null); };

  const saveInlineEdit = async (id: number) => {
    if (!inlineForm.price) { toast.error("Narx kiritish shart"); return; }
    setInlineSaving(true);
    try {
      await axiosClient.put(`/shop-product/${id}`, {
        price: Number(inlineForm.price),
        count: inlineForm.count ? Number(inlineForm.count) : 0,
        bonus_price: inlineForm.bonus_price && Number(inlineForm.bonus_price) > 0 ? Number(inlineForm.bonus_price) : undefined,
      });
      toast.success("Yangilandi");
      setInlineEditId(null);
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setInlineSaving(false); }
  };

  // ─── Helpers ───────────────────────────────────────────
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  const getProductImage = (group: ProductGroup) => {
    if (group.productImage) return `${staticUrl}/static/products/${group.productImage}`;
    for (const sp of group.shopItems) {
      if (sp.product_item?.image) return `${staticUrl}/static/product-items/${sp.product_item.image}`;
    }
    return null;
  };

  const getVariantInfo = (sp: ShopProductItemProps) => {
    const pi = sp.product_item;
    if (!pi) return { label: "", color: "" };
    const unitSymbol = pi.product?.unit_type?.symbol ?? pi.unit_type?.symbol;
    const isDona = unitSymbol === "dona";
    const parts = [
      pi.name ?? "",
      !isDona && pi.value != null && unitSymbol ? `${pi.value} ${unitSymbol}` : "",
      !isDona && pi.size ? pi.size : "",
    ].filter(Boolean).join(" · ");
    return { label: parts || (pi.color ?? ""), color: pi.color ?? "" };
  };

  const getVariantInfoRaw = (pi: ProductItemRaw, unitType?: { symbol?: string }) => {
    const unitSymbol = unitType?.symbol ?? pi.unit_type?.symbol;
    const isDona = unitSymbol === "dona";
    const parts = [
      pi.name ?? "",
      !isDona && pi.value != null && unitSymbol ? `${pi.value} ${unitSymbol}` : "",
      !isDona && pi.size ? pi.size : "",
    ].filter(Boolean).join(" · ");
    return { label: parts || (pi.color ?? `ID:${pi.id}`), color: pi.color ?? "" };
  };

  const discountPct = (price?: number, bonus?: number) =>
    price && bonus && price > 0 ? Math.round((1 - bonus / price) * 100) : null;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((p) => {
        const pi = p.product_item;
        const pname = pi?.product?.name_uz ?? pi?.product?.name ?? pi?.name ?? "";
        const { label } = getVariantInfo(p);
        return { "Tovar": pname, "Variant": label, "Soni": p.count ?? 0, "Sotilgan": p.sold_count ?? 0, "Oxirgi savdo": p.last_sold ? Moment(p.last_sold).format('DD.MM.YYYY') : "", "Narx": p.price ?? 0, "Skidka narxi": p.bonus_price ?? "" };
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tovarlar");
    XLSX.writeFile(wb, `shop-products-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Tovar qidirish..."
          showValue={optionValue}
          onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }}
          onExport={handleExport}
          action={<Button size="sm" variant="primary" startIcon={<PlusIcon className="size-4 fill-white" />} onClick={openAdd}>Qo&apos;shish</Button>}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-3 py-3 w-8"></TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tovar</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Variantlar</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Soni</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sotilgan</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentGroups.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-gray-400">Tovarlar yo&apos;q</TableCell></TableRow>
            ) : currentGroups.map((group, idx) => {
              const isExpanded = expandedProducts.has(group.productId);
              const variantCount = group.shopItems.length;
              const allVariantsForProduct = allProductItems.filter((pi) => (pi.product?.id ?? pi.product_id) === group.productId);
              const unassigned = allVariantsForProduct.filter((pi) => !group.shopItems.some((sp) => (sp.product_item_id ?? sp.product_item?.id) === pi.id));

              return [
                /* Product row */
                <TableRow key={group.productId} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer" onClick={() => toggleExpand(group.productId)}>
                  <TableCell className="px-3 py-4 text-center">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                  <TableCell className="px-4 py-4">
                    {(() => {
                      const imgUrl = getProductImage(group);
                      return imgUrl ? (
                        <img src={imgUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-white/6 flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-medium text-gray-800 dark:text-white text-sm">
                    <div>{group.productName}</div>
                    {group.categoryName && <span className="text-xs text-gray-400">{group.categoryName}</span>}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">{variantCount} ta</span>
                    {unassigned.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] font-medium">+{unassigned.length}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-semibold">{group.totalCount > 0 ? `${group.totalCount.toLocaleString()} ta` : "—"}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white">{group.totalSold} ta</TableCell>
                  <TableCell className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setInfoGroup(group); openInfoModal(); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition"
                        title="Batafsil ma'lumot"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                      </button>
                      <TableActions onEdit={() => openEditGroup(group)} onDelete={() => handleDeleteGroup(group)} />
                    </div>
                  </TableCell>
                </TableRow>,

                /* Expanded variant rows */
                ...(isExpanded ? group.shopItems.map((sp) => {
                  const { label, color } = getVariantInfo(sp);
                  const dp = discountPct(sp.price, sp.bonus_price);
                  const isEditing = inlineEditId === sp.id;
                  return (
                    <TableRow key={`v-${sp.id}`} className="bg-gray-50/50 dark:bg-white/1">
                      <TableCell className="px-3 py-3"></TableCell>
                      <TableCell className="px-4 py-3"></TableCell>
                      <TableCell className="px-4 py-3">
                        {color?.startsWith('#') && <span className="w-7 h-7 rounded-lg inline-block ring-1 ring-black/10 shadow-sm" style={{ background: color }} />}
                      </TableCell>
                      <TableCell colSpan={2} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{label || "—"}</TableCell>
                      {isEditing ? (
                        <>
                          <TableCell className="px-4 py-2">
                            <input type="number" placeholder="Soni" value={inlineForm.count}
                              onChange={(e) => setInlineForm({ ...inlineForm, count: e.target.value })}
                              className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <input type="number" placeholder="Narx" value={inlineForm.price}
                                onChange={(e) => setInlineForm({ ...inlineForm, price: e.target.value })}
                                className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                              <input type="number" placeholder="Skidka" value={inlineForm.bonus_price}
                                onChange={(e) => setInlineForm({ ...inlineForm, bonus_price: e.target.value })}
                                className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => saveInlineEdit(sp.id)} disabled={inlineSaving}
                                className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50" title="Saqlash">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              </button>
                              <button onClick={cancelInlineEdit}
                                className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors" title="Bekor qilish">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sp.count ? `${sp.count} ta` : "—"}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {sp.bonus_price != null && dp !== null && dp > 0 ? (
                              <div>
                                <span className="font-bold text-brand-600 dark:text-brand-400">{formatMoney(sp.bonus_price)} so&apos;m</span>
                                <span className="ml-1 px-1 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium">-{dp}%</span>
                                <div className="text-[11px] text-gray-400 line-through">{formatMoney(sp.price)} so&apos;m</div>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-800 dark:text-white">{sp.price != null ? `${formatMoney(sp.price)} so'm` : "—"}</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => startInlineEdit(sp)} title="Tahrirlash"
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 transition-colors">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteSingle(sp.id)} title="O'chirish"
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                }) : []),

                /* Unassigned variants */
                ...(isExpanded ? unassigned.map((pi) => {
                  const info = getVariantInfoRaw(pi, group.unitType);
                  return (
                    <TableRow key={`u-${pi.id}`} className="bg-orange-50/30 dark:bg-orange-900/5">
                      <TableCell className="px-3 py-3"></TableCell>
                      <TableCell className="px-4 py-3"></TableCell>
                      <TableCell className="px-4 py-3">
                        {info.color?.startsWith('#') && <span className="w-7 h-7 rounded-lg inline-block ring-1 ring-black/10 shadow-sm opacity-50" style={{ background: info.color }} />}
                      </TableCell>
                      <TableCell colSpan={2} className="px-4 py-3 text-sm text-gray-400 italic">
                        {info.label} <span className="text-[10px] font-medium text-orange-500">(qo&apos;shilmagan)</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-400">—</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-400">—</TableCell>
                      <TableCell className="px-4 py-3">
                        <button onClick={() => openEditGroup(group)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Qo&apos;shish</button>
                      </TableCell>
                    </TableRow>
                  );
                }) : []),
              ];
            })}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/5">
          <span className="text-sm text-gray-500 dark:text-gray-400">{groupedData.length} ta tovar</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      {/* ─── ADD MODAL ──────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={closeAddModal} className="max-w-200 m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] min-h-[340px] flex flex-col">
          <div className="bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Tovar qo&apos;shish</h4>
                <p className="text-sm text-white/70">Kategoriya tanlang yoki qidiring, variantlarni belgilang</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-2 shrink-0 border-b border-gray-100 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Kategoriya</Label>
                <Select options={[{ value: "", label: "Barchasi" }, ...allCategories]} defaultValue={addCatId} onChange={(v) => { setAddCatId(v); setAddProdId(""); }} />
              </div>
              <div>
                <Label>Tovar</Label>
                <Select options={[{ value: "", label: "Barcha tovarlar" }, ...addProductOptions]} defaultValue={addProdId} onChange={(v) => setAddProdId(v)} />
              </div>
            </div>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {addFilteredProducts.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm text-gray-400">Tovar topilmadi</p></div>
            ) : (
              <div className="space-y-2">
                {addFilteredProducts.map((prod) => {
                  const pName = prod.name_uz ?? prod.name ?? prod.name_ru ?? `#${prod.id}`;
                  const prodItems = allProductItems.filter((pi) => String(pi.product?.id ?? pi.product_id ?? "") === String(prod.id));
                  const isExp = expandedAddProds.has(prod.id);
                  const checkedInProd = prodItems.filter((v) => variantRows[v.id]?.checked).length;
                  const existingInShop = prodItems.filter((v) => data.some((sp) => (sp.product_item_id ?? sp.product_item?.id) === v.id && sp.shop_id === shopId)).length;

                  return (
                    <div key={prod.id} className={`rounded-xl border transition-all ${
                      checkedInProd > 0
                        ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/5"
                        : existingInShop > 0
                          ? "border-blue-200 dark:border-blue-800/30 bg-blue-50/20 dark:bg-blue-900/5"
                          : "border-gray-200 dark:border-white/6 bg-white dark:bg-white/2"
                    }`}>
                      <button
                        type="button"
                        onClick={() => toggleAddProd(prod.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isExp ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-gray-800 dark:text-white">{pName}</span>
                          <span className="ml-2 text-xs text-gray-400">({prodItems.length} ta variant)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {existingInShop > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                              {existingInShop} ta sizda bor
                            </span>
                          )}
                          {checkedInProd > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              {checkedInProd} ta tanlandi
                            </span>
                          )}
                        </div>
                      </button>
                      {isExp && prodItems.length > 0 && (
                        <div className="px-4 pb-3 border-t border-gray-100 dark:border-white/5">
                          <VariantCheckboxList
                            variants={prodItems}
                            rows={variantRows}
                            toggle={toggleVariant}
                            update={updateVariantRow}
                            checkedCount={prodItems.filter((v) => variantRows[v.id]?.checked).length}
                            data={data}
                            shopId={shopId}
                            allProducts={allProducts}
                          />
                        </div>
                      )}
                      {isExp && prodItems.length === 0 && (
                        <div className="px-4 pb-3 pt-1 text-xs text-gray-400 italic">Variantlar yo&apos;q</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 shrink-0 justify-between">
            <span className="text-xs text-gray-400">{addFilteredProducts.length} ta tovar</span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={closeAddModal}>Bekor qilish</Button>
              <Button size="sm" onClick={handleAddSave} disabled={addSaving || checkedCount === 0}>{addSaving ? "Saqlanmoqda..." : `Saqlash (${checkedCount} ta)`}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── EDIT MODAL ─────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={closeEditModal} className="max-w-180 m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Variantlarni tahrirlash</h4>
                {editGroup && <p className="text-sm text-white/70">{editGroup.productName}</p>}
              </div>
            </div>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {editGroup && (() => {
              const allVariants = allProductItems.filter((pi) => (pi.product?.id ?? pi.product_id) === editGroup.productId);
              return <VariantCheckboxList variants={allVariants} rows={editRows} toggle={toggleEditVariant} update={updateEditRow}
                checkedCount={editCheckedCount} data={data} shopId={shopId} allProducts={allProducts} />;
            })()}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 shrink-0 justify-end">
            <Button size="sm" variant="outline" onClick={closeEditModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleEditSave} disabled={editSaving}>{editSaving ? "Saqlanmoqda..." : `Saqlash (${editCheckedCount} ta)`}</Button>
          </div>
        </div>
      </Modal>

      {/* ─── INFO MODAL ─────────────────────────────────── */}
      <Modal isOpen={infoOpen} onClose={closeInfoModal} className="max-w-200 m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
          {infoGroup && (() => {
            const prod = allProducts.find((p) => p.id === infoGroup.productId);
            const variants = allProductItems.filter((pi) => (pi.product?.id ?? pi.product_id) === infoGroup.productId);
            const imgUrl = getProductImage(infoGroup);
            const totalCount = infoGroup.totalCount;
            const totalSold = infoGroup.totalSold;
            const totalValue = infoGroup.shopItems.reduce((s, sp) => s + (sp.count ?? 0) * (sp.price ?? 0), 0);
            const desc = prod?.desc;
            return (
              <>
                <div className="bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-4 shrink-0 flex items-start gap-4">
                  {imgUrl ? (
                    <img src={imgUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Tovar ma&apos;lumoti</p>
                    <h4 className="text-lg font-bold text-white leading-tight truncate">{infoGroup.productName}</h4>
                    {infoGroup.categoryName && (
                      <p className="text-sm text-white/80 mt-0.5">📂 {infoGroup.categoryName}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeInfoModal}
                    className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  {/* Names UZ/RU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                      <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nomi (UZ)</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{prod?.name_uz ?? prod?.name ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                      <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nomi (RU)</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{prod?.name_ru ?? "—"}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {desc && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                      <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Tavsif</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{desc}</p>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                      <p className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">Variantlar</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{variants.length}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                      <p className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Skladda</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 p-3">
                      <p className="text-[10px] font-semibold uppercase text-orange-600 dark:text-orange-400">Sotilgan</p>
                      <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{totalSold.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3">
                      <p className="text-[10px] font-semibold uppercase text-purple-600 dark:text-purple-400">Qiymati</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{formatMoney(totalValue)}</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {infoGroup.unitType?.symbol && (
                      <div className="rounded-lg bg-gray-50 dark:bg-white/3 px-3 py-2">
                        <span className="text-gray-400">O&apos;lchov: </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{infoGroup.unitType.symbol}</span>
                      </div>
                    )}
                    {prod?.type && (
                      <div className="rounded-lg bg-gray-50 dark:bg-white/3 px-3 py-2">
                        <span className="text-gray-400">Tur: </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{prod.type}</span>
                      </div>
                    )}
                    <div className="rounded-lg bg-gray-50 dark:bg-white/3 px-3 py-2">
                      <span className="text-gray-400">ID: </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">#{infoGroup.productId}</span>
                    </div>
                  </div>

                  {/* All variants list */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                      Barcha variantlar ({variants.length})
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {variants.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Variant yo&apos;q</p>
                      ) : variants.map((v) => {
                        const sp = infoGroup.shopItems.find((s) => (s.product_item_id ?? s.product_item?.id) === v.id);
                        const inShop = !!sp;
                        const vImg = v.image
                          ? `${staticUrl}/static/product-items/${v.image}`
                          : prod?.image
                          ? `${staticUrl}/static/products/${prod.image}`
                          : null;
                        const vLabel = [
                          v.value != null && v.value !== "" ? String(v.value) : null,
                          v.color || null,
                          v.size || null,
                          v.name || null,
                        ].filter(Boolean).join(" / ") || `#${v.id}`;
                        return (
                          <div
                            key={v.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                              inShop
                                ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-900/10"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/3"
                            }`}
                          >
                            {vImg ? (
                              <img src={vImg} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                            {v.color?.startsWith('#') && (
                              <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: v.color }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{vLabel}</p>
                              {inShop ? (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  Sklad: <span className="font-semibold text-gray-700 dark:text-gray-200">{sp!.count ?? 0}</span>
                                  {" · "}
                                  Narx: <span className="font-semibold text-gray-700 dark:text-gray-200">{sp!.price ? formatMoney(sp!.price) : "—"}</span>
                                  {sp!.bonus_price ? (
                                    <> {" · "}<span className="text-rose-500 font-semibold">skidka {formatMoney(sp!.bonus_price)}</span></>
                                  ) : null}
                                  {sp!.sold_count ? <> {" · "}sotilgan: <span className="font-semibold">{sp!.sold_count}</span></> : null}
                                </p>
                              ) : (
                                <p className="text-[11px] text-gray-400">Do&apos;konda yo&apos;q</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 shrink-0 justify-end">
                  <Button size="sm" variant="outline" onClick={closeInfoModal}>Yopish</Button>
                  <Button
                    size="sm"
                    onClick={() => { closeInfoModal(); openEditGroup(infoGroup); }}
                  >Tahrirlash</Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}

/* ─── Shared variant checkbox list component ─────────────── */
function VariantCheckboxList({
  variants, rows, toggle, update, checkedCount, data, shopId, allProducts,
}: {
  variants: ProductItemRaw[];
  rows: Record<number, VariantRow>;
  // eslint-disable-next-line no-unused-vars
  toggle: (_id: number) => void;
  // eslint-disable-next-line no-unused-vars
  update: (_id: number, _field: keyof VariantRow, _value: string) => void;
  checkedCount: number;
  data: ShopProductItemProps[];
  shopId: number;
  allProducts: ProductRaw[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Variantlar <span className="ml-1.5 text-gray-400 font-normal">({variants.length} ta)</span>
        </p>
        {checkedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800/30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            {checkedCount} ta tanlandi
          </span>
        )}
      </div>
      <div className="space-y-2">
        {variants.map((v) => {
          const row = rows[v.id] ?? { checked: false, count: "", price: "", bonus_price: "" };
          const existing = data.find((sp) => (sp.product_item_id ?? sp.product_item?.id) === v.id && sp.shop_id === shopId);
          const prod = allProducts.find((p) => String(p.id) === String(v.product?.id ?? v.product_id ?? ""));
          const unitSymbol = prod?.unit_type?.symbol ?? v.unit_type?.symbol;
          const isDona = unitSymbol === "dona";
          const nameParts = [v.name ?? "", v.color ?? ""].filter(Boolean).join(" · ") || `ID:${v.id}`;
          const detailParts = [
            !isDona && v.value != null && unitSymbol ? `${v.value} ${unitSymbol}` : "",
            !isDona && v.size ? v.size : "",
          ].filter(Boolean).join(" · ");

          return (
            <div key={v.id} className={`rounded-xl border transition-all ${
              row.checked
                ? existing ? "border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10"
                           : "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10"
                : "border-gray-200 dark:border-white/6 bg-white dark:bg-white/2"
            }`}>
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
                <input type="checkbox" checked={row.checked} onChange={() => toggle(v.id)}
                  className="w-4.5 h-4.5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer" />
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {v.color?.startsWith("#") && <span className="w-5 h-5 rounded-md shrink-0 ring-1 ring-black/10 shadow-sm" style={{ background: v.color }} />}
                  <div className="min-w-0">
                    <span className="font-medium text-sm text-gray-800 dark:text-white truncate block">{nameParts}</span>
                    {detailParts && <span className="text-xs text-gray-400 dark:text-gray-500">{detailParts}</span>}
                  </div>
                </div>
                {existing && !row.checked && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium">Sizda bor</span>
                )}
              </label>
              {row.checked && (
                <div className="px-4 pb-3 pt-0">
                  {existing && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-3 py-2 mb-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Sizda bor &mdash; o&apos;zgartirmoqchimisiz?</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Hozirgi: {existing.count ?? 0} ta &middot; {existing.price ? `${formatMoney(existing.price)} so'm` : "narx yo'q"}
                        {existing.bonus_price ? ` · skidka: ${formatMoney(existing.bonus_price)} so'm` : ""}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soni</label>
                      <Input type="number" placeholder="0" value={row.count} onChange={(e) => update(v.id, "count", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Narx <span className="text-error-500">*</span></label>
                      <Input type="number" placeholder="so'm" value={row.price} onChange={(e) => update(v.id, "price", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Skidka narxi</label>
                      <Input type="number" placeholder="ixtiyoriy" value={row.bonus_price} onChange={(e) => update(v.id, "bonus_price", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
