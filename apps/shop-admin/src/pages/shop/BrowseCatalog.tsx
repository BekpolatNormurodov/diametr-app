import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import axiosClient from "../../service/axios.service";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { toast } from "../../components/ui/toast";
import { ChevronLeftIcon, BoxCubeIcon, CheckLineIcon, GridIcon } from "../../icons";

interface CategoryRaw {
  id: number;
  name?: string;
  name_uz?: string;
  name_ru?: string;
  image?: string;
  _count?: { products?: number };
}
interface ProductRaw {
  id: number;
  name?: string;
  name_uz?: string;
  name_ru?: string;
  desc?: string;
  image?: string;
  type?: string;
  category_id?: number;
  category?: { id: number; name?: string; name_uz?: string; name_ru?: string };
  createdt?: string;
  createdAt?: string;
  unit_type?: { id: number; name?: string; symbol?: string };
  _count?: { items?: number };
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
}
interface ShopProductRaw {
  id: number;
  shop_id?: number;
  product_item_id?: number;
  count?: number;
  price?: number;
  bonus_price?: number;
  product_item?: { id: number };
}

type VariantRow = { checked: boolean; count: string; price: string; bonus_price: string };

const variantLabel = (v: ProductItemRaw) => {
  const parts = [
    v.value != null && v.value !== "" ? String(v.value) : null,
    v.color || null,
    v.size || null,
    v.name || null,
  ].filter(Boolean);
  return parts.join(" / ") || `#${v.id}`;
};

type SortMode = "newest" | "oldest" | "name" | "name_desc" | "variants_desc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Eng yangi" },
  { value: "oldest", label: "Eng eski" },
  { value: "name", label: "Nom (A-Z)" },
  { value: "name_desc", label: "Nom (Z-A)" },
  { value: "variants_desc", label: "Variant ko'p" },
];

const PAGE_SIZES = [12, 24, 48, 96];

