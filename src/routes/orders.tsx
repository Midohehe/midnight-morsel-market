import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api, db, errText, useAuth, type Order } from "@/lib/store";
import { timeAgo } from "@/lib/time";
import { BottomNav, Card, STATUS, Stars, StatusPill, TopBar, btnPrimary, inputCls, money } from "@/components/nb";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — NIGHTBITE" },
      { name: "description", content: "Track your late night orders live from kitchen to your door." },
      { property: "og:title", content: "My Orders — NIGHTBITE" },
      { property: "og:description", content: "Live order tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { t, L } = useI18n();
  const data = db.use();
  const auth = useAuth();
  const mine = data.orders.filter((o) => auth.userId && o.customer_id === auth.userId);
  return (
    <div className="min-h-screen pb-24">
      <TopBar title={t("myOrders")} back={false} />
      <div className="space-y-4 p-4">
        {!mine.length && (
          <div className="py-20 text-center">
            <div className="text-6xl">🧾</div>
            <p className="my-4 text-muted-foreground">{L("ما عندكش طلبات", "No orders yet")}</p>
            <Link to="/" className={btnPrimary}>{t("orderNow")}</Link>
          </div>
        )}
        {mine.map((o) => <OrderCard key={o.id} o={o} />)}
      </div>
      <BottomNav />
    </div>
  );
}

const STEPS = ["pending", "cooking", "on_way", "delivered"] as const;

function OrderCard({ o }: { o: Order }) {
  const { L, lang } = useI18n();
  const data = db.use();
  const cook = data.cooks.find((c) => c.id === o.cook_id);
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">{cook?.avatar} {lang === "ar" ? cook?.kitchen_name_ar : cook?.kitchen_name_en}</div>
          <div className="text-[11px] text-muted-foreground">#{o.id.slice(-5).toUpperCase()} • {timeAgo(o.created_at, lang === "ar")}</div>
        </div>
        <StatusPill s={o.status} />
      </div>
      {o.status !== "rejected" && (
        <div className="flex items-start">
          {STEPS.map((st, i) => (
            <div key={st} className="flex flex-1 flex-col items-center gap-1 text-center">
              <div className="flex w-full items-center">
                <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : i <= idx ? "bg-primary" : "bg-muted"}`} />
                <div className={`grid h-8 w-8 place-items-center rounded-full text-sm ${i <= idx ? "bg-primary" : "bg-muted"} ${i === idx && st !== "delivered" ? "animate-pulse ring-4 ring-primary/30" : ""}`}>{STATUS[st].icon}</div>
                <div className={`h-0.5 flex-1 ${i === 3 ? "opacity-0" : i < idx ? "bg-primary" : "bg-muted"}`} />
              </div>
              <span className={`text-[10px] ${i <= idx ? "text-foreground font-bold" : "text-muted-foreground"}`}>{L(STATUS[st].ar, STATUS[st].en)}</span>
            </div>
          ))}
        </div>
      )}
      {o.status === "cooking" && o.ready && <p className="rounded-lg bg-secondary/10 p-2 text-center text-xs text-secondary">{L("الأكل جاهز، نستنو في السايق 🏍️", "Food is ready, waiting for a driver 🏍️")}</p>}
      {o.delivery_boy && o.status === "on_way" && (
        <div className="flex items-center justify-between rounded-xl bg-muted p-3">
          <div className="text-sm"><div className="text-[11px] text-muted-foreground">{L("السايق", "Driver")}</div><div className="font-bold">🏍️ {o.delivery_boy.name}</div></div>
          <a href={`tel:${o.delivery_boy.phone}`} className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-xs font-bold text-success-foreground" dir="ltr"><Phone className="h-3.5 w-3.5" />{o.delivery_boy.phone}</a>
        </div>
      )}
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {o.items.map((i) => <div key={i.product_id} className="flex justify-between"><span>{i.qty}× {lang === "ar" ? i.name_ar : i.name_en}</span><span>{money(i.qty * i.price, lang)}</span></div>)}
        <div className="flex justify-between pt-1 font-bold text-foreground"><span>{L("المجموع", "Total")}</span><span className="text-primary">{money(o.total, lang)}</span></div>
      </div>
      {o.status === "delivered" && !o.rated && <RateForm o={o} />}
      {o.rated && <p className="text-center text-xs text-success">⭐ {L("شكراً على تقييمك", "Thanks for rating!")}</p>}
    </Card>
  );
}

function RateForm({ o }: { o: Order }) {
  const { L } = useI18n();
  const [r, setR] = useState(5);
  const [c, setC] = useState("");
  const submit = () => api.rate(o.id, r, c).catch((x) => alert(errText(x, L)));
  return (
    <div className="space-y-2 rounded-xl border border-secondary/40 bg-secondary/5 p-3">
      <div className="text-sm font-bold">{L("قيّم المطبخ", "Rate the kitchen")}</div>
      <Stars value={r} size={28} onChange={setR} />
      <textarea className={inputCls} rows={2} placeholder={L("تعليقك...", "Your comment...")} value={c} onChange={(e) => setC(e.target.value)} />
      <button onClick={submit} className="w-full rounded-xl bg-secondary py-2 font-bold text-secondary-foreground">{L("أبعث التقييم", "Submit rating")}</button>
    </div>
  );
}
