import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "CUSTOMER" | "COOK" | "DELIVERY" | "ADMIN";
export type User = {
  id: string; name: string; phone: string; role: Role; avatar: string;
  username: string; cook_id?: string; address?: string;
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
  image_url: string; quantity_available: number; category: string; unavailable?: boolean;
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

export const uid = () => Math.random().toString(36).slice(2, 9);

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

const EMPTY: DB = { cooks: [], products: [], orders: [], users: [], reviews: [], wallets: {}, transactions: [], cards: [] };

/* ---------------- remote store (Lovable Cloud) ---------------- */
let cache: DB = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export type Auth = { ready: boolean; userId: string | null; role: Role | null };
let authState: Auth = { ready: false, userId: null, role: null };
const authListeners = new Set<() => void>();

async function fetchAll() {
  const [cooks, products, orders, reviews, profiles, roles, wallets, txns, cards] = await Promise.all([
    supabase.from("cooks").select("*"),
    supabase.from("products").select("*"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*"),
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("wallets").select("*"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("topup_cards").select("*").order("created_at", { ascending: false }),
  ]);
  const roleOf = new Map((roles.data ?? []).map((r) => [r.user_id, r.role as Role]));
  cache = {
    cooks: (cooks.data ?? []) as Cook[],
    products: (products.data ?? []) as Product[],
    orders: (orders.data ?? []).map((o) => ({ ...o, customer_id: o.customer_id ?? undefined, delivery_boy: (o.delivery_boy ?? undefined) as Order["delivery_boy"], items: o.items as unknown as OrderItem[], payment: o.payment as Order["payment"], status: o.status as OrderStatus, created_at: Number(o.created_at) })) as Order[],
    reviews: (reviews.data ?? []).map((r) => ({ ...r, created_at: Number(r.created_at) })),
    users: (profiles.data ?? []).map((u) => ({ id: u.id, name: u.name, phone: u.phone, avatar: u.avatar, username: u.username, address: u.address, cook_id: u.cook_id ?? undefined, role: roleOf.get(u.id) ?? "CUSTOMER" })) as User[],
    wallets: Object.fromEntries((wallets.data ?? []).map((w) => [w.user_id, w.balance])),
    transactions: (txns.data ?? []).map((t) => ({ ...t, type: t.type as Txn["type"], created_at: Number(t.created_at) })),
    cards: (cards.data ?? []).map((c) => ({ ...c, used_by: c.used_by ?? undefined, used_at: c.used_at ? Number(c.used_at) : undefined, created_at: Number(c.created_at) })),
  };
  loaded = true;
  emit();
}

export const refresh = () => {
  if (timer) clearTimeout(timer);
  return new Promise<void>((res) => { timer = setTimeout(() => { fetchAll().finally(res); }, 60); });
};

async function loadAuth() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id ?? null;
  let role: Role | null = null;
  if (id) {
    const r = await supabase.from("user_roles").select("role").eq("user_id", id);
    const list = (r.data ?? []).map((x) => x.role as Role);
    role = list.includes("ADMIN") ? "ADMIN" : list[0] ?? "CUSTOMER";
  }
  authState = { ready: true, userId: id, role };
  authListeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  loadAuth().then(fetchAll);
  supabase.auth.onAuthStateChange((ev) => {
    if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") loadAuth().then(refresh);
  });
  supabase.channel("nb-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "cooks" }, () => refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => refresh())
    .subscribe();
  // fallback polling (realtime only delivers rows the user may read at subscribe time)
  setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 15000);
}

export const db = {
  get: () => cache,
  loaded: () => loaded,
  use: () => useSyncExternalStore((l) => { start(); listeners.add(l); return () => listeners.delete(l); }, () => cache, () => EMPTY),
};
export const useAuth = () => useSyncExternalStore((l) => { start(); authListeners.add(l); return () => authListeners.delete(l); }, () => authState, () => authState);

/* ---------------- actions ---------------- */
const EMAIL_DOMAIN = "nightbite.app";
const toEmail = (u: string) => `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
const toPass = (p: string) => `nb::${p}`; // allow short PINs like 1234

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export const api = {
  async signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password: toPass(password) });
    fail(error); await loadAuth(); await refresh();
  },
  async signUp(f: { username: string; password: string; name: string; phone: string; address: string; role: Role; kitchen?: string }) {
    const { data: taken } = await supabase.rpc("username_taken", { _u: f.username.trim() });
    if (taken) throw new Error("username_taken");
    const { error } = await supabase.auth.signUp({ email: toEmail(f.username), password: toPass(f.password),
      options: { data: { username: f.username.trim().toLowerCase(), name: f.name, phone: f.phone, address: f.address, role: f.role, kitchen: f.kitchen ?? "" } } });
    fail(error); await loadAuth(); await refresh();
  },
  async signOut() { await supabase.auth.signOut(); await loadAuth(); await refresh(); },
  async placeOrder(a: { cook_id: string; items: { product_id: string; qty: number }[]; name: string; phone: string; address: string; payment: "cash" | "wallet" }) {
    const { data, error } = await supabase.rpc("place_order", { _cook_id: a.cook_id, _items: a.items, _name: a.name, _phone: a.phone, _address: a.address, _payment: a.payment });
    fail(error); await refresh(); return data as string;
  },
  async cookOrder(id: string, action: "accept" | "reject" | "ready") { fail((await supabase.rpc("cook_update_order", { _order_id: id, _action: action })).error); await refresh(); },
  async driverTake(id: string) { fail((await supabase.rpc("driver_take", { _order_id: id })).error); await refresh(); },
  async driverDeliver(id: string) { fail((await supabase.rpc("driver_deliver", { _order_id: id })).error); await refresh(); },
  async rate(id: string, rating: number, comment: string) { fail((await supabase.rpc("rate_order", { _order_id: id, _rating: rating, _comment: comment })).error); await refresh(); },
  async redeem(code: string) { const { data, error } = await supabase.rpc("redeem_card", { _code: code }); fail(error); await refresh(); return data as number; },
  async issueCards(amount: number, qty: number, batch: string) { fail((await supabase.rpc("admin_issue_cards", { _amount: amount, _qty: qty, _batch: batch })).error); await refresh(); },
  async patchCook(id: string, patch: Partial<Cook>) { fail((await supabase.from("cooks").update(patch).eq("id", id)).error); await refresh(); },
  async saveProduct(p: Partial<Product> & { cook_id: string }) {
    const { id, ...rest } = p;
    fail(id ? (await supabase.from("products").update(rest).eq("id", id)).error : (await supabase.from("products").insert(rest)).error);
    await refresh();
  },
  async patchProduct(id: string, patch: Partial<Product>) { fail((await supabase.from("products").update(patch).eq("id", id)).error); await refresh(); },
  async deleteProduct(id: string) { fail((await supabase.from("products").delete().eq("id", id)).error); await refresh(); },
  /** Uploads an image to storage and returns a long-lived URL. */
  async upload(file: File) {
    const uid = authState.userId; if (!uid) throw new Error("not_signed_in");
    const path = `${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    fail((await supabase.storage.from("media").upload(path, file, { upsert: true })).error);
    const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    fail(error); return data!.signedUrl;
  },
};

export const errText = (e: unknown, L: (ar: string, en: string) => string) => {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("Invalid login")) return L("بيانات غلط", "Wrong credentials");
  if (m.includes("username_taken")) return L("اليوزر مستعمل", "Username taken");
  if (m.includes("low_balance")) return L("الرصيد ما يكفيش", "Not enough wallet balance");
  if (m.includes("sold_out")) return L("في صنف خلص", "An item is sold out");
  if (m.includes("kitchen_closed")) return L("المطبخ مسكر", "Kitchen is closed");
  if (m.includes("invalid")) return L("رقم الكرت غلط", "Invalid card number");
  if (m.includes("used")) return L("الكرت مستعمل", "Card already used");
  if (m.includes("taken")) return L("الطلب أخذه سايق آخر", "Already taken by another driver");
  return m;
};

function makeStore<T>(key: string, init: () => T) {
  let c: T | null = null;
  const ls = new Set<() => void>();
  const get = (): T => { if (c === null) { const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null; c = raw ? (JSON.parse(raw) as T) : init(); } return c; };
  const set = (fn: (d: T) => T | void) => { const d = structuredClone(get()); const r = fn(d); c = (r ?? d) as T; localStorage.setItem(key, JSON.stringify(c)); ls.forEach((l) => l()); };
  const init0 = init();
  const use = () => useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, get, () => init0);
  return { get, set, use };
}
export type Cart = { cook_id: string | null; items: { product_id: string; qty: number }[] };
export const cart = makeStore<Cart>("nightbite_cart", () => ({ cook_id: null, items: [] }));
export function distanceKm(lat: number, lng: number) {
  const R = 6371, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(lat - ME.lat), dLng = toR(lng - ME.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(ME.lat)) * Math.cos(toR(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export const isTonight = (ts: number) => Date.now() - ts < 14 * 3600 * 1000;
