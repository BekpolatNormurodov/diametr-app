import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
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

export interface RegionItemProps {
  id: number;
  name?: string;
  createdt?: string; createdAt?: string;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];

export default function RegionsTable({ data, onRefetch }: { data: RegionItemProps[]; onRefetch?: () => void }) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<RegionItemProps | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.name ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: RegionItemProps) => {
    setEditItem(item);
    setFormName(item.name ?? "");
    openModal();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await axiosClient.put(`/region/${editItem.id}`, { name: formName });
        toast.success("Region yangilandi");
      }
      onRefetch?.(); closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/region/${id}`);
      toast.success("Region o'chirildi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((r) => ({ ID: r.id, Nomi: r.name ?? "", Yaratilgan: Moment(r.createdAt).format("DD.MM.YYYY") })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Regions");
    XLSX.writeFile(wb, `regions-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar search={search} onSearch={(v) => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Qidirish..." showValue={optionValue} onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }} onExport={handleExport} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Region nomi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell></TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.name ?? "-"}</TableCell>
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Regionni tahrirlash</h4>
          </div>
          <div className="px-2">
            <Label>Region nomi</Label>
            <Input type="text" placeholder="Region nomi" value={formName} onChange={(e) => setFormName(e.target.value)} />
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