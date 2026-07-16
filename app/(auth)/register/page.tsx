import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[400px] px-5 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">สมัครสมาชิก</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand-blue">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
