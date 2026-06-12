import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Zap, Lock, Globe, ArrowRight, Star, Quote, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string;
}

const features = [
  { icon: Zap, title: "Instant Transfers", desc: "Send money to anyone in seconds, 24/7 with no delays." },
  { icon: Lock, title: "Bank-Grade Security", desc: "Multi-layer encryption and PIN-protected transactions." },
  { icon: Globe, title: "Global Access", desc: "Access your account anywhere in the world, anytime." },
  { icon: Shield, title: "Insured Deposits", desc: "Your funds are protected up to $250,000 per account." },
];

export default function Landing() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (supabase.from("testimonials" as any) as any)
      .select("id,name,role,content,rating,avatar_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(6)
      .then(({ data }: any) => setTestimonials((data as Testimonial[]) || []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg navy-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">SecureVault</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            <Link to="/testimonials" className="hover:text-foreground transition-colors">Reviews</Link>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-accent transition-colors">Login</Link>
            <Link to="/register" className="h-9 px-4 rounded-lg gold-gradient text-primary font-semibold text-sm flex items-center hover:opacity-90 active:scale-[0.97] transition-all">
              Open Account
            </Link>
          </div>
          <button className="md:hidden text-foreground" onClick={() => setMenuOpen((o) => !o)} aria-label="menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-5 py-4 flex flex-col gap-3 text-sm">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimonials</a>
            <Link to="/testimonials" onClick={() => setMenuOpen(false)}>Reviews</Link>
            <div className="flex gap-3 pt-2 border-t border-border">
              <Link to="/login" className="flex-1 h-10 rounded-lg border border-border flex items-center justify-center font-medium">Login</Link>
              <Link to="/register" className="flex-1 h-10 rounded-lg gold-gradient text-primary font-semibold flex items-center justify-center">Open Account</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden navy-gradient">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 25% 40%, hsl(42 80% 55% / 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 70%, hsl(220 60% 30% / 0.5) 0%, transparent 50%)"
        }} />
        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5 text-accent" /> Trusted by 50,000+ customers worldwide
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white text-balance leading-tight">
            Banking, reimagined for the way you live.
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl mx-auto">
            SecureVault combines bank-grade security with a modern experience — so you can move money, manage cards, and grow your wealth without friction.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="h-12 px-7 rounded-lg gold-gradient text-primary font-semibold flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
              Open An Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="h-12 px-7 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">Why SecureVault</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Built for trust. Designed for speed.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl navy-gradient flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-24 bg-secondary/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">What our customers say</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Loved by people who care about their money.</h2>
          </div>

          {testimonials.length === 0 ? (
            <p className="text-center text-muted-foreground">No reviews yet — be the first to share your experience.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.slice(0, 3).map((t) => (
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

          <div className="text-center mt-10">
            <Link to="/testimonials" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              Read all customer stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-24 bg-background">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Ready to bank smarter?</h2>
          <p className="mt-4 text-muted-foreground">Open your SecureVault account in minutes. No paperwork, no hidden fees.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="h-12 px-7 rounded-lg gold-gradient text-primary font-semibold flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
              Open An Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="h-12 px-7 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors">
              I already have one
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-border bg-card py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg navy-gradient flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="font-display font-bold text-foreground">SecureVault</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SecureVault Bank. All rights reserved.</p>
          <a href="mailto:Securevaultbank.info@gmail.com" className="text-xs text-muted-foreground hover:text-accent transition-colors">
            Securevaultbank.info@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
