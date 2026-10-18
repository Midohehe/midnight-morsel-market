import { useSyncExternalStore } from "react";

export type Role = "CUSTOMER" | "COOK" | "DELIVERY" | "ADMIN";
export type User = {
  id: string; name: string; phone: string; role: Role; avatar: string;
  username: string; password: string; cook_id?: string; address?: string;
};
export type Cook = {
  id: string; name: string; phone: string; avatar: string;
  kitchen_name_ar: string; kitchen_name_en: string; address_ar: string; address_en: string;
  lat: number; lng: number; rating: number; total_orders: number; is_open: boolean;
  kitchen_video_url: string; cover: string; is_verified: boolean; banned: boolean;
};
export type Product = {
  id: string; cook_id: string; name_ar: string; name_en: string;
  description_ar: string; description_en: string; price_LYD: number;
  image_url: string; quantity_available: number; category: string;
};
export type OrderStatus = "pending" | "cooking" | "on_way" | "delivered" | "rejected";
export type OrderItem = { product_id: string; qty: number; price: number; name_ar: string; name_en: string };
export type Order = {
  id: string; customer_id?: string | undefined; customer_name: string; customer_phone: string; customer_address: string;
  cook_id: string; items: OrderItem[]; subtotal: number; delivery_fee: number; app_fee: number; total: number;
  status: OrderStatus; ready: boolean; payment?: "cash" | "wallet"; created_at: number;
  delivery_boy?: { id: string; name: string; phone: string }; rated?: boolean;
};
export type Review = { id: string; cook_id: string; order_id: string; rating: number; comment: string; created_at: number };
export type Txn = { id: string; user_id: string; amount: number; type: "topup" | "payment" | "refund" | "earning"; note: string; created_at: number };
export type TopupCard = { id: string; code: string; amount: number; batch: string; created_at: number; used_by?: string | undefined; used_at?: number | undefined };
export type DB = { cooks: Cook[]; products: Product[]; orders: Order[]; users: User[]; reviews: Review[]; wallets: Record<string, number>; transactions: Txn[]; cards: TopupCard[] };

export const DELIVERY_FEE = 5;
export const APP_FEE = 2;
export const COMMISSION = 0.2;
export const ME = { lat: 32.8955, lng: 13.18 }; // Martyrs' Square, Tripoli
const COORDS: Record<string, [number, number]> = { c1: [32.853, 13.064], c2: [32.87, 13.125], c3: [32.879, 13.201], c4: [32.86, 13.13] };

