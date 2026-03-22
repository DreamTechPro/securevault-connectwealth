import { useState } from "react";
import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowDownLeft, ArrowUpRight, Send, AlertTriangle } from "lucide-react";

type TxTab = "deposit" | "withdraw" | "send";

const Transactions = () => {
  const { currentUser, users, addTransaction } = useBank();
  const [tab, setTab] = useState<TxTab>("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (!currentUser) return null;

  const isFrozen = currentUser.accountStatus !== "active";

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setRecipientEmail("");
    setAccountNumber("");
    setBtcAddress("");
    setError("");
  };

  const handleDeposit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError("Enter a valid amount"); return; }
    if (!accountNumber.trim() && !btcAddress.trim()) { setError("Please enter an account number or BTC wallet address"); return; }
    addTransaction(currentUser.id, {
      type: "credit",
      amount: num,
      description: description.trim() || `Deposit ${accountNumber.trim() ? `from ${accountNumber.trim()}` : `via BTC ${btcAddress.trim().slice(0, 12)}...`}`,
      date: new Date().toISOString().split("T")[0],
      balanceAfter: currentUser.balance + num,
    });
    setSuccess(`Successfully deposited $${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
    resetForm();
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleWithdraw = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError("Enter a valid amount"); return; }
    if (num > currentUser.balance) { setError("Insufficient balance"); return; }
    if (!accountNumber.trim() && !btcAddress.trim()) { setError("Please enter a destination account number or BTC wallet address"); return; }
    addTransaction(currentUser.id, {
      type: "debit",
      amount: num,
      description: description.trim() || `Withdrawal ${accountNumber.trim() ? `to ${accountNumber.trim()}` : `to BTC ${btcAddress.trim().slice(0, 12)}...`}`,
      date: new Date().toISOString().split("T")[0],
      balanceAfter: currentUser.balance - num,
    });
    setSuccess(`Successfully withdrew $${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
    resetForm();
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleSend = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError("Enter a valid amount"); return; }
    if (num > currentUser.balance) { setError("Insufficient balance"); return; }
    if (!recipientEmail.trim() && !accountNumber.trim()) { setError("Please enter the recipient's email or account number"); return; }

    let recipient = null;
    if (recipientEmail.trim()) {
      recipient = users.find((u) => u.email === recipientEmail.trim().toLowerCase() && u.id !== currentUser.id);
    } else if (accountNumber.trim()) {
      recipient = users.find((u) => u.accountNumber === accountNumber.trim() && u.id !== currentUser.id);
    }

    if (!recipient) { setError("Recipient not found. Check the email or account number."); return; }
    if (recipient.accountStatus !== "active") { setError("Recipient account is not active"); return; }

    addTransaction(currentUser.id, {
      type: "debit",
      amount: num,
      description: `Transfer to ${recipient.name}`,
      date: new Date().toISOString().split("T")[0],
      balanceAfter: currentUser.balance - num,
    });

    addTransaction(recipient.id, {
      type: "credit",
      amount: num,
      description: `Transfer from ${currentUser.name}`,
      date: new Date().toISOString().split("T")[0],
      balanceAfter: recipient.balance + num,
    });

    setSuccess(`Successfully sent $${num.toLocaleString("en-US", { minimumFractionDigits: 2 })} to ${recipient.name}`);
    resetForm();
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (isFrozen) { setError("Your account is currently restricted. Contact support."); return; }
    if (tab === "deposit") handleDeposit();
    else if (tab === "withdraw") handleWithdraw();
    else handleSend();
  };

  const tabs: { key: TxTab; label: string; icon: typeof ArrowDownLeft }[] = [
    { key: "deposit", label: "Deposit", icon: ArrowDownLeft },
    { key: "withdraw", label: "Withdraw", icon: ArrowUpRight },
    { key: "send", label: "Send Money", icon: Send },
  ];

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Transactions</h1>
        <p className="text-muted-foreground text-sm mb-8">Deposit, withdraw, or send money</p>

        {isFrozen && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Your account is currently restricted. Transactions are disabled.</p>
          </div>
        )}

        {/* Balance card */}
        <div className="glass-card rounded-xl p-5 mb-6" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s forwards", opacity: 0 }}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            ${currentUser.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border mb-6 w-fit" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-card text-blue-500 shadow-sm"
                  : "text-muted-foreground hover:text-blue-500"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="glass-card rounded-xl p-6 max-w-lg" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s forwards", opacity: 0 }}>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "send" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="text-center text-xs text-muted-foreground">— OR —</div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {tab === "deposit" ? "Source Account Number" : tab === "withdraw" ? "Destination Account Number" : "Recipient Account Number"}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
                placeholder="SVB-XXXX-XXXX"
              />
            </div>

            {(tab === "deposit" || tab === "withdraw") && (
              <>
                <div className="text-center text-xs text-muted-foreground">— OR use BTC —</div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {tab === "deposit" ? "Source BTC Wallet Address" : "Destination BTC Wallet Address"}
                  </label>
                  <input
                    type="text"
                    value={btcAddress}
                    onChange={(e) => setBtcAddress(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
                    placeholder="bc1q..."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
                placeholder="What's this for?"
              />
            </div>
            <button
              type="submit"
              disabled={isFrozen}
              className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {tab === "deposit" ? "Deposit Funds" : tab === "withdraw" ? "Withdraw Funds" : "Send Money"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
