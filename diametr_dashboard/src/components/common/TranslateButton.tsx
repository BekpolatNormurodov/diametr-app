import { useState } from "react";
import { toast } from "../ui/toast";

/**
 * Free MyMemory translate API (no key required, has daily limit ~5000 words/day per IP).
 * Pair examples: "uz|ru", "ru|uz".
 */
async function translateText(text: string, langPair: "uz|ru" | "ru|uz"): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translate failed");
  const data = await res.json();
  const out: string = data?.responseData?.translatedText ?? "";
  if (!out) throw new Error("Empty translation");
  return out;
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
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const text = source.trim();
    if (!text) {
      toast.error("Avval matnni kiriting");
      return;
    }
    setLoading(true);
    try {
      const pair = direction === "uz->ru" ? "uz|ru" : "ru|uz";
      const translated = await translateText(text, pair);
      onResult(translated);
    } catch (e: any) {
      toast.error("Tarjima xatoligi: " + (e?.message ?? ""));
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
      title={`Avtomatik tarjima qilish (${label})`}
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
