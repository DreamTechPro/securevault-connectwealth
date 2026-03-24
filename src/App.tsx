import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BankProvider, useBank } from "@/contexts/BankContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import TransactionHistory from "./pages/TransactionHistory";
import BtcWallet from "./pages/BtcWallet";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser, loading } = useBank();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Loading...</div></div>;
  if (!currentUser) return <Navigate to="/" replace />;
  if (adminOnly && currentUser.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (!adminOnly && currentUser.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BankProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/dashboard/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
            <Route path="/dashboard/wallet" element={<ProtectedRoute><BtcWallet /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BankProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
