import { useBank } from "@/contexts/BankContext";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowUpRight, ArrowDownLeft, Clock, Wallet, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const Dashboard = () => {
  const { currentUser } = useBank();
  if (!currentUser) return null;

  const daysLeft = differenceInDays(new Date(currentUser.expiresAt), new Date());
  const recentTx = [...currentUser.transactions].reverse().slice(0, 5);

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome, {currentUser.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's your account overview</p>
          </div>
          <StatusBadge status={currentUser.accountStatus} />
        </div>

        {/* Support message banner */}
        {currentUser.supportMessage && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3" style={{ animation: "scale-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Account Notice</p>
              <p className="text-sm text-muted-foreground mt-0.5">{currentUser.supportMessage}</p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">${currentUser.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-2">Account: {currentUser.accountNumber}</p>
          </div>
          <div className="glass-card rounded-xl p-5" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s forwards", opacity: 0 }}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">BTC Wallet</p>
            <div className="flex items-center gap-2 mt-1">
              <Wallet className="w-4 h-4 text-accent" />
              <p className="text-sm font-mono text-foreground truncate">{currentUser.btcWallet || "Not configured"}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards", opacity: 0 }}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Account Validity</p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-accent" />
              <p className="text-sm text-foreground font-medium">{daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expires {format(new Date(currentUser.expiresAt), "MMM dd, yyyy")}</p>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="glass-card rounded-xl overflow-hidden" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s forwards", opacity: 0 }}>
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
          </div>
          {recentTx.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "MMM dd, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${tx.type === "credit" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
