import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { DeleteIcon, EditIcon, DownloadIcon } from "../../../icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";
import ImageField, { ImageFieldResult } from "../../common/ImageField";
import TranslateButton from "../../common/TranslateButton";

export interface CategoryItemProps {
  id: number;
  name?: string;
  name_uz?: string;
  name_ru?: string;
  image?: string;
  createdt?: string; createdAt?: string;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];
const emptyForm = { name_uz: "", name_ru: "" };

export default function CategorysTable({ data, onRefetch }: { data: CategoryItemProps[]; onRefetch?: () => void }) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<CategoryItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const imgKey = useRef(0);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.name ?? "").toLowerCase().includes(q) || (s.name_uz ?? "").toLowerCase().includes(q) || (s.name_ru ?? "").toLowerCase().includes(q); });
  const maxPage = Math.max(1, Math.ceil(filteredData.length / +optionValue));
  const safePage = Math.min(currentPage, maxPage);
  const currentItems = filteredData.slice((safePage - 1) * +optionValue, safePage * +optionValue);

  // Numbered pagination — matches productsTable style
  const pageNumbers = (() => {
    const pages: (number | "...")[] = [];
    const total = maxPage;
    const cur = safePage;
    const window = 1;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= cur - window && i <= cur + window)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  })();

  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  const openEdit = (item: CategoryItemProps) => {
    setEditItem(item);
    setForm({ name_uz: item.name_uz ?? item.name ?? "", name_ru: item.name_ru ?? "" });
    imageResultRef.current = null;
    imgKey.current++;
    openModal();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageFilename: string | undefined;
      const imgResult = imageResultRef.current;
      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/category/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageFilename = res.data?.data?.image ?? res.data?.image;
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/category/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }
      const payload: any = { name_uz: form.name_uz, name_ru: form.name_ru };
      if (imageFilename) payload.image = imageFilename;
      if (editItem) {
        await axiosClient.put(`/category/${editItem.id}`, payload);
        toast.success("Kategoriya yangilandi");
      }
      onRefetch?.(); closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/category/${id}`);
      toast.success("Kategoriya o'chirildi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((c) => ({
      ID: c.id, "Nomi (UZ)": c.name_uz ?? c.name ?? "", "Nomi (RU)": c.name_ru ?? "",
      "Yaratilgan": Moment(c.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, `categories-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar search={search} onSearch={(v) => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Qidirish..." showValue={optionValue} onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }} onExport={handleExport} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (UZ)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (RU)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell></TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(safePage - 1) * +optionValue + idx + 1}</TableCell>
                <TableCell className="px-5 py-4">
                  {item.image ? (
                    <img src={`${staticUrl}/static/categories/${item.image}`} alt={item.name_uz} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='text-gray-400 dark:text-gray-600'><rect x='3' y='3' width='18' height='18' rx='4' /><circle cx='9' cy='9' r='2' /><path d='m21 15-5-5L5 21'/></svg></div>}
                </TableCell>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.name_uz ?? item.name ?? "-"}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.name_ru ?? "-"}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}</TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex flex-wrap gap-3 justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredData.length} ta ichidan {Math.min((safePage - 1) * +optionValue + 1, filteredData.length)}–{Math.min(safePage * +optionValue, filteredData.length)} ko'rsatilmoqda
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Birinchi"
            >«</button>
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    safePage === p
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={safePage >= maxPage}
              onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Keyingi"
            >›</button>
            <button
              disabled={safePage >= maxPage}
              onClick={() => setCurrentPage(maxPage)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Oxirgi"
            >»</button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Kategoriyani tahrirlash</h4>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Nomi (O'zbek)</Label>
                <TranslateButton
                  source={form.name_ru}
                  direction="ru->uz"
                  onResult={(t) => setForm({ ...form, name_uz: t })}
                />
              </div>
              <Input type="text" placeholder="Uzbekcha nomi" value={form.name_uz} onChange={(e) => setForm({ ...form, name_uz: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Nomi (Ruscha)</Label>
                <TranslateButton
                  source={form.name_uz}
                  direction="uz->ru"
                  onResult={(t) => setForm({ ...form, name_ru: t })}
                />
              </div>
              <Input type="text" placeholder="Ruscha nomi" value={form.name_ru} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} />
            </div>
            <ImageField key={imgKey.current} label="Rasm (ixtiyoriy)" onChange={(r) => { imageResultRef.current = r; }} />
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}