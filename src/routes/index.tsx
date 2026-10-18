import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, List, Map as MapIcon, Moon, ChefHat } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { db, distanceKm, CATEGORIES, ME } from "@/lib/store";
import { fmtCountdown, isOpenAt, nextChange, useNow } from "@/lib/time";
import { BottomNav, Img, LangToggle, Logo, OpenBadge, Stars, money } from "@/components/nb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NIGHTBITE — Late Night Home Kitchen Delivery" },
      { name: "description", content: "Order home-cooked sandwiches, shakshuka and brik from real Tripoli homes, 10 PM – 5 AM." },
      { property: "og:title", content: "NIGHTBITE — Home Food, Late Night" },
      { property: "og:description", content: "Real homes cooking late night in Tripoli. Delivered by moto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, L, lang } = useI18n();
  const data = db.use();
  const now = useNow();
  const open = isOpenAt(now);
  const [preview, setPreview] = useState(() => sessionStorage.getItem("nb_preview") === "1");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [cat, setCat] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const kitchens = useMemo(() => data.cooks
    .filter((c) => !c.banned && (!onlyOpen || c.is_open))
    .filter((c) => !cat || data.products.some((p) => p.cook_id === c.id && p.category === cat))
    .map((c) => ({ ...c, dist: distanceKm(c.lat, c.lng) }))
    .sort((a, b) => a.dist - b.dist), [data, onlyOpen, cat]);

  const countdown = fmtCountdown(nextChange(now).getTime() - now.getTime());

  if (!open && !preview) {
    return (
      <div className="flex min-h-screen flex-col bg-night">
        <div className="flex items-center justify-between p-4"><Logo /><LangToggle /></div>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="text-8xl drop-shadow-[0_0_40px_oklch(0.86_0.18_90/0.5)]">🌙</div>
          <h1 className="text-3xl font-black leading-tight">{L("نرجعو الساعة 10 في الليل", "We open at 10 PM")}</h1>
          <p className="text-muted-foreground">{L("الحياش يطيبو من 10 الليل لين 5 الصبح", "Home kitchens cook from 10 PM to 5 AM")}</p>
          <div className="rounded-2xl border bg-card px-6 py-4">
            <div className="text-xs text-muted-foreground">{L("نفتحو بعد", "Opening in")}</div>
            <div className="font-mono text-4xl font-black text-primary" dir="ltr">{countdown}</div>
          </div>
          <button onClick={() => { sessionStorage.setItem("nb_preview", "1"); setPreview(true); }}
            className="text-sm font-semibold text-secondary underline underline-offset-4">
            {L("شوف الحياش (وضع تجريبي)", "Browse anyway (demo mode)")}
          </button>
        </div>
        <RoleLinks />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night pb-24">
      <header className="space-y-3 p-4">
        <div className="flex items-center justify-between"><Logo /><LangToggle /></div>
        <div className="flex items-center justify-between rounded-2xl border bg-card/80 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Moon className="h-4 w-4 text-secondary" />
            <span className="font-semibold">{L("فاتحين 10 الليل - 5 الصبح", "Open 10 PM - 5 AM")}</span>
          </div>
          <div className="text-end">
            <div className="text-[10px] text-muted-foreground">{open ? L("نسكرو بعد", "Closes in") : L("تجريبي • نفتحو بعد", "Demo • opens in")}</div>
            <div className="font-mono text-sm font-bold text-primary" dir="ltr">{countdown}</div>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{t("nearbyHomes")} 🏠</h2>
          <div className="flex rounded-full bg-muted p-0.5">
            <button onClick={() => setView("list")} className={`rounded-full p-1.5 ${view === "list" ? "bg-primary text-primary-foreground" : ""}`} aria-label="list"><List className="h-4 w-4" /></button>
            <button onClick={() => setView("map")} className={`rounded-full p-1.5 ${view === "map" ? "bg-primary text-primary-foreground" : ""}`} aria-label="map"><MapIcon className="h-4 w-4" /></button>
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm">
          <span>{L("الفاتحين بس", "Open Now Only")}</span>
          <button onClick={() => setOnlyOpen(!onlyOpen)} className={`relative h-6 w-11 rounded-full transition ${onlyOpen ? "bg-success" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${onlyOpen ? "start-[22px]" : "start-0.5"}`} />
          </button>
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={!cat} onClick={() => setCat(null)}>🍽️ {L("الكل", "All")}</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.icon} {lang === "ar" ? c.ar : c.en}</Chip>
          ))}
        </div>

        {view === "map" && <FakeMap kitchens={kitchens} />}

        {kitchens.length === 0 && <p className="py-10 text-center text-muted-foreground">{L("ما فيش حياش توا 😴", "No kitchens right now 😴")}</p>}

        {kitchens.map((k) => {
          const prods = data.products.filter((p) => p.cook_id === k.id).slice(0, 3);
          return (
            <div key={k.id} className="overflow-hidden rounded-3xl border bg-card">
              <div className="relative h-28">
                <Img src={k.cover} alt={k.kitchen_name_en} className="h-full w-full opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute top-3 start-3"><OpenBadge open={k.is_open} /></div>
                {k.is_verified && <span className="absolute top-3 end-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">✓ {L("موثوق", "Verified")}</span>}
              </div>
              <div className="-mt-8 relative space-y-3 p-4 pt-0">
                <div className="flex items-end gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-card bg-surface text-3xl">{k.avatar}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-black leading-tight">{lang === "ar" ? k.kitchen_name_ar : k.kitchen_name_en}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{k.name}</span>•<Stars value={k.rating} size={11} /><span className="font-bold text-secondary">{k.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {L(`${k.dist} كم منك`, `${k.dist} km away`)} • {lang === "ar" ? k.address_ar : k.address_en}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {prods.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-xl bg-muted">
                      <Img src={p.image_url} alt={p.name_en} className="h-16 w-full" />
                      <div className="p-1.5">
                        <div className="truncate text-[11px]">{lang === "ar" ? p.name_ar : p.name_en}</div>
                        <div className="text-[11px] font-bold text-primary">{money(p.price_LYD, lang)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/kitchen/$id" params={{ id: k.id }} className="block rounded-xl bg-gradient-primary py-2.5 text-center font-bold text-primary-foreground shadow-glow">
                  {L("شوف المنيو", "View Menu")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6"><RoleLinks /></div>
      <BottomNav />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
      {children}
    </button>
  );
}

function FakeMap({ kitchens }: { kitchens: { id: string; lat: number; lng: number; avatar: string; dist: number; is_open: boolean }[] }) {
  const { L } = useI18n();
  const pos = (lat: number, lng: number) => ({ left: `${((lng - 13.1) / 0.12) * 100}%`, top: `${(1 - (lat - 32.85) / 0.05) * 100}%` });
  return (
    <div className="relative h-64 overflow-hidden rounded-3xl border map-grid" dir="ltr">
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-accent/80 to-transparent text-center text-[10px] leading-8 text-muted-foreground">
        {L("البحر المتوسط", "Mediterranean Sea")} 🌊
      </div>
      <div className="absolute" style={pos(ME.lat, ME.lng)}>
        <span className="block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-secondary ring-8 ring-secondary/20" />
      </div>
      {kitchens.map((k) => (
        <Link key={k.id} to="/kitchen/$id" params={{ id: k.id }} className="absolute -translate-x-1/2 -translate-y-full" style={pos(k.lat, k.lng)}>
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-glow ${k.is_open ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <span>{k.avatar}</span>{k.dist} km
          </div>
          <div className={`mx-auto h-2 w-2 rotate-45 -mt-1 ${k.is_open ? "bg-primary" : "bg-muted"}`} />
        </Link>
      ))}
    </div>
  );
}

function RoleLinks() {
  const { L, t } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-6 text-center text-[11px]">
      <Link to="/cook" className="rounded-xl border bg-card p-2"><ChefHat className="mx-auto mb-1 h-4 w-4 text-primary" />{t("beCook")}</Link>
      <Link to="/delivery" className="rounded-xl border bg-card p-2"><span className="block text-base">🏍️</span>{L("سايق", "Driver")}</Link>
      <Link to="/admin" className="rounded-xl border bg-card p-2"><span className="block text-base">🛡️</span>{L("الإدارة", "Admin")}</Link>
    </div>
  );
}
