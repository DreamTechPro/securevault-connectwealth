import { AccountStatus } from "@/contexts/BankContext";
import { ShieldCheck, Snowflake, ShieldOff } from "lucide-react";

const statusConfig: Record<AccountStatus, { label: string; className: string; icon: typeof ShieldCheck }> = {
  active: { label: "Active", className: "bg-success/10 text-success", icon: ShieldCheck },
  frozen: { label: "Frozen", className: "bg-frozen/10 text-frozen", icon: Snowflake },
  disabled: { label: "Disabled", className: "bg-destructive/10 text-destructive", icon: ShieldOff },
};

export function StatusBadge({ status }: { status: AccountStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
