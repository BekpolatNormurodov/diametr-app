import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Moment from "moment";
import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import {
  CopyIcon,
  DeleteIcon,
  EditIcon,
  DownloadIcon,
  PlusIcon,
} from "../../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import { formatMoney } from "../../../service/formatters/money.format";
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
  createdt?: string; createdAt?: string;
}

const options = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];

const discountTypeOptions = [
  { value: "PERCENT", label: "Foiz (%)" },
  { value: "FIXED", label: "Belgilangan summa" },
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

  useEffect(() => {
    setTableData(data);
    setCurrentPage(1);
  }, [data]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.code ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const startIndex = (currentPage - 1) * +optionValue;
  const currentItems = filteredData.slice(startIndex, startIndex + +optionValue);

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
    setSaving(true);
    try {
      const payload = {
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
      await axiosClient.patch(`/promo-code/${item.id}`, {
        is_active: !item.is_active,
      });
      toast.success(item.is_active ? "O'chirildi" : "Yoqildi");
      onRefetch();
    } catch {
      toast.error("Xatolik");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((p) => ({
        ID: p.id,
        Kod: p.code,
        "Chegirma turi": p.discount_type,
        "Chegirma miqdori": p.discount_value,
        "Min buyurtma": p.min_order_amount ?? "",
        "Maks foydalanish": p.max_uses ?? "Cheksiz",
        "Foydalanilgan": p.used_count,
        Holati: p.is_active ? "Faol" : "Nofaol",
        "Muddat": p.expires_at ? Moment(p.expires_at).format("DD.MM.YYYY") : "Cheksiz",
        "Yaratilgan": Moment(p.createdAt).format("DD.MM.YYYY HH:mm"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PromoCodes");
    XLSX.writeFile(wb, `promo-codes-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="px-5 py-3 flex flex-row justify-between items-center border-b border-gray-100 dark:border-white/[0.05]">
          <div className="flex flex-row items-center gap-2 text-theme-sm font-medium text-gray-500 dark:text-gray-400">
            <span>Ko'rsatish</span>
            <Select
              options={options}
              onChange={setOptionValue}
              className="dark:bg-dark-900"
              defaultValue="10"
            />
            <span>ta</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" startIcon={<PlusIcon className="size-4 fill-white" />} onClick={openAdd}>
              Qo'shish
            </Button>
            <Button size="sm" variant="outline" endIcon={<DownloadIcon className="size-4" />} onClick={handleExport}>
              Excel
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {["ID", "Kod", "Turi", "Chegirma", "Foydalanish", "Holati", "Muddat", "Yaratilgan", ""].map((h) => (
                <TableCell key={h} isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{p.id}</TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <code className="font-bold text-gray-800 dark:text-white/90 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-sm">
                      {p.code}
                    </code>
                    <button
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => { navigator.clipboard.writeText(p.code); toast.info("Nusxalandi"); }}
                    >
                      <CopyIcon className="size-4" />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                  {p.discount_type === "PERCENT" ? "Foiz" : "Belgilangan"}
                </TableCell>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90 text-theme-sm">
                  {p.discount_type === "PERCENT" ? `${p.discount_value}%` : formatMoney(p.discount_value)}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                  {p.used_count} / {p.max_uses ?? "∞"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <button onClick={() => handleToggle(p)}>
                    <Badge color={p.is_active ? "success" : "error"}>
                      {p.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                  {p.expires_at ? Moment(p.expires_at).format("DD.MM.YYYY") : "∞"}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                  {Moment(p.createdAt).format("DD.MM.YYYY HH:mm")}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions onEdit={() => openEdit(p)} onDelete={() => handleDelete(p.id)} />
                </TableCell>
              </TableRow>
            ))}
            {currentItems.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-gray-400 dark:text-gray-600" colSpan={9}>
                  Ma'lumot topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Pagination */}
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-theme-sm text-gray-500 dark:text-gray-400">
            {startIndex + 1}–{Math.min(startIndex + +optionValue, tableData.length)} / {tableData.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              ←
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(p + 1, maxPage))} disabled={currentPage === maxPage || maxPage === 0}>
              →
            </Button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[560px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <h4 className="mb-5 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editItem ? "Promo kodni tahrirlash" : "Yangi promo kod"}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Kod *</Label>
              <Input
                type="text"
                placeholder="Masalan: SUMMER20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Chegirma turi *</Label>
              <Select
                options={discountTypeOptions}
                defaultValue={form.discount_type}
                onChange={(v) => setForm({ ...form, discount_type: v })}
              />
            </div>
            <div>
              <Label>Chegirma miqdori *</Label>
              <Input
                type="number"
                placeholder={form.discount_type === "PERCENT" ? "20" : "50000"}
                value={form.discount_value}
                min="0"
                max={form.discount_type === "PERCENT" ? "100" : undefined}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />
            </div>
            <div>
              <Label>Min buyurtma summasi</Label>
              <Input
                type="number"
                placeholder="100000"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Maks foydalanish soni</Label>
              <Input
                type="number"
                placeholder="Cheksiz"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Amal qilish muddati</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>Bekor qilish</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.code || !form.discount_value}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
