import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import PaymentsTable, { PaymentItemProps } from "../../components/tables/diametr/paymentsTable";
import { usePolling } from "../../hooks/usePolling";
import { toast } from "../../components/ui/toast";
import Moment from "moment";
import { useLang, tr } from "../../context/LangContext";

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Plans
// ─────────────────────────────────────────────────────────────────────────────
interface Plan {
  months: number;
  label: string;
  basePrice: number;
  finalPrice: number;
  discount: number;
}

const PLANS: Plan[] = [
  { months: 1,  get label() { return tr("1 oy", "1 мес."); },   basePrice: 100_000,   finalPrice: 100_000,   discount: 0  },
  { months: 2,  get label() { return tr("2 oy", "2 мес."); },   basePrice: 200_000,   finalPrice: 190_000,   discount: 5  },
  { months: 3,  get label() { return tr("3 oy", "3 мес."); },   basePrice: 300_000,   finalPrice: 255_000,   discount: 15 },
  { months: 6,  get label() { return tr("6 oy", "6 мес."); },   basePrice: 600_000,   finalPrice: 450_000,   discount: 25 },
  { months: 12, get label() { return tr("1 yil", "1 год"); },  basePrice: 1_200_000, finalPrice: 840_000,   discount: 30 },
];

type PayMethod = "payme" | "click" | "uzum" | "manual" | "free";

const PAY_METHODS: { id: PayMethod; label: string; color: string }[] = [
  { id: "payme", label: "Payme",   color: "bg-blue-500" },
  { id: "click", label: "Click",   color: "bg-green-500" },
  { id: "uzum",  label: "Uzum",    color: "bg-orange-500" },
  { id: "manual",get label() { return tr("Ruchnoy", "Вручную"); }, color: "bg-purple-500" },
  { id: "free",  get label() { return tr("Bepul", "Бесплатно"); },   color: "bg-gray-500" },
];

// Payme / Click merchant config (replace with real IDs)
const PAYME_MERCHANT = import.meta.env.VITE_PAYME_MERCHANT ?? "payme_merchant_id";
const CLICK_SERVICE  = import.meta.env.VITE_CLICK_SERVICE  ?? "click_service_id";

