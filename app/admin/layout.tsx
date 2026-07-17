import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-8">
      {/* Console banner — the one bold, branded element. */}
      <div className="sv-dots-light relative overflow-hidden rounded-[22px] bg-ink px-6 py-6 text-white shadow-[0_18px_40px_rgba(14,27,42,.22)]">
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-brand-teal">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-2 animate-sv-ping rounded-full bg-brand-teal" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-teal" />
              </span>
              ผู้ดูแลระบบ · Admin
            </span>
            <h1 className="mt-1.5 font-sans text-[26px] font-bold leading-tight">
              จัดการสินค้า
            </h1>
            {session.user?.email && (
              <p className="mt-1 text-sm text-white/55">
                เข้าสู่ระบบในชื่อ {session.user.email}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-4" />
            กลับหน้าร้าน
          </Link>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
