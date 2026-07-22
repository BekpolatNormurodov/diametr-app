import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { useEffect, useRef, useState } from "react";
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

export interface ProductItemRowProps {
  id: number;
  name?: string;
  desc?: string;
  image?: string;
  color?: string;
  size?: string;
  value?: number | null;
  unit_type?: { id: number; name: string; name_uz?: string | null; name_ru?: string | null; symbol: string } | null;
  product?: { id: number; name_uz?: string; name_ru?: string; name?: string } | null;
  product_id?: number;
  _count?: { shop_products?: number };
  createdt?: string;
  createdAt?: string;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];
const emptyForm = { name: "", desc: "", color: "", size: "", value: "", unit_type_id: "", product_id: "" };

export default function ProductItemsTable({
  data,
  onRefetch,
  unitTypes = [],
  products = [],
}: {
  data: ProductItemRowProps[];
  onRefetch?: () => void;
  unitTypes: { value: string; label: string; symbol?: string }[];
  products: { value: string; label: string }[];
}) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<ProductItemRowProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const imgKey = useRef(0);
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  const selectedUnitType = unitTypes.find((u) => u.value === form.unit_type_id);
  const selectedUnitSymbol = selectedUnitType?.symbol ?? "";
  const isDimensionUnit = selectedUnitSymbol === "x*y" || selectedUnitSymbol === "x*y*z";
  const selectedSizePlaceholder = selectedUnitSymbol === "x*y"
    ? "120x60, 50x30 ..."
    : selectedUnitSymbol === "x*y*z"
      ? "120x60x30, 2x2x2 ..."
      : "120x80, XL, 50x50 sm...";
  const selectedSizeLabel = isDimensionUnit ? "O'lcham (majburiy)" : "O'lcham (ixtiyoriy)";
  const selectedValueLabel = isDimensionUnit ? "Qiymat (miqdor, ixtiyoriy)" : "Qiymat (miqdor)";

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === ""
    ? tableData
    : tableData.filter((s) => {
        const q = search.toLowerCase();
        return (
          (s.name ?? "").toLowerCase().includes(q) ||
          (s.product?.name_uz ?? "").toLowerCase().includes(q) ||
          (s.color ?? "").toLowerCase().includes(q) ||
          (s.size ?? "").toLowerCase().includes(q)
        );
      });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: ProductItemRowProps) => {
    setEditItem(item);
    setForm({
      name: item.name ?? "",
      desc: item.desc ?? "",
      color: item.color ?? "",
      size: item.size ?? "",
      value: item.value != null ? String(item.value) : "",
      unit_type_id: item.unit_type?.id ? String(item.unit_type.id) : "",
      product_id: item.product?.id ? String(item.product.id) : (item.product_id ? String(item.product_id) : ""),
    });
    imageResultRef.current = null;
    imgKey.current++;
    openModal();
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Variant nomi kiritish shart"); return; }
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
      const payload: any = {
        name: form.name,
        desc: form.desc || undefined,
        color: form.color || undefined,
        size: form.size || undefined,
        value: isDimensionUnit ? undefined : form.value ? Number(form.value) : undefined,
        unit_type_id: form.unit_type_id ? Number(form.unit_type_id) : undefined,
        product_id: form.product_id ? Number(form.product_id) : undefined,
      };
      if (imageFilename) payload.image = imageFilename;
      if (editItem) {
        await axiosClient.put(`/product-item/${editItem.id}`, payload);
        toast.success("Variant yangilandi");
      }
      onRefetch?.();
      closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/product-item/${id}`);
      toast.success("Variant o'chirildi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((p) => ({
      ID: p.id,
      "Variant nomi": p.name ?? "",
      "Mahsulot": p.product?.name_uz ?? "",
      "O'lchov": p.unit_type?.symbol ?? "",
      "Qiymat": p.value ?? "",
      "Rang": p.color ?? "",
      "O'lcham": p.size ?? "",
      "Yaratilgan": Moment(p.createdt ?? p.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProductItems");
    XLSX.writeFile(wb, `product-items-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

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
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Variant nomi</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Mahsulot</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">O'lchov</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rang</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">O'lcham</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Do'konlar</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-4 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {(currentPage - 1) * +optionValue + idx + 1}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {item.image
                    ? <img src={`${staticUrl}/static/product-items/${item.image}`} alt={item.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg></div>
                  }
                </TableCell>
                <TableCell className="px-4 py-4 font-medium text-gray-800 dark:text-white">{item.name ?? "-"}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{item.product?.name_uz ?? item.product?.name ?? "-"}</TableCell>
                <TableCell className="px-4 py-4">
                  {item.unit_type
                    ? <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{item.value ?? ""}</span>
                        <span className="text-brand-600 dark:text-brand-400 font-medium">{item.unit_type.symbol}</span>
                      </span>
                    : <span className="text-gray-400 text-xs">-</span>
                  }
                </TableCell>
                <TableCell className="px-4 py-4">
                  {item.color
                    ? <span className="inline-flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full border-2 border-gray-200 dark:border-white/10 shadow-sm flex-shrink-0 ring-2 ring-white dark:ring-gray-900"
                          style={{ background: item.color.startsWith('#') ? item.color : '#94a3b8' }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.color}</span>
                      </span>
                    : <span className="text-gray-400 text-xs">-</span>
                  }
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{item.size ?? "-"}</TableCell>
                <TableCell className="px-4 py-4 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    (item._count?.shop_products ?? 0) > 0
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}>
                    {item._count?.shop_products ?? 0} ta
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}
                </TableCell>
                <TableCell className="px-4 py-4">
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
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Variantni tahrirlash</h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-2">
            <div>
              <Label>Variant nomi *</Label>
              <Input type="text" placeholder="Masalan: Qizil 1.5L" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Mahsulot</Label>
              <Select options={products} value={form.product_id} onChange={(v) => setForm({ ...form, product_id: v })} placeholder="Mahsulot tanlang" />
            </div>
            <div>
              <Label>O'lchov birligi</Label>
              <Select options={unitTypes} value={form.unit_type_id} onChange={(v) => setForm({ ...form, unit_type_id: v })} placeholder="kg, L, m..." />
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
              <ImageField key={imgKey.current} label="Rasm (ixtiyoriy)" onChange={(r) => { imageResultRef.current = r; }} />
            </div>
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
