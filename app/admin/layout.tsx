import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  return (
    <div className="mx-auto max-w-[960px] px-5 py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink">จัดการสินค้า</h1>
      {children}
    </div>
  );
}
