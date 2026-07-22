import TableActions from "./TableActions";
import TableToolbar from "./TableToolbar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Moment from "moment";
import Badge from "../../ui/badge/Badge";
import { useState } from "react";
import axiosClient from "../../../service/axios.service";
import { toast } from "../../ui/toast";
import * as XLSX from "xlsx";

export interface UserItemProps {
  id: number;
  fullname?: string;
  phone?: string;
  image?: string;
  role?: string;
  createdt?: string;
  createdAt?: string;
}

export default function UsersTable({
  data,
  onRefetch,
}: {
  data: UserItemProps[];
  onRefetch?: () => void;
}) {
  const [search, setSearch]     = useState("");
  const [showValue, setShowValue] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = search.trim()
    ? data.filter((u) =>
        [u.fullname, u.phone].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const pageSize = parseInt(showValue);
  const maxPage  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleShow   = (v: string) => { setShowValue(v); setCurrentPage(1); };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/user/${id}`);
      toast.success("Foydalanuvchi o'chirildi");
      onRefetch?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((u) => ({
        ID: u.id,
        "To'liq ism": u.fullname ?? "",
        Telefon: u.phone ?? "",
        Rol: u.role ?? "USER",
        Yaratilgan: Moment(u.createdt ?? u.createdAt).format("DD.MM.YYYY"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <TableToolbar
        search={search}
        onSearch={handleSearch}
        searchPlaceholder="Ism yoki telefon..."
        showValue={showValue}
        onShowChange={handleShow}
        onExport={handleExport}
      />
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Foydalanuvchi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Telefon</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rol</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sana</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-gray-400 dark:text-gray-500">
                  {search ? "Qidiruv natijasi topilmadi" : "Ma'lumot yo'q"}
                </TableCell>
              </TableRow>
            ) : current.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {(currentPage - 1) * pageSize + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={`${staticUrl}/${item.image}`}
                        alt={item.fullname}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold shadow-sm">
                        {(item.fullname ?? item.phone ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {item.fullname ?? <span className="text-gray-400 italic">Ism yo'q</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {item.phone ?? "-"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge color="info" size="sm">{item.role ?? "USER"}</Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY")}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions
                    onEdit={() => {}}
                    onDelete={() => handleDelete(item.id)}
                    editLabel="Ko'rish"
                    deleteLabel="O'chirish"
                    confirmTitle="Foydalanuvchini o'chirasizmi?"
                    confirmDesc="Barcha buyurtmalari bilan o'chib ketadi."
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 flex flex-wrap gap-2 justify-between items-center border-t border-gray-100 dark:border-white/[0.05]">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} ta ichidan {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)} ko'rsatilmoqda
        </span>
        <div className="flex gap-1.5">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400 transition-colors"
          >
            Oldingi
          </button>
          <span className="px-3 py-1.5 text-xs rounded-lg bg-brand-500 text-white font-medium">
            {currentPage} / {maxPage}
          </span>
          <button
            disabled={currentPage >= maxPage}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400 transition-colors"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}
