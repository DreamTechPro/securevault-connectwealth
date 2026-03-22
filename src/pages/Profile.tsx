import { useState } from "react";
import { useBank } from "@/contexts/BankContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Mail, CreditCard, Calendar, Clock, Pencil, Check, X, Camera } from "lucide-react";

const Profile = () => {
  const { currentUser, updateUser } = useBank();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || "");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  if (!currentUser) return null;

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

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

  const fields = [
    { icon: Mail, label: "Email", value: currentUser.email },
    { icon: CreditCard, label: "Account Number", value: currentUser.accountNumber },
    { icon: Calendar, label: "Member Since", value: format(new Date(currentUser.createdAt), "MMMM dd, yyyy") },
    { icon: Clock, label: "Account Expires", value: format(new Date(currentUser.expiresAt), "MMMM dd, yyyy") },
  ];

  return (
    <DashboardLayout>
      <div style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 active:scale-[0.97] transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 active:scale-[0.97] transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.97] transition-all"
              >
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
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-semibold text-foreground bg-transparent border-b border-blue-500 focus:outline-none pb-0.5"
                />
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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Profile Image URL</label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://... or upload above"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">New Password (min 6 chars, leave blank to keep)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                />
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
