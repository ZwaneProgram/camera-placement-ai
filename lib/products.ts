import { formatBaht } from "@/lib/utils";

export type ProductType = "cctv" | "sensor" | "alarm" | "lock" | "nvr";

export interface Product {
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
  img: string;
}

/** Source of truth for the demo catalogue (mirrors the SUCCESS IT design). */
export const PRODUCTS: Product[] = [
  { id: 1, name: "กล้องโดม SUCCESS IT 4MP", en: "Dome Camera 4MP", type: "cctv", typeLabel: "กล้องวงจรปิด", brand: "SUCCESS IT", res: "4MP", price: 1290, old: 1690, rating: 4.8, reviews: 212, ai: true, img: "Dome Camera" },
  { id: 2, name: "กล้อง Bullet กันน้ำ 5MP", en: "Bullet Outdoor 5MP", type: "cctv", typeLabel: "กล้องวงจรปิด", brand: "HikPro", res: "5MP", price: 1890, old: 2290, rating: 4.7, reviews: 158, ai: true, img: "Bullet Camera" },
  { id: 3, name: "กล้อง PTZ หมุน 360° 8MP", en: "PTZ 360° 8MP", type: "cctv", typeLabel: "กล้องวงจรปิด", brand: "SUCCESS IT", res: "8MP", price: 4590, old: 5290, rating: 4.9, reviews: 97, ai: true, img: "PTZ Camera" },
  { id: 4, name: "เซ็นเซอร์ประตู-หน้าต่างไร้สาย", en: "Door/Window Sensor", type: "sensor", typeLabel: "เซ็นเซอร์", brand: "AjaxLite", res: "-", price: 390, old: 490, rating: 4.6, reviews: 340, ai: false, img: "Door Sensor" },
  { id: 5, name: "เซ็นเซอร์ตรวจจับการเคลื่อนไหว PIR", en: "PIR Motion Sensor", type: "sensor", typeLabel: "เซ็นเซอร์", brand: "AjaxLite", res: "-", price: 590, old: 790, rating: 4.7, reviews: 221, ai: true, img: "PIR Sensor" },
  { id: 6, name: "ไซเรนสัญญาณกันขโมย 120dB", en: "Alarm Siren 120dB", type: "alarm", typeLabel: "สัญญาณกันขโมย", brand: "SUCCESS IT", res: "-", price: 890, old: 1090, rating: 4.5, reviews: 88, ai: false, img: "Alarm Siren" },
  { id: 7, name: "สมาร์ทล็อคลายนิ้วมือ", en: "Smart Fingerprint Lock", type: "lock", typeLabel: "สมาร์ทล็อค", brand: "LockOne", res: "-", price: 3290, old: 3990, rating: 4.8, reviews: 134, ai: false, img: "Smart Lock" },
  { id: 8, name: "ชุด NVR 8 ช่อง + HDD 2TB", en: "NVR Kit 8CH", type: "nvr", typeLabel: "ชุด NVR", brand: "SUCCESS IT", res: "8CH", price: 5990, old: 6990, rating: 4.9, reviews: 76, ai: true, img: "NVR Kit" },
];

const TAG_MAP: Record<ProductType, string[]> = {
  cctv: ["", "อินฟราเรดกลางคืน", "ดูผ่านมือถือ"],
  sensor: ["ไร้สาย", "แจ้งเตือนทันที"],
  alarm: ["เสียง 120dB", "ติดตั้งง่าย"],
  lock: ["สแกนลายนิ้วมือ", "ปลดล็อกผ่านแอป"],
  nvr: ["บันทึก 24 ชม.", "HDD 2TB"],
};

export interface DecoratedProduct extends Product {
  priceLabel: string;
  oldPriceLabel: string;
  discount: number;
  ratingLabel: string;
  reviewsLabel: string;
  tags: string[];
}

export function decorate(p: Product): DecoratedProduct {
  const tags = (TAG_MAP[p.type] ?? [])
    .map((t, i) => (i === 0 && p.type === "cctv" ? p.res : t))
    .filter(Boolean)
    .slice(0, 3);
  return {
    ...p,
    priceLabel: formatBaht(p.price),
    oldPriceLabel: formatBaht(p.old),
    discount: Math.round((1 - p.price / p.old) * 100),
    ratingLabel: p.rating.toFixed(1),
    reviewsLabel: `(${p.reviews})`,
    tags,
  };
}

export const DECORATED = PRODUCTS.map(decorate);

export function getProduct(id: number): DecoratedProduct | undefined {
  const p = PRODUCTS.find((x) => x.id === id);
  return p ? decorate(p) : undefined;
}

export function bestSellers(n = 4): DecoratedProduct[] {
  return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, n).map(decorate);
}

export function productHighlights(p: Product): string[] {
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

export function typeCounts(): Record<string, number> {
  const counts: Record<string, number> = { all: PRODUCTS.length };
  for (const p of PRODUCTS) counts[p.type] = (counts[p.type] ?? 0) + 1;
  return counts;
}

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