function buildPaymeUrl(amount: number, orderId: string) {
  const params = btoa(JSON.stringify({ m: PAYME_MERCHANT, ac: { order_id: orderId }, a: amount * 100 }));
  return `https://checkout.paycom.uz/${params}`;
}
function buildClickUrl(amount: number, orderId: string) {
  return `https://my.click.uz/services/${CLICK_SERVICE}?amount=${amount}&transaction_param=${orderId}`;
}
function buildUzumUrl(amount: number) {
  return `https://uzumbank.uz/pay?amount=${amount}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { t } = useLang();

  const { isOpen, openModal, closeModal } = useModal();
  const [payLinkModal, setPayLinkModal] = useState(false);
  const [payLink, setPayLink] = useState("");
  const [payLinkLabel, setPayLinkLabel] = useState("");

  // Form state
  const [shopId, setShopId] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [payMethod, setPayMethod] = useState<PayMethod>("payme");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [freeMonths, setFreeMonths] = useState<string>("1");
  const [saving, setSaving] = useState(false);

  // Shops list
  const [shopOptions, setShopOptions] = useState<{ value: string; label: string }[]>([]);
  // Loaded on mount and refreshed whenever the modal opens (a failed refresh keeps the old list).
  const loadShops = () => {
    axiosClient.get("/shop/all").then((res) => {
      const list = res.data?.data ?? res.data ?? [];
      if (Array.isArray(list)) setShopOptions(list.map((s: any) => ({ value: String(s.id), label: s.name ?? String(s.id) })));
    }).catch(() => {});
  };
  useEffect(() => { loadShops(); }, []);

  // Payments data
  const fetchPayments = useCallback(() => axiosClient.get("/payment/all").then((res) => res.data), []);
  const { data, isLoading, refetch } = useFetchWithLoader<PaymentItemProps[]>({ fetcher: fetchPayments });
  usePolling(refetch, 10_000);
  const paymentData: PaymentItemProps[] = Array.isArray(data) ? data : [];

  // Derived amount & dates
  const effectiveAmount = payMethod === "manual"
    ? Number(manualAmount) || 0
    : payMethod === "free"
    ? 0
    : selectedPlan.finalPrice;

  const effectiveMonths = payMethod === "free" ? Number(freeMonths) || 1 : selectedPlan.months;

  const startDate = Moment().format("YYYY-MM-DD");
  const endDate   = Moment().add(effectiveMonths, "months").format("YYYY-MM-DD");

  const handleOpenPayLink = () => {
    if (!shopId) return toast.error(t("Avval do'konni tanlang", "Сначала выберите магазин"));
    const orderId = `shop-${shopId}-${Date.now()}`;
    const amount  = effectiveAmount;
    let link = "";
    if (payMethod === "payme") link = buildPaymeUrl(amount, orderId);
    else if (payMethod === "click") link = buildClickUrl(amount, orderId);
    else if (payMethod === "uzum")  link = buildUzumUrl(amount);
    setPayLink(link);
    setPayLinkLabel(PAY_METHODS.find((m) => m.id === payMethod)?.label ?? "");
    setPayLinkModal(true);
  };

  const handleSave = async () => {
    if (!shopId) return toast.error(t("Do'konni tanlang", "Выберите магазин"));
    if ((payMethod === "manual") && !manualAmount) return toast.error(t("Summani kiriting", "Введите сумму"));
    setSaving(true);
    try {
      await axiosClient.post("/payment", {
        type: "SHOP",
        shop_id: Number(shopId),
        amount: effectiveAmount,
        start_date: startDate,
        end_date: endDate,
      });
      toast.success(t("Obuna muvaffaqiyatli qo'shildi", "Подписка успешно добавлена"));
      refetch();
      closeModal();
      resetForm();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik yuz berdi", "Произошла ошибка"));
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setShopId(""); setSelectedPlan(PLANS[0]); setPayMethod("payme");
    setManualAmount(""); setFreeMonths("1");
  };

  return (
    <>
      <PageMeta title={`${t.k("payments")} | Diametr Dashboard`} description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle={t("Obunalar & To'lovlar", "Подписки и платежи")} />

      {/* Plan overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {PLANS.map((p) => (
          <div key={p.months} className="relative rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4 text-center">
            {p.discount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                -{p.discount}%
              </span>
            )}
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{p.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{(p.finalPrice / 1000).toLocaleString()}K</p>
            {p.discount > 0 && (
              <p className="text-xs text-gray-400 line-through">{(p.basePrice / 1000).toLocaleString()}K</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{t("so'm", "сум")}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <ComponentCard
          title={t("Obunalar tarixi", "История подписок")}
          action={
            <Button size="sm" variant="primary" startIcon={<PlusIcon className="size-5 fill-white" />} onClick={() => { loadShops(); openModal(); }}>
              {t("Obuna qo'shish", "Добавить подписку")}
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <PaymentsTable data={paymentData} onRefetch={refetch} />}
        </ComponentCard>
      </div>

      {/* ── Add subscription modal ── */}
      <Modal isOpen={isOpen} onClose={() => { closeModal(); resetForm(); }} className="max-w-[720px] m-4">
        <div className="relative w-full p-6 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 max-h-[90vh]">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-5">{t("Obuna qo'shish", "Добавить подписку")}</h4>

          {/* Shop selector */}
          <div className="mb-5">
            <Label>{t("Do'kon", "Магазин")}</Label>
            <Select
              options={shopOptions}
              placeholder={t("Do'konni tanlang", "Выберите магазин")}
              onChange={(v) => setShopId(v)}
            />
          </div>

          {/* Plan cards */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("Tarif rejasi", "Тарифный план")}</p>
            <div className="grid grid-cols-5 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.months}
                  onClick={() => setSelectedPlan(p)}
                  disabled={payMethod === "free" || payMethod === "manual"}
                  className={`relative rounded-xl border-2 p-3 text-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedPlan.months === p.months && payMethod !== "free" && payMethod !== "manual"
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-white/[0.05] hover:border-brand-300"
                  }`}
                >
                  {p.discount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                      -{p.discount}%
                    </span>
                  )}
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{p.label}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{(p.finalPrice / 1000).toLocaleString()}K</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("To'lov usuli", "Способ оплаты")}</p>
            <div className="flex flex-wrap gap-2">
              {PAY_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                    payMethod === m.id
                      ? `border-transparent text-white ${m.color}`
                      : "border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:border-gray-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional fields */}
          {payMethod === "manual" && (
            <div className="mb-5">
              <Label>{t("Summa (so'm)", "Сумма (сум)")}</Label>
              <Input
                type="number"
                placeholder="100000"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </div>
          )}
          {payMethod === "free" && (
            <div className="mb-5">
              <Label>{t("Muddati (oy)", "Срок (мес.)")}</Label>
              <Input
                type="number"
                placeholder="1"
                value={freeMonths}
                onChange={(e) => setFreeMonths(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{t("0 so'm evaziga", "за 0 сум")} {freeMonths} {t("oy bepul obuna", "мес. бесплатной подписки")}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("Summa", "Сумма")}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {effectiveAmount === 0 ? t("Bepul", "Бесплатно") : t(`${effectiveAmount.toLocaleString()} so'm`, `${effectiveAmount.toLocaleString()} сум`)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("Boshlanish", "Начало")}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{Moment(startDate).format("DD.MM.YYYY")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("Tugash", "Окончание")}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{Moment(endDate).format("DD.MM.YYYY")}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 justify-end flex-wrap">
            <Button size="sm" variant="outline" onClick={() => { closeModal(); resetForm(); }}>
              {t("Bekor qilish", "Отмена")}
            </Button>
            {(payMethod === "payme" || payMethod === "click" || payMethod === "uzum") && (
              <Button size="sm" variant="outline" onClick={handleOpenPayLink} disabled={!shopId}>
                {PAY_METHODS.find((m) => m.id === payMethod)?.label} {t("havolasini ko'rish", "посмотреть ссылку")}
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t("Saqlanmoqda...", "Сохранение...") : t("Obunani saqlash", "Сохранить подписку")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment link modal ── */}
      <Modal isOpen={payLinkModal} onClose={() => setPayLinkModal(false)} className="max-w-[500px] m-4">
        <div className="relative w-full p-6 bg-white no-scrollbar rounded-3xl dark:bg-gray-900">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{payLinkLabel} {t("to'lov havolasi", "ссылка на оплату")}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("Quyidagi havolani do'kon egasiga yuboring yoki to'g'ridan to'g'ri oching:", "Отправьте эту ссылку владельцу магазина или откройте её напрямую:")}
          </p>
          <div className="bg-gray-50 dark:bg-white/[0.05] rounded-lg p-3 break-all text-xs text-gray-700 dark:text-gray-300 mb-4 font-mono">
            {payLink}
          </div>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(payLink); toast.success(t("Nusxalandi", "Скопировано")); }}>
              {t("Nusxalash", "Копировать")}
            </Button>
            <Button size="sm" variant="primary" onClick={() => window.open(payLink, "_blank")}>
              {t("Ochish", "Открыть")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}