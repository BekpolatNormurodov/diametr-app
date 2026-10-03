import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

import { useLang } from "../../context/LangContext";
export default function SignIn() {
  const { t } = useLang();
  return (
    <>
      <PageMeta title={t("Diametr Do'kon Admin", "Diametr — панель магазина")} description="Diametr Do'kon Admin Paneli" />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
