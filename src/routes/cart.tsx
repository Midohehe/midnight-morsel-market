import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, LocateFixed } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { APP_FEE, DELIVERY_FEE, api, cart, db, errText, useAuth } from "@/lib/store";
import { BottomNav, Card, Img, TopBar, btnPrimary, inputCls, money } from "@/components/nb";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout — NIGHTBITE" },
      { name: "description", content: "Review your late night order and pay cash on delivery." },
      { property: "og:title", content: "Cart & Checkout — NIGHTBITE" },
      { property: "og:description", content: "Confirm your home food order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, L, lang } = useI18n();
  const data = db.use();
  const c = cart.use();
  const auth = useAuth();
  const me = auth.role === "CUSTOMER" ? data.users.find((u) => u.id === auth.userId) : undefined;
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState(me?.name ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [address, setAddress] = useState(me?.address ?? "");
  useEffect(() => { if (me) { setName((v) => v || me.name); setPhone((v) => v || me.phone); setAddress((v) => v || (me.address ?? "")); } }, [me?.id]);
  const [locating, setLocating] = useState(false);
  const [pay, setPay] = useState<"cash" | "wallet">("cash");
  const balance = me ? data.wallets[me.id] ?? 0 : 0;
  const cook = data.cooks.find((k) => k.id === c.cook_id);
  const lines = c.items.map((i) => ({ ...i, p: data.products.find((p) => p.id === i.product_id)! })).filter((l) => l.p);
  const subtotal = lines.reduce((s2, l) => s2 + l.qty * l.p.price_LYD, 0);
  const total = subtotal + DELIVERY_FEE + APP_FEE;

  const setQty = (pid: string, d: number) => cart.set((x) => {
    const it = x.items.find((i) => i.product_id === pid); if (!it) return;
    const max = data.products.find((p) => p.id === pid)?.quantity_available ?? 99;
    it.qty = Math.min(max, it.qty + d);
    x.items = x.items.filter((i) => i.qty > 0);
    if (!x.items.length) x.cook_id = null;
  });

  const locate = () => {
    setLocating(true);
    const done = (txt: string) => { setAddress(txt); setLocating(false); };
    if (!navigator.geolocation) return done("📍 Tripoli");
    navigator.geolocation.getCurrentPosition(
      (p) => done(`📍 ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)} — Tripoli`),
      () => done(L("📍 طرابلس - موقعي الحالي", "📍 Tripoli - current location")), { timeout: 5000 });
  };

  const confirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cook || !lines.length) return;
    if (!me) { alert(L("سجل دخولك من حسابي باش تطلب", "Sign in from My Account to order")); return navigate({ to: "/account" }); }
    if (pay === "wallet" && balance < total) return alert(L("الرصيد ما يكفيش", "Not enough wallet balance"));
    setBusy(true);
    try {
      await api.placeOrder({ cook_id: cook.id, items: lines.map((l) => ({ product_id: l.p.id, qty: l.qty })), name: name.trim(), phone: phone.trim(), address: address.trim(), payment: pay });
      cart.set(() => ({ cook_id: null, items: [] }));
      navigate({ to: "/orders" });
    } catch (x) { alert(errText(x, L)); } finally { setBusy(false); }
  };

  if (!lines.length) return (
    <div className="min-h-screen pb-24">
      <TopBar title={t("cart")} />
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="text-7xl">🛍️</div>
        <p className="text-muted-foreground">{L("السلة فاضية", "Your cart is empty")}</p>
        <Link to="/" className={btnPrimary}>{t("orderNow")}</Link>
      </div>
      <BottomNav />
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      <TopBar title={t("cart")} />
      <form onSubmit={confirmOrder} className="space-y-4 p-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2 font-bold">{cook?.avatar} {lang === "ar" ? cook?.kitchen_name_ar : cook?.kitchen_name_en}</div>
          {lines.map((l) => (
            <div key={l.product_id} className="flex items-center gap-3">
              <Img src={l.p.image_url} alt="" className="h-14 w-14 rounded-xl" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{lang === "ar" ? l.p.name_ar : l.p.name_en}</div>
                <div className="text-xs text-primary font-bold">{money(l.p.price_LYD * l.qty, lang)}</div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                <button type="button" onClick={() => setQty(l.product_id, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-card">{l.qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}</button>
                <span className="w-4 text-center text-sm font-bold">{l.qty}</span>
                <button type="button" onClick={() => setQty(l.product_id, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="space-y-2 text-sm">
          <Row k={L("الأكل", "Food total")} v={money(subtotal, lang)} />
          <Row k={t("delivery")} v={money(DELIVERY_FEE, lang)} />
          <Row k={L("رسوم التطبيق", "App fee")} v={money(APP_FEE, lang)} />
          <div className="border-t pt-2"><Row k={t("total")} v={money(total, lang)} bold /></div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-bold">{L("معلومات التوصيل", "Delivery details")}</h3>
          <input required className={inputCls} placeholder={L("اسمك", "Your Name")} value={name} onChange={(e) => setName(e.target.value)} />
          <input required className={inputCls} inputMode="tel" pattern="[0-9+ ]{7,15}" placeholder={L("رقم الهاتف", "Phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="flex gap-2">
            <input required className={inputCls} placeholder={L("العنوان", "Address")} value={address} onChange={(e) => setAddress(e.target.value)} />
            <button type="button" onClick={locate} className="grid w-12 shrink-0 place-items-center rounded-xl bg-muted text-primary" aria-label="locate">
              <LocateFixed className={`h-5 w-5 ${locating ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPay("cash")} className={`rounded-xl border p-3 text-start text-sm ${pay === "cash" ? "border-primary bg-primary/10" : "bg-muted"}`}>
              <div className="text-xl">💵</div><div className="font-bold">{L("كاش عند الاستلام", "Cash on Delivery")}</div>
            </button>
            <button type="button" disabled={!me} onClick={() => setPay("wallet")} className={`rounded-xl border p-3 text-start text-sm disabled:opacity-40 ${pay === "wallet" ? "border-primary bg-primary/10" : "bg-muted"}`}>
              <div className="text-xl">👛</div><div className="font-bold">{L("المحفظة", "Wallet")}</div>
              <div className={`text-xs ${me && balance < total ? "text-destructive" : "text-muted-foreground"}`}>{me ? money(balance, lang) : L("سجل دخول", "Sign in first")}</div>
            </button>
          </div>
        </Card>
        <button disabled={busy} className={`${btnPrimary} w-full text-lg`}>{t("checkout")} • {money(total, lang)}</button>
      </form>
      <BottomNav />
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-lg font-black text-primary" : "text-muted-foreground"}`}><span>{k}</span><span>{v}</span></div>;
}
