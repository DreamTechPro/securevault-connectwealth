
-- 1. Remove sensitive tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.card_details;
ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions;

-- 2. Restrict profile self-updates to non-sensitive columns only
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile safe fields"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enforce column-level privileges so users can't change sensitive fields
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, support_message, btc_wallet, profile_image, transaction_pin, profile_image)
  ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Block direct user transaction inserts; provide a safe transfer RPC
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE OR REPLACE FUNCTION public.transfer_funds(
  _recipient_profile_id uuid,
  _amount numeric,
  _description text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_profile_id uuid;
  _sender_balance numeric;
  _recipient_balance numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT id, balance INTO _sender_profile_id, _sender_balance
  FROM public.profiles WHERE user_id = auth.uid() FOR UPDATE;

  IF _sender_profile_id IS NULL THEN
    RAISE EXCEPTION 'Sender profile not found';
  END IF;
  IF _sender_profile_id = _recipient_profile_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;
  IF _sender_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  SELECT balance INTO _recipient_balance
  FROM public.profiles WHERE id = _recipient_profile_id FOR UPDATE;

  IF _recipient_balance IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  UPDATE public.profiles SET balance = balance - _amount WHERE id = _sender_profile_id;
  UPDATE public.profiles SET balance = balance + _amount WHERE id = _recipient_profile_id;

  INSERT INTO public.transactions (profile_id, type, amount, description, balance_after)
  VALUES (_sender_profile_id, 'debit', _amount, _description, _sender_balance - _amount);
  INSERT INTO public.transactions (profile_id, type, amount, description, balance_after)
  VALUES (_recipient_profile_id, 'credit', _amount, _description, _recipient_balance + _amount);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_funds(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid, numeric, text) TO authenticated;

-- 4. Restrictive policy preventing non-admin inserts on user_roles
CREATE POLICY "Block non-admin role inserts"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated, anon
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block non-admin role updates"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated, anon
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Lock down has_role function exec to authenticated only (needed for RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
