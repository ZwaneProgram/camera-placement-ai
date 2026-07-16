"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const data = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="email" type="email" required placeholder="อีเมล"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="password" type="password" required placeholder="รหัสผ่าน"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <button disabled={pending}
        className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
