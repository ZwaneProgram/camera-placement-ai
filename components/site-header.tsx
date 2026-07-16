"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart } from "lucide-react";

import { CONTACT } from "@/lib/contact";

import { useSession, signOut } from "next-auth/react";

import { Logo } from "@/components/brand";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/products", label: "สินค้าทั้งหมด" },
  { href: "/products/1#ai-simulator", label: "AI ลองวางกล้อง", accent: true },
];

function isActive(pathname: string, href: string) {
  const path = href.split("#")[0];
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count, toggle } = useCart();
  const [navOpen, setNavOpen] = React.useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/[.88] shadow-[0_2px_16px_rgba(14,27,42,.05)] backdrop-blur-[12px]">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-3.5 sm:gap-[18px]">
        <Logo />

        <nav className="ml-2 hidden items-center gap-1.5 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center rounded-xl px-4 text-[15px] font-semibold transition-colors",
                  active
                    ? "bg-line-soft text-brand-blue"
                    : item.accent
                      ? "text-brand-blue hover:bg-line-soft"
                      : "text-ink hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {session?.user ? (
          <div className="hidden items-center gap-2 md:flex">
            {isAdmin && (
              <Link href="/admin" className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-blue hover:bg-line-soft">
                แอดมิน
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-secondary"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <Link href="/login" className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-secondary md:flex">
            เข้าสู่ระบบ
          </Link>
        )}

        <button
          onClick={toggle}
          className="relative flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          <ShoppingCart className="size-4" />
          <span className="hidden sm:inline">ตะกร้า</span>
          {count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-teal px-1.5 text-xs font-bold text-ink">
              {count}
            </span>
          )}
        </button>

        <button
          onClick={() => setNavOpen((o) => !o)}
          aria-label="เมนู"
          className="flex size-10 items-center justify-center rounded-[10px] border border-line bg-white md:hidden"
        >
          <Menu className="size-5 text-ink" />
        </button>
      </div>

      {navOpen && (
        <div className="flex flex-col gap-1 border-t border-line px-5 pt-2.5 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[10px] p-3 text-left text-base font-semibold",
                item.accent ? "text-brand-blue" : "text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
          {session?.user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-[10px] p-3 text-left text-base font-semibold text-brand-blue"
                >
                  แอดมิน
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-[10px] p-3 text-left text-base font-semibold text-ink"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-[10px] p-3 text-left text-base font-semibold text-ink"
            >
              เข้าสู่ระบบ
            </Link>
          )}

          <div className="mt-1.5 flex gap-2">
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-line bg-secondary font-bold text-brand-blue"
            >
              Facebook
            </a>
            <a
              href={CONTACT.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-success-line font-semibold text-white"
            >
              LINE
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
