import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api, db, errText, type Role } from "@/lib/store";
import { WalletPanel } from "@/components/wallet";
import { BottomNav, Card, LoginGate, PanelHeader, Stat, Tabs, btnPrimary, inputCls } from "@/components/nb";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — NIGHTBITE" },
      { name: "description", content: "Sign in to your NIGHTBITE customer account." },
      { property: "og:title", content: "My Account — NIGHTBITE" },
      { property: "og:description", content: "Customer account and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const { L, t } = useI18n();
  const data = db.use();
  return (
    <div className="pb-24">
      <LoginGate role="CUSTOMER" title={L("حسابي", "My Account")} demo="ahmed / 1234" extra={<Register />}>
        {(user, logout) => {
          const orders = data.orders.filter((o) => o.customer_id === user.id);
          return (
            <div className="min-h-screen">
              <PanelHeader user={user} logout={logout} title={L("زبون", "Customer")} />
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat icon="🧾" label={L("طلباتي", "Orders")} value={orders.length} />
                  <Stat icon="💰" label={L("صرفت", "Spent (LYD)")} value={orders.filter((o) => o.status !== "rejected").reduce((s, o) => s + o.total, 0)} />
                </div>
                <Card className="space-y-1 text-sm">
                  <div>📞 <span dir="ltr">{user.phone}</span></div>
                  <div>📍 {user.address || "—"}</div>
                  <div className="text-muted-foreground">👤 {user.username}</div>
                </Card>
                <WalletPanel userId={user.id} />
                <Link to="/orders" className={`${btnPrimary} block text-center`}>{t("myOrders")}</Link>
              </div>
            </div>
          );
        }}
      </LoginGate>
      <BottomNav />
    </div>
  );
}

function Register() {
  const { L } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [f, setF] = useState({ name: "", phone: "", address: "", username: "", password: "", kitchen: "" });
  const [err, setErr] = useState("");
  if (!open) return <button onClick={() => setOpen(true)} className="w-full text-center text-sm text-secondary underline">{L("ما عندكش حساب؟ سجل توا", "No account? Sign up")}</button>;
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (f.password.length < 4) return setErr(L("كلمة السر 4 أحرف على الأقل", "Password must be at least 4 characters"));
    setBusy(true);
    try {
      await api.signUp({ ...f, role, kitchen: f.kitchen });
      if (role === "COOK") router.navigate({ to: "/cook" });
      else if (role === "DELIVERY") router.navigate({ to: "/delivery" });
    } catch (x) { setErr(errText(x, L)); } finally { setBusy(false); }
  };
  return (
    <Card>
      <form onSubmit={submit} className="space-y-2">
        <h3 className="font-bold">{L("حساب جديد", "New account")}</h3>
        <Tabs value={role} onChange={(r) => { setRole(r); setErr(""); }}
          items={[
            { id: "CUSTOMER", label: `🙂 ${L("زبون", "Customer")}` },
            { id: "COOK", label: `👩‍🍳 ${L("طباخ", "Cook")}` },
            { id: "DELIVERY", label: `🏍️ ${L("سايق", "Driver")}` },
          ]} />
        {(["name", "phone", "address", ...(role === "COOK" ? ["kitchen"] as const : []), "username", "password"] as const).map((k) => (
          <input key={k} required={k !== "address"} type={k === "password" ? "password" : "text"} className={inputCls}
            placeholder={{ name: L("الاسم", "Name"), phone: L("الهاتف", "Phone"), address: L("العنوان", "Address"), kitchen: L("اسم المطبخ", "Kitchen name"), username: L("اسم المستخدم", "Username"), password: L("كلمة السر", "Password") }[k]}
            value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        ))}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${btnPrimary} w-full`}>{L("سجل", "Sign up")}</button>
      </form>
    </Card>
  );
}
