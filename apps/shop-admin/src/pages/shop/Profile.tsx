import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";
import axiosClient from "../../service/axios.service";
import { toast } from "../../components/ui/toast";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

export default function ProfilePage() {
  const userRaw = localStorage.getItem("user");
  const [user, setUser] = useState<any>(userRaw ? JSON.parse(userRaw) : null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [chatId, setChatId] = useState<string>(user?.chat_id ?? "");
  const [savingTg, setSavingTg] = useState(false);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) { toast.error("Eski va yangi parolni kiriting"); return; }
    if (newPassword !== confirmPassword) { toast.error("Yangi parollar mos kelmaydi"); return; }
    if (newPassword.length < 6) { toast.error("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setSaving(true);
    try {
      await axiosClient.patch(`/admin/${user?.id}`, { old_password: oldPassword, password: newPassword });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  const handleSaveChatId = async () => {
    if (!chatId.trim()) { toast.error("Chat ID kiriting"); return; }
    setSavingTg(true);
    try {
      const res = await axiosClient.patch("/admin/me", { chat_id: chatId.trim() });
      const updated = { ...user, chat_id: res.data?.chat_id ?? chatId.trim() };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Telegram ulandi");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSavingTg(false); }
  };

  const initials = (user?.fullname ?? "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <PageMeta title="Profil" description="Foydalanuvchi profili" />
      <PageBreadcrumb pageTitle="Profil" />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 dark:from-brand-700 dark:via-brand-600 dark:to-emerald-600" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user?.fullname ?? "—"}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.phone ?? "—"}</p>
              </div>
              {user?.shop && (
                <div className="ml-auto pb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {user.shop.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-sky-500">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Telegram bildirishnomalar</h3>
              <p className="text-xs text-gray-400">Obuna va buyurtmalar haqida xabar olish</p>
            </div>
            {user?.chat_id && (
              <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                Ulangan
              </span>
            )}
          </div>
          {!user?.chat_id && (
            <div className="mb-4 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30">
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1.5">Qanday ulash?</p>
              <ol className="text-xs text-sky-600 dark:text-sky-400 space-y-1 list-decimal list-inside">
                <li><a href="https://t.me/diametr_admin_bot" target="_blank" rel="noreferrer" className="font-semibold underline">@diametr_admin_bot</a> ga /start yuboring</li>
                <li>Bot Chat ID yuboradi — uni quyiga kiriting</li>
              </ol>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input type="text" placeholder="Chat ID" value={chatId} onChange={(e: any) => setChatId(e.target.value)} />
            </div>
            <Button onClick={handleSaveChatId} disabled={savingTg} size="sm">
              {savingTg ? "..." : user?.chat_id ? "Yangilash" : "Ulash"}
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Parolni o'zgartirish</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Eski parol</Label>
              <Input type="password" placeholder="Eski parol" value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Yangi parol</Label>
                <Input type="password" placeholder="Min 6 belgi" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Tasdiqlash</Label>
                <Input type="password" placeholder="Qayta kiriting" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handlePasswordChange} disabled={saving} className="w-full">
              {saving ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
            </Button>
          </div>
        </div>

      </div>
    </>
  );
}
