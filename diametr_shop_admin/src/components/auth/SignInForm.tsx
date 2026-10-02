import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { toast } from "../ui/toast";
import axiosClient from "../../service/axios.service";
import { takeExpiredFlag } from "../../service/session";
import { useLang } from "../../context/LangContext";
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT } from "../../utils/password";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useLang();

  // Sent here by a 401 / an expired token: say why, once. (The toast host
  // registers in its own effect, which runs after this one.)
  useEffect(() => {
    if (takeExpiredFlag()) {
      setTimeout(() => toast.warning(t("Sessiya muddati tugadi. Qaytadan kiring", "Сессия истекла. Войдите снова")), 0);
    }
  }, [t]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!login.trim() || !password.trim()) {
      toast.error(t("Login va parolni kiriting", "Введите логин и пароль"));
      return;
    }
    // The server accepts no shorter password at login; say so in Uzbek instead of a 400.
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(t(PASSWORD_TOO_SHORT, `Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`));
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", { login: login.replace(/\+/g, ''), password });

      const user = res.data?.user ?? res.data;
      const role: string = (user?.role ?? "").toUpperCase();

      if (role !== "ADMIN") {
        toast.error(t("Bu panel faqat Do'kon Adminlari uchun mo'ljallangan", "Эта панель только для администраторов магазинов"));
        return;
      }

      if (!user?.shop_id) {
        toast.error(t("Sizning akkauntingizga do'kon biriktirilmagan", "К вашему аккаунту не привязан магазин"));
        return;
      }

      const token = res.data.access_token ?? res.data.token ?? "";
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("shop_id", String(user.shop_id));

      toast.success(t("Kirish muvaffaqiyatli", "Вход выполнен"));
      navigate("/");
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? t("Login yoki parol noto'g'ri", "Неверный логин или пароль");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto" />
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{t("Do'kon Admin", "Админ магазина")}</span>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("Do'kon Paneliga Kirish", "Вход в панель магазина")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("Buyurtmalar, to'lovlar va tovarlarni boshqaring", "Управляйте заказами, платежами и товарами")}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  {t("Login", "Логин")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="998XXXXXXXXX"
                  value={login}
                  onChange={(e) => setLogin(e.target.value.replace(/[^0-9+]/g, ''))}
                />
              </div>

              <div>
                <Label>
                  {t("Parol", "Пароль")} <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("Parol kiriting", "Введите пароль")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" size="sm" disabled={loading || login.trim().length < 12 || password.trim().length < 8}>
                  {loading ? t("Kirish...", "Вход...") : t("Kirish", "Войти")}
                </Button>
                {(login.trim().length > 0 && login.trim().length < 12) && (
                  <p className="text-xs text-error-500 mt-1">{t("Login kamida 12 ta belgi bo'lishi kerak", "Логин должен содержать не менее 12 символов")}</p>
                )}
                {(password.trim().length > 0 && password.trim().length < 8) && (
                  <p className="text-xs text-error-500 mt-1">{t("Parol kamida 8 ta belgi bo'lishi kerak", "Пароль должен содержать не менее 8 символов")}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
