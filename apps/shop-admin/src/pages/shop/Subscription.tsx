import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import Moment from "moment";
import { toast } from "react-toastify";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function statusInfo(expired?: string | null) {
  if (!expired) return { cls: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", label: "Belgilanmagan", days: null, color: "gray" };
  const days = Math.ceil((new Date(expired).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Muddati tugagan", days, color: "red" };
  if (days <= 3) return { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: `${days} kun qoldi`, days, color: "red" };
  if (days <= 7) return { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: `${days} kun qoldi`, days, color: "amber" };
  if (days <= 30) return { cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: `${days} kun qoldi`, days, color: "blue" };
  return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Faol", days, color: "green" };
}

const LOG_LABELS: Record<string, { label: string; cls: string }> = {
  TOP_UP_CLICK: { label: "Click", cls: "bg-blue-50 text-blue-600" },
  TOP_UP_PAYME: { label: "Payme", cls: "bg-cyan-50 text-cyan-600" },
  TOP_UP_UZUM: { label: "Uzum", cls: "bg-purple-50 text-purple-600" },
  TOP_UP_MANUAL: { label: "Qolda", cls: "bg-teal-50 text-teal-600" },
  SUBSCRIPTION_DEDUCT: { label: "Obuna", cls: "bg-red-50 text-red-600" },
  FREE_TRIAL: { label: "Tekin", cls: "bg-violet-50 text-violet-600" },
};

const AMOUNTS = [50000, 100000, 200000, 500000];

const PLANS = [
  { months: 1, discount: 0, label: "1 oy" },
  { months: 3, discount: 10, label: "3 oy", badge: "−10%" },
  { months: 6, discount: 20, label: "6 oy", badge: "−20%" },
  { months: 12, discount: 30, label: "12 oy", badge: "−30%" },
];

export default function SubscriptionPage() {
  const [balance, setBalance] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [payingBalance, setPayingBalance] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [balRes, logsRes] = await Promise.allSettled([
        axiosClient.get("/subscription/balance"),
        axiosClient.get("/subscription/my-logs?take=30"),
      ]);
      if (balRes.status === "fulfilled") setBalance(balRes.value.data);
      if (logsRes.status === "fulfilled") {
        const d = logsRes.value.data;
        setLogs(Array.isArray(d) ? d : d?.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const st = statusInfo(balance?.expired);
  const isExpired = st.color === "red" && (st.days ?? 0) < 0;
  const subPrice = balance?.subscription_price ?? 50000;
  const shopId = balance?.id;

  const plan = PLANS[selectedPlan];
  const planTotal = Math.round(subPrice * plan.months * (1 - plan.discount / 100));
  const planOriginal = subPrice * plan.months;

  const effectiveTopUp = customAmount ? Number(customAmount) : topUpAmount;

  const buildClickUrl = (amount: number) =>
    `https://my.click.uz/services/pay?service_id=${import.meta.env.VITE_CLICK_SERVICE_ID ?? ""}&merchant_id=${import.meta.env.VITE_CLICK_MERCHANT_ID ?? ""}&amount=${amount}&transaction_param=${shopId}_${Date.now()}`;

  const buildPaymeUrl = (amount: number) => {
    const params = `m=${import.meta.env.VITE_PAYME_MERCHANT_ID ?? ""};ac.shop_id=${shopId};a=${amount * 100}`;
    return `https://checkout.paycom.uz/${btoa(params)}`;
  };

  const buildUzumUrl = (amount: number) =>
    `https://www.uzumbank.uz/pay?serviceId=${import.meta.env.VITE_UZUM_SERVICE_ID ?? ""}&amount=${amount}&shopId=${shopId}`;

  const handlePayFromBalance = async () => {
    if (payingBalance) return;
    if ((balance?.balance ?? 0) < planTotal) {
      toast.error(`Balansda yetarli mablag' yo'q! Kerak: ${formatMoney(planTotal)} so'm`);
      return;
    }
    setPayingBalance(true);
    try {
      await axiosClient.post("/subscription/pay-from-balance", { months: plan.months });
      toast.success(`Obuna ${plan.months} oyga muvaffaqiyatli uzaytirildi!`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    }
    setPayingBalance(false);
  };

  return (
    <>
      <PageMeta title="Obuna" description="Obuna holati" />
      <PageBreadcrumb pageTitle="Obuna" />

      {/* Expired Alert */}
      {isExpired && (
        <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Obuna muddati tugagan!</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Sizning mahsulotlaringiz platformada foydalanuvchilarga <strong>ko'rsatilmaydi</strong>. 
                Obunani yangilash uchun balansni to'ldiring yoki administrator bilan bog'laning.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                Tugagan sana: {balance?.expired ? Moment(balance.expired).format("DD.MM.YYYY") : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-6 w-24 mb-2" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-32" />
            </div>
          ))
        ) : (
          <>
            {/* Balance */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-400 uppercase">Balans</div>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatMoney(balance?.balance ?? 0)} <span className="text-sm font-normal text-gray-400">so'm</span>
              </div>
            </div>

            {/* Expiry */}
            <div className={`rounded-2xl border p-6 ${isExpired ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10" : "border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                  <svg className={`w-5 h-5 ${isExpired ? "text-red-500" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-400 uppercase">Obuna muddati</div>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {balance?.expired ? Moment(balance.expired).format("DD.MM.YYYY") : "—"}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2 ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-400 uppercase">Holat</div>
              </div>
              <div className={`text-2xl font-bold ${isExpired ? "text-red-600" : "text-emerald-600"}`}>
                {isExpired ? "Bloklangan" : "Faol"}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {isExpired ? "Mahsulotlaringiz platformada ko'rinmaydi" : "Mahsulotlaringiz platformada ko'rinadi"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Auto Payment Toggle */}
      {!loading && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Avto to'lov</div>
                <p className="text-xs text-gray-400 mt-0.5">Balansdan avtomatik yechib obunani uzaytirish</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setToggling(true);
                try {
                  const newVal = !(balance?.auto_payment !== false);
                  await axiosClient.patch("/subscription/auto-payment", { auto_payment: newVal });
                  setBalance((b: any) => ({ ...b, auto_payment: newVal }));
                } catch { }
                setToggling(false);
              }}
              disabled={toggling}
              className="relative"
            >
              <div className={`w-12 h-7 rounded-full transition-colors ${balance?.auto_payment !== false ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${balance?.auto_payment !== false ? "left-6" : "left-1"}`} />
              </div>
            </button>
          </div>
          <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${balance?.auto_payment !== false ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
            {balance?.auto_payment !== false
              ? "Obuna muddati tugaganda, balansda yetarli mablag' bo'lsa avtomatik uzaytiriladi"
              : "Avto to'lov o'chirilgan — obuna muddati tugaganda do'kon bloklanadi"}
          </div>
        </div>
      )}

      {/* Balance Top-up + Subscription Payment */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6">
          {/* Balansni to'ldirish */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Balansni to'ldirish</div>
                <p className="text-xs text-gray-400 mt-0.5">Hisobingizni to'ldiring</p>
              </div>
            </div>

            {/* Amount selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Summa tanlang yoki kiriting</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setTopUpAmount(amt); setCustomAmount(""); }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      !customAmount && topUpAmount === amt
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-700 ring-1 ring-brand-200"
                        : "border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {formatMoney(amt)} so'm
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1000}
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Boshqa summa kiriting..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    customAmount
                      ? "border-brand-500 ring-1 ring-brand-200 bg-brand-50/50 dark:bg-brand-900/10"
                      : "border-gray-200 dark:border-white/[0.08]"
                  } dark:bg-white/[0.02] text-gray-700 dark:text-gray-200 placeholder-gray-400`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">so'm</span>
              </div>
            </div>

            {/* 3 Providers */}
            <div className="space-y-2.5">
              <a
                href={buildClickUrl(effectiveTopUp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <img src="/payments/click.png" alt="Click" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600">Click</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(effectiveTopUp)} so'm to'lash</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <a
                href={buildPaymeUrl(effectiveTopUp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-cyan-200 dark:hover:border-cyan-800 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-all group"
              >
                <img src="/payments/payme.png" alt="Payme" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-cyan-600">Payme</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(effectiveTopUp)} so'm to'lash</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <a
                href={buildUzumUrl(effectiveTopUp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group"
              >
                <img src="/payments/uzum.png" alt="Uzum" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600">Uzum</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(effectiveTopUp)} so'm to'lash</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>
            <p className="mt-3 text-[10px] text-gray-400 text-center">To'lov qilganingizda balans avtomatik to'ldiriladi</p>
          </div>

          {/* Obunaga to'lov */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Obunaga to'lov</div>
                <p className="text-xs text-gray-400 mt-0.5">Muddat tanlang va to'lang</p>
              </div>
            </div>

            {/* Plan selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Muddat tanlang</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLANS.map((p, i) => (
                  <button
                    key={p.months}
                    onClick={() => setSelectedPlan(i)}
                    className={`relative px-3 py-3 rounded-xl text-center border transition-all ${
                      selectedPlan === i
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 ring-1 ring-emerald-200"
                        : "border-gray-200 dark:border-white/[0.08] hover:border-gray-300"
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white whitespace-nowrap">
                        {p.badge}
                      </span>
                    )}
                    <div className={`text-sm font-bold ${selectedPlan === i ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {p.label}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {formatMoney(Math.round(subPrice * p.months * (1 - p.discount / 100)))} so'm
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl px-4 py-3 mb-5 border border-emerald-100 dark:border-emerald-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">{plan.label} obuna</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    {formatMoney(planTotal)} so'm
                    {plan.discount > 0 && (
                      <span className="text-xs line-through text-gray-400 font-normal">{formatMoney(planOriginal)}</span>
                    )}
                  </div>
                </div>
                {plan.discount > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 text-xs font-bold dark:bg-orange-900/30 dark:text-orange-400">
                    Tejaysiz {formatMoney(planOriginal - planTotal)} so'm
                  </span>
                )}
              </div>
            </div>

            {/* 4 Payment Options */}
            <div className="space-y-2.5">
              <a
                href={buildClickUrl(planTotal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <img src="/payments/click.png" alt="Click" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600">Click orqali</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(planTotal)} so'm</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <a
                href={buildPaymeUrl(planTotal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-cyan-200 dark:hover:border-cyan-800 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-all group"
              >
                <img src="/payments/payme.png" alt="Payme" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-cyan-600">Payme orqali</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(planTotal)} so'm</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <a
                href={buildUzumUrl(planTotal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group"
              >
                <img src="/payments/uzum.png" alt="Uzum" className="w-9 h-9 rounded-lg object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600">Uzum orqali</div>
                  <div className="text-[10px] text-gray-400">{formatMoney(planTotal)} so'm</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <button
                onClick={handlePayFromBalance}
                disabled={payingBalance || (balance?.balance ?? 0) < planTotal}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
                  (balance?.balance ?? 0) >= planTotal
                    ? "border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                    : "border-gray-100 dark:border-white/[0.06] opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-600">
                    {payingBalance ? "To'lanmoqda..." : "Balansdan to'lash"}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {(balance?.balance ?? 0) >= planTotal
                      ? `Balans: ${formatMoney(balance?.balance ?? 0)} so'm`
                      : `Yetarli emas (${formatMoney(balance?.balance ?? 0)} / ${formatMoney(planTotal)} so'm)`}
                  </div>
                </div>
                {(balance?.balance ?? 0) >= planTotal && (
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Logs */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tranzaksiyalar tarixi
          </h3>
          <span className="text-xs text-gray-400">{logs.length} ta</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-10" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Tranzaksiyalar topilmadi</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sana</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tur</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase">Summa</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase">Balans</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Izoh</th>
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
                      <td className="px-5 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
