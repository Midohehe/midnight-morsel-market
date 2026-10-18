import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { APP_FEE, COMMISSION, db, isTonight, uid, type Role } from "@/lib/store";
import { timeAgo } from "@/lib/time";
import { Card, LoginGate, PanelHeader, Stat, StatusPill, Tabs, btnPrimary, inputCls, money } from "@/components/nb";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — NIGHTBITE" },
      { name: "description", content: "Manage kitchens, orders, users and finance for NIGHTBITE." },
      { property: "og:title", content: "Admin Panel — NIGHTBITE" },
      { property: "og:description", content: "NIGHTBITE operations dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "dash" | "kitchens" | "orders" | "users" | "finance";

function AdminPage() {
  const { L, lang } = useI18n();
  const data = db.use();
  const [tab, setTab] = useState<Tab>("dash");
  const [video, setVideo] = useState<string | null>(null);
  const tonight = data.orders.filter((o) => isTonight(o.created_at));
  const valid = data.orders.filter((o) => o.status !== "rejected");
  const commission = valid.reduce((s, o) => s + o.subtotal * COMMISSION, 0);
  const patchCook = (id: string, p: Record<string, unknown>) => db.set((d) => { Object.assign(d.cooks.find((c) => c.id === id)!, p); });

  return (
    <LoginGate role="ADMIN" title={L("لوحة الإدارة", "Admin Panel")} demo="admin / admin123">
      {(user, logout) => (
        <div className="min-h-screen pb-10">
          <PanelHeader user={user} logout={logout} title={L("الإدارة", "Admin")} />
          <div className="space-y-4 p-4">
            <Tabs value={tab} onChange={setTab} items={[
              { id: "dash", label: L("عام", "Overview") }, { id: "kitchens", label: L("المطابخ", "Kitchens") },
              { id: "orders", label: L("الطلبات", "Orders") }, { id: "users", label: L("المستخدمين", "Users") }, { id: "finance", label: L("المالية", "Finance") }]} />

            {tab === "dash" && (
              <div className="grid grid-cols-2 gap-3">
                <Stat icon="🧾" label={L("طلبات الليلة", "Orders tonight")} value={tonight.length} />
                <Stat icon="💰" label={L("إيرادات الليلة", "Revenue tonight")} value={money(tonight.filter((o) => o.status !== "rejected").reduce((s, o) => s + o.total, 0), lang)} />
                <Stat icon="🏠" label={L("مطابخ فاتحة", "Active kitchens")} value={data.cooks.filter((c) => c.is_open && !c.banned).length} />
                <Stat icon="🏍️" label={L("سواق نشطين", "Active drivers")} value={new Set(data.orders.filter((o) => o.status === "on_way").map((o) => o.delivery_boy?.id)).size + "/" + data.users.filter((u) => u.role === "DELIVERY").length} />
              </div>
            )}

            {tab === "kitchens" && data.cooks.map((c) => (
              <Card key={c.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.avatar}</span>
                  <div className="flex-1">
                    <b>{lang === "ar" ? c.kitchen_name_ar : c.kitchen_name_en}</b>
                    <div className="text-xs text-muted-foreground">{c.name} • ⭐ {c.rating.toFixed(1)} • {c.total_orders} {L("طلب", "orders")}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] font-bold">
                    {c.is_verified ? <span className="text-success">✓ {L("موثوق", "Verified")}</span> : <span className="text-secondary">{L("غير موثوق", "Unverified")}</span>}
                    {c.banned && <span className="text-destructive">⛔ {L("موقوف", "Banned")}</span>}
                  </div>
                </div>
                {video === c.id && <video src={c.kitchen_video_url} controls autoPlay className="w-full rounded-xl" />}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button onClick={() => setVideo(video === c.id ? null : c.id)} className="rounded-lg bg-muted py-2">▶ {L("الفيديو", "Video")}</button>
                  <button onClick={() => patchCook(c.id, { is_verified: !c.is_verified })} className="rounded-lg bg-success/15 py-2 text-success">{c.is_verified ? L("إلغاء التوثيق", "Unverify") : L("توثيق", "Verify")}</button>
                  {c.banned ? <button onClick={() => patchCook(c.id, { banned: false })} className="rounded-lg bg-muted py-2">{L("رفع الإيقاف", "Unban")}</button> :
                    <button disabled={c.rating >= 3.5} title="rating < 3.5" onClick={() => patchCook(c.id, { banned: true, is_open: false })} className="rounded-lg bg-destructive/15 py-2 text-destructive disabled:opacity-30">{L("إيقاف", "Ban")}</button>}
                </div>
                {c.rating >= 3.5 && !c.banned && <p className="text-[10px] text-muted-foreground">{L("الإيقاف متاح لو التقييم أقل من 3.5", "Ban allowed only if rating < 3.5")}</p>}
              </Card>
            ))}

            {tab === "orders" && tonight.map((o) => {
              const k = data.cooks.find((c) => c.id === o.cook_id);
              return (
                <Card key={o.id} className="space-y-1 text-sm">
                  <div className="flex justify-between"><b>#{o.id.slice(-5).toUpperCase()}</b><StatusPill s={o.status} /></div>
                  <div className="text-xs text-muted-foreground">{k?.avatar} {lang === "ar" ? k?.kitchen_name_ar : k?.kitchen_name_en} → {o.customer_name} • {timeAgo(o.created_at, lang === "ar")}</div>
                  <div className="flex justify-between text-xs"><span>🏍️ {o.delivery_boy?.name ?? "—"}</span><b className="text-primary">{money(o.total, lang)}</b></div>
                </Card>
              );
            })}

            {tab === "users" && <Users />}

            {tab === "finance" && (<>
              <div className="grid grid-cols-2 gap-3">
                <Stat icon="🏦" label={L("عمولة 20%", "Commission 20%")} value={money(Math.round(commission), lang)} />
                <Stat icon="📲" label={L("رسوم التطبيق", "App fees")} value={money(valid.length * APP_FEE, lang)} />
                <Stat icon="💵" label={L("إجمالي المبيعات", "Gross sales")} value={money(valid.reduce((s, o) => s + o.total, 0), lang)} />
                <Stat icon="📈" label={L("صافي الربح", "Net income")} value={money(Math.round(commission + valid.length * APP_FEE), lang)} />
              </div>
              {data.cooks.map((c) => {
                const os = valid.filter((o) => o.cook_id === c.id);
                const sub = os.reduce((s, o) => s + o.subtotal, 0);
                return (
                  <Card key={c.id} className="flex justify-between text-sm">
                    <span>{c.avatar} {lang === "ar" ? c.kitchen_name_ar : c.kitchen_name_en}</span>
                    <span className="text-end text-xs">{money(sub, lang)}<br /><b className="text-primary">+{money(Math.round(sub * COMMISSION * 10) / 10, lang)}</b></span>
                  </Card>
                );
              })}
            </>)}
          </div>
        </div>
      )}
    </LoginGate>
  );
}

