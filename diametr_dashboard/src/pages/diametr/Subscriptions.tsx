import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Moment from "moment";
import { formatMoney } from "../../service/formatters/money.format";
import { matchesSearchKey, searchKey } from "../../utils/searchKey";
import { useLang, tr } from "../../context/LangContext";

// ─── helpers ──────────────────────────────────────────────────────────────────
function subStatusInfo(expired?: string | null) {
  if (!expired) return { cls: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", label: tr("Belgilanmagan", "Не задано"), days: null, color: "gray" };
  const days = Math.ceil((new Date(expired).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: tr("Tugagan", "Истекла"), days, color: "red" };
  if (days <= 3) return { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: tr(`${days} kun qoldi`, `осталось ${days} дн.`), days, color: "red" };
  if (days <= 7) return { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: tr(`${days} kun qoldi`, `осталось ${days} дн.`), days, color: "amber" };
  if (days <= 30) return { cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: tr(`${days} kun qoldi`, `осталось ${days} дн.`), days, color: "blue" };
  return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: tr("Faol", "Активен"), days, color: "green" };
}

const LOG_LABELS: Record<string, { label: string; cls: string }> = {
  TOP_UP_CLICK: { label: "Click", cls: "bg-blue-50 text-blue-600" },
  TOP_UP_PAYME: { label: "Payme", cls: "bg-cyan-50 text-cyan-600" },
  TOP_UP_UZUM: { label: "Uzum", cls: "bg-purple-50 text-purple-600" },
  TOP_UP_MANUAL: { get label() { return tr("Qolda", "Вручную"); }, cls: "bg-teal-50 text-teal-600" },
  SUBSCRIPTION_DEDUCT: { get label() { return tr("Obuna", "Подписка"); }, cls: "bg-red-50 text-red-600" },
  FREE_TRIAL: { get label() { return tr("Tekin", "Бесплатно"); }, cls: "bg-violet-50 text-violet-600" },
};

export default function SubscriptionsPage() {
  const { t } = useLang();

  const [settings, setSettings] = useState<{ free_trial_months: number; subscription_price: number } | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [topping, setTopping] = useState(false);
  const [givingTrial, setGivingTrial] = useState(false);
  const [settingExpiry, setSettingExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryNote, setExpiryNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [searchShop, setSearchShop] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [settRes, shopsRes] = await Promise.allSettled([
        axiosClient.get("/subscription/settings"),
        axiosClient.get("/subscription/shops"),
      ]);
      if (settRes.status === "fulfilled") setSettings(settRes.value.data);
      if (shopsRes.status === "fulfilled") {
        const d = shopsRes.value.data;
        setShops(Array.isArray(d) ? d : d?.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedShopRef = useRef<number | null>(null);
  selectedShopRef.current = selectedShop;

  const fetchLogs = useCallback(async (shopId: number, keepOnError = false) => {
    try {
      const res = await axiosClient.get(`/subscription/logs/${shopId}?take=30`);
      const d = res.data;
      // Ignore a late answer for a shop that is no longer selected.
      if (selectedShopRef.current === shopId) setLogs(Array.isArray(d) ? d : d?.data ?? []);
    } catch {
      if (!keepOnError && selectedShopRef.current === shopId) setLogs([]);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Balance / expiry change outside this page (Click/Payme webhooks, hourly auto-renew/block,
  // other admins). Settings are not re-fetched here so a half-typed settings form is never overwritten.
  const pollShops = useCallback(async () => {
    try {
      const res = await axiosClient.get("/subscription/shops");
      const d = res.data;
      setShops(Array.isArray(d) ? d : d?.data ?? []);
    } catch {
      /* keep the current list */
    }
    const shopId = selectedShopRef.current;
    if (shopId) await fetchLogs(shopId, true);
  }, [fetchLogs]);
  useEffect(() => {
    const id = setInterval(() => { pollShops(); }, 30_000);
    return () => clearInterval(id);
  }, [pollShops]);
  useEffect(() => {
    if (selectedShop) fetchLogs(selectedShop);
    else setLogs([]);
  }, [selectedShop, fetchLogs]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await axiosClient.patch("/subscription/settings", settings);
      toast.success(t("Sozlamalar saqlandi", "Настройки сохранены"));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik", "Ошибка"));
    } finally { setSavingSettings(false); }
  };

  const handleTopUp = async () => {
    if (!selectedShop || !topUpAmount) { toast.error(t("Dokon va summa tanlang", "Выберите магазин и сумму")); return; }
    setTopping(true);
    try {
      await axiosClient.post(`/subscription/top-up/${selectedShop}`, { amount: Number(topUpAmount), note: topUpNote || undefined });
      toast.success(t("Balans to'ldirildi", "Баланс пополнен"));
      setTopUpAmount(""); setTopUpNote("");
      await fetchAll();
      await fetchLogs(selectedShop);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik", "Ошибка"));
    } finally { setTopping(false); }
  };

  const handleGiveTrial = async (shopId: number, months: number) => {
    setGivingTrial(true);
    try {
      await axiosClient.post(`/subscription/free-trial/${shopId}`, { months });
      toast.success(t(`+${months} oy tekin berildi`, `Выдано бесплатно: +${months} мес.`));
      await fetchAll();
      if (selectedShop) await fetchLogs(selectedShop);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik", "Ошибка"));
    } finally { setGivingTrial(false); }
  };

  const handleSetExpiry = async () => {
    if (!selectedShop || !expiryDate) { toast.error(t("Sana tanlang", "Выберите дату")); return; }
    setSettingExpiry(true);
    try {
      await axiosClient.patch(`/subscription/set-expiry/${selectedShop}`, {
        expired: expiryDate,
        note: expiryNote || undefined,
      });
      toast.success(t("Muddati belgilandi", "Срок установлен"));
      setExpiryDate(""); setExpiryNote("");
      await fetchAll();
      await fetchLogs(selectedShop);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik", "Ошибка"));
    } finally { setSettingExpiry(false); }
  };

  const selectedShopData = shops.find((s) => s.id === selectedShop);
  const selectedStatus = subStatusInfo(selectedShopData?.expired);

  const searchShopKey = searchKey(searchShop);
  const filteredShops = searchShopKey
    ? shops.filter((s) => matchesSearchKey(searchShopKey, [s.name]))
    : shops;

  // counts
  const activeCount = shops.filter((s) => { const d = subStatusInfo(s.expired); return d.color === "green" || d.color === "blue"; }).length;
  const warningCount = shops.filter((s) => subStatusInfo(s.expired).color === "amber").length;
  const expiredCount = shops.filter((s) => subStatusInfo(s.expired).color === "red").length;

  return (
    <>
      <PageMeta title={t.k("subscriptionsTitle")} description={t("Obuna boshqaruvi", "Управление подписками")} />
      <PageBreadcrumb pageTitle={t("Obuna Boshqaruvi", "Управление подписками")} />

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
          <div className="text-xs font-medium text-gray-400 uppercase mb-1">{t("Jami do'konlar", "Всего магазинов")}</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{shops.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-5">
          <div className="text-xs font-medium text-emerald-600 uppercase mb-1">{t("Faol", "Активен")}</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5">
          <div className="text-xs font-medium text-amber-600 uppercase mb-1">{t("Ogohlantirish", "Предупреждение")}</div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{warningCount}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 p-5">
          <div className="text-xs font-medium text-red-600 uppercase mb-1">{t("Tugagan", "Истекла")}</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{expiredCount}</div>
        </div>
      </div>

      {/* ── Settings (collapsible) ──────────────────────────────── */}
      <div className="mb-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${showSettings ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t("Umumiy sozlamalar", "Общие настройки")}
        </button>
        {showSettings && settings && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-48">
                <Label>{t("Bepul sinov (oy)", "Пробный период (мес.)")}</Label>
                <Input
                  type="number"
                  value={String(settings.free_trial_months)}
                  onChange={(e: any) => setSettings({ ...settings, free_trial_months: Number(e.target.value) })}
                />
              </div>
              <div className="w-48">
                <Label>{t("Oylik narx (som)", "Цена в месяц (сум)")}</Label>
                <Input
                  type="number"
                  value={String(settings.subscription_price)}
                  onChange={(e: any) => setSettings({ ...settings, subscription_price: Number(e.target.value) })}
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={savingSettings} size="sm">
                {savingSettings ? "..." : t("Saqlash", "Сохранить")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

        {/* ── Shops List ─── */}
        <div className="xl:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">{t("Do'konlar", "Магазины")}</h3>
                <span className="text-xs text-gray-400">{filteredShops.length} {t("ta", "шт.")}</span>
              </div>
              <input
                type="text"
                placeholder={t("Qidirish...", "Поиск...")}
                value={searchShop}
                onChange={(e) => setSearchShop(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition"
              />
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-14" />)}
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredShops.map((shop) => {
                  const st = subStatusInfo(shop.expired);
                  const admin = shop.admins?.[0];
                  const isSelected = selectedShop === shop.id;
                  return (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedShop(isSelected ? null : shop.id)}
                      className={[
                        "px-5 py-3.5 border-b border-gray-50 dark:border-white/[0.03] last:border-0 cursor-pointer transition-all",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-900/20 border-l-4 !border-l-brand-500"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border-l-4 border-l-transparent",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800 dark:text-white truncate">
                            {shop.name ?? t(`Do'kon #${shop.id}`, `Магазин #${shop.id}`)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {admin?.fullname ?? t("Admin yo'q", "Нет админа")}
                            {admin?.chat_id && <span className="ml-1 text-green-500">• TG</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {formatMoney(shop.balance ?? 0)} som
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredShops.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-sm">{t("Do'konlar topilmadi", "Магазины не найдены")}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Control Panel (selected shop) ─── */}
        <div className="xl:col-span-7">
          {!selectedShop ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] flex flex-col items-center justify-center h-96">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t("Do'konni tanlang boshqarish uchun", "Выберите магазин для управления")}</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Shop Info Header ─── */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {selectedShopData?.name ?? t(`Do'kon #${selectedShop}`, `Магазин #${selectedShop}`)}
                    </h2>
                    <div className="mt-1 text-sm text-gray-400">
                      {selectedShopData?.admins?.[0]?.fullname ?? t("Admin belgilanmagan", "Админ не назначен")}
                      {selectedShopData?.admins?.[0]?.phone && (
                        <span className="ml-2">{selectedShopData.admins[0].phone}</span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${selectedStatus.cls}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedStatus.dot}`} />
                    {selectedStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-5">
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-4 text-center">
                    <div className="text-xs font-medium text-gray-400 uppercase mb-1">{t("Balans", "Баланс")}</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {formatMoney(selectedShopData?.balance ?? 0)}
                    </div>
                    <div className="text-xs text-gray-400">som</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-4 text-center">
                    <div className="text-xs font-medium text-gray-400 uppercase mb-1">{t("Obuna muddati", "Срок подписки")}</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white">
                      {selectedShopData?.expired ? Moment(selectedShopData.expired).format("DD.MM.YYYY") : "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedStatus.days != null ? (selectedStatus.days < 0 ? t(`${Math.abs(selectedStatus.days)} kun oldin tugagan`, `истекла ${Math.abs(selectedStatus.days)} дн. назад`) : t(`${selectedStatus.days} kun qoldi`, `осталось ${selectedStatus.days} дн.`)) : "belgilanmagan"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-4 text-center">
                    <div className="text-xs font-medium text-gray-400 uppercase mb-1">{t("Holat", "Статус")}</div>
                    <div className={`text-lg font-bold ${selectedShopData?.work_status === "WORKING" ? "text-emerald-600" : selectedShopData?.work_status === "BLOCKED" ? "text-red-600" : "text-gray-400"}`}>
                      {selectedShopData?.work_status === "WORKING" ? t("Ishlayapti", "Работает") : selectedShopData?.work_status === "BLOCKED" ? t("Bloklangan", "Заблокирован") : selectedShopData?.work_status ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Quick Actions: Free months ─── */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {t("Tekin muddat berish", "Выдать бесплатный срок")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleGiveTrial(selectedShop, m)}
                      disabled={givingTrial}
                      className="relative group flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-50"
                    >
                      <span className="text-xl font-bold text-gray-700 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        +{m}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-violet-500 transition-colors">
                        {m === 1 ? "oy" : "oy"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Set Expiry & Top-up (side by side) ─── */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Set Expiry Date */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("Muddatni belgilash", "Установить срок")}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>{t("Sana", "Дата")}</Label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <Label>{t("Izoh (ixtiyoriy)", "Комментарий (необязательно)")}</Label>
                      <Input
                        type="text"
                        placeholder={t("Sabab...", "Причина...")}
                        value={expiryNote}
                        onChange={(e: any) => setExpiryNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSetExpiry} disabled={settingExpiry || !expiryDate} className="w-full" size="sm">
                      {settingExpiry ? t("Belgilanmoqda...", "Установка...") : t("Muddatni belgilash", "Установить срок")}
                    </Button>
                  </div>
                </div>

                {/* Balance Top-up */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("Balans to'ldirish", "Пополнение баланса")}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>{t("Summa (som)", "Сумма (сум)")}</Label>
                      <Input
                        type="number"
                        placeholder="50 000"
                        value={topUpAmount}
                        onChange={(e: any) => setTopUpAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{t("Izoh (ixtiyoriy)", "Комментарий (необязательно)")}</Label>
                      <Input
                        type="text"
                        placeholder={t("Sabab...", "Причина...")}
                        value={topUpNote}
                        onChange={(e: any) => setTopUpNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleTopUp} disabled={topping || !topUpAmount} className="w-full" size="sm">
                      {topping ? t("To'ldirilmoqda...", "Пополнение...") : t("Balansni to'ldirish", "Пополнить баланс")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Transaction Logs ─── */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {t("Tranzaksiyalar jurnali", "Журнал транзакций")}
                  </h3>
                  <span className="text-xs text-gray-400">{logs.length} {t("ta", "шт.")}</span>
                </div>
                {logs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">{t("Harakatlar topilmadi", "Операции не найдены")}</div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t("Sana", "Дата")}</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t("Tur", "Тип")}</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase">{t("Summa", "Сумма")}</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase">{t("Balans", "Баланс")}</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t("Izoh", "Комментарий")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log: any) => {
                          const logStyle = LOG_LABELS[log.type] ?? { label: log.type, cls: "bg-gray-50 text-gray-600" };
                          return (
                            <tr key={log.id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                              <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{Moment(log.createdt).format("DD.MM.YY HH:mm")}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${logStyle.cls}`}>
                                  {logStyle.label}
                                </span>
                              </td>
                              <td className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${log.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {log.amount >= 0 ? "+" : ""}{formatMoney(log.amount)}
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">{formatMoney(log.balance_after)}</td>
                              <td className="px-5 py-3 text-xs text-gray-400 max-w-[180px] truncate">{log.note ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
