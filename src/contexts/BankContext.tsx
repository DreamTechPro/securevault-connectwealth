import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

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
  id: string;
  userId: string;
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

function mapTransactions(txData: any[]): Transaction[] {
  return (txData || []).map((t) => ({
    id: t.id,
    type: t.type as "credit" | "debit",
    amount: Number(t.amount),
    description: t.description,
    date: t.date,
    balanceAfter: Number(t.balance_after),
  }));
}

function mapProfile(profile: any, role: string, transactions: Transaction[]): BankUser {
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

async function fetchProfileWithRole(userId: string): Promise<BankUser | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) return null;

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

  return mapProfile(profile, roleData?.role || "user", mapTransactions(txData || []));
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

  return profiles.map((p) => mapProfile(p, roleMap.get(p.user_id) || "user", txMap.get(p.id) || []));
}

export function BankProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [users, setUsers] = useState<BankUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const u = await fetchProfileWithRole(userId);
    setCurrentUser(u);
    if (u?.role === "admin") {
      const all = await fetchAllUsers();
      setUsers(all);
    }
    return u;
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user) { setCurrentUser(null); return; }
    await loadUserData(s.user.id);
  }, [loadUserData]);

  const refreshUsers = useCallback(async () => {
    const all = await fetchAllUsers();
    setUsers(all);
  }, []);

  useEffect(() => {
    let mounted = true;

    // First restore session from storage
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        await loadUserData(s.user.id);
      }
      if (mounted) setLoading(false);
    });

    // Then listen for subsequent auth changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Fire and forget — don't await inside callback to avoid deadlocks
        loadUserData(s.user.id);
      } else {
        setCurrentUser(null);
        setUsers([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

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
    const dbUpdates: Record<string, any> = {};
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

    await refreshCurrentUser();
    if (currentUser?.role === "admin") await refreshUsers();
  };

  const addTransaction = async (profileId: string, tx: Omit<Transaction, "id">) => {
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
