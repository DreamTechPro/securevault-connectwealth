import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Star, Quote, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string;
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from("testimonials" as any) as any)
      .select("id,name,role,content,rating,avatar_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }: any) => {
        setItems((data as Testimonial[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg navy-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">SecureVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-accent">Login</Link>
            <Link to="/register" className="h-9 px-4 rounded-lg gold-gradient text-primary font-semibold text-sm flex items-center">Open Account</Link>
          </div>
        </div>
      </header>

      <section className="navy-gradient py-16 text-center px-5">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white">Customer Stories</h1>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">Real words from real SecureVault members.</p>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading reviews...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground">No reviews available yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((t) => (
              <article key={t.id} className="glass-card rounded-2xl p-6 flex flex-col">
                <Quote className="w-7 h-7 text-accent/60 mb-3" />
                <p className="text-foreground/90 leading-relaxed flex-1">"{t.content}"</p>
                <div className="flex items-center gap-1 mt-5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-primary font-bold text-sm">
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