/** Polished custom dropdown with icon, animated panel, check on selection. */
function FancyDropdown<T extends string | number>({
  label,
  icon,
  value,
  options,
  onChange,
  width = "w-44",
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  // eslint-disable-next-line no-unused-vars
  onChange: (v: T) => void;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex flex-col">
      <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <div ref={ref} className={`relative ${width}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`group h-10 w-full flex items-center gap-2 px-3 rounded-xl border bg-white dark:bg-white/5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-all ${
            open
              ? "border-brand-500 ring-2 ring-brand-100 dark:ring-brand-500/20"
              : "border-gray-200 dark:border-white/10 hover:border-brand-400 hover:shadow"
          }`}
        >
          <span className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
            open ? "bg-brand-500 text-white" : "bg-brand-50 dark:bg-brand-500/10 text-brand-500"
          }`}>
            {icon}
          </span>
          <span className="flex-1 truncate">{current?.label ?? "—"}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180 text-brand-500" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl py-1.5 origin-top animate-[fadeIn_120ms_ease-out]">
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={String(o.value)}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    selected
                      ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{o.hint}</span>
                  )}
                  {selected && (
                    <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Image with graceful fallback to a placeholder block. */
function CatalogImg({
  src,
  alt,
  className,
  fallbackClassName,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallback: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className={fallbackClassName ?? className}>{fallback}</div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

export default function BrowseCatalogPage() {
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);

  const [categories, setCategories] = useState<CategoryRaw[]>([]);
  const [products, setProducts] = useState<ProductRaw[]>([]);
  const [productItems, setProductItems] = useState<ProductItemRaw[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProductRaw[]>([]);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [expandedProd, setExpandedProd] = useState<Set<number>>(new Set());
  const [rows, setRows] = useState<Record<number, VariantRow>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [infoProduct, setInfoProduct] = useState<ProductRaw | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, itemRes, spRes] = await Promise.allSettled([
        axiosClient.get("/category/all"),
        axiosClient.get("/product/all"),
        axiosClient.get("/product-item/all"),
        axiosClient.get("/shop-product/all"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pick = (r: any) => Array.isArray(r?.value?.data) ? r.value.data : r?.value?.data?.data ?? [];
      if (catRes.status === "fulfilled") setCategories(pick(catRes));
      if (prodRes.status === "fulfilled") setProducts(pick(prodRes));
      if (itemRes.status === "fulfilled") setProductItems(pick(itemRes));
      if (spRes.status === "fulfilled") {
        const list: ShopProductRaw[] = pick(spRes);
        setShopProducts(shopId ? list.filter((s) => s.shop_id === shopId) : list);
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Init rows with existing shop-product data
  useEffect(() => {
    if (productItems.length === 0) return;
    const next: Record<number, VariantRow> = {};
    for (const v of productItems) {
      const existing = shopProducts.find((sp) => (sp.product_item_id ?? sp.product_item?.id) === v.id);
      next[v.id] = rows[v.id] ?? {
        checked: !!existing,
        count: existing?.count != null ? String(existing.count) : "",
        price: existing?.price != null ? String(existing.price) : "",
        bonus_price: existing?.bonus_price != null ? String(existing.bonus_price) : "",
      };
    }
    setRows(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productItems, shopProducts]);

  const variantsOfProduct = (pid: number) =>
    productItems.filter((v) => (v.product?.id ?? v.product_id) === pid);

  const sortedProducts = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.category_id === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.name_uz ?? p.name ?? p.name_ru ?? "").toLowerCase().includes(q));
    }
    const arr = [...list];
    const nameOf = (p: ProductRaw) => (p.name_uz ?? p.name ?? p.name_ru ?? "").toLocaleLowerCase();
    const tsOf = (p: ProductRaw) => {
      const t = p.createdt ?? p.createdAt;
      const ms = t ? Date.parse(t) : NaN;
      return Number.isFinite(ms) ? ms : p.id; // fallback: id (auto-increment)
    };
    switch (sortBy) {
      case "newest": arr.sort((a, b) => tsOf(b) - tsOf(a)); break;
      case "oldest": arr.sort((a, b) => tsOf(a) - tsOf(b)); break;
      case "name": arr.sort((a, b) => nameOf(a).localeCompare(nameOf(b))); break;
      case "name_desc": arr.sort((a, b) => nameOf(b).localeCompare(nameOf(a))); break;
      case "variants_desc":
        arr.sort((a, b) => variantsOfProduct(b.id).length - variantsOfProduct(a.id).length);
        break;
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCat, search, sortBy, productItems]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = useMemo(
    () => sortedProducts.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedProducts, safePage, pageSize]
  );

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [activeCat, search, sortBy, pageSize]);

  const toggleProd = (pid: number) => setExpandedProd((prev) => {
    const next = new Set(prev);
    if (next.has(pid)) next.delete(pid); else next.add(pid);
    return next;
  });

  const updateRow = (id: number, field: keyof VariantRow, value: string | boolean) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } as VariantRow }));

  const toggleVariant = (id: number) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id]?.checked } as VariantRow }));

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const [idStr, r] of Object.entries(rows)) {
      const id = Number(idStr);
      const existing = shopProducts.find((sp) => (sp.product_item_id ?? sp.product_item?.id) === id);
      if (r.checked && r.price) {
        if (!existing) n++;
        else if (
          String(existing.count ?? "") !== r.count ||
          String(existing.price ?? "") !== r.price ||
          String(existing.bonus_price ?? "") !== r.bonus_price
        ) n++;
      } else if (!r.checked && existing) {
        n++;
      }
    }
    return n;
  }, [rows, shopProducts]);

  const handleSaveAll = async () => {
    setSaving(true);
    let created = 0, updated = 0, deleted = 0, errors = 0;
    try {
      for (const [idStr, r] of Object.entries(rows)) {
        const piId = Number(idStr);
        const existing = shopProducts.find((sp) => (sp.product_item_id ?? sp.product_item?.id) === piId);
        try {
          if (r.checked && r.price) {
            const payload = {
              product_item_id: piId,
              price: Number(r.price),
              count: r.count ? Number(r.count) : 0,
              bonus_price: r.bonus_price && Number(r.bonus_price) > 0 ? Number(r.bonus_price) : undefined,
            };
            if (existing) {
              await axiosClient.put(`/shop-product/${existing.id}`, payload);
              updated++;
            } else {
              await axiosClient.post("/shop-product", payload);
              created++;
            }
          } else if (!r.checked && existing) {
            await axiosClient.delete(`/shop-product/${existing.id}`);
            deleted++;
          }
        } catch {
          errors++;
        }
      }
      const msgs: string[] = [];
      if (created) msgs.push(`${created} ta qo'shildi`);
      if (updated) msgs.push(`${updated} ta yangilandi`);
      if (deleted) msgs.push(`${deleted} ta o'chirildi`);
      if (errors) msgs.push(`${errors} ta xatolik`);
      toast.success(msgs.join(", ") || "O'zgarish yo'q");
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const inShop = (piId: number) =>
    shopProducts.some((sp) => (sp.product_item_id ?? sp.product_item?.id) === piId);

  const productHasShopItems = (pid: number) =>
    variantsOfProduct(pid).some((v) => inShop(v.id));

  return (
    <>
      <PageMeta title="Katalog" description="Barcha kategoriya va tovarlar" />
      <PageBreadcrumb pageTitle="Katalog" />
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/shop-products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400">
              <ChevronLeftIcon className="w-4 h-4" /> Tovarlar
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <GridIcon className="w-5 h-5 text-brand-500" />
              Barcha kategoriya va tovarlar
            </h2>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex flex-col">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Qidirish</span>
              <Input
                type="text"
                placeholder="Tovar nomi bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
            </div>
            <FancyDropdown<SortMode>
              label="Tartiblash"
              icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13M3 12h9m-9 5h5m6 0l3 3m0 0l3-3m-3 3V8" /></svg>}
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(v) => setSortBy(v)}
              width="w-48"
            />
            <FancyDropdown<number>
              label="Sahifa soni"
              icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>}
              value={pageSize}
              options={PAGE_SIZES.map((n) => ({ value: n, label: `${n} ta`, hint: "/ sahifa" }))}
              onChange={(v) => setPageSize(v)}
              width="w-40"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={dirtyCount === 0 || saving}
              onClick={handleSaveAll}
              startIcon={<CheckLineIcon className="w-4 h-4" />}
            >
              {saving ? "Saqlanmoqda..." : `Saqlash${dirtyCount ? ` (${dirtyCount})` : ""}`}
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
              activeCat === "all"
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white dark:bg-white/3 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-brand-400"
            }`}
          >
            <GridIcon className="w-4 h-4" />
            Barchasi <span className="opacity-70">({products.length})</span>
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                  active
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white dark:bg-white/3 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-brand-400"
                }`}
              >
                {c.image ? (
                  <CatalogImg
                    src={`${staticUrl}/static/categories/${c.image}`}
                    alt={c.name_uz ?? c.name ?? ""}
                    className="w-6 h-6 rounded object-cover"
                    fallbackClassName="w-6 h-6 rounded bg-white/30 flex items-center justify-center"
                    fallback={<BoxCubeIcon className="w-3.5 h-3.5" />}
                  />
                ) : (
                  <BoxCubeIcon className="w-4 h-4" />
                )}
                {c.name_uz ?? c.name ?? c.name_ru ?? `#${c.id}`}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Yuklanmoqda...</div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Tovar topilmadi</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pagedProducts.map((p) => {
              const variants = variantsOfProduct(p.id);
              const expanded = expandedProd.has(p.id);
              const hasInShop = productHasShopItems(p.id);
              const checkedHere = variants.filter((v) => rows[v.id]?.checked).length;
              return (
                <div
                  key={p.id}
                  className={`relative rounded-xl border bg-white dark:bg-white/3 overflow-hidden transition ${
                    hasInShop ? "border-green-300 dark:border-green-700/40" : "border-gray-200 dark:border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setInfoProduct(p); }}
                    title="Batafsil ma'lumot"
                    className="absolute top-2 left-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 dark:bg-gray-900/95 text-brand-500 border border-brand-200 dark:border-brand-500/30 shadow-md hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleProd(p.id)}
                    className="w-full text-left hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                      <CatalogImg
                        src={p.image ? `${staticUrl}/static/products/${p.image}` : null}
                        alt={p.name_uz ?? p.name ?? ""}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600"
                        fallback={<BoxCubeIcon className="w-12 h-12" />}
                      />
                      {hasInShop && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500 text-white shadow">
                          <CheckLineIcon className="w-3 h-3" /> Do'konda
                        </span>
                      )}
                      {checkedHere > 0 && (
                        <span className="absolute top-2 left-12 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-500 text-white shadow">
                          {checkedHere} tanlandi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white truncate">
                          {p.name_uz ?? p.name ?? p.name_ru ?? `#${p.id}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {variants.length} ta variant
                        </p>
                      </div>
                      <span className={`text-gray-400 transition ${expanded ? "rotate-180" : ""}`}>▾</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-100 dark:border-white/6 p-3 space-y-2">
                      {variants.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Variant yo'q</p>
                      ) : (
                        variants.map((v) => {
                          const r = rows[v.id] ?? { checked: false, count: "", price: "", bonus_price: "" };
                          const exists = inShop(v.id);
                          return (
                            <div
                              key={v.id}
                              className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border ${
                                r.checked
                                  ? "border-brand-300 bg-brand-50/40 dark:bg-brand-500/5 dark:border-brand-500/40"
                                  : "border-gray-100 dark:border-white/6"
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-[140px]">
                                <input
                                  type="checkbox"
                                  checked={!!r.checked}
                                  onChange={() => toggleVariant(v.id)}
                                  className="w-4 h-4 accent-brand-500"
                                />
                                <CatalogImg
                                  src={
                                    v.image
                                      ? `${staticUrl}/static/product-items/${v.image}`
                                      : p.image
                                      ? `${staticUrl}/static/products/${p.image}`
                                      : null
                                  }
                                  alt={variantLabel(v)}
                                  className="w-9 h-9 rounded-md object-cover border border-gray-200 dark:border-white/10"
                                  fallbackClassName="w-9 h-9 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-gray-600"
                                  fallback={<BoxCubeIcon className="w-4 h-4" />}
                                />
                                {v.color && (
                                  <span
                                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-white/20"
                                    style={{ background: v.color }}
                                  />
                                )}
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                  {variantLabel(v)}
                                </span>
                                {exists && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                                    do'konda
                                  </span>
                                )}
                              </label>
                              <Input
                                type="number"
                                placeholder="Soni"
                                value={r.count}
                                onChange={(e) => updateRow(v.id, "count", e.target.value)}
                                className="w-20"
                                disabled={!r.checked}
                              />
                              <Input
                                type="number"
                                placeholder="Narx"
                                value={r.price}
                                onChange={(e) => updateRow(v.id, "price", e.target.value)}
                                className="w-28"
                                disabled={!r.checked}
                              />
                              <Input
                                type="number"
                                placeholder="Bonus"
                                value={r.bonus_price}
                                onChange={(e) => updateRow(v.id, "bonus_price", e.target.value)}
                                className="w-24"
                                disabled={!r.checked}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && sortedProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jami <span className="font-semibold text-gray-700 dark:text-gray-200">{sortedProducts.length}</span> ta tovar
              {" • "}
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sortedProducts.length)} ko'rsatilmoqda
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                className="h-8 px-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40"
              >«</button>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40"
              >Oldingi</button>
              {(() => {
                const nums: number[] = [];
                const start = Math.max(1, safePage - 2);
                const end = Math.min(totalPages, start + 4);
                for (let i = start; i <= end; i++) nums.push(i);
                return nums.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 rounded-lg border text-sm ${
                      n === safePage
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white dark:bg-white/3 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200"
                    }`}
                  >{n}</button>
                ));
              })()}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40"
              >Keyingi</button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                className="h-8 px-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40"
              >»</button>
            </div>
          </div>
        )}

        {/* Sticky bottom save bar when there are pending changes */}
        {dirtyCount > 0 && (
          <div className="sticky bottom-3 z-30 flex justify-end">
            <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-white/10 px-4 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {dirtyCount} ta o'zgarish kutmoqda
              </span>
              <Button
                size="sm"
                variant="primary"
                disabled={saving}
                onClick={handleSaveAll}
                startIcon={<CheckLineIcon className="w-4 h-4" />}
              >
                {saving ? "Saqlanmoqda..." : "Hammasini saqlash"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Product Info Modal ───────────────────────── */}
        <Modal isOpen={!!infoProduct} onClose={() => setInfoProduct(null)} className="max-w-200 m-4">
          <div className="relative w-full overflow-hidden bg-white no-scrollbar rounded-3xl dark:bg-gray-900 shadow-2xl max-h-[90vh] flex flex-col">
            {infoProduct && (() => {
              const p = infoProduct;
              const variants = variantsOfProduct(p.id);
              const cat = categories.find((c) => c.id === p.category_id);
              const checkedHere = variants.filter((v) => rows[v.id]?.checked).length;
              const inShopCount = variants.filter((v) => inShop(v.id)).length;
              const imgUrl = p.image ? `${staticUrl}/static/products/${p.image}` : null;
              return (
                <>
                  <div className="bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-4 shrink-0 flex items-start gap-4">
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                        <BoxCubeIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Tovar ma&apos;lumoti</p>
                      <h4 className="text-lg font-bold text-white leading-tight truncate">
                        {p.name_uz ?? p.name ?? p.name_ru ?? `#${p.id}`}
                      </h4>
                      {cat && (
                        <p className="text-sm text-white/80 mt-0.5">📂 {cat.name_uz ?? cat.name ?? `#${cat.id}`}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setInfoProduct(null)}
                      className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                        <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nomi (UZ)</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{p.name_uz ?? p.name ?? "—"}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                        <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Nomi (RU)</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{p.name_ru ?? "—"}</p>
                      </div>
                    </div>

                    {p.desc && (
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 p-3">
                        <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Tavsif</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{p.desc}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                        <p className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">Variantlar</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{variants.length}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                        <p className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Do&apos;konda</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{inShopCount}</p>
                      </div>
                      <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3">
                        <p className="text-[10px] font-semibold uppercase text-brand-600 dark:text-brand-400">Tanlandi</p>
                        <p className="text-xl font-bold text-brand-700 dark:text-brand-300">{checkedHere}</p>
                      </div>
                      <div className="rounded-xl bg-gray-100 dark:bg-white/5 p-3">
                        <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">ID</p>
                        <p className="text-xl font-bold text-gray-700 dark:text-gray-300">#{p.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {p.unit_type?.symbol && (
                        <div className="rounded-lg bg-gray-50 dark:bg-white/3 px-3 py-2">
                          <span className="text-gray-400">O&apos;lchov: </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{p.unit_type.symbol}</span>
                        </div>
                      )}
                      {p.type && (
                        <div className="rounded-lg bg-gray-50 dark:bg-white/3 px-3 py-2">
                          <span className="text-gray-400">Tur: </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{p.type}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                        Barcha variantlar ({variants.length})
                      </p>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {variants.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">Variant yo&apos;q</p>
                        ) : variants.map((v) => {
                          const exists = inShop(v.id);
                          const sp = shopProducts.find((s) => (s.product_item_id ?? s.product_item?.id) === v.id);
                          const vImg = v.image
                            ? `${staticUrl}/static/product-items/${v.image}`
                            : p.image
                            ? `${staticUrl}/static/products/${p.image}`
                            : null;
                          return (
                            <div
                              key={v.id}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                                exists
                                  ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-900/10"
                                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/3"
                              }`}
                            >
                              {vImg ? (
                                <img src={vImg} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300">
                                  <BoxCubeIcon className="w-5 h-5" />
                                </div>
                              )}
                              {v.color?.startsWith('#') && (
                                <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: v.color }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{variantLabel(v)}</p>
                                {exists && sp ? (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Sklad: <span className="font-semibold text-gray-700 dark:text-gray-200">{sp.count ?? 0}</span>
                                    {" · "}
                                    Narx: <span className="font-semibold text-gray-700 dark:text-gray-200">{sp.price ? sp.price.toLocaleString() : "—"}</span>
                                    {sp.bonus_price ? (
                                      <> {" · "}<span className="text-rose-500 font-semibold">skidka {sp.bonus_price.toLocaleString()}</span></>
                                    ) : null}
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
                    <Button size="sm" variant="outline" onClick={() => setInfoProduct(null)}>Yopish</Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setInfoProduct(null);
                        setExpandedProd((prev) => { const n = new Set(prev); n.add(p.id); return n; });
                      }}
                    >Variantlarni ko&apos;rish</Button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      </div>
    </>
  );
}
