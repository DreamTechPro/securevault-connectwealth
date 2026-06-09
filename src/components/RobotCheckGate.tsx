import { useEffect, useState, ReactNode } from "react";
import { Shield, CheckCircle2 } from "lucide-react";
import { useBank } from "@/contexts/BankContext";

const KEY_PREFIX = "svb_human_verified_";

export function RobotCheckGate({ children }: { children: ReactNode }) {
  const { currentUser } = useBank();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    // Per-session check (sessionStorage so it resets each tab/session)
    const v = sessionStorage.getItem(KEY_PREFIX + currentUser.id);
    if (v === "1") setVerified(true);
  }, [currentUser?.id]);

  if (!currentUser || verified) return <>{children}</>;

  const handleVerify = () => {
    setChecking(true);
    // Small UX delay to mimic a real check
    setTimeout(() => {
      sessionStorage.setItem(KEY_PREFIX + currentUser.id, "1");
      setVerified(true);
      setChecking(false);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5">
          <Shield className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Security check</h1>
        <p className="text-sm text-muted-foreground mb-6">
          For your protection, please verify you are human before accessing your account.
        </p>

        <label className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 accent-accent"
            checked={checking}
            disabled={checking}
            onChange={handleVerify}
          />
          <span className="text-sm font-medium text-foreground flex-1 text-left">
            {checking ? "Verifying..." : "I'm not a robot"}
          </span>
          {checking && <CheckCircle2 className="w-5 h-5 text-accent animate-pulse" />}
        </label>

        <p className="mt-6 text-xs text-muted-foreground">
          SecureVault Bank · Protected session
        </p>
      </div>
    </div>
  );
}
