import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../ui/table";
import Moment from "moment";
import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { DeleteIcon, EditIcon, DownloadIcon } from "../../../icons";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import DateField from "../../form/DateField";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import ImageField, { ImageFieldResult } from "../../common/ImageField";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";

export interface AdItemProps {
  id: number;
  title: string;
  subtitle?: string;
  title_ru?: string;
  subtitle_ru?: string;
  image?: string;
  shop?: string | { id: number; name: string } | null;
  type?: string;
  expired?: string;
  createdt?: string; createdAt?: string;
}

const showOptions = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];
const typeOptions = [
  { value: "SHOP", label: "Do'kon (SHOP)" },
  { value: "WORKER", label: "Ishchi (WORKER)" },
  { value: "REGION", label: "Region (REGION)" },
  { value: "PRODUCT", label: "Mahsulot (PRODUCT)" },
];
// targetId = the id of the object the banner links to (its meaning depends on
// `type`: SHOP→shop, PRODUCT→product, WORKER→worker, REGION→region).
const emptyForm = { title: "", subtitle: "", title_ru: "", subtitle_ru: "", expired: "", type: "SHOP", targetId: "" };

// Which type links to which endpoint + how to label each option.
const TARGET_CONFIG: Record<string, { endpoint: string; label: (o: any) => string; heading: string }> = {
  SHOP: { endpoint: "/shop/all", heading: "Do'kon", label: (o) => o.name ?? o.name_uz ?? `#${o.id}` },
  PRODUCT: { endpoint: "/product/all", heading: "Mahsulot", label: (o) => o.name_uz ?? o.name_ru ?? o.name ?? `#${o.id}` },
  WORKER: { endpoint: "/worker/all", heading: "Ishchi", label: (o) => o.name ?? o.fullname ?? o.phone ?? `#${o.id}` },
  REGION: { endpoint: "/region/all", heading: "Hudud", label: (o) => o.name_uz ?? o.name_ru ?? o.name ?? `#${o.id}` },
};

export interface AdsTableHandle {
  openCreate: () => void;
}

