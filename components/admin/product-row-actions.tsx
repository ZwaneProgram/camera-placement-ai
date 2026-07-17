"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/app/admin/actions";

export function ProductRowActions({ id, name }: { id: number; name?: string }) {
  const [pending, setPending] = React.useState(false);

  async function onDelete() {
    if (!confirm(`ลบ "${name ?? "สินค้านี้"}" ออกจากแคตตาล็อก?`)) return;
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
    <Button
      type="button"
      onClick={onDelete}
      disabled={pending}
      variant="ghost"
      size="icon"
      aria-label={`ลบ ${name ?? "สินค้า"}`}
      className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
