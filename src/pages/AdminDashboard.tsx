import { useState, ReactNode } from "react";
import { useBank, BankUser, AccountStatus } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Pencil, Trash2, X, History, DollarSign } from "lucide-react";

const AdminDashboard = () => {
  const { users, updateUser, addTransaction, addUser, deleteUser } = useBank();
  const [editingUser, setEditingUser] = useState<BankUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTx, setShowAddTx] = useState<string | null>(null);

  const nonAdminUsers = users.filter((u) => u.role === "user");

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground text-sm mt-1">{nonAdminUsers.length} user accounts</p>
          </div>
          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 h-10 px-4 rounded-lg gold-gradient text-primary font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="space-y-3">
          {nonAdminUsers.map((user) => (
            <div key={user.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start gap-4">
                {user.profileImage ? (
                  <img src={user.profileImage} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full gold-gradient flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{user.name}</h3>
                    <StatusBadge status={user.accountStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email} · {user.accountNumber}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                    ${user.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  {user.supportMessage && (
                    <p className="text-xs text-warning mt-1 italic">"{user.supportMessage}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    BTC: {user.btcWallet ? <span className="font-mono">{user.btcWallet.slice(0, 20)}...</span> : "None"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setShowAddTx(user.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Add transaction">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => setEditingUser(user)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this user?")) deleteUser(user.id); }} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* Transaction history mini */}
              {user.transactions.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
                    <History className="w-3 h-3" /> {user.transactions.length} transactions
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-border rounded-lg border border-border">
                    {[...user.transactions].reverse().map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div>
                          <span className="text-foreground font-medium">{tx.description}</span>
                          <span className="text-muted-foreground ml-2">{tx.date}</span>
                        </div>
                        <span className={`font-semibold tabular-nums ${tx.type === "credit" ? "text-success" : "text-destructive"}`}>
                          {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Edit User Modal */}
        {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={(updates) => { updateUser(editingUser.id, updates); setEditingUser(null); }} />}

        {/* Add User Modal */}
        {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onAdd={(user) => { addUser(user); setShowAddUser(false); }} />}

        {/* Add Transaction Modal */}
        {showAddTx && <AddTransactionModal userId={showAddTx} onClose={() => setShowAddTx(null)} onAdd={(tx) => { addTransaction(showAddTx, tx); setShowAddTx(null); }} />}
      </div>
    </DashboardLayout>
  );
};

function EditUserModal({ user, onClose, onSave }: { user: BankUser; onClose: () => void; onSave: (u: Partial<BankUser>) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [balance, setBalance] = useState(user.balance.toString());
  const [status, setStatus] = useState<AccountStatus>(user.accountStatus);
  const [supportMsg, setSupportMsg] = useState(user.supportMessage);
  const [btcWallet, setBtcWallet] = useState(user.btcWallet);
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [password, setPassword] = useState(user.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, balance: parseFloat(balance) || 0, accountStatus: status, supportMessage: supportMsg, btcWallet, profileImage, password });
  };

  return (
    <ModalWrapper onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} />
        <Field label="Balance ($)" value={balance} onChange={setBalance} type="number" />
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Account Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)} className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Support Message</label>
          <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" placeholder="Leave blank for no message" />
        </div>
        <Field label="BTC Wallet Address" value={btcWallet} onChange={setBtcWallet} />
        <Field label="Profile Image URL" value={profileImage} onChange={setProfileImage} placeholder="https://..." />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" className="flex-1 h-10 rounded-lg gold-gradient text-primary text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all">Save</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: Omit<BankUser, "id" | "createdAt" | "expiresAt">) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("user123");
  const [balance, setBalance] = useState("0");
  const [btcWallet, setBtcWallet] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accNum = `SVB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    onAdd({
      name, email, password, role: "user", balance: parseFloat(balance) || 0,
      accountNumber: accNum, accountStatus: "active", supportMessage: "", btcWallet, profileImage, transactions: [], transactionPin: "",
    });
  };

  return (
    <ModalWrapper onClose={onClose} title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name" value={name} onChange={setName} required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <Field label="Password" value={password} onChange={setPassword} required />
        <Field label="Initial Balance ($)" value={balance} onChange={setBalance} type="number" />
        <Field label="BTC Wallet Address" value={btcWallet} onChange={setBtcWallet} />
        <Field label="Profile Image URL" value={profileImage} onChange={setProfileImage} placeholder="https://..." />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" className="flex-1 h-10 rounded-lg gold-gradient text-primary text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all">Add User</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function AddTransactionModal({ userId, onClose, onAdd }: { userId: string; onClose: () => void; onAdd: (tx: { type: "credit" | "debit"; amount: number; description: string; date: string; balanceAfter: number }) => void }) {
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ type, amount: parseFloat(amount) || 0, description, date, balanceAfter: 0 });
  };

  return (
    <ModalWrapper onClose={onClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as "credit" | "debit")} className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="credit">Credit (Deposit)</option>
            <option value="debit">Debit (Withdrawal)</option>
          </select>
        </div>
        <Field label="Amount ($)" value={amount} onChange={setAmount} type="number" required />
        <Field label="Description" value={description} onChange={setDescription} required />
        <Field label="Date" value={date} onChange={setDate} type="date" />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" className="flex-1 h-10 rounded-lg gold-gradient text-primary text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all">Add</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" style={{ animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow" />
    </div>
  );
}

export default AdminDashboard;
