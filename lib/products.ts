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
    priceLabel: formatBaht(p.price),
    oldPriceLabel: formatBaht(old),
    discount: old > p.price ? Math.round((1 - p.price / old) * 100) : 0,
    ratingLabel: p.rating.toFixed(1),
    reviewsLabel: `(${p.reviews})`,
    tags,
  };
}

export function productHighlights(p: DecoratedProduct): string[] {
  return [
    `ความละเอียด ${p.res !== "-" ? p.res : "สูง"} ภาพคมชัด`,
    "มองเห็นกลางคืน (Night Vision)",
    "เชื่อมต่อดูผ่านมือถือได้ทุกที่",
  ];
}

export const PRODUCT_DESC =
  "กล้องและอุปกรณ์รักษาความปลอดภัยคุณภาพสูง ออกแบบสำหรับบ้านและธุรกิจในประเทศไทย ทนทานต่อสภาพอากาศ ติดตั้งง่าย รองรับการดูภาพสดผ่านแอปพลิเคชันบนมือถือ พร้อมระบบแจ้งเตือนอัจฉริยะและการรับประกันศูนย์ไทย";

export function productSpecs(p: DecoratedProduct) {
  return [
    { k: "ยี่ห้อ", v: p.brand },
    { k: "ประเภท", v: p.typeLabel },
    { k: "ความละเอียด", v: p.res },
    { k: "การรับประกัน", v: "2 ปี (ศูนย์ไทย)" },
    { k: "การติดตั้ง", v: "ฟรีในเขต กทม." },
  ];
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
  { title: "Lorem ipsum", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do." },
  { title: "Dolor sit amet", desc: "Sed do eiusmod tempor incididunt ut labore et dolore magna." },
  { title: "Consectetur elit", desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco." },
  { title: "Adipiscing tempor", desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse." },
];

export const PLACEMENT_NOTES = [
  { num: 1, color: "#2F6BFF", text: "มุมเพดานด้านขวาบน ครอบคลุมประตูทางเข้าและพื้นที่นั่งเล่นได้กว้างที่สุด" },
  { num: 2, color: "#5EE7D3", text: "ติดสูงจากพื้นประมาณ 2.4 เมตร หลีกเลี่ยงแสงย้อนจากหน้าต่าง" },
  { num: 3, color: "#2F6BFF", text: "มุมมองภาพชัดเจนในระยะ ~8 เมตร เหมาะกับเลนส์ 2.8 มม. ของรุ่นนี้" },
];
