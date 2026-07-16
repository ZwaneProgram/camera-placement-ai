"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { registerUser } from "@/lib/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const data = new FormData(e.currentTarget);
    const result = await registerUser(data);
    if (result.error) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setPending(false);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="name" type="text" placeholder="ชื่อ (ไม่บังคับ)"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="email" type="email" required placeholder="อีเมล"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="password" type="password" required minLength={8} placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <button disabled={pending}
        className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังสมัคร…" : "สมัครสมาชิก"}
      </button>
    </form>
  );
}
