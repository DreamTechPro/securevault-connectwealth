import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useBank } from "@/contexts/BankContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, TrendingUp, Building2, Gem, Leaf, Loader2, Clock, CheckCircle2, XCircle, Copy, Wallet } from "lucide-react";

interface Investment {
  id: string;
  asset: string;
  amount: number;
  status: string;
  admin_note: string;
  created_at: string;
  plan?: string;
  duration_days?: number;
  interest_rate?: number;
  wallet_address?: string;
}

const ASSETS = [
  {
    id: "gold",
    label: "Gold",
    desc: "A time-tested safe haven. Physical gold hedges inflation and holds value across market cycles — ideal for wealth preservation.",
    short: "Stable, inflation-proof store of value",
    icon: Coins,
    tint: "from-yellow-500/20 to-amber-600/10",
  },
  {
    id: "silver",
    label: "Silver",
    desc: "A dual-purpose asset combining precious-metal security with industrial demand from tech, solar, and EV manufacturing.",
    short: "Industrial demand + precious metal",
    icon: Gem,
    tint: "from-slate-400/20 to-slate-600/10",
  },
  {
    id: "real_estate",
    label: "Real Estate",
    desc: "Fractional ownership in vetted commercial and residential properties. Earn from rental income plus long-term appreciation.",
    short: "Fractional property portfolio",
    icon: Building2,
    tint: "from-emerald-500/20 to-teal-600/10",
  },
  {
    id: "stocks",
    label: "Stocks Index",
    desc: "Diversified exposure to a curated basket of S&P 500 blue-chip companies — balanced growth with lower single-stock risk.",
    short: "Diversified S&P 500 basket",
    icon: TrendingUp,
    tint: "from-blue-500/20 to-indigo-600/10",
  },
  {
    id: "green_energy",
    label: "Green Energy",
    desc: "Invest in the future — solar farms, wind infrastructure, and battery storage projects driving the global energy transition.",
    short: "Solar & wind infrastructure",
    icon: Leaf,
    tint: "from-green-500/20 to-lime-600/10",
  },
];

const PLANS = [
  { id: "starter", label: "Starter", duration_days: 7, interest_rate: 5, desc: "Short-term entry plan — quick 1-week cycle." },
  { id: "growth", label: "Growth", duration_days: 30, interest_rate: 15, desc: "One-month term with balanced returns." },
  { id: "premium", label: "Premium", duration_days: 90, interest_rate: 40, desc: "90-day compounded plan for serious investors." },
  { id: "elite", label: "Elite", duration_days: 180, interest_rate: 100, desc: "Six-month lock — doubles capital on maturity." },
];

