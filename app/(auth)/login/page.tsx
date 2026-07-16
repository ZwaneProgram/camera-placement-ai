import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[400px] px-5 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">เข้าสู่ระบบ</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-semibold text-brand-blue">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
