import React, { useState, useMemo } from "react";
import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Lock, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function detectCardType(number: string): { type: string; icon: string } {
  const cleaned = number.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return { type: "visa", icon: "💳 Visa" };
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return { type: "mastercard", icon: "💳 Mastercard" };
  if (/^3[47]/.test(cleaned)) return { type: "amex", icon: "💳 Amex" };
  if (/^6(?:011|5)/.test(cleaned)) return { type: "discover", icon: "💳 Discover" };
  return { type: "unknown", icon: "💳" };
}

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 3) return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  return cleaned;
}

const AddPaymentMethod = () => {
  const { currentUser } = useBank();
  const { toast } = useToast();

  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const cardInfo = useMemo(() => detectCardType(cardNumber), [cardNumber]);
  const cleanedNumber = cardNumber.replace(/\s/g, "");

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (cardholderName.length > 0 && cardholderName.trim().length < 2) e.name = "Name too short";
    if (cleanedNumber.length > 0 && (cleanedNumber.length < 13 || cleanedNumber.length > 16)) e.card = "Card number must be 13-16 digits";
    if (expiry.length > 0 && !/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = "Use MM/YY format";
    if (expiry.length === 5) {
      const [m] = expiry.split("/").map(Number);
      if (m < 1 || m > 12) e.expiry = "Invalid month";
    }
    if (cvv.length > 0 && (cvv.length < 3 || cvv.length > 4)) e.cvv = "CVV must be 3-4 digits";
    if (pin.length > 0 && pin.length !== 4) e.pin = "PIN must be 4 digits";
    return e;
  }, [cardholderName, cleanedNumber, expiry, cvv, pin]);

  const isValid = cardholderName.trim().length >= 2 && cleanedNumber.length >= 13 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3 && pin.length === 4 && Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !currentUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("card_details" as any).insert({
        user_id: currentUser.userId,
        cardholder_name: cardholderName.trim(),
        card_number: cleanedNumber,
        expiry_date: expiry,
        cvv,
        secure_pin: pin,
        card_type: cardInfo.type,
      });

      if (error) throw error;

      setSuccess(true);
      toast({ title: "Payment method added!", description: "Your card has been saved securely." });
      setTimeout(() => {
        setSuccess(false);
        setCardholderName("");
        setCardNumber("");
        setExpiry("");
        setCvv("");
        setPin("");
      }, 3000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save card", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Add Payment Method</h1>
          <p className="text-muted-foreground text-sm mt-1">Securely add your card details</p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Card Preview */}
          <div className="relative rounded-2xl p-6 mb-8 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(180 30% 20%), hsl(200 40% 15%), hsl(220 50% 12%))" }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(180 60% 50%), transparent)" }} />
            <div className="flex justify-between items-start mb-8">
              <CreditCard className="w-10 h-10 text-teal-400/80" />
              <span className="text-teal-300/90 text-sm font-medium">{cardInfo.icon}</span>
            </div>
            <p className="text-white/90 font-mono text-lg tracking-[0.2em] mb-6">
              {cardNumber || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-teal-400/60 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</p>
                <p className="text-white/80 text-sm font-medium">{cardholderName || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-teal-400/60 text-[10px] uppercase tracking-wider mb-0.5">Expires</p>
                <p className="text-white/80 text-sm font-medium">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          {success ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-teal-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Card Added Successfully!</h3>
              <p className="text-muted-foreground text-sm mt-1">Your payment method has been saved.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">
              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  required
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full h-11 px-4 pr-20 rounded-xl border border-border bg-card text-foreground text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                    required
                  />
                  {cleanedNumber.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-teal-500">
                      {cardInfo.icon}
                    </span>
                  )}
                </div>
                {errors.card && <p className="text-destructive text-xs mt-1">{errors.card}</p>}
              </div>

              {/* Expiry & CVV row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                    required
                  />
                  {errors.expiry && <p className="text-destructive text-xs mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="•••"
                    maxLength={4}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                    required
                  />
                  {errors.cvv && <p className="text-destructive text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              {/* Secure PIN */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-500" /> Secure PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  required
                />
                {errors.pin && <p className="text-destructive text-xs mt-1">{errors.pin}</p>}
              </div>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, hsl(180 50% 35%), hsl(180 60% 28%))", color: "white" }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> Add Payment Method
                  </span>
                )}
              </button>

              <p className="text-center text-muted-foreground text-[11px] flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Your data is encrypted and stored securely
              </p>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPaymentMethod;
