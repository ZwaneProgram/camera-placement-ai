import { CONTACT } from "@/lib/contact";

const PRODUCT_LINKS = [
  { label: "กล้องวงจรปิด", cat: "cctv" },
  { label: "เซ็นเซอร์", cat: "sensor" },
  { label: "สัญญาณกันขโมย", cat: "alarm" },
  { label: "สมาร์ทล็อค", cat: "lock" },
  { label: "ชุด NVR", cat: "nvr" },
];

export function SiteFooter() {
  return (
    <footer className="mt-5 bg-ink text-white">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)]">
              <span className="size-[11px] rounded-full border-[3px] border-white" />
            </span>
            <span className="text-lg font-bold">SUCCESS IT CENTER</span>
          </div>
          <p className="mb-4 max-w-[260px] text-sm leading-relaxed text-white/60">
            ระบบรักษาความปลอดภัยอัจฉริยะสำหรับบ้านและธุรกิจ พร้อมฟีเจอร์ AI
            ช่วยวางกล้อง
          </p>
          <div className="flex gap-2.5">
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-[42px] items-center justify-center rounded-[11px] bg-white/10 font-bold"
            >
              f
            </a>
            <a
              href={CONTACT.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[42px] items-center rounded-[11px] bg-success-line px-4 font-semibold"
            >
              LINE @successit
            </a>
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-[15px] font-bold">สินค้า</div>
          <div className="flex flex-col gap-2.5 text-sm text-white/60">
            {PRODUCT_LINKS.map((l) => (
              <a
                key={l.cat}
                href={`/products?cat=${l.cat}`}
                className="hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-[15px] font-bold">
            รับข่าวสาร &amp; โปรโมชั่น
          </div>
          <p className="mb-3 text-sm text-white/60">
            เพิ่มเราเป็นเพื่อนใน LINE รับส่วนลดพิเศษ
          </p>
          <a
            href={CONTACT.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] items-center justify-center rounded-xl bg-success-line font-bold text-white"
          >
            เพิ่มเพื่อนใน LINE
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2.5 px-5 py-[18px] text-[13px] text-white/45">
          <span>© 2026 SUCCESS IT CENTER · สงวนลิขสิทธิ์</span>
        </div>
      </div>
    </footer>
  );
}