function Users() {
  const { L } = useI18n();
  const data = db.use();
  const [f, setF] = useState({ name: "", phone: "", username: "", password: "", role: "DELIVERY" as Role });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const username = f.username.trim().toLowerCase();
    if (data.users.some((u) => u.username === username)) return alert(L("اليوزر مستعمل", "Username taken"));
    db.set((d) => { d.users.push({ id: "u_" + uid(), ...f, username, avatar: f.role === "DELIVERY" ? "🏍️" : "🙂" }); });
    setF({ ...f, name: "", phone: "", username: "", password: "" });
  };
  const roles: Role[] = ["CUSTOMER", "COOK", "DELIVERY", "ADMIN"];
  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={add} className="space-y-2">
          <h3 className="font-bold">{L("مستخدم جديد", "Add user")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["name", "phone", "username", "password"] as const).map((k) => (
              <input key={k} required className={inputCls} placeholder={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            ))}
          </div>
          <select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
            <option value="DELIVERY">DELIVERY</option><option value="CUSTOMER">CUSTOMER</option>
          </select>
          <button className={`${btnPrimary} w-full`}>{L("إضافة", "Add")}</button>
        </form>
      </Card>
      {roles.map((r) => (
        <div key={r} className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground">{r} ({data.users.filter((u) => u.role === r).length})</h4>
          {data.users.filter((u) => u.role === r).map((u) => (
            <Card key={u.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="text-2xl">{u.avatar}</span>
              <div className="flex-1"><b>{u.name}</b><div className="text-xs text-muted-foreground" dir="ltr">{u.phone} · @{u.username}</div></div>
              {u.role !== "ADMIN" && u.role !== "COOK" && (
                <button onClick={() => confirm("Delete?") && db.set((d) => { d.users = d.users.filter((x) => x.id !== u.id); })} className="text-xs text-destructive">✕</button>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
