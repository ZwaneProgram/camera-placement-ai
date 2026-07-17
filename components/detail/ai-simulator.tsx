"use client";

import * as React from "react";
import { Sparkles, Upload, Download, RotateCcw, RotateCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type DecoratedProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

// ---------- API response types ----------

interface Placement {
  x: number;
  y: number;
  position: string;
  reason: string;
}

interface AnalyzeSuccess {
  placements: Placement[];
}

interface GenerateSuccess {
  generatedImage: string;
}

// ---------- State machine ----------

type AiState =
  | "idle"
  | "uploaded"
  | "analyzing"
  | "placements"
  | "generating"
  | "result"
  | "error";

const STATUS_LABEL: Record<AiState, string> = {
  idle: "รอการอัปโหลดรูปห้อง",
  uploaded: "อัปโหลดรูปแล้ว พร้อมวิเคราะห์",
  analyzing: "AI กำลังวิเคราะห์…",
  placements: "เลือกตำแหน่งที่ต้องการ",
  generating: "AI กำลังสร้างภาพจำลอง…",
  result: "สร้างภาพจำลองเสร็จแล้ว",
  error: "เกิดข้อผิดพลาด",
};

// Marker colours for each placement index
const MARKER_COLORS = ["#2F6BFF", "#5EE7D3", "#E55B4B"] as const;

// ---------- Component ----------

export const AiSimulator = React.forwardRef<
  HTMLDivElement,
  { product: DecoratedProduct; onAddToCart: () => void }
>(function AiSimulator({ product, onAddToCart }, ref) {
  const [state, setState] = React.useState<AiState>("idle");

  // The uploaded File (kept for FormData calls)
  const [file, setFile] = React.useState<File | null>(null);
  // data-URL of the uploaded image for display
  const [preview, setPreview] = React.useState<string | null>(null);

  const [placements, setPlacements] = React.useState<Placement[]>([]);
  const [selected, setSelected] = React.useState<number | null>(null); // index 0-2
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  // Full-screen image preview (lightbox). Holds the URL to show, or null.
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  // Landscape toggle (mobile) — rotates the lightbox image 90° so it fills
  // a portrait screen when the phone is turned sideways.
  const [rotated, setRotated] = React.useState(false);

  // Close the lightbox on Escape and lock body scroll while it's open.
  React.useEffect(() => {
    if (!lightbox) {
      setRotated(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const downloadRef = React.useRef<HTMLAnchorElement>(null);

  // ---- Helpers ----

  const reset = () => {
    setState("idle");
    setFile(null);
    setPreview(null);
    setPlacements([]);
    setSelected(null);
    setGeneratedImage(null);
    setErrorMsg(null);
    // Reset file input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setState("error");
  };

  // ---- File selection ----

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      showError("ไฟล์ที่เลือกไม่ใช่ภาพ กรุณาเลือกไฟล์ JPG หรือ PNG");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showError("ไฟล์มีขนาดเกิน 10MB กรุณาเลือกไฟล์ขนาดเล็กกว่านี้");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setFile(f);
      setState("uploaded");
    };
    reader.readAsDataURL(f);
  };

  // ---- Step 1: Analyze ----

  const analyze = async () => {
    if (!file) return;
    setState("analyzing");
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = (await res.json()) as Partial<AnalyzeSuccess> & { error?: string };

      if (!res.ok || json.error) {
        console.error("analyze error:", json.error ?? res.statusText);
        showError(json.error ?? "วิเคราะห์ไม่สำเร็จ ลองอีกครั้ง");
        return;
      }

      const pts = json.placements ?? [];
      if (pts.length === 0) {
        showError("ไม่พบตำแหน่งที่แนะนำในภาพนี้ ลองอัปโหลดรูปห้องที่มีแสงเพียงพอ");
        return;
      }

      setPlacements(pts);
      setSelected(null);
      setState("placements");
    } catch (err) {
      console.error("analyze fetch error:", err);
      showError("ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาตรวจสอบการเชื่อมต่อ");
    }
  };

  // ---- Step 2: Generate ----

  const generate = async () => {
    if (!file || selected === null) return;
    const chosen = placements[selected];
    if (!chosen) return;

    setState("generating");
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("selectedPosition", chosen.position);

      // For AI-tagged products, pass the clean product reference shot (2nd
      // image, plain bg) so the AI composites this exact camera into the room.
      if (product.ai) {
        const ref =
          product.images[1] ?? product.images[0] ?? product.imageUrl ?? null;
        if (ref) fd.append("productImageUrl", ref);
      }

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const json = (await res.json()) as Partial<GenerateSuccess> & { error?: string };

      if (!res.ok || json.error) {
        console.error("generate error:", json.error ?? res.statusText);
        showError(json.error ?? "สร้างภาพจำลองไม่สำเร็จ ลองอีกครั้ง");
        return;
      }

      if (!json.generatedImage) {
        showError("ไม่ได้รับภาพจาก AI กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setGeneratedImage(json.generatedImage);
      setState("result");
    } catch (err) {
      console.error("generate fetch error:", err);
      showError("ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาตรวจสอบการเชื่อมต่อ");
    }
  };

  // ---- Download ----

  const downloadImage = () => {
    if (!generatedImage) return;
    const a = downloadRef.current;
    if (!a) return;
    a.href = generatedImage;
    a.download = "ai-camera-placement.png";
    a.click();
  };

  // ---- Marker dragging (placements step) ----

  const imgWrapRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef<number | null>(null);

  const moveMarker = (clientX: number, clientY: number, i: number) => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const x = clamp(((clientX - rect.left) / rect.width) * 100);
    const y = clamp(((clientY - rect.top) / rect.height) * 100);
    setPlacements((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, x, y } : p))
    );
  };

  const onMarkerPointerDown = (e: React.PointerEvent, i: number) => {
    e.preventDefault();
    setSelected(i);
    draggingRef.current = i;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMarkerPointerMove = (e: React.PointerEvent, i: number) => {
    if (draggingRef.current !== i) return;
    moveMarker(e.clientX, e.clientY, i);
  };

  const onMarkerPointerUp = (e: React.PointerEvent, i: number) => {
    if (draggingRef.current !== i) return;
    draggingRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // ---- Status dot colour ----

  const statusDot =
    state === "error"
      ? "#e5484d"
      : state === "analyzing" || state === "generating"
        ? "#2F6BFF"
        : "#5EE7D3";

  // ---- Preview style helper ----

  const previewStyle: React.CSSProperties = preview
    ? {
        backgroundImage: `url(${preview})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "repeating-linear-gradient(45deg,#eef4f7,#eef4f7 12px,#e2ecf0 12px,#e2ecf0 24px)",
      };

  // ---- Chosen placement (for result state) ----
  const chosenPlacement = selected !== null ? placements[selected] ?? null : null;

  // ---- Render ----

  return (
    <section
      ref={ref}
      id="ai-simulator"
      className="relative mt-12 scroll-mt-24 overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#0E1B2A_0%,#123b5e_55%,#1a5fa8_100%)] p-6 sm:p-11"
    >
      <div className="sv-dots-teal absolute inset-0 opacity-70" />
      {/* Hidden anchor for download */}
      <a ref={downloadRef} className="hidden" />

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

          {/* ── IDLE ── */}
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

          {/* ── UPLOADED ── */}
          {state === "uploaded" && (
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative h-[150px] w-[200px] shrink-0 overflow-hidden rounded-[14px] border border-line">
                <div className="absolute inset-0" style={previewStyle} />
                <span className="absolute bottom-2 left-2 rounded-md bg-white px-[7px] py-[3px] font-mono text-[11px] text-muted-foreground">
                  รูปที่อัปโหลด
                </span>
              </div>
              <div className="min-w-[220px] flex-1">
                <div className="mb-1.5 text-lg font-bold text-ink">
                  พร้อมวิเคราะห์ตำแหน่งแล้ว
                </div>
                <div className="mb-[18px] text-sm leading-relaxed text-muted-foreground">
                  AI จะวิเคราะห์ผังห้องและแนะนำตำแหน่งติดตั้ง{" "}
                  <b className="text-ink">{product.displayName}</b> ที่ครอบคลุมที่สุด
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="gradient" onClick={analyze} className="h-12">
                    <Sparkles className="size-4" /> วิเคราะห์ตำแหน่งด้วย AI
                  </Button>
                  <Button variant="soft" onClick={reset} className="h-12">
                    เปลี่ยนรูป
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {state === "analyzing" && (
            <div className="px-5 py-9 text-center">
              <div className="mx-auto mb-[22px] size-[58px] animate-sv-spin rounded-full border-[5px] border-line border-t-brand-blue" />
              <div className="mb-1.5 text-lg font-bold text-ink">
                AI กำลังวิเคราะห์มุมห้อง…
              </div>
              <div className="mb-5 text-sm text-muted-foreground">
                กำลังค้นหาตำแหน่งที่ครอบคลุมพื้นที่สูงสุด
              </div>
              {/* Indeterminate animated bar */}
              <div className="mx-auto h-2.5 max-w-[420px] overflow-hidden rounded-full bg-line">
                <div className="h-full w-1/2 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#5EE7D3,#2F6BFF,#5EE7D3)] bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {/* ── PLACEMENTS ── */}
          {state === "placements" && (
            <div>
              <div className="mb-1.5 text-[15px] font-bold text-ink">
                เลือกตำแหน่งที่ต้องการติดตั้ง
              </div>
              <div className="mb-4 text-[13px] text-muted-foreground">
                แตะเพื่อเลือก · ลากหมุดเพื่อปรับตำแหน่งบนภาพได้
              </div>

              {/* Image with draggable markers */}
              <div
                ref={imgWrapRef}
                className="relative mb-5 w-full touch-none overflow-hidden rounded-[14px] border border-line"
                style={{ aspectRatio: "4/3" }}
              >
                <div className="absolute inset-0" style={previewStyle} />
                {placements.map((p, i) => (
                  <button
                    key={i}
                    onPointerDown={(e) => onMarkerPointerDown(e, i)}
                    onPointerMove={(e) => onMarkerPointerMove(e, i)}
                    onPointerUp={(e) => onMarkerPointerUp(e, i)}
                    title={p.position}
                    className={cn(
                      "absolute flex size-8 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-lg transition-[box-shadow] cursor-grab active:cursor-grabbing active:scale-110",
                      selected === i ? "scale-110 ring-2 ring-white ring-offset-2" : ""
                    )}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      background: MARKER_COLORS[i],
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Placement list */}
              <div className="mb-5 flex flex-col gap-2.5">
                {placements.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors",
                      selected === i
                        ? "border-brand-teal bg-[#f4fdfb]"
                        : "border-line bg-white hover:border-brand-teal/50 hover:bg-[#f9fffe]"
                    )}
                  >
                    <span
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: MARKER_COLORS[i] }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink">{p.position}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {p.reason}
                      </div>
                    </div>
                    {selected === i && (
                      <span className="ml-auto shrink-0 text-brand-teal">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="gradient"
                  onClick={generate}
                  disabled={selected === null}
                  className="h-12"
                >
                  <Sparkles className="size-4" /> สร้างภาพจำลอง
                </Button>
                <Button variant="soft" onClick={reset} className="h-12">
                  เปลี่ยนรูป
                </Button>
              </div>
            </div>
          )}

          {/* ── GENERATING ── */}
          {state === "generating" && (
            <div className="px-5 py-9 text-center">
              <div className="mx-auto mb-[22px] size-[58px] animate-sv-spin rounded-full border-[5px] border-line border-t-brand-blue" />
              <div className="mb-1.5 text-lg font-bold text-ink">
                AI กำลังสร้างภาพจำลอง…
              </div>
              <div className="mb-5 text-sm text-muted-foreground">
                กำลังวาดกล้องลงในภาพห้องของคุณ อาจใช้เวลาสักครู่
              </div>
              <div className="mx-auto h-2.5 max-w-[420px] overflow-hidden rounded-full bg-line">
                <div className="h-full w-1/2 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#5EE7D3,#2F6BFF,#5EE7D3)] bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {state === "result" && generatedImage && (
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-muted-foreground">
                    ภาพต้นฉบับ
                  </div>
                  <div
                    onClick={() => preview && setLightbox(preview)}
                    className="relative cursor-zoom-in overflow-hidden rounded-[14px] border border-line"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <div className="absolute inset-0" style={previewStyle} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-brand-blue">
                    ✦ AI วางกล้องแล้ว
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedImage}
                    alt="ภาพจำลองตำแหน่งกล้องวงจรปิด"
                    onClick={() => setLightbox(generatedImage)}
                    title="คลิกเพื่อดูภาพขยาย"
                    className="w-full cursor-zoom-in rounded-[14px] border-2 border-brand-teal object-cover"
                    style={{ aspectRatio: "4/3" }}
                  />
                </div>
              </div>

              {chosenPlacement && (
                <div className="mt-5 rounded-[14px] border border-[#cbf3ec] bg-[#f4fdfb] px-5 py-[18px]">
                  <div className="mb-2.5 text-[15px] font-bold text-ink">
                    คำแนะนำการติดตั้งจาก AI
                  </div>
                  <div className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                    <span
                      className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: selected !== null ? MARKER_COLORS[selected] : MARKER_COLORS[0] }}
                    >
                      {selected !== null ? selected + 1 : 1}
                    </span>
                    <div>
                      <div className="font-semibold">{chosenPlacement.position}</div>
                      <div className="mt-0.5 text-muted-foreground">{chosenPlacement.reason}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-[18px] flex flex-wrap gap-2.5">
                <Button
                  onClick={onAddToCart}
                  className="h-[50px] min-w-[200px] flex-1"
                >
                  เพิ่มลงตะกร้า · {product.priceLabel}
                </Button>
                <Button variant="soft" onClick={downloadImage} className="h-[50px]">
                  <Download className="size-4" /> ดาวน์โหลดภาพ
                </Button>
                <Button variant="soft" onClick={reset} className="h-[50px]">
                  <RotateCcw className="size-4" /> ลองใหม่
                </Button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {state === "error" && (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-[18px] flex size-[60px] items-center justify-center rounded-full bg-[#fdecec] text-3xl font-bold text-destructive">
                !
              </div>
              <div className="mb-1.5 text-lg font-bold text-ink">
                ไม่สามารถประมวลผลได้
              </div>
              {errorMsg && (
                <div className="mx-auto mb-5 max-w-[400px] text-sm text-muted-foreground">
                  {errorMsg}
                </div>
              )}
              <div className="flex justify-center gap-2.5">
                {preview && (
                  <Button
                    onClick={() => {
                      setErrorMsg(null);
                      setState("uploaded");
                    }}
                    className="h-[46px] bg-brand-blue"
                  >
                    ลองใหม่
                  </Button>
                )}
                <Button variant="soft" onClick={reset} className="h-[46px]">
                  <RotateCcw className="size-4" /> อัปโหลดใหม่
                </Button>
              </div>
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

      {/* Full-screen lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex animate-sv-fade items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="ปิด"
            className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="size-5" />
          </button>
          {/* Landscape rotate — mobile only */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRotated((r) => !r);
            }}
            aria-label="หมุนภาพแนวนอน"
            className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/25 md:hidden"
          >
            <RotateCw className="size-4" />
            {rotated ? "แนวตั้ง" : "แนวนอน"}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="ภาพขยาย"
            onClick={(e) => e.stopPropagation()}
            style={
              rotated
                ? { maxWidth: "92vh", maxHeight: "92vw" }
                : { maxWidth: "94vw", maxHeight: "92vh" }
            }
            className={cn(
              "rounded-xl object-contain shadow-2xl transition-transform duration-300",
              rotated && "rotate-90"
            )}
          />
        </div>
      )}
    </section>
  );
});
