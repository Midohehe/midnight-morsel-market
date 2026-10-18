import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, COMMISSION, db, session, uid, walletMove, type Product, type User } from "@/lib/store";
import { WalletPanel } from "@/components/wallet";
import { beep, timeAgo } from "@/lib/time";
import { Card, Img, LoginGate, PanelHeader, Stat, StatusPill, Tabs, btnGhost, btnPrimary, inputCls, money } from "@/components/nb";

export const Route = createFileRoute("/cook")({
  head: () => ({
    meta: [
      { title: "Cook Dashboard — NIGHTBITE" },
      { name: "description", content: "Home cooks manage their kitchen, menu and incoming late night orders." },
      { property: "og:title", content: "Cook Dashboard — NIGHTBITE" },
      { property: "og:description", content: "Run your home kitchen at night." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CookPage,
});

function CookPage() {
  const { L } = useI18n();
  return (
    <LoginGate role="COOK" otp title={L("لوحة الطياب", "Cook Panel")} demo="fatima / 1234 · OTP: 0911111111 + 1234" extra={<CookRegister />}>
      {(user, logout) => <CookApp user={user} logout={logout} />}
    </LoginGate>
  );
}

function CookApp({ user, logout }: { user: User; logout: () => void }) {
  const { L, lang } = useI18n();
  const data = db.use();
  const [tab, setTab] = useState<"dash" | "menu" | "history" | "wallet">("dash");
  const cook = data.cooks.find((c) => c.id === user.cook_id);
  const orders = data.orders.filter((o) => o.cook_id === user.cook_id);
  const pending = orders.filter((o) => o.status === "pending");
  const prevPending = useRef(pending.length);
  const [popup, setPopup] = useState(false);
  useEffect(() => {
    if (pending.length > prevPending.current) { beep(); setPopup(true); }
    prevPending.current = pending.length;
  }, [pending.length]);
  if (!cook) return null;
  const today = orders.filter((o) => Date.now() - o.created_at < 864e5 && o.status !== "rejected");
  const earnings = today.reduce((s, o) => s + o.subtotal * (1 - COMMISSION), 0);
  const setStatus = (id: string, patch: Partial<(typeof orders)[number]>) => db.set((d) => {
    const o = d.orders.find((x) => x.id === id); if (!o) return;
    if (patch.status === "rejected" && o.payment === "wallet" && o.customer_id) walletMove(d, o.customer_id, o.total, "refund", `Order #${o.id.slice(-5).toUpperCase()}`);
    Object.assign(o, patch);
  });

  return (
    <div className="min-h-screen pb-10">
      <PanelHeader user={user} logout={logout} title={lang === "ar" ? cook.kitchen_name_ar : cook.kitchen_name_en} />
      <div className="space-y-4 p-4">
        {cook.banned && <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{L("المطبخ موقوف من الإدارة", "Kitchen banned by admin")}</p>}
        {!cook.is_verified && <p className="rounded-xl bg-secondary/10 p-3 text-sm text-secondary">{L("المطبخ في انتظار التوثيق", "Kitchen awaiting verification")}</p>}
        <Tabs value={tab} onChange={setTab} items={[{ id: "dash", label: L("الرئيسية", "Dashboard") }, { id: "menu", label: L("المنيو", "My Menu") }, { id: "history", label: L("السجل", "History") }, { id: "wallet", label: L("المحفظة", "Wallet") }]} />

        {tab === "dash" && (<>
          <button onClick={() => db.set((d) => { const c = d.cooks.find((x) => x.id === cook.id)!; c.is_open = !c.is_open; })}
            className={`flex w-full items-center justify-between rounded-2xl p-4 font-bold ${cook.is_open ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            <span>{cook.is_open ? L("🟢 المطبخ فاتح", "🟢 Kitchen is OPEN") : L("🔴 المطبخ مسكر", "🔴 Kitchen is CLOSED")}</span>
            <span className={`relative h-7 w-12 rounded-full ${cook.is_open ? "bg-success" : "bg-muted"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all ${cook.is_open ? "start-6" : "start-1"}`} /></span>
          </button>
          <div className="grid grid-cols-3 gap-2">
            <Stat icon="💰" label={L("أرباح اليوم", "Today's earnings")} value={money(Math.round(earnings), lang)} />
            <Stat icon="🧾" label={L("طلبات اليوم", "Today's orders")} value={today.length} />
            <Stat icon="⭐" label={L("التقييم", "Rating")} value={cook.rating.toFixed(1)} />
          </div>
          <h3 className="font-black">{L("طلبات جديدة", "Incoming orders")} {pending.length > 0 && <span className="ms-1 rounded-full bg-primary px-2 text-xs text-primary-foreground">{pending.length}</span>}</h3>
          {!pending.length && <p className="text-center text-sm text-muted-foreground">{L("نستنو في الطلبات... 🌙", "Waiting for orders... 🌙")}</p>}
          {pending.map((o) => (
            <Card key={o.id} className="space-y-2 border-primary">
              <div className="flex justify-between"><b>{o.customer_name}</b><span className="text-xs text-muted-foreground">{timeAgo(o.created_at, lang === "ar")}</span></div>
              {o.items.map((i) => <div key={i.product_id} className="text-sm">{i.qty}× {lang === "ar" ? i.name_ar : i.name_en}</div>)}
              <div className="text-xs text-muted-foreground">📍 {o.customer_address}</div>
              <div className="font-bold text-primary">{money(o.subtotal, lang)}</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setStatus(o.id, { status: "rejected" })} className="rounded-xl bg-destructive/15 py-2 font-bold text-destructive">{L("رفض", "Reject")}</button>
                <button onClick={() => setStatus(o.id, { status: "cooking" })} className="rounded-xl bg-success py-2 font-bold text-success-foreground">{L("قبول", "Accept")}</button>
              </div>
            </Card>
          ))}
          <h3 className="font-black">{L("يطيب توا 🔥", "Cooking now 🔥")}</h3>
          {orders.filter((o) => o.status === "cooking").map((o) => (
            <Card key={o.id} className="flex items-center justify-between">
              <div className="text-sm"><b>{o.customer_name}</b><div className="text-xs text-muted-foreground">{o.items.map((i) => `${i.qty}× ${lang === "ar" ? i.name_ar : i.name_en}`).join("، ")}</div></div>
              {o.ready ? <span className="text-xs text-secondary">{L("نستنو السايق", "Awaiting driver")}</span> :
                <button onClick={() => setStatus(o.id, { ready: true })} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">{L("جاهز ✓", "Ready ✓")}</button>}
            </Card>
          ))}
        </>)}

        {tab === "menu" && <MenuEditor cookId={cook.id} />}
        {tab === "wallet" && <WalletPanel userId={user.id} />}

        {tab === "history" && orders.map((o) => (
          <Card key={o.id} className="flex items-center justify-between text-sm">
            <div><b>{o.customer_name}</b><div className="text-xs text-muted-foreground">#{o.id.slice(-5).toUpperCase()} • {timeAgo(o.created_at, lang === "ar")}</div></div>
            <div className="text-end"><StatusPill s={o.status} /><div className="mt-1 font-bold text-primary">{money(o.subtotal, lang)}</div></div>
          </Card>
        ))}
      </div>

      {popup && pending[0] && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-6 backdrop-blur" onClick={() => setPopup(false)}>
          <Card className="w-full max-w-sm animate-in zoom-in space-y-3 border-primary text-center shadow-glow">
            <div className="text-5xl">🔔</div>
            <h3 className="text-xl font-black">{L("طلب جديد!", "New order!")}</h3>
            <p>{pending[0].customer_name} • {money(pending[0].subtotal, lang)}</p>
            <button className={`${btnPrimary} w-full`} onClick={() => { setStatus(pending[0]!.id, { status: "cooking" }); setPopup(false); }}>{L("قبول", "Accept")}</button>
          </Card>
        </div>
      )}
    </div>
  );
}

const empty = { name_ar: "", name_en: "", description_ar: "", description_en: "", price_LYD: 0, quantity_available: 10, category: "sandwich", image_url: "" };

function MenuEditor({ cookId }: { cookId: string }) {
  const { L, lang } = useI18n();
  const data = db.use();
  const products = data.products.filter((p) => p.cook_id === cookId);
  const [edit, setEdit] = useState<(typeof empty & { id?: string }) | null>(null);
  const setQty = (id: string, d: number) => db.set((x) => { const p = x.products.find((y) => y.id === id); if (p) p.quantity_available = Math.max(0, p.quantity_available + d); });
  const save = (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    db.set((d) => {
      if (edit.id) Object.assign(d.products.find((p) => p.id === edit.id)!, edit);
      else d.products.push({ ...edit, id: "p" + uid(), cook_id: cookId } as Product);
    });
    setEdit(null);
  };
  const onFile = (f?: File) => { if (!f || !edit) return; const r = new FileReader(); r.onload = () => setEdit({ ...edit, image_url: String(r.result) }); r.readAsDataURL(f); };

  if (edit) return (
    <Card>
      <form onSubmit={save} className="space-y-2">
        <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed">
          {edit.image_url ? <Img src={edit.image_url} alt="" className="h-36 w-full" /> : <div className="grid h-36 place-items-center text-sm text-muted-foreground">📷 {L("ضيف صورة", "Upload photo")}</div>}
          <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <input required className={inputCls} placeholder="الاسم بالعربي" dir="rtl" value={edit.name_ar} onChange={(e) => setEdit({ ...edit, name_ar: e.target.value })} />
        <input required className={inputCls} placeholder="Name in English" dir="ltr" value={edit.name_en} onChange={(e) => setEdit({ ...edit, name_en: e.target.value })} />
        <input className={inputCls} placeholder="الوصف" dir="rtl" value={edit.description_ar} onChange={(e) => setEdit({ ...edit, description_ar: e.target.value })} />
        <input className={inputCls} placeholder="Description" dir="ltr" value={edit.description_en} onChange={(e) => setEdit({ ...edit, description_en: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input required type="number" min={1} className={inputCls} placeholder={L("السعر", "Price")} value={edit.price_LYD || ""} onChange={(e) => setEdit({ ...edit, price_LYD: +e.target.value })} />
          <input required type="number" min={0} className={inputCls} placeholder={L("الكمية", "Qty")} value={edit.quantity_available} onChange={(e) => setEdit({ ...edit, quantity_available: +e.target.value })} />
        </div>
        <select className={inputCls} value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {lang === "ar" ? c.ar : c.en}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setEdit(null)} className={btnGhost}>{L("إلغاء", "Cancel")}</button>
          <button className={btnPrimary}>{L("حفظ", "Save")}</button>
        </div>
      </form>
    </Card>
  );

  return (
    <div className="space-y-3">
      <button onClick={() => setEdit({ ...empty })} className={`${btnPrimary} flex w-full items-center justify-center gap-2`}><Plus className="h-4 w-4" />{L("صنف جديد", "Add product")}</button>
      {products.map((p) => (
        <Card key={p.id} className="flex items-center gap-3 p-3">
          <Img src={p.image_url} alt="" className="h-14 w-14 rounded-xl" />
          <div className="flex-1">
            <div className="text-sm font-bold">{lang === "ar" ? p.name_ar : p.name_en}</div>
            <div className="text-xs text-primary">{money(p.price_LYD, lang)}</div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <button onClick={() => setQty(p.id, -1)} className="h-6 w-6 rounded bg-muted">−</button>
              <span className={p.quantity_available ? "" : "text-destructive font-bold"}>{p.quantity_available || L("تم", "Sold out")}</span>
              <button onClick={() => setQty(p.id, 1)} className="h-6 w-6 rounded bg-muted">+</button>
            </div>
          </div>
          <button onClick={() => setEdit({ ...p })} className="rounded-lg bg-muted p-2"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => confirm(L("نمسحوه؟", "Delete?")) && db.set((d) => { d.products = d.products.filter((x) => x.id !== p.id); })} className="rounded-lg bg-destructive/15 p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </Card>
      ))}
    </div>
  );
}

function CookRegister() {
  const { L, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", kitchen: "", phone: "", address: "", username: "", password: "" });
  const [err, setErr] = useState("");
  if (!open) return <button onClick={() => setOpen(true)} className="w-full text-sm text-secondary underline">👩‍🍳 {t("beCook")}</button>;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const username = f.username.trim().toLowerCase();
    if (db.get().users.some((u) => u.username === username)) return setErr(L("اليوزر مستعمل", "Username taken"));
    const cid = "c" + uid(), id = "u_" + uid();
    db.set((d) => {
      d.cooks.push({ id: cid, name: f.name, phone: f.phone, avatar: "🧑‍🍳", kitchen_name_ar: f.kitchen, kitchen_name_en: f.kitchen, address_ar: f.address, address_en: f.address, lat: 32.86 + Math.random() * 0.03, lng: 13.13 + Math.random() * 0.08, rating: 5, total_orders: 0, is_open: false, kitchen_video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", cover: "", is_verified: false, banned: false });
      d.users.push({ id, name: f.name, phone: f.phone, role: "COOK", avatar: "🧑‍🍳", username, password: f.password, cook_id: cid });
    });
    session.set((s) => { s.COOK = id; });
  };
  const labels = { name: L("اسمك", "Your name"), kitchen: L("اسم المطبخ", "Kitchen name"), phone: L("الهاتف", "Phone"), address: L("الحي", "Area"), username: L("اسم المستخدم", "Username"), password: L("كلمة السر", "Password") };
  return (
    <Card>
      <form onSubmit={submit} className="space-y-2">
        <h3 className="font-bold">{t("beCook")}</h3>
        {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
          <input key={k} required type={k === "password" ? "password" : "text"} className={inputCls} placeholder={labels[k]} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        ))}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${btnPrimary} w-full`}>{L("سجل مطبخك", "Register kitchen")}</button>
      </form>
    </Card>
  );
}
