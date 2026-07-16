import type { Product as DbProduct } from "@prisma/client";
import { formatBaht } from "@/lib/utils";

export type ProductType = "cctv" | "sensor" | "alarm" | "lock" | "nvr";

export const PRODUCT_TYPES: ProductType[] = [
  "cctv",
  "sensor",
  "alarm",
  "lock",
  "nvr",
];

/** Thai label for each product type (was previously stored per-row as typeLabel). */
export const TYPE_LABEL: Record<ProductType, string> = {
  cctv: "กล้องวงจรปิด",
  sensor: "เซ็นเซอร์",
  alarm: "สัญญาณกันขโมย",
  lock: "สมาร์ทล็อค",
  nvr: "ชุด NVR",
};

/** Row shape consumed by the UI. `oldPrice`/`imageUrl` may be null in the DB. */
export type Product = DbProduct;

const TAG_MAP: Record<ProductType, string[]> = {
  cctv: ["", "อินฟราเรดกลางคืน", "ดูผ่านมือถือ"],
  sensor: ["ไร้สาย", "แจ้งเตือนทันที"],
  alarm: ["เสียง 120dB", "ติดตั้งง่าย"],
  lock: ["สแกนลายนิ้วมือ", "ปลดล็อกผ่านแอป"],
  nvr: ["บันทึก 24 ชม.", "HDD 2TB"],
};

export interface DecoratedProduct {
  id: number;
  name: string;
  en: string;
  type: ProductType;
  typeLabel: string;
  brand: string;
  res: string;
  price: number;
  old: number;
  rating: number;
  reviews: number;
  ai: boolean;
  imageUrl: string | null;
  images: string[];
  priceLabel: string;
  oldPriceLabel: string;
  discount: number;
  ratingLabel: string;
  reviewsLabel: string;
  tags: string[];
}

export function decorate(p: Product): DecoratedProduct {
  const type = p.type as ProductType;
  const old = p.oldPrice ?? p.price;
  const tags = (TAG_MAP[type] ?? [])
    .map((t, i) => (i === 0 && type === "cctv" ? p.res : t))
    .filter(Boolean)
    .slice(0, 3);
  return {
    id: p.id,
    name: p.name,
    en: p.en,
    type,
    typeLabel: TYPE_LABEL[type] ?? p.type,
    brand: p.brand,
    res: p.res,
    price: p.price,
    old,
    rating: p.rating,
    reviews: p.reviews,
    ai: p.ai,
    imageUrl: p.imageUrl,
    images: p.images,
    priceLabel: formatBaht(p.price),
    oldPriceLabel: formatBaht(old),
    discount: old > p.price ? Math.round((1 - p.price / old) * 100) : 0,
    ratingLabel: p.rating.toFixed(1),
    reviewsLabel: `(${p.reviews})`,
    tags,
  };
}

export function productHighlights(p: DecoratedProduct): string[] {
  switch (p.type) {
    case "cctv":
      return [
        `ความละเอียด ${p.res !== "-" ? p.res : "สูง"} ภาพคมชัด`,
        "มองเห็นกลางคืน (Night Vision) ชัดแม้ในที่มืด",
        "ดูสด/ย้อนหลังผ่านมือถือได้ทุกที่ทั่วโลก",
        "แจ้งเตือนทันทีเมื่อตรวจจับความเคลื่อนไหว",
      ];
    case "sensor":
      return [
        "เชื่อมต่อไร้สาย ติดตั้งเองได้ง่ายไม่ต้องเจาะผนัง",
        "แบตเตอรี่ใช้งานยาวนาน ไม่ต้องชาร์จบ่อย",
        "แจ้งเตือนทันทีเมื่อตรวจพบการเคลื่อนไหว",
        "ทนทานทุกสภาพอากาศ เหมาะทั้งในและนอกอาคาร",
      ];
    case "alarm":
      return [
        "เสียงไซเรนดังสูง ขับไล่ผู้บุกรุกได้ทันที",
        "กันงัดแงะ (Tamper-proof) แตะปลอก-แจ้งเตือนทันที",
        "สั่งเปิด/ปิดระบบผ่านแอปได้จากทุกที่",
        "สำรองไฟในตัว ทำงานต่อเนื่องแม้ไฟดับ",
      ];
    case "lock":
      return [
        "ปลดล็อกด้วยลายนิ้วมือ รหัส หรือแอปมือถือ",
        "ล็อกอัตโนมัติเมื่อประตูปิด ไม่ต้องกังวลลืมล็อก",
        "สร้างรหัสชั่วคราวให้แขกหรือช่างได้สะดวก",
        "แจ้งเตือนการเข้า-ออกทุกครั้งผ่านแอป",
      ];
    case "nvr":
      return [
        "บันทึกภาพต่อเนื่อง 24 ชั่วโมง ไม่มีช่องว่าง",
        `รองรับหลายกล้องพร้อมกัน ครอบคลุมทุกมุม`,
        "ดูย้อนหลังจากมือถือได้ทุกที่ทุกเวลา",
        "พื้นที่จัดเก็บขนาดใหญ่ รองรับการบันทึกระยะยาว",
      ];
  }
}

