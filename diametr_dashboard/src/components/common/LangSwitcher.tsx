import { useLang } from "../../context/LangContext";

/**
 * OZ / РУС chip — matches the customer site (diametr.uz) so the two
 * surfaces feel like one product. Segmented control: the active language
 * is the emerald pill, the other is a plain button.
 */
export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const btn = (val: "uz" | "ru", label: string) => {
    const active = lang === val;
    return (
      <button
        key={val}
        type="button"
        onClick={() => setLang(val)}
        aria-pressed={active}
        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
          active
            ? "bg-emerald-500 text-white shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/[0.06] p-0.5">
      {btn("uz", "O'Z")}
      {btn("ru", "РУС")}
    </div>
  );
}
