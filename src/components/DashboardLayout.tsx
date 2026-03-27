import { ReactNode, useState } from "react";
import { useBank } from "@/contexts/BankContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, History, Wallet, UserCircle, Settings, LogOut, Shield, Menu, X, Users, ArrowUpRight, CreditCard,
} from "lucide-react";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/transactions", label: "Transactions", icon: ArrowUpRight },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/wallet", label: "BTC Wallet", icon: Wallet },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { to: "/dashboard/add-payment", label: "Payment", icon: CreditCard },
];

const adminLinks = [
  { to: "/admin", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useBank();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col navy-gradient fixed inset-y-0 left-0 z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-white">SecureVault</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-blue-400"
                    : "text-sidebar-foreground/70 hover:text-blue-400 hover:bg-sidebar-accent/50"
                }`}
              >
                <link.icon className={`w-4 h-4 ${active ? "text-blue-400" : "text-blue-400/70"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} className="w-9 h-9 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400/80 hover:text-red-400 hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 navy-gradient flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md gold-gradient flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-white">SecureVault</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 navy-gradient flex flex-col" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-bold text-white">SecureVault</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {links.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-sidebar-accent text-blue-400" : "text-sidebar-foreground/70 hover:text-blue-400"
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${active ? "text-blue-400" : "text-blue-400/70"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-sidebar-border">
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400/80 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
