import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Moment from "moment";
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
import * as XLSX from "xlsx";

export interface PaymentItemProps {
  id: number;
  amount?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
  image?: string;
  shop_id?: number;
  shop?: { id: number; name?: string };
  createdt?: string;
  createdAt?: string;
}

const typeOptions = [
  { value: "CARD",   label: "Karta" },
  { value: "CASH",   label: "Naqd" },
  { value: "ONLINE", label: "Online" },
  { value: "SHOP",   label: "Do'kon to'lovi" },
];
const emptyForm = { amount: "", type: "SHOP", start_date: "", end_date: "" };

export default function PaymentsTable({
  data,
  onRefetch,
}: {
  data: PaymentItemProps[];
  onRefetch?: () => void;
}) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<PaymentItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const shopId = Number(localStorage.getItem("shop_id") ?? 0);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === ""
    ? tableData
    : tableData.filter((s) => (s.type ?? "").toLowerCase().includes(search.toLowerCase()));

  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.sort((a: any, b: any) => b.id - a.id).slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: PaymentItemProps) => {
    setEditItem(item);
    setForm({
      amount: item.amount != null ? String(item.amount) : "",
      type: item.type ?? "SHOP",
      start_date: item.start_date ? Moment(item.start_date).format("YYYY-MM-DD") : "",
      end_date: item.end_date ? Moment(item.end_date).format("YYYY-MM-DD") : "",
    });
    openModal();
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    openModal();
  };

  const handleSave = async () => {
    if (!form.amount) {
      toast.error("Summani kiriting");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        type: form.type,
        amount: Number(form.amount),
        shop_id: shopId,
      };
      if (form.start_date) payload.start_date = form.start_date;
      if (form.end_date) payload.end_date = form.end_date;

      if (editItem) {
        await axiosClient.put(`/payment/${editItem.id}`, payload);
        toast.success("To'lov yangilandi");
      } else {
        await axiosClient.post("/payment", payload);
        toast.success("To'lov qo'shildi");
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
      await axiosClient.delete(`/payment/${id}`);
      toast.success("To'lov o'chirildi");
      onRefetch?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((p) => ({
        ID: p.id,
        Summa: p.amount ?? 0,
        Turi: typeOptions.find((t) => t.value === p.type)?.label ?? p.type ?? "",
        Boshlanish: p.start_date ? Moment(p.start_date).format("DD.MM.YYYY") : "",
        Tugash: p.end_date ? Moment(p.end_date).format("DD.MM.YYYY") : "",
        Yaratilgan: Moment(p.createdAt).format("DD.MM.YYYY"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  const typeLabel = (t?: string) => typeOptions.find((o) => o.value === t)?.label ?? t ?? "-";
  const typeClass = (t?: string) =>
    t === "CASH"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : t === "ONLINE"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : t === "SHOP"
      ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";

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
            <Button size="sm" variant="primary" startIcon={<PlusIcon className="size-4 fill-white" />} onClick={openAdd}>
              To'lov qo'shish
            </Button>
          }
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Summa</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Turi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Boshlanish</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tugash</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sana</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">To'lovlar yo'q</TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {(currentPage - 1) * +optionValue + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                  {item.amount != null ? `${formatMoney(item.amount)} so'm` : "-"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeClass(item.type)}`}>
                    {typeLabel(item.type)}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.start_date ? Moment(item.start_date).format("DD.MM.YYYY") : "-"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.end_date ? Moment(item.end_date).format("DD.MM.YYYY") : "-"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Moment(item.createdAt ?? item.createdt).format("DD.MM.YYYY")}
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
            {filteredData.length} ta to'lov · Jami: {formatMoney(tableData.reduce((s, p) => s + (p.amount ?? 0), 0))} so'm
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
              {editItem ? "To'lovni tahrirlash" : "To'lov qo'shish"}
            </h4>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <Label>Summa <span className="text-error-500">*</span></Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>To'lov turi</Label>
              <Select options={typeOptions} defaultValue={form.type} onChange={(v) => setForm({ ...form, type: v })} />
            </div>
            <div>
              <Label>Boshlanish sanasi</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Tugash sanasi</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
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