export function productDesc(p: DecoratedProduct): string {
  switch (p.type) {
    case "cctv":
      return `${p.brand} ${p.name} กล้องวงจรปิดความละเอียดสูง ออกแบบสำหรับบ้านและธุรกิจในประเทศไทย มองเห็นกลางคืนได้ชัดเจน รองรับดูสดและย้อนหลังผ่านแอปบนมือถือ พร้อมระบบแจ้งเตือนเมื่อตรวจจับความเคลื่อนไหว รับประกันศูนย์ไทย`;
    case "sensor":
      return `${p.brand} ${p.name} เซ็นเซอร์ตรวจจับไร้สายคุณภาพสูง ติดตั้งง่ายไม่ต้องเดินสาย แจ้งเตือนทันทีผ่านแอปเมื่อตรวจพบความเคลื่อนไหวหรือการบุกรุก เหมาะสำหรับบ้านพักอาศัยและสถานประกอบการ`;
    case "alarm":
      return `${p.brand} ${p.name} ระบบสัญญาณกันขโมยเสียงดังสูง ป้องกันการบุกรุกด้วยไซเรนอัตโนมัติ สั่งการผ่านแอปมือถือ พร้อมระบบสำรองไฟเพื่อให้ทำงานได้แม้ในยามไฟดับ`;
    case "lock":
      return `${p.brand} ${p.name} สมาร์ทล็อคอัจฉริยะสำหรับการควบคุมการเข้าออก รองรับลายนิ้วมือ รหัส และแอปมือถือ ล็อกอัตโนมัติและแจ้งเตือนทุกครั้งที่มีการเปิดประตู เหมาะสำหรับบ้านพักและสำนักงาน`;
    case "nvr":
      return `${p.brand} ${p.name} ชุดบันทึกภาพ NVR ครบวงจร รองรับการบันทึกต่อเนื่อง 24 ชั่วโมงจากหลายกล้องพร้อมกัน พื้นที่จัดเก็บขนาดใหญ่และดูย้อนหลังผ่านมือถือได้ทุกที่ เหมาะสำหรับบ้าน ออฟฟิศ และห้างร้าน`;
  }
}

export function productSpecs(p: DecoratedProduct): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = [
    { k: "ยี่ห้อ", v: p.brand },
    { k: "ประเภท", v: p.typeLabel },
  ];

  if ((p.type === "cctv" || p.type === "nvr") && p.res !== "-") {
    rows.push({ k: "ความละเอียด", v: p.res });
  }

  rows.push({ k: "การรับประกัน", v: "2 ปี (ศูนย์ไทย)" });

  if (p.type === "cctv" || p.type === "nvr" || p.type === "alarm") {
    rows.push({ k: "การติดตั้ง", v: "ฟรีในเขต กทม." });
  }

  return rows;
}

export interface CategoryDef {
  key: ProductType;
  th: string;
  en: string;
  gradient: string;
  icon: "dome" | "sensor" | "alarm" | "lock" | "nvr";
}

