"use client";

import * as React from "react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/admin/actions";

export function ProductRowActions({ id }: { id: number }) {
  const [pending, setPending] = React.useState(false);

  async function onDelete() {
    if (!confirm("ลบสินค้านี้?")) return;
    setPending(true);
    try {
      await deleteProduct(id);
      toast.success("ลบสินค้าแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={onDelete} disabled={pending} className="text-sm font-semibold text-destructive disabled:opacity-50">
      ลบ
    </button>
  );
}
