import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import Button from "../ui/button/Button";
import { PlusIcon, DownloadIcon } from "../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import { formatMoney } from "../../service/formatters/money.format";
import Moment from "moment";
import * as XLSX from "xlsx";

export interface PromoCodeItemProps {
  id: number;
  code: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  shop_id?: number;
  createdt?: string;
  createdAt?: string;
}

const discountTypeOptions = [
  { value: "PERCENT", label: "Foiz (%)" },
  { value: "FIXED",   label: "Belgilangan summa" },
];
const emptyForm = {
  code: "",
  discount_type: "PERCENT",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

export default function PromoCodesTable({
  data,
  onRefetch,
}: {
  data: PromoCodeItemProps[];
  onRefetch: () => void;
}) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<PromoCodeItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === ""
    ? tableData
    : tableData.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()));

  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const startIndex = (currentPage - 1) * +optionValue;
  const currentItems = filteredData.sort((a: any, b: any) => b.id - a.id).slice(startIndex, startIndex + +optionValue);

  const openEdit = (item: PromoCodeItemProps) => {
    setEditItem(item);
    setForm({
      code: item.code,
      discount_type: item.discount_type,
      discount_value: String(item.discount_value),
      min_order_amount: item.min_order_amount ? String(item.min_order_amount) : "",
      max_uses: item.max_uses ? String(item.max_uses) : "",
      expires_at: item.expires_at ? item.expires_at.split("T")[0] : "",
    });
    openModal();
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    openModal();
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Kod va chegirma miqdorini kiriting");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        expires_at: form.expires_at || undefined,
      };

      if (editItem) {
        await axiosClient.patch(`/promo-code/${editItem.id}`, payload);
        toast.success("Promo kod yangilandi");
      } else {
        await axiosClient.post("/promo-code", payload);
        toast.success("Promo kod yaratildi");
      }
      onRefetch();
      closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/promo-code/${id}`);
      toast.success("O'chirildi");
      onRefetch();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleToggle = async (item: PromoCodeItemProps) => {
    try {
      await axiosClient.patch(`/promo-code/${item.id}`, { is_active: !item.is_active });
      toast.success(item.is_active ? "O'chirildi" : "Yoqildi");
      onRefetch();
    } catch {
      toast.error("Xatolik");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((p) => ({
        Kod: p.code,
        "Chegirma turi": p.discount_type === "PERCENT" ? "Foiz" : "Summa",
        "Chegirma miqdori": p.discount_type === "PERCENT" ? `${p.discount_value}%` : `${formatMoney(p.discount_value)} so'm`,
        "Min buyurtma": p.min_order_amount ? `${formatMoney(p.min_order_amount)} so'm` : "—",
        "Maks foydalanish": p.max_uses ?? "Cheksiz",
        Foydalanilgan: p.used_count,
        Holati: p.is_active ? "Faol" : "Nofaol",
        Muddat: p.expires_at ? Moment(p.expires_at).format("DD.MM.YYYY") : "Cheksiz",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PromoCodes");
    XLSX.writeFile(wb, `promo-codes-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Kod qidirish..."
          showValue={optionValue}
          onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }}
          onExport={handleExport}
          action={
            <Button size="sm" variant="primary" startIcon={<PlusIcon className="size-4 fill-white" />} onClick={openAdd}>
              Qo'shish
            </Button>
          }
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Kod</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Chegirma</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Ishlatildi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Muddat</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Holat</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">Promo kodlar yo'q</TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {startIndex + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/[0.08] font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.code}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {item.discount_type === "PERCENT"
                    ? `${item.discount_value}%`
                    : `${formatMoney(item.discount_value)} so'm`}
                  {item.min_order_amount && (
                    <span className="block text-xs font-normal text-gray-400">
                      Min: {formatMoney(item.min_order_amount)} so'm
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.used_count} / {item.max_uses ?? "∞"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.expires_at ? Moment(item.expires_at).format("DD.MM.YYYY") : "Cheksiz"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      item.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {item.is_active ? "Faol" : "Nofaol"}
                  </button>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredData.length} ta promo kod</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[520px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
              {editItem ? "Promo kodni tahrirlash" : "Yangi promo kod"}
            </h4>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <Label>Kod <span className="text-error-500">*</span></Label>
              <Input type="text" placeholder="SUMMER20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Chegirma turi</Label>
              <Select options={discountTypeOptions} defaultValue={form.discount_type} onChange={(v) => setForm({ ...form, discount_type: v })} />
            </div>
            <div>
              <Label>Chegirma miqdori <span className="text-error-500">*</span></Label>
              <Input
                type="number"
                placeholder={form.discount_type === "PERCENT" ? "20" : "10000"}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />
            </div>
            <div>
              <Label>Minimal buyurtma summasi (so'm)</Label>
              <Input type="number" placeholder="Ixtiyoriy" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
            </div>
            <div>
              <Label>Maksimal foydalanish soni</Label>
              <Input type="number" placeholder="Cheksiz" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
            </div>
            <div>
              <Label>Tugash sanasi</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
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