export default function Investments() {
  const { currentUser } = useBank();
  const [asset, setAsset] = useState("gold");
  const [plan, setPlan] = useState("starter");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [lastCreated, setLastCreated] = useState<Investment | null>(null);

  const refresh = async () => {
    if (!currentUser) return;
    const { data } = await (supabase.from("investments" as any) as any)
      .select("*").eq("user_id", currentUser.userId).order("created_at", { ascending: false });
    const list = (data as Investment[]) || [];
    setItems(list);
    setLastCreated((prev) => (prev ? list.find((i) => i.id === prev.id) || prev : prev));
    setLoading(false);
  };

  const loadWallets = async () => {
    const keys = ASSETS.map((a) => `invest_wallet_${a.id}`);
    const { data } = await supabase.from("site_settings").select("key,value").in("key", keys);
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => {
      const asset = r.key.replace("invest_wallet_", "");
      map[asset] = r.value;
    });
    setWallets(map);
  };

  useEffect(() => {
    refresh();
    loadWallets();
    const ch = (supabase as any)
      .channel("invest-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, loadWallets)
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, refresh)
      .subscribe();
    // polling fallback in case realtime is not enabled for these tables
    const timer = setInterval(() => { refresh(); loadWallets(); }, 8000);
    return () => { (supabase as any).removeChannel(ch); clearInterval(timer); };
  }, [currentUser?.userId]);

  const walletFor = (inv: Investment) => (inv.wallet_address || wallets[inv.asset] || "").trim();


  const selectedAsset = ASSETS.find((a) => a.id === asset)!;
  const selectedPlan = PLANS.find((p) => p.id === plan)!;

  const submit = async () => {
    if (!currentUser) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    const walletAddress = wallets[asset] || "";
    const { data, error } = await (supabase.from("investments" as any) as any).insert({
      user_id: currentUser.userId,
      profile_id: currentUser.id,
      asset,
      amount: amt,
      plan: selectedPlan.id,
      duration_days: selectedPlan.duration_days,
      interest_rate: selectedPlan.interest_rate,
      wallet_address: walletAddress,
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Investment created — send funds to the wallet address to activate.");
    setLastCreated(data as Investment);
    setAmount("");
    refresh();
  };

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

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
        <p className="text-sm text-muted-foreground mt-1">Choose an asset, pick a term, and grow your wealth.</p>
      </div>

      {/* Asset selection */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">1. Choose asset</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ASSETS.map((a) => {
          const Icon = a.icon;
          const active = asset === a.id;
          return (
            <button key={a.id} onClick={() => setAsset(a.id)}
              className={`text-left p-4 rounded-xl border transition-all bg-gradient-to-br ${a.tint} ${active ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/50"}`}>
              <Icon className="w-6 h-6 text-accent mb-2" />
              <p className="font-semibold text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.short}</p>
            </button>
          );
        })}
      </div>

      {/* Asset description */}
      <div className="glass-card rounded-xl p-4 mb-6 border-l-4 border-accent">
        <p className="text-sm font-semibold text-foreground">{selectedAsset.label}</p>
        <p className="text-sm text-muted-foreground mt-1">{selectedAsset.desc}</p>
      </div>

      {/* Plan selection */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">2. Choose a plan</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {PLANS.map((p) => {
          const active = plan === p.id;
          return (
            <button key={p.id} onClick={() => setPlan(p.id)}
              className={`text-left p-4 rounded-xl border transition-all ${active ? "border-accent ring-2 ring-accent/40 bg-accent/5" : "border-border hover:border-accent/50"}`}>
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-foreground">{p.label}</p>
                <p className="text-lg font-bold text-accent">{p.interest_rate}%</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.duration_days} days</p>
              <p className="text-xs text-muted-foreground mt-2">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Amount + submit */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">3. Fund your investment</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-3 text-sm">
          <div><span className="text-muted-foreground">Asset:</span> <span className="font-semibold text-foreground capitalize">{selectedAsset.label}</span></div>
          <div><span className="text-muted-foreground">Term:</span> <span className="font-semibold text-foreground">{selectedPlan.duration_days} days</span></div>
          <div><span className="text-muted-foreground">Return:</span> <span className="font-semibold text-accent">{selectedPlan.interest_rate}%</span></div>
        </div>
        <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
        <div className="flex gap-2 mt-1.5">
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="500" className="flex-1 h-11 px-3 rounded-lg border border-border bg-background" />
          <button disabled={submitting} onClick={submit}
            className="h-11 px-6 rounded-lg gold-gradient text-primary font-semibold disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Invest
          </button>
        </div>
        {amount && Number(amount) > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Projected payout after {selectedPlan.duration_days} days: <span className="font-semibold text-success">${(Number(amount) * (1 + selectedPlan.interest_rate / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </p>
        )}
      </div>

      {/* Payment wallet after creating */}
      {lastCreated && (
        <div className="glass-card rounded-xl p-5 mb-6 border-l-4 border-success">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-success" />
            <p className="font-semibold text-foreground">Complete your investment</p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Send <span className="font-semibold text-foreground">${Number(lastCreated.amount).toLocaleString()}</span> to the wallet address below to activate your {lastCreated.plan} plan. Your investment will be approved once payment is confirmed.
          </p>
          {walletFor(lastCreated) ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
              <code className="flex-1 text-xs font-mono break-all text-foreground">{walletFor(lastCreated)}</code>
              <button onClick={() => copy(walletFor(lastCreated))} className="shrink-0 h-8 px-3 rounded-md bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          ) : (
            <p className="text-xs text-yellow-600">Wallet address is being assigned by our team. It will appear here automatically — please check back shortly.</p>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold text-foreground mb-3">My investments</h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No investments yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="glass-card rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground capitalize">{i.asset.replace("_", " ")}</p>
                    <StatusBadge s={i.status} />
                    {i.plan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent capitalize">
                        {i.plan} · {i.duration_days}d · {i.interest_rate}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(i.created_at).toLocaleString()}</p>
                  {i.admin_note && <p className="text-xs text-foreground/70 mt-1">Note: {i.admin_note}</p>}
                </div>
                <p className="font-mono font-semibold text-foreground shrink-0">${Number(i.amount).toLocaleString()}</p>
              </div>
              {i.wallet_address && i.status === "pending" && (
                <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border">
                  <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <code className="flex-1 text-[11px] font-mono break-all text-foreground">{i.wallet_address}</code>
                  <button onClick={() => copy(i.wallet_address!)} className="shrink-0 h-7 px-2 rounded-md bg-accent/15 text-accent text-[11px] font-semibold flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
