import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import LangSwitcher from "../components/common/LangSwitcher";
import { formatPhoneNumber } from "../service/formatters/phone.format";
import { endSession } from "../service/session";
import { useLang } from "../context/LangContext";

interface StoredUser {
  fullname?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: string | null;
}

function readUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null");
  } catch {
    return null;
  }
}

/**
 * The signed-in Super Admin: who is logged in, the panel language and sign-out.
 * (Replaces the template cards: their social links and "Edit" form were fake.)
 */
export default function UserProfiles() {
  const { t } = useLang();
  const user = readUser();
  const name = user?.fullname?.trim() || "Admin";
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const rows: [string, string][] = [
    [t("To'liq ism", "Полное имя"), name],
    [t("Telefon", "Телефон"), formatPhoneNumber(user?.phone) || "—"],
    [t("Rol", "Роль"), "Super Admin"],
  ];

  return (
    <>
      <PageMeta title={t("Profil | Diametr", "Профиль | Diametr")} description={t("Diametr boshqaruv paneli", "Панель управления Diametr")} />
      <PageBreadcrumb pageTitle={t("Profil", "Профиль")} />
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-5 p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row lg:p-6">
          <div className="flex items-center justify-center w-20 h-20 overflow-hidden text-2xl font-semibold border border-gray-200 rounded-full shrink-0 bg-brand-50 text-brand-600 dark:border-gray-800 dark:bg-brand-500/15 dark:text-brand-400">
            {user?.image ? (
              <img src={import.meta.env.VITE_STATIC_PATH + user.image} alt={name} className="object-cover w-full h-full" />
            ) : (
              initials
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatPhoneNumber(user?.phone)}</p>
            <span className="inline-block px-2.5 py-0.5 mt-2 text-xs font-semibold rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              Super Admin
            </span>
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h4 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
            {t("Shaxsiy ma'lumotlar", "Личные данные")}
          </h4>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 break-words dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4 p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between lg:p-6">
          <div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">{t("Panel tili", "Язык панели")}</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("Server xabarlari ham shu tilda keladi", "Сообщения сервера тоже приходят на этом языке")}
            </p>
          </div>
          <LangSwitcher />
        </div>

        <button
          type="button"
          onClick={() => endSession()}
          className="w-full px-4 py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-xl bg-white hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10 sm:w-auto"
        >
          {t("Tizimdan chiqish", "Выйти из системы")}
        </button>
      </div>
    </>
  );
}
