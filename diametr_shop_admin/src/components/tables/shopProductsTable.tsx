import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Button from "../ui/button/Button";
import { PlusIcon } from "../../icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import { formatMoney } from "../../service/formatters/money.format";
import { useShopId } from "../../context/ShopSessionContext";
import * as XLSX from "xlsx";
import Moment from "moment";
import { buildSearchIndex, filterSearchIndex } from "../../utils/searchKey";
import { beginBusy, endBusy } from "../../utils/busy";
import Pagination, { useAutoClampPage } from "../common/Pagination";

export interface ShopProductItemProps {
  id: number;
  count?: number;
  price?: number;
  bonus_price?: number;
  sold_count?: number;
  last_sold?: string | null;
  shop_id?: number;
  work_status?: string;
  shop?: { id: number; name?: string };
  product_item_id?: number;
  product_item?: {
    id: number;
    name?: string;
    image?: string;
    value?: number | string;
    color?: string;
    size?: string;
    work_status?: string;
    unit_type?: { id: number; name?: string; symbol?: string };
    product?: {
      id: number;
      name?: string;
      name_uz?: string;
      name_ru?: string;
      image?: string;
      category_id?: number;
      work_status?: string;
      unit_type?: { id: number; name?: string; symbol?: string };
      category?: { id: number; name?: string; name_uz?: string };
    };
  };
}

const isArchivedStatus = (s?: string) => s != null && s !== "WORKING";

/** Stock whose catalog product was deleted by the platform admin. */
const isProductArchived = (sp: ShopProductItemProps) => isArchivedStatus(sp.product_item?.product?.work_status);

/** Stock whose catalog variant or product was deleted — it can no longer be sold. */
export const isCatalogArchived = (sp: ShopProductItemProps) =>
  isArchivedStatus(sp.product_item?.work_status) || isProductArchived(sp);

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
  /** The catalog product was deleted by the platform admin. */
  archived: boolean;
}

type RowValues = { count: string; price: string; bonus_price: string };
/** `orig` = the stock values the row was prefilled from; present only for stock that already existed. */
type VariantRow = RowValues & { checked: boolean; orig?: RowValues };
const EMPTY_ROW: VariantRow = { checked: false, count: "", price: "", bonus_price: "" };

type SaveOp = {
  kind: "post" | "put" | "delete";
  piId: number;
  label: string;
  spId?: number;
  payload?: { price?: number; count?: number; bonus_price?: number | null };
  /** PUT that changes the count: the count the owner started from; refused if it moved meanwhile. */
  expectCount?: string;
  /** Row values being saved (become the new baseline after success). */
  values?: RowValues;
};
type SaveResult = { ok: true } | { ok: false; message: string; currentCount?: number; gone?: boolean };

// Same ceiling as the backend DTO (MAX_INT_VALUE), so a too-large number gets an Uzbek message, not a 400.
const MAX_INT = 2_000_000_000;
const INT_RE = /^\d+$/;

const stockValues = (sp?: { count?: number; price?: number; bonus_price?: number | null }): RowValues => ({
  count: sp?.count != null ? String(sp.count) : "",
  price: sp?.price != null ? String(sp.price) : "",
  bonus_price: sp?.bonus_price != null && sp.bonus_price > 0 ? String(sp.bonus_price) : "",
});

const trimValues = (v: RowValues): RowValues => ({ count: v.count.trim(), price: v.price.trim(), bonus_price: v.bonus_price.trim() });

/** "Variant: message", or just "Message" when there is no label (inline edit). */
const withLabel = (label: string, text: string) => (label ? `${label}: ${text}` : text.charAt(0).toUpperCase() + text.slice(1));

/**
 * Validation shared by the add, edit and inline paths (same rules as the backend):
 * price integer >= 1000, count integer >= 0, discount empty or 0 < discount < price.
 */
function validateRow(v: RowValues, label: string): string | null {
  const say = (text: string) => withLabel(label, text);
  const price = v.price.trim();
  const count = v.count.trim();
  const bonus = v.bonus_price.trim();
  if (!price) return say("narxni kiriting");
  if (!INT_RE.test(price)) return say("narx butun musbat son bo'lishi kerak (masalan 15000)");
  if (Number(price) < 1000) return say("narx kamida 1 000 so'm bo'lishi kerak");
  if (Number(price) > MAX_INT) return say("narx juda katta");
  if (!count) return say("sonini kiriting (0 ham bo'lishi mumkin)");
  if (!INT_RE.test(count)) return say("soni 0 yoki undan katta butun son bo'lishi kerak");
  if (Number(count) > MAX_INT) return say("soni juda katta");
  if (bonus) {
    if (!INT_RE.test(bonus) || Number(bonus) <= 0) return say("skidka narxi 0 dan katta butun son bo'lishi kerak (skidkasiz bo'lsa bo'sh qoldiring)");
    if (Number(bonus) >= Number(price)) return say("skidka narxi narxdan kichik bo'lishi kerak");
  }
  return null;
}

/** Empty discount means "no discount": sent as null so an existing discount is cleared. */
const bonusOrNull = (v: RowValues) => (v.bonus_price.trim() ? Number(v.bonus_price) : null);

