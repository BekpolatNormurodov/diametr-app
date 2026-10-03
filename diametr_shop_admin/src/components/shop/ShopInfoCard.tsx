import { useEffect, useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../ui/toast";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import TranslateButton from "../common/TranslateButton";
import WorkHoursEditor from "../common/WorkHoursEditor";
import { useLang } from "../../context/LangContext";
import { useShopId } from "../../context/ShopSessionContext";
import { openStatus, parseWorkHours, statusText, workHoursValid, type WorkHours } from "../../utils/workHours";
import { decodeEntities } from "../../utils/text";

const MAX = 3000;

/**
 * What customers see on the shop page (site + app): about text in both
 * languages and the weekly hours. Saved with PATCH /shop/my/info, which only
 * ever touches the owner's own shop.
 */
export default function ShopInfoCard() {
  const { t, lang } = useLang();
  const shopId = useShopId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [descUz, setDescUz] = useState("");
  const [descRu, setDescRu] = useState("");
  const [hours, setHours] = useState<WorkHours | null>(null);

  useEffect(() => {
    if (!shopId) return;
    let alive = true;
    axiosClient
      .get(`/shop/${shopId}`)
      .then((res) => {
        if (!alive) return;
        const s = res.data ?? {};
        setDescUz(decodeEntities(s.description ?? ""));
        setDescRu(decodeEntities(s.description_ru ?? ""));
        setHours(parseWorkHours(s.work_hours));
      })
      .catch(() => { /* keep the empty form; saving still works */ })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [shopId]);

  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); };

  const save = async () => {
    if (!workHoursValid(hours)) {
      toast.error(t("Ish vaqtida ochilish va yopilish bir xil bo'lmasin", "Время открытия и закрытия не должно совпадать"));
      return;
    }
    setSaving(true);
    try {
      await axiosClient.patch("/shop/my/info", {
        description: descUz.trim() || null,
        description_ru: descRu.trim() || null,
        work_hours: hours,
      });
      setDirty(false);
      toast.success(t("Do'kon ma'lumotlari saqlandi", "Информация о магазине сохранена"));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("Xatolik yuz berdi", "Произошла ошибка"));
    } finally {
      setSaving(false);
    }
  };

  const status = hours && workHoursValid(hours) ? openStatus(hours) : null;

  const area =
    "w-full min-h-[110px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-hidden focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">{t("Do'kon sahifasi", "Страница магазина")}</h3>
          <p className="text-xs text-gray-400">{t("Tavsif va ish vaqti saytda va ilovada ko'rinadi", "Описание и время работы видны на сайте и в приложении")}</p>
        </div>
        {status && (
          <span
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              status.open
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "animate-pulse bg-emerald-500" : "bg-gray-400"}`} />
            {statusText(status, lang)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]" />
      ) : (
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>{t("Do'kon haqida (o'zbekcha)", "О магазине (узбекский)")}</Label>
              <TranslateButton source={descRu} direction="ru->uz" onResult={edit(setDescUz)} />
            </div>
            <textarea
              className={area}
              maxLength={MAX}
              value={descUz}
              onChange={(e) => edit(setDescUz)(e.target.value)}
              placeholder={t("Masalan: Qurilish mollari ulgurji va chakana. Yetkazib berish bor.", "Например: Стройматериалы оптом и в розницу. Есть доставка.")}
            />
            <p className="mt-1 text-right text-[11px] text-gray-400">{descUz.length}/{MAX}</p>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>{t("Do'kon haqida (ruscha)", "О магазине (русский)")}</Label>
              <TranslateButton source={descUz} direction="uz->ru" onResult={edit(setDescRu)} />
            </div>
            <textarea
              className={area}
              maxLength={MAX}
              value={descRu}
              onChange={(e) => edit(setDescRu)(e.target.value)}
              placeholder={t("Ruscha tavsif", "Описание на русском")}
            />
            <p className="mt-1 text-right text-[11px] text-gray-400">{descRu.length}/{MAX}</p>
          </div>
          <div>
            <Label>{t("Ish vaqti", "Время работы")}</Label>
            <WorkHoursEditor value={hours} onChange={edit(setHours)} />
          </div>
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <span className={`text-xs ${dirty ? "font-medium text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>
              {dirty ? t("Saqlanmagan o'zgarishlar bor", "Есть несохранённые изменения") : t("Barcha o'zgarishlar saqlangan", "Все изменения сохранены")}
            </span>
            <Button onClick={save} disabled={saving || !dirty} className="sm:min-w-[180px]">
              {saving ? t("Saqlanmoqda...", "Сохранение...") : t("Saqlash", "Сохранить")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
