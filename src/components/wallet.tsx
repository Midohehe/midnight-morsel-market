import { useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api, db, errText } from "@/lib/store";
import { timeAgo } from "@/lib/time";
import { Card, btnPrimary, inputCls, money } from "@/components/nb";

const TYPE = { topup: ["تعبئة", "Top-up"], payment: ["دفع", "Payment"], refund: ["استرجاع", "Refund"], earning: ["أرباح", "Earning"] } as const;

export function WalletPanel({ userId }: { userId: string }) {
  const { L, lang } = useI18n();
  const data = db.use();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const balance = data.wallets[userId] ?? 0;
  const txns = data.transactions.filter((t) => t.user_id === userId).slice(0, 20);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const amount = await api.redeem(code); setMsg({ ok: true, text: L(`تمت تعبئة ${amount} د.ل ✓`, `Added ${amount} LYD ✓`) }); setCode(""); }
    catch (x) { setMsg({ ok: false, text: errText(x, L) }); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-2 text-sm font-bold opacity-80"><WalletIcon className="h-4 w-4" />{L("محفظة نايت بايت", "NIGHTBITE Wallet")}</div>
        <div className="mt-2 text-4xl font-black">{money(balance, lang)}</div>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-2">
          <div className="text-sm font-bold">💳 {L("عبّي بكرت", "Top up with a card")}</div>
          <input className={inputCls} dir="ltr" inputMode="numeric" placeholder="0000-0000-0000-0000" value={code} onChange={(e) => setCode(e.target.value)} />
          {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
          <button disabled={code.replace(/\D/g, "").length < 16} className={`${btnPrimary} w-full`}>{L("عبّي", "Redeem")}</button>
        </form>
      </Card>
      <Card className="space-y-2">
        <div className="text-sm font-bold">{L("الحركات", "Transactions")}</div>
        {!txns.length && <p className="text-xs text-muted-foreground">{L("ما فيش حركات", "No transactions yet")}</p>}
        {txns.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b py-1.5 text-sm last:border-0">
            <div>
              <div className="font-semibold">{L(TYPE[t.type][0], TYPE[t.type][1])}</div>
              <div className="text-[11px] text-muted-foreground">{t.note} • {timeAgo(t.created_at, lang === "ar")}</div>
            </div>
            <span className={`font-bold ${t.amount >= 0 ? "text-success" : "text-destructive"}`} dir="ltr">{t.amount >= 0 ? "+" : ""}{t.amount}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
