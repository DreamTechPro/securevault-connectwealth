import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useBank } from "@/contexts/BankContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, TrendingUp, Building2, Gem, Leaf, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Investment {
  id: string;
  asset: string;
  amount: number;
  status: string;
  admin_note: string;
  created_at: string;
}

const ASSETS = [
  { id: "gold", label: "Gold", desc: "Stable, inflation-proof store of value", icon: Coins, tint: "from-yellow-500/20 to-amber-600/10" },
  { id: "silver", label: "Silver", desc: "Industrial demand + precious metal", icon: Gem, tint: "from-slate-400/20 to-slate-600/10" },
  { id: "real_estate", label: "Real Estate", desc: "Fractional property portfolio", icon: Building2, tint: "from-emerald-500/20 to-teal-600/10" },
  { id: "stocks", label: "Stocks Index", desc: "Diversified S&P 500 basket", icon: TrendingUp, tint: "from-blue-500/20 to-indigo-600/10" },
  { id: "green_energy", label: "Green Energy", desc: "Solar & wind infrastructure", icon: Leaf, tint: "from-green-500/20 to-lime-600/10" },
];

export default function Investments() {
  const { currentUser } = useBank();
  const [asset, setAsset] = useState("gold");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!currentUser) return;
    const { data } = await (supabase.from("investments" as any) as any)
      .select("*").eq("user_id", currentUser.userId).order("created_at", { ascending: false });
    setItems((data as Investment[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [currentUser?.userId]);

  const submit = async () => {
    if (!currentUser) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > currentUser.balance) { toast.error("Amount exceeds your balance"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from("investments" as any) as any).insert({
      user_id: currentUser.userId,
      profile_id: currentUser.id,
      asset,
      amount: amt,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Investment submitted for approval");
    setAmount("");
    refresh();
  };

  const StatusBadge = ({ s }: { s: string }) => {
    const map: Record<string, { icon: any; cls: string; label: string }> = {
      pending: { icon: Clock, cls: "bg-yellow-500/15 text-yellow-500", label: "Pending" },
      approved: { icon: CheckCircle2, cls: "bg-success/15 text-success", label: "Approved" },
      rejected: { icon: XCircle, cls: "bg-destructive/15 text-destructive", label: "Rejected" },
    };
    const it = map[s] || map.pending;
    const Icon = it.icon;
    return <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${it.cls}`}><Icon className="w-3 h-3" />{it.label}</span>;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Investments</h1>
        <p className="text-sm text-muted-foreground mt-1">Grow your wealth — invest in gold, real estate, and more.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ASSETS.map((a) => {
          const Icon = a.icon;
          const active = asset === a.id;
          return (
            <button key={a.id} onClick={() => setAsset(a.id)}
              className={`text-left p-4 rounded-xl border transition-all bg-gradient-to-br ${a.tint} ${active ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/50"}`}>
              <Icon className="w-6 h-6 text-accent mb-2" />
              <p className="font-semibold text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-5 mb-8">
        <label className="text-xs font-medium text-muted-foreground">Amount to invest (USD)</label>
        <div className="flex gap-2 mt-1.5">
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="500" className="flex-1 h-11 px-3 rounded-lg border border-border bg-background" />
          <button disabled={submitting} onClick={submit}
            className="h-11 px-6 rounded-lg gold-gradient text-primary font-semibold disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Invest
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Available balance: ${currentUser?.balance.toLocaleString() ?? 0}. Investments require admin approval.</p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">My investments</h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No investments yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="glass-card rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground capitalize">{i.asset.replace("_", " ")}</p>
                  <StatusBadge s={i.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(i.created_at).toLocaleString()}</p>
                {i.admin_note && <p className="text-xs text-foreground/70 mt-1">Note: {i.admin_note}</p>}
              </div>
              <p className="font-mono font-semibold text-foreground shrink-0">${Number(i.amount).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
