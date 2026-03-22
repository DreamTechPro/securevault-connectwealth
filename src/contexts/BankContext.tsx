import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

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
  name: string;
  email: string;
  role: "admin" | "user";
  password: string;
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
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (userId: string, updates: Partial<BankUser>) => void;
  addTransaction: (userId: string, tx: Omit<Transaction, "id">) => void;
  addUser: (user: Omit<BankUser, "id" | "createdAt" | "expiresAt">) => void;
  deleteUser: (userId: string) => void;
  loginDirectly: (userId: string) => void;
}

const BankContext = createContext<BankContextType | null>(null);

const STORAGE_VERSION = "v3";

const defaultUsers: BankUser[] = [
  {
    id: "admin-1",
    name: "System Administrator",
    email: "admin@securevault.com",
    role: "admin",
    password: "admin123",
    balance: 0,
    accountNumber: "SVB-0000-0001",
    accountStatus: "active",
    supportMessage: "",
    btcWallet: "",
    profileImage: "",
    transactions: [],
    transactionPin: "",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-1",
    name: "Marcus Wellington",
    email: "marcus@email.com",
    role: "user",
    password: "user123",
    balance: 84750.32,
    accountNumber: "SVB-2847-5931",
    accountStatus: "active",
    supportMessage: "",
    btcWallet: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    profileImage: "",
    transactionPin: "",
    transactions: [
      { id: "t1", type: "credit", amount: 50000, description: "Wire Transfer - Goldman Corp", date: "2025-12-15", balanceAfter: 50000 },
      { id: "t2", type: "credit", amount: 35000, description: "Salary Deposit", date: "2026-01-01", balanceAfter: 85000 },
      { id: "t3", type: "debit", amount: 249.68, description: "Amazon Purchase", date: "2026-01-10", balanceAfter: 84750.32 },
    ],
    createdAt: "2025-12-01T00:00:00.000Z",
    expiresAt: "2026-12-01T00:00:00.000Z",
  },
  {
    id: "user-2",
    name: "Elena Vasquez",
    email: "elena@email.com",
    role: "user",
    password: "user123",
    balance: 215400.00,
    accountNumber: "SVB-7193-0482",
    accountStatus: "frozen",
    supportMessage: "Your account has been temporarily frozen due to suspicious activity. Please contact support at +1-800-555-0199.",
    btcWallet: "bc1q9h0yjdupgfadd8kzmnce5kk2g5m3mh2rjl9tup",
    profileImage: "",
    transactionPin: "",
    transactions: [
      { id: "t4", type: "credit", amount: 200000, description: "Investment Return", date: "2025-11-20", balanceAfter: 200000 },
      { id: "t5", type: "credit", amount: 18000, description: "Consulting Fee", date: "2026-01-05", balanceAfter: 218000 },
      { id: "t6", type: "debit", amount: 2600, description: "International Transfer", date: "2026-02-01", balanceAfter: 215400 },
    ],
    createdAt: "2025-11-15T00:00:00.000Z",
    expiresAt: "2026-11-15T00:00:00.000Z",
  },
  {
    id: "user-3",
    name: "James Salcedo",
    email: "james.salcedo66@yahoo.com",
    role: "user",
    password: "user123",
    balance: 12500.00,
    accountNumber: "SVB-5129-8374",
    accountStatus: "active",
    supportMessage: "",
    btcWallet: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    profileImage: "",
    transactionPin: "",
    transactions: [
      { id: "t7", type: "credit", amount: 15000, description: "Initial Deposit", date: "2026-03-01", balanceAfter: 15000 },
      { id: "t8", type: "debit", amount: 2500, description: "Bill Payment", date: "2026-03-10", balanceAfter: 12500 },
    ],
    createdAt: "2026-03-01T00:00:00.000Z",
    expiresAt: "2027-03-01T00:00:00.000Z",
  },
];

function getInitialUsers(): BankUser[] {
  const ver = localStorage.getItem("bank_version");
  if (ver !== STORAGE_VERSION) {
    localStorage.removeItem("bank_users");
    localStorage.removeItem("bank_current_user");
    localStorage.setItem("bank_version", STORAGE_VERSION);
    return defaultUsers;
  }
  const saved = localStorage.getItem("bank_users");
  if (saved) {
    const parsed = JSON.parse(saved) as BankUser[];
    return parsed.map((u) => ({ ...u, transactionPin: u.transactionPin || "" }));
  }
  return defaultUsers;
}

export function BankProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<BankUser[]>(getInitialUsers);
  const usersRef = useRef(users);
  usersRef.current = users;

  const [currentUser, setCurrentUser] = useState<BankUser | null>(() => {
    const savedId = localStorage.getItem("bank_current_user");
    if (!savedId) return null;
    return getInitialUsers().find((u) => u.id === savedId) || null;
  });

  useEffect(() => {
    localStorage.setItem("bank_users", JSON.stringify(users));
    if (currentUser) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  }, [users]);

  const login = (email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    // Use ref to always get latest users (fixes stale closure after registration)
    const user = usersRef.current.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("bank_current_user", user.id);
      return true;
    }
    return false;
  };

  const loginDirectly = (userId: string) => {
    const user = usersRef.current.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("bank_current_user", user.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("bank_current_user");
  };

  const updateUser = (userId: string, updates: Partial<BankUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const addTransaction = (userId: string, tx: Omit<Transaction, "id">) => {
    const txWithId = { ...tx, id: `t-${Date.now()}` };
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newBalance = tx.type === "credit" ? u.balance + tx.amount : u.balance - tx.amount;
        return {
          ...u,
          balance: newBalance,
          transactions: [...u.transactions, { ...txWithId, balanceAfter: newBalance }],
        };
      })
    );
  };

  const addUser = (user: Omit<BankUser, "id" | "createdAt" | "expiresAt">) => {
    const now = new Date();
    const newUser: BankUser = {
      ...user,
      transactionPin: user.transactionPin || "",
      id: `user-${Date.now()}`,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      // Immediately sync to ref so login can find the new user
      usersRef.current = updated;
      return updated;
    });
    return newUser.id;
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <BankContext.Provider value={{ currentUser, users, login, logout, updateUser, addTransaction, addUser, deleteUser, loginDirectly }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBank must be inside BankProvider");
  return ctx;
}
