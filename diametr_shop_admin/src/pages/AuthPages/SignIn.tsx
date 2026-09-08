import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta title="Diametr Do'kon Admin" description="Diametr Do'kon Admin Paneli" />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
