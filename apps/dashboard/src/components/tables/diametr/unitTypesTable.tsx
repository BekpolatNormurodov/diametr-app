import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import TranslateButton from "../../common/TranslateButton";
import * as XLSX from "xlsx";

export interface UnitTypeItemProps {
  id: number;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  symbol: string;
  createdAt?: string;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];
const emptyForm = { name_uz: "", name_ru: "", symbol: "" };

export default function UnitTypesTable({ data, onRefetch }: { data: UnitTypeItemProps[]; onRefetch?: () => void }) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<UnitTypeItemProps | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("20");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === ""
    ? tableData
    : tableData.filter((s) => {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q)
          || (s.name_uz ?? "").toLowerCase().includes(q)
          || (s.name_ru ?? "").toLowerCase().includes(q)
          || s.symbol.toLowerCase().includes(q);
      });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const openEdit = (item: UnitTypeItemProps) => {
    setEditItem(item);
    setForm({
      name_uz: item.name_uz ?? item.name ?? "",
      name_ru: item.name_ru ?? "",
      symbol: item.symbol,
    });
    openModal();
  };

  const handleSave = async () => {
    if (!form.name_uz.trim() || !form.symbol.trim()) {
      toast.error("Nom va belgi kiritish shart");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await axiosClient.put(`/unit-type/${editItem.id}`, { ...form, name: form.name_uz });
        toast.success("O'lchov birligi yangilandi");
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
      await axiosClient.delete(`/unit-type/${id}`);
      toast.success("O'lchov birligi o'chirildi");
      onRefetch?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((u) => ({
      ID: u.id,
      "Nomi (UZ)": u.name_uz ?? u.name,
      "Nomi (RU)": u.name_ru ?? "",
      "Belgi": u.symbol,
      "Yaratilgan": Moment(u.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "UnitTypes");
    XLSX.writeFile(wb, `unit-types-${Moment().format("YYYY-MM-DD")}.xlsx`);
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
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (UZ)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi (RU)</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Belgi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Yaratilgan</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {(currentPage - 1) * +optionValue + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.name_uz ?? item.name}</TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.name_ru ?? "—"}</TableCell>
                <TableCell className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                    {item.symbol}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Moment(item.createdAt).format("DD.MM.YYYY")}
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
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage(p => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14 mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">O'lchov birligini tahrirlash</h4>
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
              <Input
                type="text"
                placeholder="Kilogramm"
                value={form.name_uz}
                onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
              />
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
              <Input
                type="text"
                placeholder="Килограмм"
                value={form.name_ru}
                onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
              />
            </div>
            <div>
              <Label>Belgi (masalan: kg)</Label>
              <Input
                type="text"
                placeholder="kg"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
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
