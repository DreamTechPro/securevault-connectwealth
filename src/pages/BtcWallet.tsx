import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Wallet, Copy, Check } from "lucide-react";
import { useState } from "react";

const BtcWallet = () => {
  const { currentUser } = useBank();
  const [copied, setCopied] = useState(false);
  if (!currentUser) return null;

  const handleCopy = () => {
    if (currentUser.btcWallet) {
      navigator.clipboard.writeText(currentUser.btcWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <h1 className="text-2xl font-semibold text-foreground mb-1">BTC Wallet</h1>
        <p className="text-muted-foreground text-sm mb-6">Your Bitcoin wallet information</p>

        <div className="glass-card rounded-xl p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Bitcoin Address</p>
              <p className="text-xs text-muted-foreground">Use this address to receive BTC</p>
            </div>
          </div>

          {currentUser.btcWallet ? (
            <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
              <code className="flex-1 text-sm font-mono text-foreground break-all">{currentUser.btcWallet}</code>
              <button onClick={handleCopy} className="shrink-0 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No BTC wallet address configured. Contact your administrator.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BtcWallet;
