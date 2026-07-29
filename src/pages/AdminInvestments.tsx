import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Trash2, Clock, CheckCircle2, XCircle, Wallet, Save } from "lucide-react";

interface Row {
  id: string;
  user_id: string;
  profile_id: string;
  asset: string;
  amount: number;
  status: string;
  admin_note: string;
  created_at: string;
  plan?: string;
  duration_days?: number;
  interest_rate?: number;
  wallet_address?: string;
  profile?: { name: string; email: string; balance: number };
}

export default function AdminInvestments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [walletEdit, setWalletEdit] = useState<Record<string, string>>({});

  const refresh = async () => {
    setLoading(true);
    const { data } = await (supabase.from("investments" as any) as any)
      .select("*").order("created_at", { ascending: false });
    const list = (data as Row[]) || [];
    const ids = Array.from(new Set(list.map((r) => r.profile_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,email,balance").in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      list.forEach((r) => (r.profile = map.get(r.profile_id) as any));
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = (supabase as any)
      .channel("admin-investments")
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => refresh())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, []);

  const setStatus = async (r: Row, status: "approved" | "rejected", extraNote?: string) => {
    const updates: any = { status, admin_note: extraNote ?? r.admin_note ?? "" };
    const { error } = await (supabase.from("investments" as any) as any).update(updates).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Investment ${status}`);
    refresh();
  };

  const saveWallet = async (r: Row) => {
    const val = (walletEdit[r.id] ?? "").trim();
    const { error } = await (supabase.from("investments" as any) as any)
      .update({ wallet_address: val }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Wallet address updated");
    setWalletEdit((s) => { const n = { ...s }; delete n[r.id]; return n; });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this investment record?")) return;
    const { error } = await (supabase.from("investments" as any) as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    refresh();
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const StatusIcon = ({ s }: { s: string }) => s === "approved" ? <CheckCircle2 className="w-3 h-3" /> : s === "rejected" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Investments</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign wallet addresses, approve, or reject user investments</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 h-8 rounded-md text-xs font-medium capitalize ${filter === f ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No investments in this view.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const editing = walletEdit[r.id] !== undefined;
            return (
              <div key={r.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground capitalize">{r.asset.replace("_", " ")}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        r.status === "approved" ? "bg-success/15 text-success" :
                        r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                        "bg-yellow-500/15 text-yellow-500"
                      }`}>
                        <StatusIcon s={r.status} /> {r.status}
                      </span>
                      {r.plan && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent capitalize">
                          {r.plan} · {r.duration_days}d · {r.interest_rate}%
                        </span>
                      )}
                      <span className="font-mono font-semibold text-accent">${Number(r.amount).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.profile?.name || "Unknown"} · {r.profile?.email || "—"} · Balance ${Number(r.profile?.balance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                    {r.admin_note && <p className="text-xs text-foreground/80 mt-1">Note: {r.admin_note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(r, "approved")}
                          className="h-8 px-3 rounded-lg bg-success/15 text-success text-xs font-semibold flex items-center gap-1 hover:bg-success/25">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => { setNoteFor(r.id); setNote(""); }}
                          className="h-8 px-3 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold flex items-center gap-1 hover:bg-destructive/25">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Wallet address for this investment */}
                <div className="mt-3 p-3 rounded-lg bg-background/60 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">Payment wallet address (shown to user)</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={editing ? walletEdit[r.id] : (r.wallet_address || "")}
                      onChange={(e) => setWalletEdit((s) => ({ ...s, [r.id]: e.target.value }))}
                      placeholder="Enter wallet address for this investment"
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono"
                    />
                    <button onClick={() => saveWallet(r)}
                      className="h-9 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1">
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>

                {noteFor === r.id && (
                  <div className="mt-3 flex gap-2">
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)"
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm" />
                    <button onClick={() => { setStatus(r, "rejected", note); setNoteFor(null); }}
                      className="h-9 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold">Confirm reject</button>
                    <button onClick={() => setNoteFor(null)} className="h-9 px-3 rounded-lg border border-border text-xs">Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