export const uid = () => Math.random().toString(36).slice(2, 9);
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=70&auto=format&fit=crop`;
const VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export const CATEGORIES: { id: string; ar: string; en: string; icon: string }[] = [
  { id: "sandwich", ar: "سندويتشات", en: "Sandwiches", icon: "🥪" },
  { id: "shakshuka", ar: "شكشوكة", en: "Shakshuka", icon: "🍳" },
  { id: "brik", ar: "بريك", en: "Brik", icon: "🥟" },
  { id: "mlewi", ar: "ملوي", en: "Mlewi", icon: "🫓" },
  { id: "rice", ar: "مقلوبة", en: "Rice", icon: "🍚" },
  { id: "sweets", ar: "حلو", en: "Sweets", icon: "🍩" },
  { id: "drinks", ar: "مشروبات", en: "Drinks", icon: "🍵" },
  { id: "sides", ar: "جانبي", en: "Sides", icon: "🍟" },
];

function seed(): DB {
  const now = Date.now();
  const cooks: Cook[] = [
    { id: "c1", name: "Umm Fatima", phone: "0911111111", avatar: "👩🏻‍🍳", kitchen_name_ar: "مطبخ أم فاطمة", kitchen_name_en: "Umm Fatima's Kitchen", address_ar: "السياحية، طرابلس", address_en: "Siyahiya, Tripoli", lat: 32.865, lng: 13.14, rating: 4.8, total_orders: 312, is_open: true, kitchen_video_url: VIDEO, cover: img("1556909114-f6e7ad7d3136"), is_verified: true, banned: false },
    { id: "c2", name: "Khala Salma", phone: "0922222222", avatar: "👵🏽", kitchen_name_ar: "حوش خالة سلمى", kitchen_name_en: "Khala Salma's House", address_ar: "قرجي، طرابلس", address_en: "Gurji, Tripoli", lat: 32.87, lng: 13.165, rating: 4.9, total_orders: 528, is_open: true, kitchen_video_url: VIDEO, cover: img("1556910103-1c02745aae4d"), is_verified: true, banned: false },
    { id: "c3", name: "Dar Bouzid", phone: "0933333333", avatar: "🧔🏽", kitchen_name_ar: "دار بوزيد", kitchen_name_en: "Dar Bouzid", address_ar: "بن عاشور، طرابلس", address_en: "Ben Ashour, Tripoli", lat: 32.885, lng: 13.2, rating: 4.6, total_orders: 190, is_open: false, kitchen_video_url: VIDEO, cover: img("1504754524776-8f4f37790ca0"), is_verified: false, banned: false },
    { id: "c4", name: "HouSh Tripoli", phone: "0944444444", avatar: "🧑🏻‍🍳", kitchen_name_ar: "حوش طرابلس", kitchen_name_en: "HouSh Tripoli", address_ar: "حي الأندلس، طرابلس", address_en: "Hay Al Andalus, Tripoli", lat: 32.88, lng: 13.12, rating: 5.0, total_orders: 744, is_open: true, kitchen_video_url: VIDEO, cover: img("1414235077428-338989a2e8c0"), is_verified: true, banned: false },
  ];
  const p = (id: string, cook_id: string, name_ar: string, name_en: string, description_ar: string, description_en: string, price_LYD: number, image: string, quantity_available: number, category: string): Product =>
    ({ id, cook_id, name_ar, name_en, description_ar, description_en, price_LYD, image_url: img(image), quantity_available, category });
  const products: Product[] = [
    p("p1", "c1", "سندويتش تن وجبنة", "Tuna Cheese Sandwich", "خبزة سخونة بالتن والجبنة والهريسة", "Warm baguette, tuna, melted cheese & harissa", 8, "1528735602780-2552fd46c7af", 15, "sandwich"),
    p("p2", "c1", "سندويتش عظم وهريسة", "Egg & Harissa Sandwich", "عظم مسلوق، بطاطا، هريسة حارة", "Boiled egg, potato, spicy harissa", 6, "1553909489-cd47e0907980", 10, "sandwich"),
    p("p3", "c1", "شاورما دجاج", "Chicken Shawarma Wrap", "دجاج متبل مع ثومية", "Marinated chicken with garlic sauce", 10, "1626700051175-6818013e1d4f", 8, "sandwich"),
    p("p4", "c1", "شاهي بالنعناع", "Mint Tea", "شاهي أحمر بالنعناع الطازة", "Libyan red tea with fresh mint", 3, "1576092768241-dec231879fc3", 30, "drinks"),
    p("p5", "c2", "شكشوكة بالعظم", "Egg Shakshuka", "طماطم وفلفل وعظم، مع خبزة", "Tomato, peppers & eggs with bread", 12, "1590412200988-a436970781fa", 12, "shakshuka"),
    p("p6", "c2", "شكشوكة بالقديد", "Shakshuka with Gadeed", "شكشوكة بلحم القديد الليبي", "Shakshuka with Libyan dried meat", 15, "1525351484163-7529414344d8", 6, "shakshuka"),
    p("p7", "c2", "بريك بالعظم", "Egg Brik", "بريك مقرمش بالعظم والتن", "Crispy brik with egg & tuna", 5, "1601050690597-df0568f70950", 20, "brik"),
    p("p8", "c2", "بريك لحم", "Meat Brik", "بريك محشي لحم مفروم وبقدونس", "Brik stuffed with minced meat & parsley", 6, "1601050690597-df0568f70950", 0, "brik"),
    p("p9", "c3", "ملوي بالعسل", "Mlewi with Honey", "ملوي ساخن بالعسل والزبدة", "Hot flaky mlewi with honey & butter", 10, "1565299507177-b0ac66763828", 10, "mlewi"),
    p("p10", "c3", "مقلوبة", "Maklouba", "رز وباذنجان ودجاج", "Rice, eggplant & chicken", 18, "1512058564366-18510be2db19", 5, "rice"),
    p("p11", "c3", "سفنز", "Sfinz", "سفنز ليبي بالسكر", "Libyan sfinz donuts with sugar", 5, "1551024601-bec78aea704b", 25, "sweets"),
    p("p12", "c4", "سندويتش تن", "Tuna Sandwich", "التن الكلاسيكي الليبي", "Classic Libyan tuna sandwich", 7, "1528735602780-2552fd46c7af", 20, "sandwich"),
    p("p13", "c4", "سندويتش كفتة", "Kofta Sandwich", "كفتة مشوية على الفحم", "Charcoal grilled kofta", 9, "1529006557810-274b9b2fc783", 12, "sandwich"),
    p("p14", "c4", "سندويتش إسكالوب", "Chicken Escalope", "إسكالوب مقرمش مع صوص", "Crispy escalope with sauce", 10, "1606755962773-d324e0a13086", 9, "sandwich"),
    p("p15", "c4", "بطاطا مقلية", "Fries", "بطاطا مقلية بالكمون", "Fries with cumin salt", 4, "1573080496219-bb080dd4f877", 0, "sides"),
  ];
  const users: User[] = [
    { id: "u_admin", name: "Admin", phone: "0900000000", role: "ADMIN", avatar: "🛡️", username: "admin", password: "admin123" },
    { id: "u_c1", name: "Umm Fatima", phone: "0911111111", role: "COOK", avatar: "👩🏻‍🍳", username: "fatima", password: "1234", cook_id: "c1" },
    { id: "u_c2", name: "Khala Salma", phone: "0922222222", role: "COOK", avatar: "👵🏽", username: "salma", password: "1234", cook_id: "c2" },
    { id: "u_c3", name: "Dar Bouzid", phone: "0933333333", role: "COOK", avatar: "🧔🏽", username: "bouzid", password: "1234", cook_id: "c3" },
    { id: "u_c4", name: "HouSh Tripoli", phone: "0944444444", role: "COOK", avatar: "🧑🏻‍🍳", username: "housh", password: "1234", cook_id: "c4" },
    { id: "u_d1", name: "Ali Moto", phone: "0915555555", role: "DELIVERY", avatar: "🏍️", username: "ali", password: "1234" },
    { id: "u_d2", name: "Omar Speed", phone: "0926666666", role: "DELIVERY", avatar: "🛵", username: "omar", password: "1234" },
    { id: "u_cu1", name: "Ahmed", phone: "0917777777", role: "CUSTOMER", avatar: "🙂", username: "ahmed", password: "1234", address: "Zawiyat Al Dahmani, Tripoli" },
  ];
  const orders: Order[] = [
    { id: "o1001", customer_id: "u_cu1", customer_name: "Ahmed", customer_phone: "0917777777", customer_address: "Zawiyat Al Dahmani, Tripoli", cook_id: "c1", items: [{ product_id: "p1", qty: 2, price: 8, name_ar: "سندويتش تن وجبنة", name_en: "Tuna Cheese Sandwich" }, { product_id: "p4", qty: 2, price: 3, name_ar: "شاهي بالنعناع", name_en: "Mint Tea" }], subtotal: 22, delivery_fee: 5, app_fee: 2, total: 29, status: "pending", ready: false, created_at: now - 4 * 60000 },
    { id: "o1002", customer_name: "Mariam", customer_phone: "0928888888", customer_address: "Fashloum, Tripoli", cook_id: "c2", items: [{ product_id: "p5", qty: 1, price: 12, name_ar: "شكشوكة بالعظم", name_en: "Egg Shakshuka" }, { product_id: "p7", qty: 3, price: 5, name_ar: "بريك بالعظم", name_en: "Egg Brik" }], subtotal: 27, delivery_fee: 5, app_fee: 2, total: 34, status: "pending", ready: false, created_at: now - 9 * 60000 },
  ];
  cooks.forEach((c) => { const x = COORDS[c.id]; if (x) { c.lat = x[0]; c.lng = x[1]; } });
  return { cooks, products, users, orders, reviews: [], wallets: { u_cu1: 50 }, transactions: [{ id: "t0", user_id: "u_cu1", amount: 50, type: "topup", note: "Welcome bonus", created_at: now }], cards: [] };
}

function makeStore<T>(key: string, init: () => T, migrate?: (d: T) => T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  let bound = false;
  const get = (): T => {
    if (cache === null) {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : init();
      if (migrate) cache = migrate(cache);
      if (!raw) localStorage.setItem(key, JSON.stringify(cache));
    }
    return cache;
  };
  const set = (fn: (d: T) => T | void) => {
    const draft = structuredClone(get());
    const res = fn(draft);
    cache = (res ?? draft) as T;
    localStorage.setItem(key, JSON.stringify(cache));
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    if (!bound) {
      bound = true;
      window.addEventListener("storage", (e) => {
        if (e.key === key) { cache = null; listeners.forEach((x) => x()); }
      });
    }
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const use = () => useSyncExternalStore(subscribe, get, get);
  return { get, set, use };
}

export const db = makeStore<DB>("nightbite_db_v1", seed, (d) => {
  d.wallets ??= {}; d.transactions ??= []; d.cards ??= [];
  d.cooks.forEach((c) => { const x = COORDS[c.id]; if (x) { c.lat = x[0]; c.lng = x[1]; } });
  return d;
});

/** Mutates a draft DB: changes a user's wallet balance and logs the movement. */
export function walletMove(d: DB, user_id: string, amount: number, type: Txn["type"], note: string) {
  d.wallets[user_id] = Math.round(((d.wallets[user_id] ?? 0) + amount) * 100) / 100;
  d.transactions.unshift({ id: "t" + uid(), user_id, amount, type, note, created_at: Date.now() });
}

export function genCardCode() {
  let s = ""; for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
  return s.replace(/(\d{4})(?=\d)/g, "$1-");
}

export function redeemCard(user_id: string, raw: string): { ok: true; amount: number } | { ok: false; reason: "invalid" | "used" } {
  const code = raw.replace(/\D/g, "");
  const card = db.get().cards.find((c) => c.code.replace(/\D/g, "") === code);
  if (!card) return { ok: false, reason: "invalid" };
  if (card.used_by) return { ok: false, reason: "used" };
  db.set((d) => {
    const c = d.cards.find((x) => x.id === card.id)!;
    c.used_by = user_id; c.used_at = Date.now();
    walletMove(d, user_id, c.amount, "topup", `Card ${c.code.slice(-4)}`);
  });
  return { ok: true, amount: card.amount };
}

/** Settles a delivered wallet-paid order: cook gets food minus commission, driver gets delivery fee. */
export function settleDelivered(d: DB, o: Order) {
  if (o.payment !== "wallet") return;
  const cookUser = d.users.find((u) => u.role === "COOK" && u.cook_id === o.cook_id);
  if (cookUser) walletMove(d, cookUser.id, Math.round(o.subtotal * (1 - COMMISSION) * 100) / 100, "earning", `Order #${o.id.slice(-5).toUpperCase()}`);
  if (o.delivery_boy) walletMove(d, o.delivery_boy.id, o.delivery_fee, "earning", `Delivery #${o.id.slice(-5).toUpperCase()}`);
}
export type Cart = { cook_id: string | null; items: { product_id: string; qty: number }[] };
export const cart = makeStore<Cart>("nightbite_cart", () => ({ cook_id: null, items: [] }));
export type Session = Partial<Record<Role, string>> & { guestOrders?: string[] };
export const session = makeStore<Session>("nightbite_session", () => ({}));

export function resetDemo() {
  localStorage.removeItem("nightbite_db_v1");
  localStorage.removeItem("nightbite_cart");
  location.reload();
}

export function distanceKm(lat: number, lng: number) {
  const R = 6371, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(lat - ME.lat), dLng = toR(lng - ME.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(ME.lat)) * Math.cos(toR(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export const isTonight = (ts: number) => Date.now() - ts < 14 * 3600 * 1000;
