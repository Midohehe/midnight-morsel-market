import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { db, distanceKm, settleDelivered } from "@/lib/store";
import { WalletPanel } from "@/components/wallet";
import { timeAgo } from "@/lib/time";
import { Card, LoginGate, PanelHeader, Stat, StatusPill, Tabs, money } from "@/components/nb";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Driver App — NIGHTBITE" },
      { name: "description", content: "Moto delivery drivers pick up and deliver late night home food." },
      { property: "og:title", content: "Driver App — NIGHTBITE" },
      { property: "og:description", content: "Deliver home food at night." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const { L, lang } = useI18n();
  const data = db.use();
  const [tab, setTab] = useState<"available" | "mine" | "wallet">("available");
  return (
    <LoginGate role="DELIVERY" title={L("تطبيق السايق", "Driver App")} demo="ali / 1234 · omar / 1234">
      {(user, logout) => {
        const available = data.orders.filter((o) => o.status === "cooking" && !o.delivery_boy);
        const mine = data.orders.filter((o) => o.delivery_boy?.id === user.id);
        const active = mine.filter((o) => o.status === "on_way");
        const list = tab === "available" ? available : tab === "mine" ? mine : [];
        const take = (id: string) => db.set((d) => { const o = d.orders.find((x) => x.id === id); if (o && !o.delivery_boy) { o.delivery_boy = { id: user.id, name: user.name, phone: user.phone }; o.status = "on_way"; } });
        const done = (id: string) => db.set((d) => {
          const o = d.orders.find((x) => x.id === id); if (!o) return;
          o.status = "delivered";
          const k = d.cooks.find((c) => c.id === o.cook_id); if (k) k.total_orders++;
          settleDelivered(d, o);
        });
        return (
          <div className="min-h-screen pb-10">
            <PanelHeader user={user} logout={logout} title={L("سايق موتو", "Moto driver")} />
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-2">
                <Stat icon="📦" label={L("متاحة", "Available")} value={available.length} />
                <Stat icon="🏍️" label={L("في الطريق", "Active")} value={active.length} />
                <Stat icon="💵" label={L("رصيدي", "Balance")} value={money(data.wallets[user.id] ?? 0, lang)} />
              </div>
              <Tabs value={tab} onChange={setTab} items={[{ id: "available", label: L("طلبات متاحة", "Available") }, { id: "mine", label: L("توصيلاتي", "My deliveries") }, { id: "wallet", label: L("المحفظة", "Wallet") }]} />
              {tab === "wallet" && <WalletPanel userId={user.id} />}
              {tab !== "wallet" && !list.length && <p className="py-10 text-center text-muted-foreground">{L("ما فيش طلبات توا 🌙", "No orders right now 🌙")}</p>}
              {list.map((o) => {
                const k = data.cooks.find((c) => c.id === o.cook_id);
                return (
                  <Card key={o.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <b>#{o.id.slice(-5).toUpperCase()}</b><StatusPill s={o.status} />
                    </div>
                    <div className="text-sm">🏠 {lang === "ar" ? k?.kitchen_name_ar : k?.kitchen_name_en} • {k && distanceKm(k.lat, k.lng)} km</div>
                    <div className="text-sm">📍 {o.customer_name} — {o.customer_address}</div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{timeAgo(o.created_at, lang === "ar")} • {o.ready ? L("✅ جاهز", "✅ Ready") : L("🔥 يطيب", "🔥 Cooking")}</span>
                      <span className="font-bold text-primary">{L("كاش", "Cash")}: {money(o.total, lang)}</span>
                    </div>
                    {tab === "available" && <button onClick={() => take(o.id)} className="w-full rounded-xl bg-gradient-primary py-2.5 font-bold text-primary-foreground">{L("نوصلها أنا", "Accept delivery")}</button>}
                    {o.status === "on_way" && o.delivery_boy?.id === user.id && (
                      <div className="grid grid-cols-2 gap-2">
                        <a href={`tel:${o.customer_phone}`} className="rounded-xl bg-muted py-2.5 text-center font-bold">📞 {L("اتصل", "Call")}</a>
                        <button onClick={() => done(o.id)} className="rounded-xl bg-success py-2.5 font-bold text-success-foreground">{L("وصلت ✓", "Delivered ✓")}</button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      }}
    </LoginGate>
  );
}
