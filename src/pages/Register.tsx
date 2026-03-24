import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBank } from "@/contexts/BankContext";
import { Shield, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const { register, login } = useBank();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await register(normalizedEmail, password, name.trim());
      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
        return;
      }

      setCreated(true);

      // Auto-login after a brief delay
      setTimeout(async () => {
        const success = await login(normalizedEmail, password);
        if (success) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 2500);
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center max-w-md" style={{ animation: "scale-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3" style={{ lineHeight: "1.1" }}>
            Account Successfully Created!
          </h1>
          <p className="text-muted-foreground text-lg mb-2">Welcome to SecureVault 🎉</p>
          <p className="text-muted-foreground text-sm">Redirecting you to your dashboard...</p>
          <div className="mt-6 w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ animation: "progress-fill 2.5s ease-out forwards" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 navy-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 30% 50%, hsl(42 80% 55% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(220 60% 30% / 0.5) 0%, transparent 50%)"
        }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gold-gradient mb-8" style={{ animation: "scale-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4 text-balance" style={{ lineHeight: "1.1", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards", opacity: 0 }}>
            Join SecureVault
          </h1>
          <p className="text-white/60 text-lg" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s forwards", opacity: 0 }}>
            Start managing your wealth securely today
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md" style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">SecureVault</span>
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <h2 className="text-2xl font-semibold text-foreground mb-1">Create your account</h2>
          <p className="text-muted-foreground mb-8">Fill in your details to get started</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="James Salcedo" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 px-4 pr-11 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow" placeholder="Re-enter password" required />
            </div>
            <button type="submit" className="w-full h-11 rounded-lg gold-gradient text-primary font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-blue-500 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
