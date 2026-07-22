import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Moment from "moment";
import Button from "../ui/button/Button";
import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import * as XLSX from "xlsx";

export interface WorkerItemProps {
  id: number;
  fullname?: string;
  phone?: string;
  image?: string;
  expired?: string;
  shop_id?: number;
  shop?: { id: number; name?: string };
  service?: { id: number; name?: string };
  serviceId?: number;
  createdt?: string;
  createdAt?: string;
}

const emptyForm = { fullname: "", phone: "", expired: "" };

export default function WorkersTable({
  data,
  onRefetch,
}: {
  data: WorkerItemProps[];
  onRefetch?: () => void;
}) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<WorkerItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === ""
    ? tableData
    : tableData.filter((s) => {
        const q = search.toLowerCase();
        return (
          (s.fullname ?? "").toLowerCase().includes(q) ||
          (s.phone ?? "").toLowerCase().includes(q)
        );
      });

  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.sort((a: any, b: any) => b.id - a.id).slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: WorkerItemProps) => {
    setEditItem(item);
    setForm({
      fullname: item.fullname ?? "",
      phone: item.phone ?? "",
      expired: item.expired ? Moment(item.expired).format("YYYY-MM-DD") : "",
    });
    openModal();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { fullname: form.fullname, phone: form.phone };
      if (form.expired) payload.expired = form.expired;
      if (editItem) {
        await axiosClient.put(`/worker/${editItem.id}`, payload);
        toast.success("Xodim yangilandi");
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
      await axiosClient.delete(`/worker/${id}`);
      toast.success("Xodim o'chirildi");
      onRefetch?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((w) => ({
        ID: w.id,
        "To'liq ismi": w.fullname ?? "",
        Telefon: w.phone ?? "",
        Xizmat: w.service?.name ?? "",
        Muddati: w.expired ? Moment(w.expired).format("DD.MM.YYYY") : "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workers");
    XLSX.writeFile(wb, `workers-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Xodim qidirish..."
          showValue={optionValue}
          onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }}
          onExport={handleExport}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">To'liq ismi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Telefon</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Xizmat</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Muddati</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                  Xodimlar yo'q
                </TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {(currentPage - 1) * +optionValue + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-4">
                  {item.image ? (
                    <img
                      src={`${staticUrl}/${item.image}`}
                      alt={item.fullname}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-500">
                      {item.fullname?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.fullname ?? "-"}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.phone ?? "-"}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.service?.name ?? "-"}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {item.expired ? Moment(item.expired).format("DD.MM.YYYY") : "-"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredData.length} ta xodim</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Xodimni tahrirlash</h4>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <Label>To'liq ismi</Label>
              <Input type="text" placeholder="To'liq ismi" value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input type="text" placeholder="+998 XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Muddati</Label>
              <Input type="date" value={form.expired} onChange={(e) => setForm({ ...form, expired: e.target.value })} />
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
