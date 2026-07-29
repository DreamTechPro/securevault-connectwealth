import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useBank } from "@/contexts/BankContext";
import { Shield, Percent, Save, Check, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const { users } = useBank();
  const totalBalance = users.filter((u) => u.role === "user").reduce((s, u) => s + u.balance, 0);
  const activeCount = users.filter((u) => u.accountStatus === "active" && u.role === "user").length;
  const frozenCount = users.filter((u) => u.accountStatus === "frozen").length;
  const disabledCount = users.filter((u) => u.accountStatus === "disabled").length;

  const [feePercent, setFeePercent] = useState("3");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [walletAddress, setWalletAddress] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);

  const ASSET_KEYS = [
    { id: "gold", label: "Gold" },
    { id: "silver", label: "Silver" },
    { id: "real_estate", label: "Real Estate" },
    { id: "stocks", label: "Stocks Index" },
    { id: "green_energy", label: "Green Energy" },
  ];
  const [investWallets, setInvestWallets] = useState<Record<string, string>>({});
  const [investSavingId, setInvestSavingId] = useState<string | null>(null);
  const [investSavedId, setInvestSavedId] = useState<string | null>(null);

  useEffect(() => {
    const keys = ["withdrawal_fee_percent", "activation_wallet_address", ...ASSET_KEYS.map((a) => `invest_wallet_${a.id}`)];
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", keys)
      .then(({ data }) => {
        const iw: Record<string, string> = {};
        data?.forEach((row: any) => {
          if (row.key === "withdrawal_fee_percent") setFeePercent(row.value);
          else if (row.key === "activation_wallet_address") setWalletAddress(row.value);
          else if (row.key.startsWith("invest_wallet_")) iw[row.key.replace("invest_wallet_", "")] = row.value;
        });
        setInvestWallets(iw);
      });
  }, []);

  const saveInvestWallet = async (assetId: string) => {
    const key = `invest_wallet_${assetId}`;
    const val = (investWallets[assetId] || "").trim();
    setInvestSavingId(assetId);
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value: val, updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value: val });
    }
    setInvestSavingId(null);
    setInvestSavedId(assetId);
    setTimeout(() => setInvestSavedId(null), 1500);
  };

  const handleSaveFee = async () => {
    const val = parseFloat(feePercent);
    if (isNaN(val) || val < 0 || val > 100) return;
    setSaving(true);
    await supabase
      .from("site_settings")
      .update({ value: String(val), updated_at: new Date().toISOString() })
      .eq("key", "withdrawal_fee_percent");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveWallet = async () => {
    const val = walletAddress.trim();
    if (!val) return;
    setWalletSaving(true);
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "activation_wallet_address")
      .maybeSingle();
    if (existing) {
      await supabase
        .from("site_settings")
        .update({ value: val, updated_at: new Date().toISOString() })
        .eq("key", "activation_wallet_address");
    } else {
      await supabase
        .from("site_settings")
        .insert({ key: "activation_wallet_address", value: val });
    }
    setWalletSaving(false);
    setWalletSaved(true);
    setTimeout(() => setWalletSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Admin Settings</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Account Summary</p>
            <div className="flex gap-4 mt-1">
              <span className="text-sm"><span className="font-bold text-success">{activeCount}</span> active</span>
              <span className="text-sm"><span className="font-bold text-frozen">{frozenCount}</span> frozen</span>
              <span className="text-sm"><span className="font-bold text-destructive">{disabledCount}</span> disabled</span>
            </div>
          </div>
        </div>

        {/* Withdrawal Fee Control */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Percent className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Withdrawal Fee</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Set the percentage fee users must pay before completing a withdrawal. This updates instantly for all users.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="w-28 h-11 px-4 pr-8 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow text-right font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
            </div>
            <button
              onClick={handleSaveFee}
              disabled={saving}
              className="h-11 px-5 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {/* Activation Wallet Address */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Activation Wallet Address</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This wallet address is shown to users on the withdrawal & transfer page for paying their one-time activation fee. Change it anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address"
              className="flex-1 h-11 px-4 rounded-lg border border-border bg-card text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow"
            />
            <button
              onClick={handleSaveWallet}
              disabled={walletSaving}
              className="h-11 px-5 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {walletSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {walletSaving ? "Saving..." : walletSaved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {/* Investment Wallets (per asset) */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Investment Wallet Addresses</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Default wallet address per investment asset. When a user creates a new investment, this address is attached so they know where to send funds. You can override it per-investment on the Investments page.
          </p>
          <div className="space-y-3">
            {ASSET_KEYS.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <label className="text-sm font-medium text-foreground w-32 shrink-0">{a.label}</label>
                <input
                  type="text"
                  value={investWallets[a.id] || ""}
                  onChange={(e) => setInvestWallets((s) => ({ ...s, [a.id]: e.target.value }))}
                  placeholder={`Wallet address for ${a.label}`}
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                <button
                  onClick={() => saveInvestWallet(a.id)}
                  disabled={investSavingId === a.id}
                  className="h-10 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {investSavedId === a.id ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {investSavingId === a.id ? "Saving..." : investSavedId === a.id ? "Saved" : "Save"}
                </button>
              </div>
            ))}
          </div>
        </div>


        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">System Information</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium text-foreground">SecureVault Banking v1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Account Validity</span>
              <span className="font-medium text-foreground">12 months per user</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Admin Email</span>
              <span className="font-medium text-foreground">admin@securevault.com</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
