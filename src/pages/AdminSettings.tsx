import { DashboardLayout } from "@/components/DashboardLayout";
import { useBank } from "@/contexts/BankContext";
import { Shield } from "lucide-react";

const AdminSettings = () => {
  const { users } = useBank();
  const totalBalance = users.filter((u) => u.role === "user").reduce((s, u) => s + u.balance, 0);
  const activeCount = users.filter((u) => u.accountStatus === "active" && u.role === "user").length;
  const frozenCount = users.filter((u) => u.accountStatus === "frozen").length;
  const disabledCount = users.filter((u) => u.accountStatus === "disabled").length;

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
