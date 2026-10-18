import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Plus, ShoppingBag, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cart, db, distanceKm } from "@/lib/store";
import { Img, OpenBadge, Stars, TopBar, money } from "@/components/nb";

export const Route = createFileRoute("/kitchen/$id")({
  head: () => ({
    meta: [
      { title: "Kitchen Menu — NIGHTBITE" },
      { name: "description", content: "Browse a home kitchen's late night menu and order for delivery." },
      { property: "og:title", content: "Kitchen Menu — NIGHTBITE" },
      { property: "og:description", content: "Home-cooked late night food in Tripoli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kitchen,
});

function Kitchen() {
  const { id } = Route.useParams();
  const { t, L, lang } = useI18n();
  const data = db.use();
  const c = cart.use();
  const [video, setVideo] = useState(false);
  const k = data.cooks.find((x) => x.id === id);
  if (!k) return <div className="p-10 text-center">404</div>;
  const products = data.products.filter((p) => p.cook_id === k.id);
  const count = c.items.reduce((s, i) => s + i.qty, 0);
  const total = c.items.reduce((s, i) => s + i.qty * (data.products.find((p) => p.id === i.product_id)?.price_LYD ?? 0), 0);

  const add = (pid: string, max: number) => {
    if (!k.is_open) return alert(L("المطبخ مسكر توا", "This kitchen is closed now"));
    if (c.cook_id && c.cook_id !== k.id && c.items.length && !confirm(L("السلة فيها من مطبخ ثاني. نفرغوها؟", "Cart has items from another kitchen. Clear it?"))) return;
    cart.set((d) => {
      if (d.cook_id !== k.id) { d.cook_id = k.id; d.items = []; }
      const it = d.items.find((i) => i.product_id === pid);
      if (it) it.qty = Math.min(max, it.qty + 1); else d.items.push({ product_id: pid, qty: 1 });
    });
  };

  return (
    <div className="min-h-screen pb-28">
      <TopBar title={lang === "ar" ? k.kitchen_name_ar : k.kitchen_name_en} />
      <div className="relative h-48">
        {video ? <video src={k.kitchen_video_url} autoPlay controls className="h-full w-full object-cover" /> : <Img src={k.cover} alt="" className="h-full w-full" />}
        {!video && <button onClick={() => setVideo(true)} className="absolute bottom-3 end-3 rounded-full bg-background/80 px-3 py-1.5 text-xs font-bold backdrop-blur">▶ {L("فيديو المطبخ", "Kitchen video")}</button>}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl">{k.avatar}</span>
          <div className="flex-1">
            <h1 className="text-xl font-black">{lang === "ar" ? k.kitchen_name_ar : k.kitchen_name_en}</h1>
            <div className="text-sm text-muted-foreground">{k.name}</div>
          </div>
          <OpenBadge open={k.is_open} />
        </div>
        {k.is_verified && (
          <div className="flex items-center gap-2 rounded-xl bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary">
            <BadgeCheck className="h-4 w-4" /> Verified Kitchen - مطبخ موثوق
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-card p-2"><div className="flex justify-center"><Stars value={k.rating} size={11} /></div><div className="font-black text-secondary">{k.rating.toFixed(1)}</div><div className="text-[10px] text-muted-foreground">{t("rating")}</div></div>
          <div className="rounded-xl bg-card p-2"><div className="font-black">{k.total_orders}</div><div className="text-[10px] text-muted-foreground">{L("طلبية", "Orders")}</div></div>
          <div className="rounded-xl bg-card p-2"><div className="font-black">{distanceKm(k.lat, k.lng)} km</div><div className="text-[10px] text-muted-foreground">{L("المسافة", "Distance")}</div></div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" />{lang === "ar" ? k.address_ar : k.address_en}</div>

        <h2 className="pt-2 text-lg font-black">{L("المنيو", "Menu")} 🍽️</h2>
        {products.map((p) => {
          const sold = p.quantity_available <= 0;
          const inCart = c.cook_id === k.id ? c.items.find((i) => i.product_id === p.id)?.qty ?? 0 : 0;
          return (
            <div key={p.id} className={`flex gap-3 rounded-2xl border bg-card p-3 ${sold ? "opacity-50 grayscale" : ""}`}>
              <Img src={p.image_url} alt={p.name_en} className="h-24 w-24 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col">
                <h3 className="font-bold leading-tight">{lang === "ar" ? p.name_ar : p.name_en}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{lang === "ar" ? p.description_ar : p.description_en}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div>
                    <div className="font-black text-primary">{money(p.price_LYD, lang)}</div>
                    <div className="text-[10px] text-muted-foreground">{sold ? t("soldOut") : `${t("available")}: ${p.quantity_available}`}</div>
                  </div>
                  {sold ? (
                    <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">{t("soldOut")}</span>
                  ) : (
                    <button onClick={() => add(p.id, p.quantity_available)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                      <Plus className="h-3.5 w-3.5" />{inCart ? `×${inCart}` : t("addToCart")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {count > 0 && (
        <Link to="/cart" className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 items-center justify-between rounded-2xl bg-gradient-primary px-4 py-3.5 font-bold text-primary-foreground shadow-glow">
          <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{t("cart")} ({count})</span>
          <span>{money(total, lang)}</span>
        </Link>
      )}
    </div>
  );
}
