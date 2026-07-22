import TableToolbar from "./TableToolbar";
import { ConfirmDeleteModal } from "./TableActions";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Moment from "moment";
import Button from "../ui/button/Button";
import { DeleteIcon } from "../../icons";
import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import * as XLSX from "xlsx";

interface OrderProduct {
  id: number;
  count: number;
  amount: number;
  product_name?: string | null;
  category_name?: string | null;
  variant_name?: string | null;
  variant_color?: string | null;
  variant_value?: string | null;
  variant_size?: string | null;
  unit_symbol?: string | null;
  shop_product?: {
    price?: number;
    bonus_price?: number;
    product_item?: {
      name?: string;
      color?: string;
      value?: number;
      size?: string;
      unit_type?: { symbol?: string };
      product?: {
        name?: string;
        category?: { name?: string };
        unit_type?: { symbol?: string };
      };
    };
  };
}

export interface OrderItemProps {
  id: number;
  status?: string;
  amount?: number;
  address?: string;
  phone?: string;
  payment_type?: string;
  delivery_type?: string;
  shop?: { id: number; name?: string };
  shop_id?: number;
  user?: { id: number; phone?: string; fullname?: string };
  products?: OrderProduct[];
  createdt?: string;
  createdAt?: string;
  discount_percent?: number | null;
  discount_amount?: number | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  STARTED:   { label: "Yangi",          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMED: { label: "Tasdiqlangan",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  FINISHED:  { label: "Bajarilgan",     className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CANCELED:  { label: "Bekor qilingan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const payLabel: Record<string, string> = { cash: "Naqd", payme: "Payme", click: "Click", uzum: "Uzum" };
const deliveryLabel: Record<string, string> = { MARKET: "Olib ketish", YANDEX: "Yandex", FIXED: "Yetkazish" };

export default function OrdersTable({
  data,
  onRefetch,
}: {
  data: OrderItemProps[];
  onRefetch?: () => void;
}) {
  const [tableData, setTableData] = useState(data);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    if (search.trim() === "") return tableData;
    const q = search.toLowerCase();
    return tableData.filter((s) =>
      (s.address ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q) ||
      (s.user?.fullname ?? "").toLowerCase().includes(q) ||
      (s.user?.phone ?? "").toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }, [tableData, search]);

  const sorted = useMemo(() => [...filteredData].sort((a, b) => b.id - a.id), [filteredData]);
  const maxPage = Math.ceil(sorted.length / +optionValue);
  const currentItems = sorted.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);

  const doAction = async (id: number, action: "confirm" | "cancel" | "finish") => {
    setLoadingId(id);
    try {
      await axiosClient.put(`/order/${action}/${id}`);
      const label = action === "confirm" ? "Tasdiqlandi" : action === "cancel" ? "Bekor qilindi" : "Bajarildi";
      toast.success(label);
      onRefetch?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/order/${id}`);
      toast.success("Buyurtma o'chirildi");
      onRefetch?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((o) => ({
        ID: o.id,
        Mijoz: o.user?.fullname ?? o.user?.phone ?? "",
        Telefon: o.phone ?? o.user?.phone ?? "",
        Manzil: o.address ?? "",
        Summa: (o.amount ?? 0).toLocaleString(),
        Status: statusConfig[o.status ?? ""]?.label ?? o.status ?? "",
        Sana: Moment(o.createdAt).format("DD.MM.YYYY HH:mm"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="ID, mijoz, manzil qidirish..."
          showValue={optionValue}
          onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }}
          onExport={handleExport}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Mijoz</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Telefon</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Summa</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Sana</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                  Buyurtmalar yo'q
                </TableCell>
              </TableRow>
            ) : currentItems.map((item, idx) => {
              const cfg = statusConfig[item.status ?? ""] ?? { label: item.status ?? "-", className: "bg-gray-100 text-gray-600" };
              const busy = loadingId === item.id;
              const isExpanded = expandedOrders.has(item.id);
              const products = item.products ?? [];
              return (
                <>
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer" onClick={() => { if (products.length > 0) toggleExpand(item.id); }}>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        {products.length > 0 && (
                          <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
                        )}
                        {(currentPage - 1) * +optionValue + idx + 1}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                      {item.user?.fullname ?? item.phone ?? "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.phone ?? item.user?.phone ?? "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                      {item.amount != null ? `${item.amount.toLocaleString()} so'm` : "-"}
                      {item.discount_amount ? (
                        <span className="ml-1 text-xs text-orange-500">(-{item.discount_amount.toLocaleString()})</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {Moment(item.createdt ?? item.createdAt).format("DD.MM.YYYY HH:mm")}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {item.status === "STARTED" && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(item.id, "finish")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-all"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            {busy ? "..." : "Tasdiqlash"}
                          </button>
                        )}
                        {item.status === "FINISHED" && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(item.id, "confirm")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-40 transition-all"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {busy ? "..." : "Yakunlash"}
                          </button>
                        )}
                        {(item.status === "STARTED" || item.status === "FINISHED") && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(item.id, "cancel")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-all"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            {busy ? "..." : "Bekor"}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmId(item.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"
                        >
                          <DeleteIcon className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && products.length > 0 && (
                    <TableRow key={`${item.id}-products`}>
                      <TableCell colSpan={7} className="px-0 py-0">
                        <div className="bg-gray-50/80 dark:bg-white/2 border-y border-gray-100 dark:border-white/5">
                          {/* Order extra info */}
                          <div className="px-8 pt-3 pb-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>📍 {item.address ?? "—"}</span>
                            <span>💳 {payLabel[item.payment_type ?? ""] ?? item.payment_type ?? "—"}</span>
                            <span>🚚 {deliveryLabel[item.delivery_type ?? ""] ?? item.delivery_type ?? "—"}</span>
                            {item.discount_amount ? <span>🏷 Chegirma: -{item.discount_amount.toLocaleString()} so'm ({item.discount_percent}%)</span> : null}
                          </div>
                          {/* Products sub-table */}
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-400 dark:text-gray-500">
                                <th className="px-8 py-2 text-left font-medium">Mahsulot</th>
                                <th className="px-4 py-2 text-left font-medium">Kategoriya</th>
                                <th className="px-4 py-2 text-left font-medium">Variant</th>
                                <th className="px-4 py-2 text-right font-medium">Narx</th>
                                <th className="px-4 py-2 text-right font-medium">Soni</th>
                                <th className="px-8 py-2 text-right font-medium">Jami</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((p) => {
                                const prodName = p.product_name ?? p.shop_product?.product_item?.product?.name ?? "—";
                                const catName = p.category_name ?? p.shop_product?.product_item?.product?.category?.name ?? "—";
                                const varName = p.variant_name ?? p.shop_product?.product_item?.name ?? "";
                                const varColor = p.variant_color ?? p.shop_product?.product_item?.color ?? null;
                                const varSize = p.variant_size ?? p.shop_product?.product_item?.size ?? null;
                                const unitSym = p.unit_symbol ?? p.shop_product?.product_item?.unit_type?.symbol ?? p.shop_product?.product_item?.product?.unit_type?.symbol ?? "";
                                const varValue = p.variant_value ?? (p.shop_product?.product_item?.value != null ? String(p.shop_product.product_item.value) : null);
                                const varParts: string[] = [];
                                if (varName) varParts.push(varName);
                                if (varValue && unitSym) varParts.push(`${varValue} ${unitSym}`);
                                else if (varValue) varParts.push(varValue);
                                if (varSize) varParts.push(varSize);
                                const variantDisplay = varParts.join(" · ") || "—";
                                return (
                                  <tr key={p.id} className="border-t border-gray-100 dark:border-white/4">
                                    <td className="px-8 py-2 text-gray-700 dark:text-gray-300 font-medium">{prodName}</td>
                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{catName}</td>
                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center gap-1.5">
                                        {varColor && <span className="inline-block w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: varColor }} />}
                                        {variantDisplay}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{(p.amount ?? 0).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{p.count}</td>
                                    <td className="px-8 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{((p.amount ?? 0) * p.count).toLocaleString()} so'm</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-white/5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sorted.length} ta ichidan {Math.min((currentPage - 1) * +optionValue + 1, sorted.length)}–{Math.min(currentPage * +optionValue, sorted.length)} ko'rsatilmoqda
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Oldingi</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setCurrentPage((p) => p + 1)}>Keyingi</Button>
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
