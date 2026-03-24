import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AccountStatus = "active" | "frozen" | "disabled";

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

export interface BankUser {
  id: string; // profile id
  userId: string; // auth user id
  name: string;
  email: string;
  role: "admin" | "user";
  balance: number;
  accountNumber: string;
  accountStatus: AccountStatus;
  supportMessage: string;
  btcWallet: string;
  profileImage: string;
  transactions: Transaction[];
  createdAt: string;
  expiresAt: string;
  transactionPin: string;
}

interface BankContextType {
  currentUser: BankUser | null;
  users: BankUser[];
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (profileId: string, updates: Partial<BankUser>) => Promise<void>;
  addTransaction: (profileId: string, tx: Omit<Transaction, "id">) => Promise<void>;
  deleteUser: (profileId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const BankContext = createContext<BankContextType | null>(null);

async function fetchProfileWithRole(userId: string): Promise<BankUser | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  const { data: txData } = await supabase
    .from("transactions")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  const role = roleData?.role || "user";
  const transactions: Transaction[] = (txData || []).map((t) => ({
    id: t.id,
    type: t.type as "credit" | "debit",
    amount: Number(t.amount),
    description: t.description,
    date: t.date,
    balanceAfter: Number(t.balance_after),
  }));

  return {
    id: profile.id,
    userId: profile.user_id,
    name: profile.name,
    email: profile.email,
    role: role as "admin" | "user",
    balance: Number(profile.balance),
    accountNumber: profile.account_number,
    accountStatus: profile.account_status as AccountStatus,
    supportMessage: profile.support_message,
    btcWallet: profile.btc_wallet,
    profileImage: profile.profile_image,
    transactionPin: profile.transaction_pin,
    transactions,
    createdAt: profile.created_at,
    expiresAt: profile.expires_at,
  };
}

async function fetchAllUsers(): Promise<BankUser[]> {
  const { data: profiles } = await supabase.from("profiles").select("*");
  if (!profiles) return [];

  const { data: roles } = await supabase.from("user_roles").select("*");
  const { data: allTx } = await supabase.from("transactions").select("*").order("created_at", { ascending: true });

  const roleMap = new Map<string, string>();
  (roles || []).forEach((r) => roleMap.set(r.user_id, r.role));

  const txMap = new Map<string, Transaction[]>();
  (allTx || []).forEach((t) => {
    const list = txMap.get(t.profile_id) || [];
    list.push({
      id: t.id,
      type: t.type as "credit" | "debit",
      amount: Number(t.amount),
      description: t.description,
      date: t.date,
      balanceAfter: Number(t.balance_after),
    });
    txMap.set(t.profile_id, list);
  });

  return profiles.map((p) => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    email: p.email,
    role: (roleMap.get(p.user_id) || "user") as "admin" | "user",
    balance: Number(p.balance),
    accountNumber: p.account_number,
    accountStatus: p.account_status as AccountStatus,
    supportMessage: p.support_message,
    btcWallet: p.btc_wallet,
    profileImage: p.profile_image,
    transactionPin: p.transaction_pin,
    transactions: txMap.get(p.id) || [],
    createdAt: p.created_at,
    expiresAt: p.expires_at,
  }));
}

export function BankProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [users, setUsers] = useState<BankUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user) { setCurrentUser(null); return; }
    const u = await fetchProfileWithRole(s.user.id);
    setCurrentUser(u);
  }, []);

  const refreshUsers = useCallback(async () => {
    const all = await fetchAllUsers();
    setUsers(all);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        const u = await fetchProfileWithRole(s.user.id);
        setCurrentUser(u);
        if (u?.role === "admin") {
          const all = await fetchAllUsers();
          setUsers(all);
        }
      } else {
        setCurrentUser(null);
        setUsers([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const u = await fetchProfileWithRole(s.user.id);
        setCurrentUser(u);
        if (u?.role === "admin") {
          const all = await fetchAllUsers();
          setUsers(all);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return !error;
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name } },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setUsers([]);
  };

  const updateUser = async (profileId: string, updates: Partial<BankUser>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.accountStatus !== undefined) dbUpdates.account_status = updates.accountStatus;
    if (updates.supportMessage !== undefined) dbUpdates.support_message = updates.supportMessage;
    if (updates.btcWallet !== undefined) dbUpdates.btc_wallet = updates.btcWallet;
    if (updates.profileImage !== undefined) dbUpdates.profile_image = updates.profileImage;
    if (updates.transactionPin !== undefined) dbUpdates.transaction_pin = updates.transactionPin;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("profiles").update(dbUpdates).eq("id", profileId);
    }

    // Refresh data
    await refreshCurrentUser();
    if (currentUser?.role === "admin") await refreshUsers();
  };

  const addTransaction = async (profileId: string, tx: Omit<Transaction, "id">) => {
    // Get current balance
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", profileId).single();
    if (!profile) return;

    const currentBalance = Number(profile.balance);
    const newBalance = tx.type === "credit" ? currentBalance + tx.amount : currentBalance - tx.amount;

    await supabase.from("transactions").insert({
      profile_id: profileId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      balance_after: newBalance,
    });

    await supabase.from("profiles").update({ balance: newBalance }).eq("id", profileId);

    await refreshCurrentUser();
    if (currentUser?.role === "admin") await refreshUsers();
  };

  const deleteUser = async (profileId: string) => {
    // Get user_id from profile to delete auth user
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("id", profileId).single();
    if (!profile) return;

    // Delete profile (cascade will handle transactions and roles)
    await supabase.from("profiles").delete().eq("id", profileId);
    await refreshUsers();
  };

  return (
    <BankContext.Provider value={{ currentUser, users, session, loading, login, logout, register, updateUser, addTransaction, deleteUser, refreshUsers, refreshCurrentUser }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBank must be inside BankProvider");
  return ctx;
}