const AdsTable = forwardRef<AdsTableHandle, { data: AdItemProps[]; onRefetch: () => void }>(function AdsTable({ data, onRefetch }, ref) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<AdItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const imgKey = useRef(0);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";
  // Link-target lists, fetched lazily per type and cached.
  const [targetOptions, setTargetOptions] = useState<Record<string, any[]>>({});
  const [targetLoading, setTargetLoading] = useState(false);

  const loadTargets = async (type: string) => {
    if (!TARGET_CONFIG[type] || targetOptions[type]) return;
    setTargetLoading(true);
    try {
      const res = await axiosClient.get(TARGET_CONFIG[type].endpoint);
      const list = res.data?.data ?? res.data ?? [];
      setTargetOptions((prev) => ({ ...prev, [type]: Array.isArray(list) ? list : [] }));
    } catch {
      setTargetOptions((prev) => ({ ...prev, [type]: [] }));
    } finally {
      setTargetLoading(false);
    }
  };

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.title ?? "").toLowerCase().includes(q) || (s.subtitle ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: AdItemProps) => {
    setEditItem(item);
    const t = item.type ?? "SHOP";
    const it: any = item;
    const tid =
      t === "SHOP" ? it.shop_id
      : t === "PRODUCT" ? it.product_id
      : t === "WORKER" ? it.worker_id
      : t === "REGION" ? it.region_id
      : null;
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? "",
      title_ru: item.title_ru ?? "",
      subtitle_ru: item.subtitle_ru ?? "",
      expired: item.expired ? item.expired.split("T")[0] : "",
      type: t,
      targetId: tid != null ? String(tid) : "",
    });
    loadTargets(t);
    imageResultRef.current = null;
    imgKey.current += 1;
    setImgPreview(item.image ? `${staticUrl}/static/ads/${item.image}` : null);
    openModal();
  };

  // Open the modal in "create" mode — same rich form (banner image + link
  // target) as edit, just with an empty form and a POST on save. Exposed so the
  // page's "Add" button reuses this modal instead of a separate old one.
  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    loadTargets(emptyForm.type);
    imageResultRef.current = null;
    imgKey.current += 1;
    setImgPreview(null);
    openModal();
  };

  useImperativeHandle(ref, () => ({ openCreate }));

  // When the type changes in the form, fetch that type's options.
  const onTypeChange = (v: string) => {
    setForm((f) => ({ ...f, type: v, targetId: "" }));
    loadTargets(v);
  };

  const handleSave = async () => {
    if (!form.title || !form.expired) { toast.error("Sarlavha va muddat kiritish shart"); return; }
    setSaving(true);
    try {
      // Upload the banner image first (if a new one was picked), then send its
      // filename with the ad. Reklama = banner, so the image matters most here.
      let imageFilename: string | undefined;
      const imgResult = imageResultRef.current;
      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/ad/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageFilename = res.data?.data?.image ?? res.data?.image;
      } else if (imgResult?.mode === "url" && imgResult.url) {
        imageFilename = imgResult.url;
      }
      const payload: any = { title: form.title, expired: form.expired, type: form.type };
      if (form.subtitle) payload.subtitle = form.subtitle;
      if (form.title_ru) payload.title_ru = form.title_ru;
      if (form.subtitle_ru) payload.subtitle_ru = form.subtitle_ru;
      if (imageFilename) payload.image = imageFilename;
      // Link target: assign the picked id to the field matching the type and
      // explicitly null the others — so switching type or clearing the target
      // actually clears the stale column instead of leaving it set.
      const idNum = form.targetId ? Number(form.targetId) : null;
      payload.shop_id = form.type === "SHOP" ? idNum : null;
      payload.product_id = form.type === "PRODUCT" ? idNum : null;
      payload.worker_id = form.type === "WORKER" ? idNum : null;
      payload.region_id = form.type === "REGION" ? idNum : null;
      if (editItem) {
        await axiosClient.put(`/ad/${editItem.id}`, payload);
        toast.success("Reklama yangilandi");
      } else {
        await axiosClient.post(`/ad`, payload);
        toast.success("Reklama qo'shildi");
      }
      onRefetch(); closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/ad/${id}`);
      toast.success("Reklama o'chirildi");
      onRefetch();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((a) => ({
      ID: a.id, Sarlavha: a.title, Tavsif: a.subtitle ?? "", Tur: a.type ?? "",
      "Yaratilgan": Moment(a.createdt ?? a.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ads");
    XLSX.writeFile(wb, `ads-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  const shopName = (s: any) => typeof s === "object" && s ? s.name : (s ?? "-");

  // Options for the link-target dropdown (pro searchable Select), with a
  // "static banner" default at the top.
  const targetOpts = [
    { value: "", label: "— Tanlanmagan (statik banner) —" },
    ...(targetOptions[form.type] ?? []).map((o) => ({
      value: String(o.id),
      label: TARGET_CONFIG[form.type]?.label(o) ?? `#${o.id}`,
    })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar search={search} onSearch={(v) => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Qidirish..." showValue={optionValue} onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }} onExport={handleExport} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sarlavha</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tavsif</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tur</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Muddat</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell></TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                <TableCell className="px-5 py-4">
                  <span className="font-medium text-gray-800 dark:text-white">{item.title}</span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{item.subtitle ?? "-"}</TableCell>
                <TableCell className="px-5 py-4">
                  <Badge size="sm" color="info">{item.type ?? "-"}</Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.expired ? Moment(item.expired).format("DD.MM.YYYY") : "-"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tableData.length} ta ichidan {Math.min((currentPage - 1) * +optionValue + 1, tableData.length)}–{Math.min(currentPage * +optionValue, tableData.length)} ko'rsatilmoqda
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[640px] m-4">
        <div className="relative w-full max-h-[85vh] p-5 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{editItem ? "Reklamani tahrirlash" : "Reklama qo'shish"}</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Banner rasmini yuklang va bosilganda ochiladigan manzilni tanlang.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <div>
              <Label>Sarlavha (UZ)</Label>
              <Input type="text" placeholder="Reklama sarlavhasi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Sarlavha (RU)</Label>
              <Input type="text" placeholder="Заголовок рекламы" value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} />
            </div>
            <div>
              <Label>Tavsif (UZ)</Label>
              <Input type="text" placeholder="Qisqacha tavsif" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Tavsif (RU)</Label>
              <Input type="text" placeholder="Краткое описание" value={form.subtitle_ru} onChange={(e) => setForm({ ...form, subtitle_ru: e.target.value })} />
            </div>
            <DateField
              label="Muddat"
              value={form.expired}
              placeholder="Sanani tanlang"
              onChange={(v) => setForm((f) => ({ ...f, expired: v }))}
            />
            <div>
              <Label>Tur</Label>
              <Select options={typeOptions} defaultValue={form.type} onChange={onTypeChange} />
            </div>
          </div>

          {/* Link target — full width, pro searchable dropdown */}
          <div className="mt-4">
            <Label>{TARGET_CONFIG[form.type]?.heading ?? "Manzil"} — banner bosilganda ochiladi</Label>
            <Select
              key={form.type}
              options={targetOpts}
              value={form.targetId}
              placeholder={targetLoading ? "Yuklanmoqda…" : "Tanlang..."}
              onChange={(v) => setForm({ ...form, targetId: v })}
            />
            <p className="mt-1.5 text-xs text-gray-400">Bo'sh qoldirsangiz — statik banner (hech qayerga o'tmaydi).</p>
          </div>

          {/* Banner image — full width */}
          <div className="mt-4">
            <ImageField
              key={imgKey.current}
              label="Banner rasmi"
              allowUrl={false}
              existingUrl={editItem?.image ? `${staticUrl}/static/ads/${editItem.image}` : undefined}
              onChange={(r) => { imageResultRef.current = r; setImgPreview(r.previewUrl ?? null); }}
            />
          </div>

          {/* Live preview — how the banner will look */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Ko'rinishi</p>
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.03] aspect-[16/6]">
              {imgPreview ? (
                <img src={imgPreview} alt="Banner" className="absolute inset-0 h-full w-full object-cover" onError={() => setImgPreview(null)} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <span className="text-sm">Rasm tanlansa, bu yerda ko'rinadi</span>
                </div>
              )}
              {(form.title || form.subtitle) && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-4">
                  {form.title && <p className="text-base font-semibold text-white drop-shadow">{form.title}</p>}
                  {form.subtitle && <p className="text-xs text-white/85 drop-shadow">{form.subtitle}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-7 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default AdsTable;