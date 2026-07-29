
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS interest_rate numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS wallet_address text NOT NULL DEFAULT '';
