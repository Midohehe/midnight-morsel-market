import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Home, ShoppingBag, ReceiptText, User as UserIcon, ArrowLeft, ArrowRight, Star, LogOut, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cart, db, session, type OrderStatus, type Role, type User } from "@/lib/store";

export function Logo({ small }: { small?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <span className={small ? "text-xl" : "text-2xl"}>🌙</span>
      <div className="leading-none">
        <div className={`font-black tracking-tight ${small ? "text-lg" : "text-xl"}`}>
          <span className="text-primary">{t("appName")}</span>
        </div>
        {!small && <div className="text-[11px] text-muted-foreground mt-1">{t("tagline")} 🥪</div>}
      </div>
    </div>
  );
}

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-full bg-muted p-0.5 text-xs font-bold" dir="ltr">
      {(["ar", "en"] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {l === "ar" ? "🇱🇾 AR" : "🇬🇧 EN"}
        </button>
      ))}
    </div>
  );
}

export function TopBar({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const { lang } = useI18n();
  const router = useRouter();
  const Arrow = lang === "ar" ? ArrowRight : ArrowLeft;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
      {back ? (
        <button onClick={() => router.history.back()} className="grid h-9 w-9 place-items-center rounded-full bg-muted" aria-label="back">
          <Arrow className="h-4 w-4" />
        </button>
      ) : <Logo small />}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
      <LangToggle />
    </header>
  );
}

export function BottomNav() {
  const { t, L } = useI18n();
  const c = cart.use();
  const count = c.items.reduce((s, i) => s + i.qty, 0);
  const items = [
    { to: "/", icon: Home, label: L("الرئيسية", "Home") },
    { to: "/cart", icon: ShoppingBag, label: t("cart"), badge: count },
    { to: "/orders", icon: ReceiptText, label: t("myOrders") },
    { to: "/account", icon: UserIcon, label: L("حسابي", "Account") },
  ] as const;
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t bg-card/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {items.map((it) => (
          <Link key={it.to} to={it.to} activeOptions={{ exact: true }}
            className="relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}>
            <it.icon className="h-5 w-5" />
            {it.label}
            {"badge" in it && it.badge > 0 && (
              <span className="absolute top-1.5 ms-6 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{it.badge}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)}>
          <Star style={{ width: size, height: size }}
            className={i <= Math.round(value) ? "fill-secondary text-secondary" : "text-muted-foreground"} />
        </button>
      ))}
    </div>
  );
}

export function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <div className={`grid place-items-center bg-gradient-primary text-3xl ${className}`}>🍽️</div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={`object-cover ${className}`} />;
}

export const money = (n: number, lang: string) => (lang === "ar" ? `${n} د.ل` : `${n} LYD`);

export function OpenBadge({ open }: { open: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${open ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-success animate-pulse" : "bg-destructive"}`} />
      {open ? t("openNow") : t("closed")}
    </span>
  );
}

export const STATUS: Record<OrderStatus, { ar: string; en: string; icon: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending", icon: "⏳" },
  cooking: { ar: "يطيب", en: "Cooking", icon: "🔥" },
  on_way: { ar: "في الطريق", en: "On the way", icon: "🏍️" },
  delivered: { ar: "وصل", en: "Delivered", icon: "✅" },
  rejected: { ar: "مرفوض", en: "Rejected", icon: "✖️" },
};

export function StatusPill({ s }: { s: OrderStatus }) {
  const { L } = useI18n();
  const cls = s === "delivered" ? "bg-success/15 text-success" : s === "rejected" ? "bg-destructive/15 text-destructive" : s === "pending" ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{STATUS[s].icon} {L(STATUS[s].ar, STATUS[s].en)}</span>;
}

export const inputCls = "w-full rounded-xl border bg-muted px-3 py-2.5 text-sm outline-none focus:border-primary";
export const btnPrimary = "rounded-xl bg-gradient-primary px-4 py-3 font-bold text-primary-foreground shadow-glow active:scale-[.98] transition disabled:opacity-40";
export const btnGhost = "rounded-xl border bg-muted px-3 py-2 text-sm font-semibold active:scale-[.98] transition";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-4 ${className}`}>{children}</div>;
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
      {items.map((i) => (
        <button key={i.id} onClick={() => onChange(i.id)}
          className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${value === i.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

/** Grid of icon buttons (not a strip) — used for panel sections. */
export function IconTabs<T extends string>({ value, onChange, items, cols = 3 }: {
  value: T; onChange: (v: T) => void; cols?: number;
  items: { id: T; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((i) => {
        const on = value === i.id;
        return (
          <button key={i.id} onClick={() => onChange(i.id)} aria-pressed={on}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 transition active:scale-[.97] ${on ? "border-primary bg-primary/15 text-primary shadow-glow" : "bg-card text-muted-foreground"}`}>
            <i.icon className="h-5 w-5" />
            <span className="text-[11px] font-bold leading-none">{i.label}</span>
          </button>
        );
      })}
    </div>
  );
}


