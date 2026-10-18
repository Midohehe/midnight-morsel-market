import { useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api, db, errText, uid } from "@/lib/store";
import { Card, Stat, btnGhost, btnPrimary, inputCls, money } from "@/components/nb";

export function AdminCards() {
  const { L, lang } = useI18n();
  const data = db.use();
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("10");
  const [filter, setFilter] = useState<"all" | "unused" | "used">("all");
  const [batch, setBatch] = useState<string>("all");

  const batches = [...new Set(data.cards.map((c) => c.batch))];
  const list = data.cards
    .filter((c) => batch === "all" || c.batch === batch)
    .filter((c) => filter === "all" || (filter === "used" ? c.used_by : !c.used_by));
  const userName = (id?: string) => data.users.find((u) => u.id === id)?.name ?? "";

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount), n = Math.min(500, Math.max(1, Number(count)));
    if (!(a > 0)) return;
    const b = `B${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${a}-${uid().slice(0, 3).toUpperCase()}`;
    try { await api.issueCards(a, n, b); } catch (x) { return alert(errText(x, L)); }
    setBatch(b); setAmount("");
  };

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const rows = list.map((c) => ({
      "Card Number": c.code, "Amount (LYD)": c.amount, Batch: c.batch,
      Created: new Date(c.created_at).toLocaleString("en-GB"),
      Status: c.used_by ? "Used" : "Unused", "Used By": userName(c.used_by),
      "Used At": c.used_at ? new Date(c.used_at).toLocaleString("en-GB") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 13 }, { wch: 22 }, { wch: 20 }, { wch: 9 }, { wch: 16 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top-up Cards");
    XLSX.writeFile(wb, `nightbite-cards-${batch === "all" ? "all" : batch}.xlsx`);
  };

  const unused = data.cards.filter((c) => !c.used_by);
  const walletUsers = data.users.filter((u) => u.role !== "ADMIN");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat icon="💳" label={L("كروت متاحة", "Unused cards")} value={unused.length} />
        <Stat icon="💰" label={L("قيمة غير مستعملة", "Unused value")} value={money(unused.reduce((s, c) => s + c.amount, 0), lang)} />
        <Stat icon="✅" label={L("تم شحنها", "Redeemed")} value={money(data.cards.filter((c) => c.used_by).reduce((s, c) => s + c.amount, 0), lang)} />
      </div>

      <Card>
        <form onSubmit={issue} className="space-y-2">
          <h3 className="font-bold">💳 {L("إصدار كروت تعبئة", "Issue top-up cards")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">{L("الفئة (د.ل)", "Value (LYD)")}
              <input required type="number" min={1} step="any" className={inputCls} placeholder="25" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">{L("العدد", "Quantity")}
              <input required type="number" min={1} max={500} className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[5, 10, 20, 50, 100].map((v) => (
              <button type="button" key={v} onClick={() => setAmount(String(v))} className="rounded-full border bg-muted px-3 py-1 text-xs font-bold">{v}</button>
            ))}
          </div>
          <button className={`${btnPrimary} w-full`}>{L("إصدار", "Generate")}</button>
        </form>
      </Card>

      <div className="flex gap-2">
        <select className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="all">{L("كل الدفعات", "All batches")}</option>
          {batches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">{L("الكل", "All")}</option>
          <option value="unused">{L("غير مستعمل", "Unused")}</option>
          <option value="used">{L("مستعمل", "Used")}</option>
        </select>
      </div>
      <button disabled={!list.length} onClick={exportXlsx} className={`${btnGhost} flex w-full items-center justify-center gap-2 disabled:opacity-40`}>
        <Download className="h-4 w-4" />{L(`تصدير إكسل (${list.length})`, `Export Excel (${list.length})`)}
      </button>

      <div className="space-y-2">
        {list.slice(0, 100).map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-mono text-sm font-bold" dir="ltr">{c.code}</div>
              <div className="text-[10px] text-muted-foreground">{c.batch}{c.used_by ? ` • ${userName(c.used_by)}` : ""}</div>
            </div>
            <div className="text-end">
              <div className="font-black text-primary">{money(c.amount, lang)}</div>
              <div className={`text-[10px] font-bold ${c.used_by ? "text-muted-foreground" : "text-success"}`}>{c.used_by ? L("مستعمل", "Used") : L("متاح", "Unused")}</div>
            </div>
          </Card>
        ))}
        {list.length > 100 && <p className="text-center text-xs text-muted-foreground">+{list.length - 100} … {L("صدّر الإكسل للكل", "export Excel for all")}</p>}
      </div>

      <Card className="space-y-1">
        <h3 className="mb-1 font-bold">👛 {L("أرصدة المحافظ", "Wallet balances")}</h3>
        {walletUsers.map((u) => (
          <div key={u.id} className="flex justify-between text-sm">
            <span>{u.avatar} {u.name} <span className="text-[10px] text-muted-foreground">{u.role}</span></span>
            <b>{money(data.wallets[u.id] ?? 0, lang)}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}
