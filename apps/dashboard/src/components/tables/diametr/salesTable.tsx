import TableToolbar from "./TableToolbar";
import { ConfirmDeleteModal } from "./TableActions";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Button from "../../ui/button/Button";
import { DeleteIcon } from "../../../icons";
import { useEffect, useState } from "react";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";

export interface SaleItemProps {
  id: number;
  status?: string;
  amount?: number;
  address?: string;
  phone?: string;
  payment_type?: string;
  shop?: { id: number; name?: string };
  user?: { id: number; phone?: string; fullname?: string };
  createdt?: string;
  createdAt?: string;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];

const statusConfig: Record<string, { label: string; className: string }> = {
  STARTED:   { label: "Yangi",         className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMED: { label: "Tasdiqlangan",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  FINISHED:  { label: "Bajarilgan",    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CANCELED:  { label: "Bekor qilingan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function SalesTable({ data, onRefetch }: { data: SaleItemProps[]; onRefetch?: () => void }) {
  const [tableData, setTableData] = useState(data);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.address ?? "").toLowerCase().includes(q) || (s.phone ?? "").toLowerCase().includes(q) || (s.user?.fullname ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const doAction = async (id: number, action: "confirm" | "cancel" | "finish") => {
    setLoadingId(id);
    try {
      await axiosClient.put(`/order/${action}/${id}`);
      const label = action === "confirm" ? "Tasdiqlandi" : action === "cancel" ? "Bekor qilindi" : "Bajarildi";
      toast.success(label);
      onRefetch?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setLoadingId(null); }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/order/${id}`);
      toast.success("Buyurtma o'chirildi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((o) => ({
      ID: o.id, "Do'kon": o.shop?.name ?? "", Mijoz: o.user?.fullname ?? o.user?.phone ?? "",
      Telefon: o.phone ?? o.user?.phone ?? "", Manzil: o.address ?? "",
      Summa: (o.amount ?? 0).toLocaleString(),
      Status: statusConfig[o.status ?? ""]?.label ?? o.status ?? "",
      Sana: Moment(o.createdAt).format("DD.MM.YYYY HH:mm"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar search={search} onSearch={(v) => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Qidirish..." showValue={optionValue} onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }} onExport={handleExport} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Do'kon</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Mijoz</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Summa</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sana</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-400">Buyurtmalar yo'q</TableCell></TableRow>
            ) : currentItems.map((item, idx) => {
              const cfg = statusConfig[item.status ?? ""] ?? { label: item.status ?? "-", className: "bg-gray-100 text-gray-600" };
              const busy = loadingId === item.id;
              return (
                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">{item.shop?.name ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.user?.fullname ?? item.user?.phone ?? item.phone ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                    {item.amount != null ? `${item.amount.toLocaleString()} so'm` : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY HH:mm")}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.status === "STARTED" && (
                        <button
                          disabled={busy}
                          onClick={() => doAction(item.id, "confirm")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                            bg-blue-500/10 text-blue-600 dark:text-blue-400
                            hover:bg-blue-500/20 disabled:opacity-40 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {busy ? "..." : "Tasdiqlash"}
                        </button>
                      )}
                      {(item.status === "STARTED" || item.status === "CONFIRMED") && (
                        <button
                          disabled={busy}
                          onClick={() => doAction(item.id, "finish")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                            bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                            hover:bg-emerald-500/20 disabled:opacity-40 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          {busy ? "..." : "Yakunlash"}
                        </button>
                      )}
                      {(item.status === "STARTED" || item.status === "CONFIRMED") && (
                        <button
                          disabled={busy}
                          onClick={() => doAction(item.id, "cancel")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                            bg-red-500/10 text-red-600 dark:text-red-400
                            hover:bg-red-500/20 disabled:opacity-40 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          {busy ? "..." : "Bekor"}
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(item.id)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                          text-gray-400 hover:text-red-500 hover:bg-red-500/10
                          dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10
                          transition-all"
                      >
                        <DeleteIcon className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredData.length} ta ichidan {Math.min((currentPage-1)*+optionValue+1,filteredData.length)}–{Math.min(currentPage*+optionValue,filteredData.length)} ko'rsatilmoqda</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage>=maxPage} onClick={()=>setCurrentPage(p=>p+1)}>Keyingi</Button>
          </div>
        </div>
      </div>
      {confirmId !== null && (
        <ConfirmDeleteModal
          title="Buyurtmani o'chirasizmi?"
          desc="Bu amalni qaytarib bo'lmaydi."
          onConfirm={() => { handleDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}