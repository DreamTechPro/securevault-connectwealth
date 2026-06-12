import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Plus, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string;
  is_published: boolean;
  sort_order: number;
}

const blank: Testimonial = {
  id: "", name: "", role: "", content: "", rating: 5, avatar_url: "", is_published: true, sort_order: 0,
};

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("testimonials" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.content.trim()) {
      toast.error("Name and content are required");
      return;
    }
    const payload = {
      name: editing.name.trim(),
      role: editing.role.trim(),
      content: editing.content.trim(),
      rating: Math.max(1, Math.min(5, Number(editing.rating) || 5)),
      avatar_url: editing.avatar_url.trim(),
      is_published: editing.is_published,
      sort_order: Number(editing.sort_order) || 0,
    };
    const q = editing.id
      ? (supabase.from("testimonials" as any) as any).update(payload).eq("id", editing.id)
      : (supabase.from("testimonials" as any) as any).insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Updated" : "Added");
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await (supabase.from("testimonials" as any) as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    refresh();
  };

  const togglePublish = async (t: Testimonial) => {
    const { error } = await (supabase.from("testimonials" as any) as any)
      .update({ is_published: !t.is_published }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage public reviews on the landing page</p>
        </div>
        <button
          onClick={() => setEditing({ ...blank })}
          className="flex items-center gap-2 h-10 px-4 rounded-lg gold-gradient text-primary font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No testimonials yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="glass-card rounded-xl p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{t.name}</h3>
                  <span className="text-xs text-muted-foreground">· {t.role || "—"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {t.is_published ? "Published" : "Hidden"}
                  </span>
                  <span className="text-xs text-muted-foreground">★ {t.rating} · order {t.sort_order}</span>
                </div>
                <p className="text-sm text-foreground/80 mt-1.5 line-clamp-2">"{t.content}"</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => togglePublish(t)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted" title="Toggle">
                  {t.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setEditing(t)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(t.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing.id ? "Edit" : "New"} testimonial</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role / Title</label>
                <input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Avatar URL (optional)</label>
                <input value={editing.avatar_url} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rating (1-5)</label>
                  <input type="number" min={1} max={5} value={editing.rating}
                    onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sort order</label>
                  <input type="number" value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background mt-1" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_published}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
                Published (visible on landing page)
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 h-10 rounded-lg border border-border font-medium">Cancel</button>
              <button onClick={save} className="flex-1 h-10 rounded-lg gold-gradient text-primary font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
