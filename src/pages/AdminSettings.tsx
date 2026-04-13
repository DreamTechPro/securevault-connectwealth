import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useBank } from "@/contexts/BankContext";
import { Shield, Percent, Save, Check } from "lucide-react";
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

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "withdrawal_fee_percent")
      .single()
      .then(({ data }) => {
        if (data) setFeePercent(data.value);
      });
  }, []);

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
