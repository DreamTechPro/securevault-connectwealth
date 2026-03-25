import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBank } from "@/contexts/BankContext";
import { Shield, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, loading, currentUser } = useBank();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (!loading && currentUser) {
    if (currentUser.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError("Invalid email or password");
      }
      // Navigation handled by auth state change + redirect above
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 navy-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 30% 50%, hsl(42 80% 55% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(220 60% 30% / 0.5) 0%, transparent 50%)"
        }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gold-gradient mb-8" style={{ animation: "scale-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4 text-balance" style={{ lineHeight: "1.1", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
            SecureVault Banking
          </h1>
          <p className="text-white/60 text-lg" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s forwards", opacity: 0 }}>
            Your trusted partner in digital wealth management
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">SecureVault</span>
          </div>

          <h2 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to access your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-shadow"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="text-accent font-medium hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
