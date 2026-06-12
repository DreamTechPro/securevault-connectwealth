import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch {
      setError("Could not send reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">SecureVault</span>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-1">Forgot password</h2>
        <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-sm text-foreground">
            If an account exists for <span className="font-medium">{email}</span>, a password reset link has been sent. Please check your inbox (and spam folder).
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
