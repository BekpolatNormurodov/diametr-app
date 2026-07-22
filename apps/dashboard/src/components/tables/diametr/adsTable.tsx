import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../ui/table";
import Moment from "moment";
import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { DeleteIcon, EditIcon, DownloadIcon } from "../../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";

export interface AdItemProps {
  id: number;
  title: string;
  subtitle?: string;
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
const emptyForm = { title: "", subtitle: "", expired: "", type: "SHOP" };

export default function AdsTable({ data, onRefetch }: { data: AdItemProps[]; onRefetch: () => void }) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<AdItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.title ?? "").toLowerCase().includes(q) || (s.subtitle ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: AdItemProps) => {
    setEditItem(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? "",
      expired: item.expired ? item.expired.split("T")[0] : "",
      type: item.type ?? "SHOP",
    });
    openModal();
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Sarlavha kiritish shart"); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, subtitle: form.subtitle, expired: form.expired, type: form.type };
      if (editItem) {
        await axiosClient.put(`/ad/${editItem.id}`, payload);
        toast.success("Reklama yangilandi");
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
      "Yaratilgan": Moment(a.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ads");
    XLSX.writeFile(wb, `ads-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  const shopName = (s: any) => typeof s === "object" && s ? s.name : (s ?? "-");

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

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{editItem ? "Reklamani tahrirlash" : "Reklama qo'shish"}</h4>
          </div>
          <div className="flex flex-col gap-4 px-2">
            <div>
              <Label>Sarlavha</Label>
              <Input type="text" placeholder="Reklama sarlavhasi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Input type="text" placeholder="Qisqacha tavsif" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Muddat</Label>
              <Input type="date" value={form.expired} onChange={(e) => setForm({ ...form, expired: e.target.value })} />
            </div>
            <div>
              <Label>Tur</Label>
              <Select options={typeOptions} defaultValue={form.type} onChange={(v) => setForm({ ...form, type: v })} />
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