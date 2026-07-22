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

export interface ShopItemProps {
  id: number;
  name?: string;
  inn?: string;
  address?: string;
  delivery_amount?: number;
  expired?: string;
  image?: string;
  region?: { id: number; name?: string };
  regionId?: number;
  product_count?: number;
  total_stock?: number;
  total_value?: number;
  createdt?: string; createdAt?: string;
  balance?: number;
  work_status?: string;
  auto_payment?: boolean;
  lat?: number | null;
  lon?: number | null;
}

const showOptions = [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }];

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function statusBadge(ws?: string) {
  if (ws === "BLOCKED") return { cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", label: "Bloklangan", dot: "bg-red-500" };
  if (ws === "DELETED") return { cls: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700", label: "O'chirilgan", dot: "bg-gray-400" };
  return { cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800", label: "Faol", dot: "bg-emerald-500" };
}

function expiryBadge(expired?: string) {
  if (!expired) return { cls: "text-gray-400", label: "—", color: "gray" };
  const days = Math.ceil((new Date(expired).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { cls: "text-red-600 dark:text-red-400 font-semibold", label: `${Moment(expired).format("DD.MM.YY")} ⚠`, color: "red" };
  if (days <= 3) return { cls: "text-red-500 dark:text-red-400", label: `${days} kun`, color: "red" };
  if (days <= 7) return { cls: "text-amber-600 dark:text-amber-400", label: `${days} kun`, color: "amber" };
  return { cls: "text-gray-600 dark:text-gray-300", label: Moment(expired).format("DD.MM.YY"), color: "green" };
}

export default function ShopsTable({ data, onRefetch }: { data: ShopItemProps[]; onRefetch?: () => void }) {
  const [tableData, setTableData] = useState(data);
  const { isOpen, openModal, closeModal } = useModal();
  const [editItem, setEditItem] = useState<ShopItemProps | null>(null);
  const [form, setForm] = useState({ name: "", region_id: "", inn: "", address: "", delivery_amount: "", expired: "", auto_payment: true, lat: "", lon: "" });
  const [bonusDays, setBonusDays] = useState(0);
  const [cancelSub, setCancelSub] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState("10");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [regionOptions, setRegionOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => { setTableData(data); }, [data]);
  useEffect(() => { setCurrentPage(1); }, [optionValue]);
  useEffect(() => {
    axiosClient.get("/region/all").then((res) => {
      const list = res.data?.data ?? res.data ?? [];
      setRegionOptions(list.map((r: any) => ({ value: String(r.id), label: r.name ?? String(r.id) })));
    }).catch(() => {});
  }, []);

  const filteredData = search.trim() === "" ? tableData : tableData.filter((s) => { const q = search.toLowerCase(); return (s.name ?? "").toLowerCase().includes(q) || (s.inn ?? "").toLowerCase().includes(q) || (s.address ?? "").toLowerCase().includes(q) || (s.region?.name ?? "").toLowerCase().includes(q); });
  const maxPage = Math.ceil(filteredData.length / +optionValue);
  const currentItems = filteredData.slice((currentPage - 1) * +optionValue, currentPage * +optionValue);
  const staticUrl = import.meta.env.VITE_STATIC_PATH ?? "";

  const openEdit = (item: ShopItemProps) => {
    setEditItem(item);
    setBonusDays(0);
    setCancelSub(false);
    setForm({
      name: item.name ?? "",
      region_id: item.region?.id ? String(item.region.id) : (item.regionId ? String(item.regionId) : ""),
      inn: item.inn ?? "",
      address: item.address ?? "",
      delivery_amount: item.delivery_amount != null ? String(item.delivery_amount) : "",
      expired: item.expired ? Moment(item.expired).format("YYYY-MM-DD") : "",
      auto_payment: item.auto_payment !== false,
      lat: item.lat != null ? String(item.lat) : "",
      lon: item.lon != null ? String(item.lon) : "",
    });
    openModal();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { name: form.name, inn: form.inn, address: form.address };
      if (form.region_id) payload.region_id = Number(form.region_id);
      if (form.delivery_amount) payload.delivery_amount = Number(form.delivery_amount);
      if (cancelSub) {
        payload.expired = Moment().format("YYYY-MM-DD");
      } else if (bonusDays > 0) {
        const baseMs = editItem?.expired ? new Date(editItem.expired).getTime() : 0;
        const startMs = Math.max(Date.now(), baseMs);
        payload.expired = Moment(startMs).add(bonusDays, "days").format("YYYY-MM-DD");
      }
      if (form.lat.trim() !== "") payload.lat = Number(form.lat);
      if (form.lon.trim() !== "") payload.lon = Number(form.lon);
      if (editItem) {
        await axiosClient.put(`/shop/${editItem.id}`, payload);
        // Update auto_payment separately
        if (form.auto_payment !== (editItem.auto_payment !== false)) {
          await axiosClient.patch(`/subscription/auto-payment/${editItem.id}`, { auto_payment: form.auto_payment });
        }
        toast.success("Do'kon yangilandi");
      }
      onRefetch?.(); closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/shop/${id}`);
      toast.success("Do'kon o'chirildi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleToggleBlock = async (item: ShopItemProps) => {
    try {
      await axiosClient.patch(`/shop/${item.id}/block`);
      toast.success(item.work_status === "BLOCKED" ? "Do'kon ochildi" : "Do'kon bloklandi");
      onRefetch?.();
    } catch { toast.error("Xatolik yuz berdi"); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map((s) => ({
      ID: s.id, Nomi: s.name ?? "", INN: s.inn ?? "", Manzil: s.address ?? "",
      Region: s.region?.name ?? "", "Yetkazish narxi": s.delivery_amount ?? "",
      "Tovarlar soni": s.product_count ?? 0, "Skladda": s.total_stock ?? 0,
      "Umumiy qiymati": s.total_value ?? 0, "Balans": s.balance ?? 0,
      "Holat": s.work_status ?? "", "Avto to'lov": s.auto_payment !== false ? "Ha" : "Yo'q",
      Muddati: s.expired ? Moment(s.expired).format("DD.MM.YYYY") : "",
      Yaratilgan: Moment(s.createdAt).format("DD.MM.YYYY"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shops");
    XLSX.writeFile(wb, `shops-${Moment().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <TableToolbar search={search} onSearch={(v) => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Qidirish..." showValue={optionValue} onShowChange={(v) => { setOptionValue(v); setCurrentPage(1); }} onExport={handleExport} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">#</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Rasm</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Nomi</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Holat</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Region</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Balans</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Muddati</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tovarlar</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Skladda</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Qiymati</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amallar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="py-8 text-center text-gray-400">Ma'lumot yo'q</TableCell></TableRow>
            ) : currentItems.map((item, idx) => {
              const st = statusBadge(item.work_status);
              const exp = expiryBadge(item.expired);
              return (
              <TableRow key={item.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${item.work_status === "BLOCKED" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * +optionValue + idx + 1}</TableCell>
                <TableCell className="px-5 py-4">
                  {item.image ? (
                    <img src={`${staticUrl}/static/shops/${item.image}`} alt={item.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-white/[0.06] shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='text-gray-400 dark:text-gray-600'><rect x='3' y='3' width='18' height='18' rx='4' /><circle cx='9' cy='9' r='2' /><path d='m21 15-5-5L5 21'/></svg></div>}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="font-medium text-gray-800 dark:text-white">{item.name ?? "-"}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.inn ? `INN: ${item.inn}` : ""}</div>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{item.region?.name ?? "-"}</TableCell>
                <TableCell className="px-5 py-4">
                  <div className={`text-sm font-semibold ${(item.balance ?? 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                    {formatMoney(item.balance ?? 0)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {item.auto_payment !== false ? (
                      <span className="text-blue-500">⚡ avto</span>
                    ) : (
                      <span className="text-gray-400">avto o'chiq</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`px-5 py-4 text-sm ${exp.cls}`}>{exp.label}</TableCell>
                <TableCell className="px-5 py-4 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    (item.product_count ?? 0) > 0
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}>
                    {item.product_count ?? 0}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm">
                  <span className={`font-semibold ${
                    (item.total_stock ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}>
                    {(item.total_stock ?? 0).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {(item.total_value ?? 0) > 0 ? `${(item.total_value! / 1_000_000).toFixed(1)}M` : '—'}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TableActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    extraActions={[
                      {
                        label: item.work_status === "BLOCKED" ? "Blokdan chiqarish" : "Bloklash",
                        color: item.work_status === "BLOCKED" ? "green" : "orange",
                        icon: item.work_status === "BLOCKED" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6-2a6 6 0 1112 0v4H4v-4z" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        ),
                        onClick: () => handleToggleBlock(item),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
            })}
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

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[640px] m-4">
        <div className="relative w-full p-6 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Do'konni tahrirlash</h4>
              <p className="text-xs text-gray-400">{editItem?.name}</p>
            </div>
          </div>

          {/* Subscription Info Bar */}
          {editItem && (
            <div className="mb-6 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase mb-1">Balans</div>
                  <div className={`text-lg font-bold ${(editItem.balance ?? 0) > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                    {formatMoney(editItem.balance ?? 0)} <span className="text-xs font-normal text-gray-400">so'm</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase mb-1">Holat</div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(editItem.work_status).cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge(editItem.work_status).dot}`} />
                    {statusBadge(editItem.work_status).label}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase mb-1">Muddati</div>
                  <div className={`text-sm font-semibold ${expiryBadge(editItem.expired).cls}`}>
                    {editItem.expired ? Moment(editItem.expired).format("DD.MM.YYYY") : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomi</Label>
                <Input type="text" placeholder="Do'kon nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              {regionOptions.length > 0 && (
                <div>
                  <Label>Region</Label>
                  <Select options={regionOptions} defaultValue={form.region_id} onChange={(v) => setForm({ ...form, region_id: v })} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>INN</Label>
                <Input type="text" placeholder="INN raqami" value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />
              </div>
              <div>
                <Label>Yetkazish narxi (so'm)</Label>
                <Input type="number" placeholder="0" value={form.delivery_amount} onChange={(e) => setForm({ ...form, delivery_amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Manzil</Label>
              <Input type="text" placeholder="Do'kon manzili" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude (ixtiyoriy)</Label>
                <Input type="text" placeholder="41.2995" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              </div>
              <div>
                <Label>Longitude (ixtiyoriy)</Label>
                <Input type="text" placeholder="69.2401" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} />
              </div>
            </div>
            {/* Subscription bonus / cancel ─────────────────────── */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-900/10 dark:to-transparent p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Obuna muddati</div>
                  {(() => {
                    const baseMs = editItem?.expired ? new Date(editItem.expired).getTime() : 0;
                    const currentLabel = editItem?.expired ? Moment(editItem.expired).format("DD.MM.YYYY") : "—";
                    let newLabel = currentLabel;
                    let changed = false;
                    if (cancelSub) {
                      newLabel = Moment().format("DD.MM.YYYY");
                      changed = true;
                    } else if (bonusDays > 0) {
                      const startMs = Math.max(Date.now(), baseMs);
                      newLabel = Moment(startMs).add(bonusDays, "days").format("DD.MM.YYYY");
                      changed = true;
                    }
                    return (
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Hozir:</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{currentLabel}</span>
                        {changed && (
                          <>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            <span className={`text-sm font-bold ${cancelSub ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{newLabel}</span>
                            {!cancelSub && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-semibold">+{bonusDays} kun</span>
                            )}
                            {cancelSub && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[11px] font-semibold">Bekor</span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {(bonusDays > 0 || cancelSub) && (
                  <button
                    type="button"
                    onClick={() => { setBonusDays(0); setCancelSub(false); }}
                    title="Tiklash"
                    className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white shadow-sm transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Bonus qo'shish (max 1 yil)</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { d: 3, label: "+3 kun" },
                  { d: 7, label: "+7 kun" },
                  { d: 30, label: "+1 oy" },
                  { d: 90, label: "+3 oy" },
                  { d: 180, label: "+6 oy" },
                  { d: 365, label: "+1 yil" },
                ].map((opt) => {
                  const next = Math.min(365, bonusDays + opt.d);
                  const disabled = cancelSub || bonusDays >= 365 || next === bonusDays;
                  return (
                    <button
                      key={opt.d}
                      type="button"
                      disabled={disabled}
                      onClick={() => setBonusDays(next)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        disabled
                          ? "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          : "border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-white/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const baseMs = editItem?.expired ? new Date(editItem.expired).getTime() : 0;
                const isActive = baseMs > Date.now();
                if (!isActive) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Obunani darhol tugatish:</span>
                    <button
                      type="button"
                      onClick={() => { setCancelSub((v) => !v); if (!cancelSub) setBonusDays(0); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                        cancelSub
                          ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                          : "border-rose-200 dark:border-rose-800/40 bg-white dark:bg-white/5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      }`}
                    >
                      {cancelSub ? "✓ Bugun tugaydi" : "Bekor qilish"}
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Avto to'lov</Label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, auto_payment: !form.auto_payment })}
                  className={`mt-1 flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.auto_payment
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700"
                      : "border-gray-200 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                  }`}
                >
                  <div className={`w-8 h-5 rounded-full relative transition-colors ${form.auto_payment ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.auto_payment ? "left-3.5" : "left-0.5"}`} />
                  </div>
                  {form.auto_payment ? "Yoqilgan" : "O'chirilgan"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}