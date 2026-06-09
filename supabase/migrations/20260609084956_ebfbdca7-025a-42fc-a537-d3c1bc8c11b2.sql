
-- Remove SECURITY DEFINER transfer function
DROP FUNCTION IF EXISTS public.transfer_funds(uuid, numeric, text);

-- Restore full UPDATE grant on profiles so balance can be updated by users/admins through client
GRANT UPDATE ON public.profiles TO authenticated;

-- Allow users to insert transactions (their own + recipient leg for P2P), admins anything
CREATE POLICY "Authenticated can insert transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow admins to update transactions
CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