export const CATEGORIES: CategoryDef[] = [
  { key: "cctv", th: "กล้องวงจรปิด", en: "CCTV Cameras", gradient: "linear-gradient(135deg,#5EE7D3,#2F6BFF)", icon: "dome" },
  { key: "sensor", th: "เซ็นเซอร์", en: "Sensors", gradient: "linear-gradient(135deg,#2F6BFF,#5EE7D3)", icon: "sensor" },
  { key: "alarm", th: "สัญญาณกันขโมย", en: "Alarms", gradient: "linear-gradient(135deg,#5EE7D3,#2F6BFF)", icon: "alarm" },
  { key: "lock", th: "สมาร์ทล็อค", en: "Smart Locks", gradient: "linear-gradient(135deg,#2F6BFF,#5EE7D3)", icon: "lock" },
  { key: "nvr", th: "ชุด NVR", en: "NVR Kits", gradient: "linear-gradient(135deg,#5EE7D3,#2F6BFF)", icon: "nvr" },
];

export type FilterKey = "all" | ProductType;

export const FILTERS: { k: FilterKey; l: string }[] = [
  { k: "all", l: "ทั้งหมด" },
  { k: "cctv", l: "กล้องวงจรปิด" },
  { k: "sensor", l: "เซ็นเซอร์" },
  { k: "alarm", l: "สัญญาณกันขโมย" },
  { k: "lock", l: "สมาร์ทล็อค" },
  { k: "nvr", l: "ชุด NVR" },
];

export const CATEGORY_META: Record<FilterKey, { title: string; sub: string }> = {
  all: { title: "สินค้าทั้งหมด", sub: "อุปกรณ์รักษาความปลอดภัยครบวงจร คัดสรรคุณภาพสำหรับบ้านและธุรกิจ" },
  cctv: { title: "กล้องวงจรปิด", sub: "กล้อง CCTV ความละเอียดสูง มองเห็นกลางคืน พร้อมฟีเจอร์ AI วางกล้อง" },
  sensor: { title: "เซ็นเซอร์", sub: "เซ็นเซอร์ตรวจจับไร้สาย แจ้งเตือนทันทีเมื่อมีความเคลื่อนไหว" },
  alarm: { title: "สัญญาณกันขโมย", sub: "ไซเรนและระบบแจ้งเตือนเสียงดัง ป้องกันการบุกรุก" },
  lock: { title: "สมาร์ทล็อค", sub: "ล็อกอัจฉริยะ ปลดล็อกด้วยลายนิ้วมือและแอปพลิเคชัน" },
  nvr: { title: "ชุด NVR", sub: "ชุดบันทึกภาพครบชุด พร้อมฮาร์ดดิสก์และการติดตั้ง" },
};

export type SortKey = "popular" | "low" | "high" | "rating";

export function sortProducts(list: DecoratedProduct[], sort: SortKey): DecoratedProduct[] {
  const copy = [...list];
  switch (sort) {
    case "low": return copy.sort((a, b) => a.price - b.price);
    case "high": return copy.sort((a, b) => b.price - a.price);
    case "rating": return copy.sort((a, b) => b.rating - a.rating);
    default: return copy.sort((a, b) => b.reviews - a.reviews);
  }
}

export const BENEFITS = [
  { title: "ติดตั้งฟรีในเขต กทม.", desc: "เมื่อซื้อครบ ฿2,000 ทีมช่างมืออาชีพติดตั้งให้ถึงที่ ไม่มีค่าใช้จ่ายเพิ่ม" },
  { title: "รับประกันศูนย์ไทย 2 ปี", desc: "สินค้าแท้ผ่านศูนย์ไทยทุกชิ้น พร้อมบริการหลังการขายที่คุณวางใจได้" },
  { title: "AI ช่วยวางกล้องก่อนซื้อ", desc: "อัปโหลดรูปห้องหรือพื้นที่ แล้วให้ AI จำลองจุดติดตั้งที่ครอบคลุมที่สุด" },
  { title: "จัดส่งฟรีทั่วไทย", desc: "ส่งเร็ว ปลอดภัย ติดตามพัสดุได้ทุกขั้นตอนจนถึงมือคุณ" },
];

