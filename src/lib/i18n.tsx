import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const dict = {
  ar: { appName: "نايت بايت", tagline: "أكل حوش، في نص الليل", openNow: "فاتح توا", closed: "مسكر", nearbyHomes: "حياش قريبة منك", orderNow: "أطلب توا", cart: "السلة", myOrders: "طلباتي", beCook: "ولي طياب", homeFood: "أكل حوش", price: "السعر", delivery: "التوصيل", available: "متوفر", soldOut: "تم", addToCart: "ضيف للسلة", total: "المجموع", checkout: "أكد الطلب", rating: "التقييم" },
  en: { appName: "NIGHTBITE", tagline: "Home Food, Late Night", openNow: "Open Now", closed: "Closed", nearbyHomes: "Homes Near You", orderNow: "Order Now", cart: "Cart", myOrders: "My Orders", beCook: "Become a Cook", homeFood: "Home Food", price: "Price", delivery: "Delivery", available: "Available", soldOut: "Sold Out", addToCart: "Add to Cart", total: "Total", checkout: "Checkout", rating: "Rating" },
};
export type Lang = "ar" | "en";
type Key = keyof typeof dict.en;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string; L: (ar: string, en: string) => string };
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("nb_lang") as Lang) || "ar");
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("nb_lang", lang);
  }, [lang]);
  return (
    <I18n.Provider value={{ lang, setLang, t: (k) => dict[lang][k], L: (ar, en) => (lang === "ar" ? ar : en) }}>
      {children}
    </I18n.Provider>
  );
}
export function useI18n() {
  const c = useContext(I18n);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}
