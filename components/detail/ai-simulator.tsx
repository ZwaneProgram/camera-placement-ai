"use client";

import * as React from "react";
import { Sparkles, Upload, Download, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLACEMENT_NOTES, type DecoratedProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

type AiState = "idle" | "uploaded" | "processing" | "result" | "error";

const STATUS_LABEL: Record<AiState, string> = {
  idle: "รอการอัปโหลดรูปห้อง",
  uploaded: "อัปโหลดรูปแล้ว พร้อมสร้างภาพ",
  processing: "กำลังประมวลผลด้วย AI…",
  result: "สร้างภาพจำลองเสร็จแล้ว",
  error: "เกิดข้อผิดพลาด",
};

export const AiSimulator = React.forwardRef<
  HTMLDivElement,
  { product: DecoratedProduct; onAddToCart: () => void }
>(function AiSimulator({ product, onAddToCart }, ref) {
  const [state, setState] = React.useState<AiState>("idle");
  const [room, setRoom] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRoom(ev.target?.result as string);
      setState("uploaded");
    };
    reader.readAsDataURL(f);
  };

  const generate = () => {
    setState("processing");
    setProgress(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.round(6 + Math.random() * 8);
        if (next >= 100) {
          if (timer.current) clearInterval(timer.current);
          setState("result");
          return 100;
        }
        return next;
      });
    }, 90);
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setState("idle");
    setRoom(null);
    setProgress(0);
  };

  const roomStyle: React.CSSProperties =
    room && room.startsWith("data:")
      ? {
          backgroundImage: `url(${room})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          background:
            "repeating-linear-gradient(45deg,#eef4f7,#eef4f7 12px,#e2ecf0 12px,#e2ecf0 24px)",
        };

  const statusDot =
    state === "error" ? "#e5484d" : state === "processing" ? "#2F6BFF" : "#5EE7D3";

  return (
    <section
      ref={ref}
      id="ai-simulator"
      className="relative mt-12 scroll-mt-24 overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#0E1B2A_0%,#123b5e_55%,#1a5fa8_100%)] p-6 sm:p-11"
    >
      <div className="sv-dots-teal absolute inset-0 opacity-70" />
      <div className="relative">
        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-teal/40 bg-brand-teal/15 px-3 py-1.5 text-[13px] font-bold text-brand-teal">
          <Sparkles className="size-3.5" /> AI PLACEMENT SIMULATOR
        </span>
        <h2 className="mb-2 text-[clamp(24px,3.4vw,34px)] font-bold tracking-tight text-white">
          ลองวางกล้องในห้องของคุณ
        </h2>
        <p className="mb-6 max-w-[560px] text-base leading-relaxed text-white/75">
          อัปโหลดรูปห้อง แล้ว AI จะจำลองภาพเดิมพร้อมตำแหน่งติดตั้งกล้องที่ครอบคลุมที่สุด
        </p>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,.28)] sm:p-7">
          {state === "idle" && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-[18px] border-[2.5px] border-dashed border-brand-teal bg-[#f4fdfb] px-6 py-13 text-center transition-colors hover:border-brand-blue hover:bg-[#ecfbf7]"
              >
                <div className="mx-auto mb-[18px] flex size-16 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)]">
                  <Upload className="size-6 text-white" />
                </div>
                <div className="mb-1.5 text-lg font-bold text-ink">
                  ลากรูปห้องมาวาง หรือคลิกเพื่ออัปโหลด
                </div>
                <div className="text-sm text-muted-foreground">
                  รองรับ JPG, PNG · ไม่เกิน 10MB
                </div>
                <div className="mt-[18px] inline-flex gap-2.5">
                  <span className="inline-flex h-11 items-center rounded-xl bg-ink px-[22px] text-[15px] font-bold text-white">
                    เลือกรูปภาพ
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoom("sample");
                      setState("uploaded");
                    }}
                    className="h-11 rounded-xl border-[1.5px] border-line bg-secondary px-[18px] text-sm font-semibold text-ink"
                  >
                    ใช้รูปตัวอย่าง
                  </button>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFile}
                className="hidden"
              />
            </>
          )}

          {state === "uploaded" && (
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative h-[150px] w-[200px] shrink-0 overflow-hidden rounded-[14px] border border-line">
                <div className="absolute inset-0" style={roomStyle} />
                <span className="absolute bottom-2 left-2 rounded-md bg-white px-[7px] py-[3px] font-mono text-[11px] text-muted-foreground">
                  รูปที่อัปโหลด
                </span>
              </div>
              <div className="min-w-[220px] flex-1">
                <div className="mb-1.5 text-lg font-bold text-ink">
                  พร้อมสร้างภาพจำลองแล้ว
                </div>
                <div className="mb-[18px] text-sm leading-relaxed text-muted-foreground">
                  AI จะวิเคราะห์ผังห้องและเลือกตำแหน่งติดตั้ง{" "}
                  <b className="text-ink">{product.name}</b> ที่ครอบคลุมที่สุด
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="gradient" onClick={generate} className="h-12">
                    <Sparkles className="size-4" /> สร้างภาพจำลอง
                  </Button>
                  <Button variant="soft" onClick={reset} className="h-12">
                    เปลี่ยนรูป
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "processing" && (
            <div className="px-5 py-9 text-center">
              <div className="mx-auto mb-[22px] size-[58px] animate-sv-spin rounded-full border-[5px] border-line border-t-brand-blue" />
              <div className="mb-1.5 text-lg font-bold text-ink">
                กำลังสร้างภาพจำลอง…
              </div>
              <div className="mb-5 text-sm text-muted-foreground">
                AI กำลังวิเคราะห์มุมห้องและตำแหน่งติดตั้ง
              </div>
              <div className="mx-auto h-2.5 max-w-[420px] overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#5EE7D3,#2F6BFF)] transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 font-mono text-[13px] font-semibold text-brand-blue">
                {progress}%
              </div>
            </div>
          )}

          {state === "result" && (
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-muted-foreground">
                    ภาพต้นฉบับ
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-line">
                    <div className="absolute inset-0" style={roomStyle} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-brand-blue">
                    ✦ AI วางกล้องแล้ว
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border-2 border-brand-teal">
                    <div className="absolute inset-0" style={roomStyle} />
                    <div className="absolute top-[12%] right-[14%] flex size-[30px] animate-sv-ping items-center justify-center rounded-full bg-brand-blue font-bold text-white">
                      1
                    </div>
                    <div className="absolute bottom-[20%] left-[16%] flex size-[30px] items-center justify-center rounded-full border-2 border-white bg-brand-teal font-bold text-ink">
                      2
                    </div>
                    <div className="absolute top-[12%] right-[14%] h-[60%] w-[44%] translate-x-[-6px] translate-y-[10px] rounded-xl border-2 border-dashed border-brand-blue/55" />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[14px] border border-[#cbf3ec] bg-[#f4fdfb] px-5 py-[18px]">
                <div className="mb-2.5 text-[15px] font-bold text-ink">
                  คำแนะนำการติดตั้งจาก AI
                </div>
                <div className="flex flex-col gap-2">
                  {PLACEMENT_NOTES.map((n) => (
                    <div
                      key={n.num}
                      className="flex gap-2.5 text-sm leading-relaxed text-ink"
                    >
                      <span
                        className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: n.color }}
                      >
                        {n.num}
                      </span>
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-[18px] flex flex-wrap gap-2.5">
                <Button
                  onClick={onAddToCart}
                  className="h-[50px] min-w-[200px] flex-1"
                >
                  เพิ่มลงตะกร้า · {product.priceLabel}
                </Button>
                <Button variant="soft" className="h-[50px]">
                  <Download className="size-4" /> ดาวน์โหลด / บันทึก
                </Button>
                <Button variant="soft" onClick={reset} className="h-[50px]">
                  <RotateCcw className="size-4" /> ลองใหม่
                </Button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-[18px] flex size-[60px] items-center justify-center rounded-full bg-[#fdecec] text-3xl font-bold text-destructive">
                !
              </div>
              <div className="mb-1.5 text-lg font-bold text-ink">
                ไม่สามารถประมวลผลรูปได้
              </div>
              <div className="mx-auto mb-5 max-w-[360px] text-sm text-muted-foreground">
                รูปอาจมืดเกินไปหรือไม่ใช่ภาพห้อง กรุณาลองอัปโหลดรูปห้องที่มีแสงเพียงพออีกครั้ง
              </div>
              <Button onClick={reset} className="h-[46px] bg-brand-blue">
                อัปโหลดใหม่
              </Button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="mt-[22px] flex items-center gap-3 rounded-[14px] border border-white/15 bg-white/[.07] px-[18px] py-3.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: statusDot, boxShadow: `0 0 0 4px rgba(94,231,211,.18)` }}
          />
          <div className="text-[13px] font-semibold text-white/60">
            สถานะปัจจุบัน
          </div>
          <div className="text-[15px] font-bold text-white">
            {STATUS_LABEL[state]}
          </div>
          <div className="ml-auto font-mono text-xs text-white/45">{state}</div>
        </div>
      </div>
    </section>
  );
});
