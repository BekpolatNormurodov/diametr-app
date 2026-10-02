import { useState } from "react";
import { toast } from "../ui/toast";
import { decodeEntities } from "../../utils/text";

import { useLang, tr } from "../../context/LangContext";
/**
 * Free MyMemory translate API (no key required, ~5000 words/day per IP —
 * roughly three 10 000-character descriptions).
 * One request takes at most 500 characters ("QUERY LENGTH LIMIT EXCEEDED"),
 * so longer text is translated in sentence-sized pieces and joined back.
 */
const MAX_TOTAL = 10000;
const MAX_CHUNK = 480;

async function translateChunk(text: string, langPair: "uz|ru" | "ru|uz"): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(tr("Tarjima xizmati javob bermadi", "Сервис перевода не ответил"));
  const data = await res.json();
  const out: string = decodeEntities(data?.responseData?.translatedText ?? "").trim();
  // Errors come back as "translated text" (e.g. the length / daily-quota
  // messages): never let them land in the field.
  const status = Number(data?.responseStatus ?? 200);
  if (status !== 200 || data?.quotaFinished || /^MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) {
    throw new Error(
      data?.quotaFinished || /MYMEMORY WARNING/i.test(out)
        ? tr("Bugungi bepul tarjima limiti tugadi, ertaga qayta urinib ko'ring", "Бесплатный лимит перевода на сегодня исчерпан, попробуйте завтра")
        : String(data?.responseDetails || out || tr("Tarjima xatosi", "Ошибка перевода")),
    );
  }
  if (!out) throw new Error(tr("Bo'sh tarjima", "Пустой перевод"));
  return out;
}

/** Splits one line into pieces of at most MAX_CHUNK chars, at sentence,
 *  then comma, then word boundaries. */
function piecesOf(line: string): string[] {
  const units = line.match(/[^.!?…]+[.!?…]*\s*/g) ?? [line];
  const small: string[] = [];
  for (const u of units) {
    if (u.length <= MAX_CHUNK) { small.push(u); continue; }
    for (const part of u.split(/(?<=,)\s*/)) {
      if (part.length <= MAX_CHUNK) { small.push(part + " "); continue; }
      let cur = "";
      for (const w of part.split(/\s+/)) {
        if ((cur + " " + w).trim().length > MAX_CHUNK) { if (cur) small.push(cur + " "); cur = w; }
        else cur = (cur + " " + w).trim();
      }
      if (cur) small.push(cur + " ");
    }
  }
  const out: string[] = [];
  let cur = "";
  for (const u of small) {
    if ((cur + u).length > MAX_CHUNK && cur) { out.push(cur.trim()); cur = ""; }
    cur += u;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function translateText(text: string, langPair: "uz|ru" | "ru|uz"): Promise<string> {
  // Line by line so paragraph breaks survive; 3 requests at a time.
  const lines = text.split(/\r?\n/);
  const jobs: Array<{ line: number; text: string }> = [];
  lines.forEach((l, i) => piecesOf(l).forEach((t) => t && jobs.push({ line: i, text: t })));
  const done: string[] = new Array(jobs.length);
  for (let i = 0; i < jobs.length; i += 3) {
    const batch = jobs.slice(i, i + 3);
    const res = await Promise.all(batch.map((j) => translateChunk(j.text, langPair)));
    res.forEach((r, k) => { done[i + k] = r; });
  }
  return lines
    .map((_, i) => jobs.map((j, k) => (j.line === i ? done[k] : null)).filter(Boolean).join(" "))
    .join("\n");
}

export default function TranslateButton({
  source,
  direction,
  onResult,
  className = "",
}: {
  /** Manba matn (qaysi tildan tarjima qilinadi) */
  source: string;
  /** "uz->ru" yoki "ru->uz" */
  direction: "uz->ru" | "ru->uz";
  /** Tarjima natijasi */
  onResult: (translated: string) => void;
  className?: string;
}) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const text = source.trim();
    if (!text) {
      toast.error(t("Avval matnni kiriting", "Сначала введите текст"));
      return;
    }
    if (text.length > MAX_TOTAL) {
      toast.error(t(`Matn juda uzun: ${text.length} belgi (tarjima uchun ko'pi bilan ${MAX_TOTAL})`, `Текст слишком длинный: ${text.length} символов (для перевода не более ${MAX_TOTAL})`));
      return;
    }
    setLoading(true);
    try {
      const pair = direction === "uz->ru" ? "uz|ru" : "ru|uz";
      const translated = await translateText(text, pair);
      onResult(translated);
    } catch (e: any) {
      toast.error(t("Tarjima xatoligi: ", "Ошибка перевода: ") + (e?.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const label = direction === "uz->ru" ? "UZ → RU" : "RU → UZ";

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      title={t(`Avtomatik tarjima qilish (${label})`, `Автоматический перевод (${label})`)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
        bg-gradient-to-r from-amber-400 to-orange-500 text-white
        hover:from-amber-500 hover:to-orange-600
        disabled:opacity-60 disabled:cursor-wait
        shadow-sm transition-all ${className}`}
    >
      {loading ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
        </svg>
      )}
      {label}
    </button>
  );
}
