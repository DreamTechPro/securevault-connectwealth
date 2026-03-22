import { useState } from "react";
import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Mail, CreditCard, Calendar, Clock, Pencil, Check, X, Camera, KeyRound } from "lucide-react";

const Profile = () => {
  const { currentUser, updateUser } = useBank();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || "");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  // PIN management
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  if (!currentUser) return null;

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const hasPin = !!currentUser.transactionPin;

  const handleSave = () => {
    const updates: Record<string, string> = {};
    if (name.trim() && name.trim() !== currentUser.name) updates.name = name.trim();
    if (email.trim() && email.trim() !== currentUser.email) updates.email = email.trim().toLowerCase();
    if (profileImage.trim() !== currentUser.profileImage) updates.profileImage = profileImage.trim();
    if (password.length >= 6) updates.password = password;

    if (Object.keys(updates).length > 0) {
      updateUser(currentUser.id, updates);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    }
    setEditing(false);
    setPassword("");
  };

  const handleCancel = () => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setProfileImage(currentUser.profileImage);
    setPassword("");
    setEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProfileImage(result);
      if (!editing) {
        updateUser(currentUser.id, { profileImage: result });
        setSuccess("Profile photo updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePinSave = () => {
    setPinError("");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    updateUser(currentUser.id, { transactionPin: pin });
    setShowPinModal(false);
    setPin("");
    setConfirmPin("");
    setSuccess(hasPin ? "Transaction PIN updated!" : "Transaction PIN set successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const fields = [
    { icon: Mail, label: "Email", value: currentUser.email },
    { icon: CreditCard, label: "Account Number", value: currentUser.accountNumber },
    { icon: Calendar, label: "Member Since", value: format(new Date(currentUser.createdAt), "MMMM dd, yyyy") },
    { icon: Clock, label: "Account Expires", value: format(new Date(currentUser.expiresAt), "MMMM dd, yyyy") },
    { icon: KeyRound, label: "Transaction PIN", value: hasPin ? "••••" : "Not set" },
  ];

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 active:scale-[0.97] transition-all">
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 active:scale-[0.97] transition-all">
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.97] transition-all">
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium">
            {success}
          </div>
        )}

        <div className="glass-card rounded-xl p-6 max-w-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              {(profileImage || currentUser.profileImage) ? (
                <img src={editing ? profileImage : currentUser.profileImage} className="w-16 h-16 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-xl font-bold text-primary">
                  {initials}
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              {editing ? (
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-semibold text-foreground bg-transparent border-b border-blue-500 focus:outline-none pb-0.5" />
              ) : (
                <h2 className="text-lg font-semibold text-foreground">{currentUser.name}</h2>
              )}
              <StatusBadge status={currentUser.accountStatus} />
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Profile Image URL</label>
                <input type="text" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="https://... or upload above" className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">New Password (min 6 chars, leave blank to keep)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium text-foreground">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PIN Management Button */}
          {!editing && (
            <button
              onClick={() => { setShowPinModal(true); setPinError(""); setPin(""); setConfirmPin(""); }}
              className="mt-6 w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
            >
              <KeyRound className="w-4 h-4" />
              {hasPin ? "Change Transaction PIN" : "Set Transaction PIN"}
            </button>
          )}
        </div>

        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPinModal(false)} />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6" style={{ animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{hasPin ? "Change" : "Set"} Transaction PIN</h2>
                <button onClick={() => setShowPinModal(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Enter a 4-digit PIN to secure your transactions.</p>
              {pinError && (
                <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{pinError}</div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground text-center text-lg tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                    placeholder="••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-card text-foreground text-center text-lg tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                    placeholder="••••"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowPinModal(false)} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handlePinSave} className="flex-1 h-10 rounded-lg gold-gradient text-primary text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all">Save PIN</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
