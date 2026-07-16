"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatBaht } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const { open, setOpen, items, changeQty, remove, totalLabel } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="p-0" showClose={false}>
        <SheetHeader>
          <SheetTitle className="text-[19px]">ตะกร้าสินค้า</SheetTitle>
          <button
            onClick={() => setOpen(false)}
            className="flex size-[38px] items-center justify-center rounded-[10px] border border-line bg-white text-lg text-ink"
            aria-label="ปิด"
          >
            ✕
          </button>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-5">
              {items.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="sv-hatch size-[72px] shrink-0 rounded-xl border border-line" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-sm font-semibold leading-snug text-ink">
                      {c.name}
                    </div>
                    <div className="mb-2 text-[13px] font-bold text-brand-blue">
                      {formatBaht(c.price)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-[9px] border border-line">
                        <button
                          onClick={() => changeQty(c.id, -1)}
                          className="flex size-[30px] items-center justify-center bg-secondary"
                          aria-label="ลด"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {c.qty}
                        </span>
                        <button
                          onClick={() => changeQty(c.id, 1)}
                          className="flex size-[30px] items-center justify-center bg-secondary"
                          aria-label="เพิ่ม"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-[13px] text-muted-foreground underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {formatBaht(c.price * c.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line p-5">
              <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
                <span>ยอดรวมสินค้า</span>
                <span>{totalLabel}</span>
              </div>
              <div className="mb-2.5 flex justify-between text-sm text-muted-foreground">
                <span>ค่าจัดส่ง</span>
                <span className="font-semibold text-ink">ฟรี</span>
              </div>
              <div className="mb-4 flex justify-between text-[19px] font-bold">
                <span>รวมทั้งหมด</span>
                <span>{totalLabel}</span>
              </div>
              <Button variant="gradient" size="lg" className="w-full">
                สั่งซื้อสินค้า
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="mb-[18px] flex size-[70px] items-center justify-center rounded-[20px] border border-line bg-secondary">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div className="mb-1.5 text-[17px] font-bold">ตะกร้ายังว่างอยู่</div>
            <div className="mb-5 text-sm text-muted-foreground">
              เลือกสินค้าที่คุณสนใจได้เลย
            </div>
            <Button
              onClick={() => {
                setOpen(false);
                router.push("/products");
              }}
            >
              เลือกซื้อสินค้า
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