/** Role-scoped login gate: each role has its own session & credentials. */
export function LoginGate({ role, title, demo, otp, extra, children }: {
  role: Role; title: string; demo: string; otp?: boolean; extra?: ReactNode;
  children: (user: User, logout: () => void) => ReactNode;
}) {
  const { L } = useI18n();
  const s = session.use();
  const data = db.use();
  const user = data.users.find((u) => u.id === s[role] && u.role === role);
  const [mode, setMode] = useState<"pass" | "otp">("pass");
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [otpSent, setOtpSent] = useState(false); const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const logout = () => session.set((x) => { delete x[role]; });
  if (user) return <>{children(user, logout)}</>;

  const login = (found?: User) => {
    if (!found) return setErr(L("بيانات غلط", "Wrong credentials"));
    session.set((x) => { x[role] = found.id; });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (mode === "pass") return login(data.users.find((x) => x.role === role && x.username === u.trim().toLowerCase() && x.password === p));
    if (!otpSent) {
      if (!data.users.some((x) => x.role === role && x.phone === u.trim())) return setErr(L("الرقم مش مسجل", "Phone not registered"));
      return setOtpSent(true);
    }
    if (code !== "1234") return setErr(L("الكود غلط", "Wrong code"));
    login(data.users.find((x) => x.role === role && x.phone === u.trim()));
  };

  return (
    <div className="min-h-screen bg-night">
      <TopBar title={title} />
      <div className="space-y-5 p-5 pt-10">
        <div className="text-center"><Logo /></div>
        <Card className="space-y-3">
          {otp && <Tabs value={mode} onChange={(m) => { setMode(m); setOtpSent(false); setErr(""); }}
            items={[{ id: "pass", label: L("يوزر وباسورد", "Username") }, { id: "otp", label: L("رقم + كود", "Phone + OTP") }]} />}
          <form onSubmit={submit} className="space-y-3">
            {mode === "pass" ? (<>
              <input className={inputCls} placeholder={L("اسم المستخدم", "Username")} value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" />
              <input className={inputCls} type="password" placeholder={L("كلمة السر", "Password")} value={p} onChange={(e) => setP(e.target.value)} />
            </>) : (<>
              <input className={inputCls} inputMode="tel" placeholder={L("رقم الهاتف", "Phone")} value={u} onChange={(e) => setU(e.target.value)} disabled={otpSent} />
              {otpSent && <input className={inputCls} inputMode="numeric" placeholder={L("كود التحقق (1234)", "OTP code (1234)")} value={code} onChange={(e) => setCode(e.target.value)} />}
            </>)}
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button className={`${btnPrimary} w-full`}>{mode === "otp" && !otpSent ? L("أبعث الكود", "Send code") : L("دخول", "Sign in")}</button>
          </form>
          <p className="rounded-lg bg-muted p-2 text-center text-[11px] text-muted-foreground" dir="ltr">Demo: {demo}</p>
        </Card>
        {extra}
      </div>
    </div>
  );
}

export function PanelHeader({ user, logout, title }: { user: User; logout: () => void; title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-xl">{user.avatar}</span>
      <div className="flex-1 leading-tight">
        <div className="text-[11px] text-primary font-bold">{title}</div>
        <div className="font-bold">{user.name}</div>
      </div>
      <LangToggle />
      <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-full bg-muted" aria-label="logout"><LogOut className="h-4 w-4" /></button>
    </header>
  );
}

export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="text-xl">{icon}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
