import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";

const TransactionHistory = () => {
  const { currentUser } = useBank();
  if (!currentUser) return null;

  const transactions = [...currentUser.transactions].reverse();

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Transaction History</h1>
        <p className="text-muted-foreground text-sm mb-6">All your account activity</p>

        <div className="glass-card rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4 text-success" /> : <ArrowUpRight className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "MMMM dd, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${tx.type === "credit" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">${tx.balanceAfter.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
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

export default TransactionHistory;
