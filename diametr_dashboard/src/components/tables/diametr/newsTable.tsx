import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import DateField from "../../form/DateField";
import ImageField, { ImageFieldResult } from "../../common/ImageField";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";

export interface NewsItemProps {
  id: number;
  title?: string;
  subtitle?: string;
  title_ru?: string;
  subtitle_ru?: string;
  image?: string;
  expired?: string;
  createdt?: string; createdAt?: string;
}

export interface NewsTableHandle {
  openCreate: () => void;
}

const emptyForm = { title: "", subtitle: "", title_ru: "", subtitle_ru: "", expired: "" };

const NewsTable = forwardRef<NewsTableHandle, { data: NewsItemProps[]; onRefetch?: () => void }>(
  function NewsTable({ data, onRefetch }, ref) {
    const [tableData, setTableData] = useState(data);
    const { isOpen, openModal, closeModal } = useModal();
    const [editItem, setEditItem] = useState<NewsItemProps | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [optionValue, setOptionValue] = useState("10");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const imageResultRef = useRef<ImageFieldResult | null>(null);
    const imgKey = useRef(0);
    const [imgPreview, setImgPreview] = useState<string | null>(null);
    const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

    useEffect(() => { setTableData(data); }, [data]);
    useEffect(() => { setCurrentPage(1); }, [optionValue]);

    const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.title ?? "").toLowerCase().includes(q) || (s.subtitle ?? "").toLowerCase().includes(q); });
    const maxPage = Math.ceil(filteredData.length / +optionValue);
    const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

    const openCreate = () => {
      setEditItem(null);
      setForm({ ...emptyForm });
      imageResultRef.current = null;
      imgKey.current += 1;
      setImgPreview(null);
      openModal();
    };

    useImperativeHandle(ref, () => ({ openCreate }));

    const openEdit = (item: NewsItemProps) => {
      setEditItem(item);
      setForm({
        title: item.title ?? "",
        subtitle: item.subtitle ?? "",
        title_ru: item.title_ru ?? "",
        subtitle_ru: item.subtitle_ru ?? "",
        expired: item.expired ? Moment(item.expired).format("YYYY-MM-DD") : "",
      });
      imageResultRef.current = null;
      imgKey.current += 1;
      setImgPreview(item.image ? `${staticUrl}/static/news/${item.image}` : null);
      openModal();
    };

    const handleSave = async () => {
      if (!form.title || !form.subtitle || !form.expired) {
        toast.error("Sarlavha, tavsif va muddat kiritish shart");
        return;
      }
      setSaving(true);
      try {
        // Upload a freshly picked image first, then send its filename.
        let imageFilename: string | undefined;
        const imgResult = imageResultRef.current;
        if (imgResult?.mode === "upload" && imgResult.file) {
          const fd = new FormData();
          fd.append("image", imgResult.file);
          const res = await axiosClient.post("/new/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
          imageFilename = res.data?.data?.image ?? res.data?.image;
        } else if (imgResult?.mode === "url" && imgResult.url) {
          imageFilename = imgResult.url;
        }
        const payload: any = { title: form.title, subtitle: form.subtitle, expired: form.expired };
        if (form.title_ru) payload.title_ru = form.title_ru;
        if (form.subtitle_ru) payload.subtitle_ru = form.subtitle_ru;
        if (imageFilename) payload.image = imageFilename;

        if (editItem) {
          await axiosClient.put(`/new/${editItem.id}`, payload);
          toast.success("Yangilik yangilandi");
        } else {
          await axiosClient.post(`/new`, payload);
          toast.success("Yangilik qo'shildi");
        }
        onRefetch?.(); closeModal();
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
      } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
      try {
        await axiosClient.delete(`/new/${id}`);
        toast.success("Yangilik o'chirildi");
        onRefetch?.();
      } catch { toast.error("Xatolik yuz berdi"); }
    };

    const handleExport = () => {
      const ws = XLSX.utils.json_to_sheet(tableData.map((n) => ({
        ID: n.id, Sarlavha: n.title ?? "", Tavsif: n.subtitle ?? "",
        Muddati: n.expired ? Moment(n.expired).format("DD.MM.YYYY") : "",
        Yaratilgan: Moment(n.createdt ?? n.createdAt).format("DD.MM.YYYY"),
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "News");
      XLSX.writeFile(wb, `news-${Moment().format("YYYY-MM-DD")}.xlsx`);
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
                <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sarlavha</TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tavsif</TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Muddati</TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell></TableRow>
              ) : currentItems.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                  <TableCell className="px-5 py-4">
                    {item.image ? (
                      <img src={`${staticUrl}/static/news/${item.image}`} alt={item.title} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='text-gray-400 dark:text-gray-600'><rect x='3' y='3' width='18' height='18' rx='4' /><circle cx='9' cy='9' r='2' /><path d='m21 15-5-5L5 21'/></svg></div>}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white max-w-[200px] truncate">{item.title ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{item.subtitle ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.expired ? Moment(item.expired).format("DD.MM.YYYY") : "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}</TableCell>
                  <TableCell className="px-5 py-4">
                    <TableActions onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
            <span className="text-sm text-gray-500 dark:text-gray-400">{tableData.length} ta ichidan {Math.min((currentPage-1)*+optionValue+1,tableData.length)}–{Math.min(currentPage*+optionValue,tableData.length)} ko'rsatilmoqda</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)}>Oldingi</Button>
              <Button size="sm" variant="outline" disabled={currentPage>=maxPage} onClick={()=>setCurrentPage(p=>p+1)}>Keyingi</Button>
            </div>
          </div>
        </div>

        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[640px] m-4">
          <div className="relative w-full max-h-[85vh] p-5 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
            <div className="pr-14 mb-6">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{editItem ? "Yangilikni tahrirlash" : "Yangilik qo'shish"}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sarlavha, tavsif, muddat va rasm kiriting.</p>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <Label>Sarlavha (UZ)</Label>
                <Input type="text" placeholder="Yangilik sarlavhasi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Sarlavha (RU)</Label>
                <Input type="text" placeholder="Заголовок новости" value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} />
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
            </div>

            <div className="mt-4">
              <ImageField
                key={imgKey.current}
                label="Yangilik rasmi"
                allowUrl={false}
                existingUrl={editItem?.image ? `${staticUrl}/static/news/${editItem.image}` : undefined}
                onChange={(r) => { imageResultRef.current = r; setImgPreview(r.previewUrl ?? null); }}
              />
            </div>

            {/* Live preview */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Ko'rinishi</p>
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.03] aspect-[16/6]">
                {imgPreview ? (
                  <img src={imgPreview} alt="Rasm" className="absolute inset-0 h-full w-full object-cover" onError={() => setImgPreview(null)} />
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
  }
);

export default NewsTable;