const fullPayload = (v: RowValues) => ({ price: Number(v.price), count: Number(v.count), bonus_price: bonusOrNull(v) });

/**
 * Only what the owner changed compared with the values the row was prefilled from. Price and
 * discount travel together (the discount is validated against the price); the count is sent only
 * when edited, so a count lowered by an order meanwhile is never overwritten by a stale number.
 */
function changedPayload(v: RowValues, orig: RowValues): SaveOp["payload"] | null {
  const num = (x: string) => (x.trim() ? Number(x) : null);
  const out: NonNullable<SaveOp["payload"]> = {};
  if (num(v.price) !== num(orig.price) || num(v.bonus_price) !== num(orig.bonus_price)) {
    out.price = Number(v.price);
    out.bonus_price = bonusOrNull(v);
  }
  if (num(v.count) !== num(orig.count)) out.count = Number(v.count);
  return Object.keys(out).length ? out : null;
}

const apiError = (e: unknown): string => {
  const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  return msg || "Xatolik yuz berdi";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toList = (body: any): any[] => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

const stockVariantId = (sp: ShopProductItemProps) => sp.product_item_id ?? sp.product_item?.id;

function getVariantInfo(sp: ShopProductItemProps) {
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
}

function getVariantInfoRaw(pi: ProductItemRaw, unitType?: { symbol?: string }) {
  const unitSymbol = unitType?.symbol ?? pi.unit_type?.symbol;
  const isDona = unitSymbol === "dona";
  const parts = [
    pi.name ?? "",
    !isDona && pi.value != null && unitSymbol ? `${pi.value} ${unitSymbol}` : "",
    !isDona && pi.size ? pi.size : "",
  ].filter(Boolean).join(" · ");
  return { label: parts || (pi.color ?? `ID:${pi.id}`), color: pi.color ?? "" };
}

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
  const shopId = useShopId();
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRaw[]>([]);
  const [allProductItems, setAllProductItems] = useState<ProductItemRaw[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const catalogInFlight = useRef(false);
  const catalogLoadedAt = useRef(0);
  const catalogLoaded = useRef({ products: false, items: false });
  // product_item_id → stock row created by POST during the open modal (until the refetched list has it)
  const savedStockIds = useRef(new Map<number, number>());
  // stock row ids found deleted while saving (the list may still show them until it is refetched)
  const goneStockIds = useRef(new Set<number>());

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);
  // Anchor for the pager to scroll back into view after a page jump.
  const tableTopRef = useRef<HTMLDivElement | null>(null);

  // ─── Catalog (categories, products, variants) ──────────
  // Loaded on mount, again every time the add/edit modal opens (cached lists show meanwhile),
  // when the tab becomes visible after 20s, and on demand (the modal's Yangilash button); one automatic retry on failure.
  //
  // Why the manual refresh exists: the SUPER admin creates categories and
  // products, and shop owners need to see them right after — before this,
  // a shop owner who had the modal open when a new category was added had to
  // close and reopen it (and even then only if the lock had cleared). The
  // Yangilash button asks for the newest catalog on demand, and the load lock
  // now self-releases after 15s so a stuck request never freezes future loads.
  const loadCatalog = useCallback(async (attempt: number = 1) => {
    if (catalogInFlight.current) return;
    catalogInFlight.current = true;
    // Safety net: if a request hangs (no dio timeout on axiosClient.get here),
    // release the in-flight lock so subsequent opens can still refresh.
    const releaseTimer = setTimeout(() => { catalogInFlight.current = false; }, 15_000);
    catalogLoadedAt.current = Date.now();
    if (!(catalogLoaded.current.products && catalogLoaded.current.items)) setCatalogStatus("loading");
    let failed = false;
    try {
      const [catRes, prodRes, itemRes] = await Promise.allSettled([
        axiosClient.get("/category/all"),
        axiosClient.get("/product/all"),
        axiosClient.get("/product-item/all"),
      ]);
      if (catRes.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAllCategories(toList(catRes.value.data).map((c: any) => ({ value: String(c.id), label: c.name_uz ?? c.name ?? c.name_ru ?? `#${c.id}` })));
      } else failed = true;
      if (prodRes.status === "fulfilled") {
        const products = toList(prodRes.value.data);
        setAllProducts(products);
        // Some categories are soft-deleted by the SUPER admin (work_status=
        // DELETED) but still hold products the shop already stocks (or new
        // stock a shop owner may want to add). `/category/all` filters DELETED
        // out, so those categories would vanish from the Qo'shish dropdown and
        // the shop owner could not add stock to their own existing products.
        // Merge every category we see referenced by an actual product back in
        // — deduped by id, ordered same as `/category/all` first, extras after.
        setAllCategories((prev) => {
          const seen = new Set(prev.map((c) => c.value));
          const merged = [...prev];
          for (const p of products) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cat = (p as any).category;
            const cid = p.category_id ?? cat?.id;
            if (cid == null) continue;
            const key = String(cid);
            if (seen.has(key)) continue;
            seen.add(key);
            const label = cat?.name_uz ?? cat?.name ?? cat?.name_ru ?? `#${cid}`;
            merged.push({ value: key, label });
          }
          return merged;
        });
        catalogLoaded.current.products = true;
      } else failed = true;
      if (itemRes.status === "fulfilled") {
        setAllProductItems(toList(itemRes.value.data));
        catalogLoaded.current.items = true;
      } else failed = true;
    } finally {
      clearTimeout(releaseTimer);
      catalogInFlight.current = false;
    }
    const ready = catalogLoaded.current.products && catalogLoaded.current.items;
    if (failed && attempt < 2) setTimeout(() => { loadCatalog(attempt + 1); }, 1500);
    setCatalogStatus(ready ? "ready" : failed && attempt >= 2 ? "error" : "loading");
  }, []);

  useEffect(() => {
    loadCatalog();
    // 20s (was 60s) — a SUPER admin often adds a category/product and switches
    // right back to the shop admin tab; a full minute of stale dropdowns feels
    // broken.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - catalogLoadedAt.current > 20_000) loadCatalog();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadCatalog]);

  const productById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const variantById = useMemo(() => new Map(allProductItems.map((v) => [v.id, v])), [allProductItems]);
  const variantsByProduct = useMemo(() => {
    const map = new Map<number, ProductItemRaw[]>();
    for (const pi of allProductItems) {
      const pid = Number(pi.product?.id ?? pi.product_id);
      if (!pid) continue;
      const list = map.get(pid);
      if (list) list.push(pi); else map.set(pid, [pi]);
    }
    return map;
  }, [allProductItems]);
  const variantsOf = useCallback((pid: number): ProductItemRaw[] => variantsByProduct.get(pid) ?? [], [variantsByProduct]);

  const variantTitle = (v: ProductItemRaw) => {
    const prod = productById.get(Number(v.product?.id ?? v.product_id));
    const pName = prod?.name_uz ?? prod?.name ?? prod?.name_ru ?? v.product?.name_uz ?? v.product?.name ?? "";
    return [pName, getVariantInfoRaw(v, prod?.unit_type).label].filter(Boolean).join(" · ");
  };

  /** This shop's stock row for a variant in the latest fetched list (ignoring rows known to be deleted). */
  const stockInList = (piId: number) =>
    data.find((s) => stockVariantId(s) === piId && s.shop_id === shopId && !goneStockIds.current.has(s.id));
  /** Stock row id to write to: latest list first, then a row created by POST in the open modal. */
  const stockIdFor = (piId: number): number | undefined => stockInList(piId)?.id ?? savedStockIds.current.get(piId);

  // ─── Group data by product ────────────────────────────
  // Search keys are built once per list, not on every keystroke.
  // Product names in every language AND the variant name, so "rakovina" finds the
  // stocked variant "раковина" and a Russian product name works too.
  const tableSearchIndex = useMemo(() => buildSearchIndex(tableData, (s) => {
    const pi = s.product_item;
    return [pi?.product?.name_uz, pi?.product?.name_ru, pi?.product?.name, pi?.name]
      .filter((x): x is string => !!x);
  }), [tableData]);

  const groupedData = useMemo(() => {
    const filtered = search.trim() === ""
      ? tableData
      : filterSearchIndex(tableSearchIndex, search);

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
          archived: false,
        });
      }
      const g = map.get(pid)!;
      g.shopItems.push(sp);
      g.totalCount += sp.count ?? 0;
      g.totalSold += sp.sold_count ?? 0;
      if (isProductArchived(sp)) g.archived = true;
    }
    return [...map.values()].sort((a, b) => b.productId - a.productId);
  }, [tableData, tableSearchIndex, search]);

  const maxPage = Math.ceil(groupedData.length / +optionValue) || 1;
  // Never leave the pager on a page that no longer exists (a poll removed rows,
  // a filter narrowed them) — else Keyingi/Oldingi feel like they "went back".
  useAutoClampPage(currentPage, maxPage, setCurrentPage);
  const safePage = Math.min(currentPage, maxPage);
  const currentGroups = groupedData.slice((safePage - 1) * +optionValue, safePage * +optionValue);

  const toggleExpand = (pid: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  // ─── Row state helpers (shared by add & edit modals) ───
  /** Tick/untick. The first tick of a variant the shop already stocks prefills its current values. */
  const toggleRow = (prev: Record<number, VariantRow>, id: number): Record<number, VariantRow> => {
    const cur = prev[id];
    if (cur?.checked) return { ...prev, [id]: { ...cur, checked: false } };
    if (cur && (cur.orig || cur.count || cur.price || cur.bonus_price)) return { ...prev, [id]: { ...cur, checked: true } };
    const sp = stockInList(id);
    const vals = stockValues(sp);
    return { ...prev, [id]: { checked: true, ...vals, orig: sp ? vals : undefined } };
  };
  const patchRow = (prev: Record<number, VariantRow>, id: number, field: keyof RowValues, value: string) =>
    ({ ...prev, [id]: { ...EMPTY_ROW, ...prev[id], [field]: value } });

  /** POST for new stock, PUT (changed fields only) for existing stock; null when nothing changed. */
  const buildUpsertOp = (piId: number, label: string, row: VariantRow): SaveOp | null => {
    const values = trimValues(row);
    const spId = stockIdFor(piId);
    if (spId == null) return { kind: "post", piId, label, payload: fullPayload(values), values };
    // Stock appeared after the row was filled in (no baseline to diff against): write the full row.
    if (!row.orig) return { kind: "put", piId, spId, label, payload: fullPayload(values), values };
    const changed = changedPayload(values, row.orig);
    if (!changed) return null;
    return { kind: "put", piId, spId, label, payload: changed, values, expectCount: changed.count !== undefined ? row.orig.count : undefined };
  };

  /** Runs one request; never throws. */
  const runOp = async (op: SaveOp): Promise<SaveResult> => {
    try {
      if (op.kind === "delete") {
        await axiosClient.delete(`/shop-product/${op.spId}`);
        savedStockIds.current.delete(op.piId);
        if (op.spId != null) goneStockIds.current.add(op.spId);
        return { ok: true };
      }
      if (op.kind === "post") {
        // POST is idempotent per (shop, variant) on the backend, so a retry can never duplicate.
        const res = await axiosClient.post("/shop-product", { product_item_id: op.piId, ...op.payload });
        if (typeof res.data?.id === "number") savedStockIds.current.set(op.piId, res.data.id);
        return { ok: true };
      }
      // Re-read the row right before writing: it may have been removed meanwhile, or its count
      // lowered by a finished order (then a stale count must not be written back).
      let current: number | null = null;
      try {
        const res = await axiosClient.get(`/shop-product/${op.spId}`);
        const d = res.data;
        current = d && !isArchivedStatus(d.work_status) && d.count != null ? Number(d.count) : null;
      } catch (e) {
        if ((e as { response?: { status?: number } })?.response?.status !== 404) throw e;
      }
      if (current === null) {
        savedStockIds.current.delete(op.piId);
        if (op.spId != null) goneStockIds.current.add(op.spId);
        return { ok: false, gone: true, message: withLabel(op.label, "bu variant do'kondan o'chirilgan — qayta saqlasangiz yangidan qo'shiladi") };
      }
      if (op.expectCount !== undefined && current !== Number(op.expectCount)) {
        return { ok: false, currentCount: current, message: withLabel(op.label, `soni boshqa joyda o'zgargan (hozir ${current} ta) — tekshirib, qayta saqlang`) };
      }
      await axiosClient.put(`/shop-product/${op.spId}`, op.payload);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: op.label ? `${op.label}: ${apiError(e)}` : apiError(e) };
    }
  };

  /** After a failed op: move the row's baseline to what the server has now, so a retry behaves correctly. */
  const rebaseRow = (prev: Record<number, VariantRow>, piId: number, res: SaveResult): Record<number, VariantRow> => {
    const row = prev[piId];
    if (res.ok || !row) return prev;
    if (res.gone) return { ...prev, [piId]: { ...row, orig: undefined } };
    if (res.currentCount !== undefined && row.orig) return { ...prev, [piId]: { ...row, orig: { ...row.orig, count: String(res.currentCount) } } };
    return prev;
  };

  const reportSave = (done: string[], failures: string[]) => {
    if (failures.length === 0) { toast.success(done.join(", ") || "Saqlandi"); return; }
    const head = done.length ? `${done.join(", ")}. ` : "";
    if (failures.length === 1) { toast.error(`${head}${failures[0]}`); return; }
    toast.error(`${head}${failures.length} ta xatolik:`);
    // One toast per failed variant (the toast stack keeps the last five).
    failures.slice(0, 4).forEach((f) => toast.error(f));
  };

  const untickRows = (prev: Record<number, VariantRow>, ids: number[]) => {
    const next = { ...prev };
    for (const id of ids) next[id] = { ...EMPTY_ROW };
    return next;
  };

  const firstErrors = (errors: string[]) => `${errors[0]}${errors.length > 1 ? ` (yana ${errors.length - 1} ta xato)` : ""}`;

  // ─── Add modal ─────────────────────────────────────────
  const catalogReady = catalogStatus === "ready";

  const addFilteredProducts = useMemo(() => {
    let list = allProducts.filter((p) => !addCatId || String(p.category_id) === addCatId);
    if (addProdId) list = list.filter((p) => String(p.id) === addProdId);
    // Stockable products first; variantless ones ("Tovar turlari qo'shilmoqda") after them.
    return [...list].sort((a, b) => Number(variantsOf(b.id).length > 0) - Number(variantsOf(a.id).length > 0));
  }, [allProducts, addCatId, addProdId, variantsOf]);

  // The product select's search also matches variant names (keywords), so "rakovina" finds
  // "Hammom aksessuarlari" through its variant "раковина". Memoized: the Select builds its search keys per list.
  const addProductOptions = useMemo(() => [
    { value: "", label: "Barcha tovarlar" },
    ...allProducts
      .filter((p) => !addCatId || String(p.category_id) === addCatId)
      .map((p) => ({ p, variants: variantsOf(p.id) }))
      .sort((a, b) => Number(b.variants.length > 0) - Number(a.variants.length > 0))
      .map(({ p, variants }) => {
        const cnt = variants.length;
        const pName = p.name_uz ?? p.name ?? p.name_ru ?? `#${p.id}`;
        const suffix = !catalogReady ? "" : cnt > 0 ? ` (${cnt} ta variant)` : " (tovar turlari qo'shilmoqda)";
        // The label shows one language; search the other product names and the variants too.
        const keywords = [p.name_uz, p.name_ru, p.name, ...variants.map((v) => v.name)]
          .filter((x): x is string => !!x);
        return { value: String(p.id), label: `${pName}${suffix}`, keywords };
      }),
  ], [allProducts, addCatId, variantsOf, catalogReady]);

  // Rows live for the whole modal session: the category/product selects only filter the view,
  // so variants ticked under another filter are kept and saved too.
  const toggleVariant = (id: number) => setVariantRows((prev) => toggleRow(prev, id));
  const updateVariantRow = (id: number, field: keyof RowValues, value: string) => setVariantRows((prev) => patchRow(prev, id, field, value));
  const checkedCount = Object.values(variantRows).filter((r) => r.checked).length;
  const visibleVariantIds = new Set(addFilteredProducts.flatMap((p) => variantsOf(p.id).map((v) => v.id)));
  const hiddenCheckedCount = Object.entries(variantRows).filter(([id, r]) => r.checked && !visibleVariantIds.has(Number(id))).length;

  const toggleAddProd = (pid: number) => setExpandedAddProds((prev) => {
    const next = new Set(prev);
    if (next.has(pid)) next.delete(pid); else next.add(pid);
    return next;
  });

  const openAdd = () => {
    savedStockIds.current.clear();
    goneStockIds.current.clear();
    setAddCatId(""); setAddProdId(""); setVariantRows({}); setExpandedAddProds(new Set());
    openAddModal();
    loadCatalog();
  };

  const handleAddSave = async () => {
    if (addSaving) return;
    const ops: SaveOp[] = [];
    const errors: string[] = [];
    const droppedIds: number[] = [];
    for (const [idStr, row] of Object.entries(variantRows)) {
      if (!row.checked) continue;
      const piId = Number(idStr);
      const variant = variantById.get(piId);
      // Ticked, but the variant (or its product) has since been removed from the catalog.
      if (!variant || !productById.has(Number(variant.product?.id ?? variant.product_id))) { droppedIds.push(piId); continue; }
      const label = variantTitle(variant);
      const op = buildUpsertOp(piId, label, row);
      if (!op) continue;
      const err = validateRow(row, label);
      if (err) { errors.push(err); continue; }
      ops.push(op);
    }
    if (errors.length) { toast.error(firstErrors(errors)); return; }
    const droppedMsg = droppedIds.length ? `${droppedIds.length} ta tanlangan variant katalogdan olib tashlangan — saqlanmadi` : "";
    if (droppedIds.length) setVariantRows((prev) => untickRows(prev, droppedIds));
    if (ops.length === 0) {
      if (droppedMsg) toast.error(droppedMsg);
      else if (checkedCount === 0) toast.error("Kamida bitta variant tanlang");
      else { toast.info("O'zgarishlar yo'q"); closeAddModal(); }
      return;
    }

    setAddSaving(true);
    // Keeps a pending version reload (VersionWatcher) from cutting the loop off.
    beginBusy();
    let created = 0, updated = 0;
    const failures: string[] = droppedMsg ? [droppedMsg] : [];
    try {
      for (const op of ops) {
        const res = await runOp(op);
        if (res.ok) {
          if (op.kind === "post") created++; else updated++;
          // Saved: untick it, so pressing Save again after a partial failure never re-sends it.
          setVariantRows((prev) => ({ ...prev, [op.piId]: { ...EMPTY_ROW } }));
        } else {
          failures.push(res.message);
          setVariantRows((prev) => rebaseRow(prev, op.piId, res));
        }
      }
    } finally {
      endBusy();
      setAddSaving(false);
      // Always resync the table — after full success, partial success and failure alike.
      onRefetch?.();
    }
    const done: string[] = [];
    if (created) done.push(`${created} ta yangi qo'shildi`);
    if (updated) done.push(`${updated} ta yangilandi`);
    reportSave(done, failures);
    if (failures.length === 0) closeAddModal();
  };

  // ─── Edit modal (product group) ───────────────────────
  const openEditGroup = (group: ProductGroup) => {
    savedStockIds.current.clear();
    goneStockIds.current.clear();
    setEditGroup(group);
    const rows: Record<number, VariantRow> = {};
    for (const v of variantsOf(group.productId)) {
      const sp = stockInList(v.id);
      const vals = stockValues(sp);
      rows[v.id] = sp ? { checked: true, ...vals, orig: vals } : { ...EMPTY_ROW };
    }
    setEditRows(rows);
    openEditModal();
    loadCatalog();
  };

  // A catalog refresh while the edit modal is open may bring variants that have no row yet:
  // add them (prefilled from stock) without touching rows the owner already edited.
  useEffect(() => {
    if (!editOpen || !editGroup) return;
    setEditRows((prev) => {
      let next = prev;
      for (const v of variantsOf(editGroup.productId)) {
        if (prev[v.id]) continue;
        const sp = stockInList(v.id);
        const vals = stockValues(sp);
        if (next === prev) next = { ...prev };
        next[v.id] = sp ? { checked: true, ...vals, orig: vals } : { ...EMPTY_ROW };
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantsOf, editOpen, editGroup]);

  const toggleEditVariant = (id: number) => setEditRows((prev) => toggleRow(prev, id));
  const updateEditRow = (id: number, field: keyof RowValues, value: string) => setEditRows((prev) => patchRow(prev, id, field, value));
  const editCheckedCount = Object.values(editRows).filter((r) => r.checked).length;

  const handleEditSave = async () => {
    if (!editGroup || editSaving) return;
    const productInCatalog = productById.has(editGroup.productId);
    const variants = variantsOf(editGroup.productId);
    const ops: SaveOp[] = [];
    const errors: string[] = [];
    const droppedIds: number[] = [];
    for (const v of variants) {
      const row = editRows[v.id] ?? EMPTY_ROW;
      const label = variantTitle(v);
      if (row.checked) {
        const op = buildUpsertOp(v.id, label, row);
        if (!op) continue;
        // New stock cannot be added to a product that was deleted from the catalog.
        if (op.kind === "post" && !productInCatalog) { droppedIds.push(v.id); continue; }
        const err = validateRow(row, label);
        if (err) { errors.push(err); continue; }
        ops.push(op);
      } else if (row.orig) {
        // Was stocked when the modal opened and the owner unticked it → remove it.
        const spId = stockIdFor(v.id);
        if (spId != null) ops.push({ kind: "delete", piId: v.id, spId, label });
      }
    }
    const variantIds = new Set(variants.map((v) => v.id));
    for (const [id, r] of Object.entries(editRows)) {
      if (r.checked && !r.orig && !variantIds.has(Number(id))) droppedIds.push(Number(id));
    }
    if (errors.length) { toast.error(firstErrors(errors)); return; }
    const droppedMsg = droppedIds.length ? `${droppedIds.length} ta variant katalogdan olib tashlangan — saqlanmadi` : "";
    if (droppedIds.length) setEditRows((prev) => untickRows(prev, droppedIds));
    if (ops.length === 0) {
      if (droppedMsg) toast.error(droppedMsg);
      else { toast.info("O'zgarishlar yo'q"); closeEditModal(); }
      return;
    }

    setEditSaving(true);
    beginBusy();
    let created = 0, updated = 0, deleted = 0;
    const failures: string[] = droppedMsg ? [droppedMsg] : [];
    try {
      for (const op of ops) {
        const res = await runOp(op);
        if (res.ok) {
          if (op.kind === "post") created++; else if (op.kind === "put") updated++; else deleted++;
          // Saved values become the row's new baseline, so a retry after a partial failure skips it.
          setEditRows((prev) => ({
            ...prev,
            [op.piId]: op.kind === "delete" || !op.values ? { ...EMPTY_ROW } : { ...(prev[op.piId] ?? EMPTY_ROW), orig: op.values },
          }));
        } else {
          failures.push(res.message);
          setEditRows((prev) => rebaseRow(prev, op.piId, res));
        }
      }
    } finally {
      endBusy();
      setEditSaving(false);
      onRefetch?.();
    }
    const done: string[] = [];
    if (created) done.push(`${created} ta qo'shildi`);
    if (updated) done.push(`${updated} ta yangilandi`);
    if (deleted) done.push(`${deleted} ta o'chirildi`);
    reportSave(done, failures);
    if (failures.length === 0) closeEditModal();
  };

  // ─── Delete ────────────────────────────────────────────
  const handleDeleteGroup = async (group: ProductGroup) => {
    let deleted = 0;
    const failures: string[] = [];
    beginBusy();
    try {
      for (const sp of group.shopItems) {
        try { await axiosClient.delete(`/shop-product/${sp.id}`); deleted++; }
        catch (e) { failures.push(apiError(e)); }
      }
    } finally {
      endBusy();
      onRefetch?.();
    }
    if (failures.length === 0) toast.success(`${group.productName} o'chirildi`);
    else toast.error(`${deleted} ta o'chirildi, ${failures.length} ta xatolik: ${failures[0]}`);
  };

  const handleDeleteSingle = async (id: number) => {
    try { await axiosClient.delete(`/shop-product/${id}`); toast.success("Variant o'chirildi"); }
    catch (e) { toast.error(apiError(e)); }
    finally { onRefetch?.(); }
  };

  // ─── Inline edit single variant ────────────────────────
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineForm, setInlineForm] = useState<RowValues>({ count: "", price: "", bonus_price: "" });
  const [inlineOrig, setInlineOrig] = useState<RowValues>({ count: "", price: "", bonus_price: "" });
  const [inlineSaving, setInlineSaving] = useState(false);

  const startInlineEdit = (sp: ShopProductItemProps) => {
    const vals = stockValues(sp);
    setInlineEditId(sp.id);
    setInlineForm(vals);
    setInlineOrig(vals);
  };

  const cancelInlineEdit = () => { setInlineEditId(null); };

  const saveInlineEdit = async (sp: ShopProductItemProps) => {
    if (inlineSaving) return;
    const values = trimValues(inlineForm);
    const changed = changedPayload(values, inlineOrig);
    if (!changed) { setInlineEditId(null); return; }
    const err = validateRow(values, "");
    if (err) { toast.error(err); return; }
    setInlineSaving(true);
    beginBusy();
    try {
      const res = await runOp({
        kind: "put", piId: stockVariantId(sp) ?? 0, spId: sp.id, label: "", payload: changed, values,
        expectCount: changed.count !== undefined ? inlineOrig.count : undefined,
      });
      if (res.ok) {
        toast.success("Yangilandi");
        setInlineEditId(null);
      } else {
        toast.error(res.message);
        if (res.currentCount !== undefined) setInlineOrig((o) => ({ ...o, count: String(res.currentCount) }));
      }
    } finally {
      endBusy();
      setInlineSaving(false);
      onRefetch?.();
    }
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
    <div ref={tableTopRef} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
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
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-center">#</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-center">Rasm</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tovar</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-center">Variantlar</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-right">Soni</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-right">Sotilgan</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-center">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentGroups.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-gray-400">Tovarlar yo&apos;q</TableCell></TableRow>
            ) : currentGroups.map((group, idx) => {
              const isExpanded = expandedProducts.has(group.productId);
              const variantCount = group.shopItems.length;
              // A product deleted from the catalog cannot get new stock, so offer no "+ Qo'shish" rows for it.
              const unassigned = group.archived ? [] : variantsOf(group.productId).filter((pi) => !group.shopItems.some((sp) => stockVariantId(sp) === pi.id));

              return [
                /* Product row */
                <TableRow key={group.productId} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer" onClick={() => toggleExpand(group.productId)}>
                  <TableCell className="px-3 py-4 text-center">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-center">{(safePage - 1) * +optionValue + idx + 1}</TableCell>
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
                    <div>
                      {group.productName}
                      {group.archived && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium align-middle">Katalogdan o&apos;chirilgan</span>
                      )}
                    </div>
                    {group.categoryName && <span className="text-xs text-gray-400">{group.categoryName}</span>}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">{variantCount} ta</span>
                    {unassigned.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] font-medium">+{unassigned.length}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-semibold text-right">{group.totalCount > 0 ? `${group.totalCount.toLocaleString()} ta` : "—"}</TableCell>
                  <TableCell className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white text-right">{group.totalSold} ta</TableCell>
                  <TableCell className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
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
                      <TableCell colSpan={2} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {label || "—"}
                        {!group.archived && isCatalogArchived(sp) && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium">Katalogdan o&apos;chirilgan</span>
                        )}
                      </TableCell>
                      {isEditing ? (
                        <>
                          <TableCell className="px-4 py-2">
                            <input type="number" min="0" placeholder="Soni" value={inlineForm.count}
                              onChange={(e) => setInlineForm({ ...inlineForm, count: e.target.value })}
                              className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" placeholder="Narx" value={inlineForm.price}
                                onChange={(e) => setInlineForm({ ...inlineForm, price: e.target.value })}
                                className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                              <input type="number" min="0" placeholder="Skidka" value={inlineForm.bonus_price}
                                onChange={(e) => setInlineForm({ ...inlineForm, bonus_price: e.target.value })}
                                className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => saveInlineEdit(sp)} disabled={inlineSaving}
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
                            {sp.bonus_price != null && sp.bonus_price > 0 && sp.price != null && sp.bonus_price < sp.price ? (
                              <div>
                                <span className="font-bold text-brand-600 dark:text-brand-400">{formatMoney(sp.bonus_price)} so&apos;m</span>
                                {dp !== null && dp > 0 && <span className="ml-1 px-1 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-medium">-{dp}%</span>}
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
        <Pagination
          currentPage={currentPage}
          maxPage={maxPage}
          totalItems={groupedData.length}
          totalLabel="ta tovar"
          onChange={setCurrentPage}
          scrollTargetRef={tableTopRef}
        />
      </div>

      {/* ─── ADD MODAL ──────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => { if (!addSaving) closeAddModal(); }} className="max-w-200 m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] min-h-[340px] flex flex-col">
          <div className="bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-white">Tovar qo&apos;shish</h4>
                <p className="text-sm text-white/70">Kategoriya tanlang yoki qidiring, variantlarni belgilang</p>
              </div>
              {/* Manual refresh — for the case when a SUPER admin just added
                  a new category/product and the shop owner wants it visible
                  without closing the modal. */}
              <button
                type="button"
                onClick={() => loadCatalog()}
                disabled={catalogStatus === "loading"}
                title="Katalogni yangilash — SUPER admin yangi tovar/kategoriya qo'shsa, shu tugma orqali darhol ko'rasiz"
                aria-label="Katalogni yangilash"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/15 hover:bg-white/25 disabled:opacity-50 transition-colors backdrop-blur-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={catalogStatus === "loading" ? "animate-spin" : ""}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-3.05-6.29M20 4v5h-5" />
                </svg>
                Yangilash
              </button>
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
                <Select options={addProductOptions} defaultValue={addProdId} onChange={(v) => setAddProdId(v)} />
              </div>
            </div>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {!catalogReady ? (
              <div className="py-12 text-center">
                {catalogStatus === "error" ? (
                  <>
                    <p className="text-sm text-gray-400">Katalogni yuklab bo&apos;lmadi</p>
                    <button type="button" onClick={() => loadCatalog()} className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium">Qayta urinish</button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Yuklanmoqda...</p>
                )}
              </div>
            ) : addFilteredProducts.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm text-gray-400">Tovar topilmadi</p></div>
            ) : (
              <div className="space-y-2">
                {addFilteredProducts.map((prod) => {
                  const pName = prod.name_uz ?? prod.name ?? prod.name_ru ?? `#${prod.id}`;
                  const prodItems = variantsOf(prod.id);
                  if (prodItems.length === 0) {
                    // No variants yet: nothing can be priced/stocked — shown disabled with the agreed wording.
                    return (
                      <div key={prod.id} className="rounded-xl border border-gray-200 dark:border-white/6 bg-gray-50/60 dark:bg-white/1" aria-disabled="true">
                        <div className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-not-allowed">
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-gray-400 dark:text-gray-500">{pName}</span>
                            <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">Tovar turlari qo&apos;shilmoqda — administrator variant qo&apos;shgach narx kiritish mumkin bo&apos;ladi</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const isExp = expandedAddProds.has(prod.id);
                  const checkedInProd = prodItems.filter((v) => variantRows[v.id]?.checked).length;
                  const existingInShop = prodItems.filter((v) => data.some((sp) => stockVariantId(sp) === v.id && sp.shop_id === shopId)).length;

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
                      {isExp && (
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 shrink-0 justify-between">
            <span className="text-xs text-gray-400">
              {addFilteredProducts.length} ta tovar
              {hiddenCheckedCount > 0 && ` · yana ${hiddenCheckedCount} ta tanlov boshqa filtrda`}
            </span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={closeAddModal} disabled={addSaving}>Bekor qilish</Button>
              <Button size="sm" onClick={handleAddSave} disabled={addSaving || checkedCount === 0}>{addSaving ? "Saqlanmoqda..." : `Saqlash (${checkedCount} ta)`}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── EDIT MODAL ─────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => { if (!editSaving) closeEditModal(); }} className="max-w-180 m-4">
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
            {!catalogReady ? (
              <div className="py-12 text-center">
                {catalogStatus === "error" ? (
                  <>
                    <p className="text-sm text-gray-400">Katalogni yuklab bo&apos;lmadi</p>
                    <button type="button" onClick={() => loadCatalog()} className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium">Qayta urinish</button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Yuklanmoqda...</p>
                )}
              </div>
            ) : editGroup && (() => {
              const allVariants = variantsOf(editGroup.productId);
              return <VariantCheckboxList variants={allVariants} rows={editRows} toggle={toggleEditVariant} update={updateEditRow}
                checkedCount={editCheckedCount} data={data} shopId={shopId} allProducts={allProducts} />;
            })()}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 shrink-0 justify-end">
            <Button size="sm" variant="outline" onClick={closeEditModal} disabled={editSaving}>Bekor qilish</Button>
            <Button size="sm" onClick={handleEditSave} disabled={editSaving || !catalogReady}>{editSaving ? "Saqlanmoqda..." : `Saqlash (${editCheckedCount} ta)`}</Button>
          </div>
        </div>
      </Modal>

      {/* ─── INFO MODAL ─────────────────────────────────── */}
      <Modal isOpen={infoOpen} onClose={closeInfoModal} className="max-w-200 m-4">
        <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
          {infoGroup && (() => {
            const prod = productById.get(infoGroup.productId);
            const variants = variantsOf(infoGroup.productId);
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
                        const sp = infoGroup.shopItems.find((s) => stockVariantId(s) === v.id);
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
                                  {sp!.bonus_price && sp!.bonus_price > 0 && sp!.bonus_price < (sp!.price ?? 0) ? (
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
  update: (_id: number, _field: keyof RowValues, _value: string) => void;
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
          const row = rows[v.id] ?? EMPTY_ROW;
          const existing = data.find((sp) => stockVariantId(sp) === v.id && sp.shop_id === shopId);
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
                        {existing.bonus_price != null && existing.bonus_price > 0 && existing.bonus_price < (existing.price ?? 0) ? ` · skidka: ${formatMoney(existing.bonus_price)} so'm` : ""}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soni <span className="text-error-500">*</span></label>
                      <Input type="number" min="0" placeholder="0" value={row.count} onChange={(e) => update(v.id, "count", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Narx <span className="text-error-500">*</span></label>
                      <Input type="number" min="0" placeholder="so'm" value={row.price} onChange={(e) => update(v.id, "price", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Skidka narxi</label>
                      <Input type="number" min="0" placeholder="ixtiyoriy" value={row.bonus_price} onChange={(e) => update(v.id, "bonus_price", e.target.value)} />
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
