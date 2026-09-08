import { useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { toast } from "../ui/toast";
import axiosClient from "../../service/axios.service";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!login.trim() || !password.trim()) {
      toast.error("Login va parolni kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", { login: login.replace(/\+/g, ''), password });

      const user = res.data?.user ?? res.data;
      const role: string = (user?.role ?? "").toUpperCase();

      if (role !== "ADMIN") {
        toast.error("Bu panel faqat Do'kon Adminlari uchun mo'ljallangan");
        return;
      }

      if (!user?.shop_id) {
        toast.error("Sizning akkauntingizga do'kon biriktirilmagan");
        return;
      }

      const token = res.data.access_token ?? res.data.token ?? "";
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("shop_id", String(user.shop_id));

      toast.success("Kirish muvaffaqiyatli");
      navigate("/");
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? "Login yoki parol noto'g'ri";
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
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Do'kon Admin</span>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Do'kon Paneliga Kirish
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Buyurtmalar, to'lovlar va tovarlarni boshqaring
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Login <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="998XXXXXXXXX"
                  value={login}
                  onChange={(e) => setLogin(e.target.value.replace(/[^0-9+]/g, ''))}
                />
              </div>

              <div>
                <Label>
                  Parol <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parol kiriting"
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
                  {loading ? "Kirish..." : "Kirish"}
                </Button>
                {(login.trim().length > 0 && login.trim().length < 12) && (
                  <p className="text-xs text-error-500 mt-1">Login kamida 12 ta belgi bo'lishi kerak</p>
                )}
                {(password.trim().length > 0 && password.trim().length < 8) && (
                  <p className="text-xs text-error-500 mt-1">Parol kamida 8 ta belgi bo'lishi kerak</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
