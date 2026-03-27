
CREATE TABLE public.card_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cardholder_name TEXT NOT NULL,
  card_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  secure_pin TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.card_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own cards"
ON public.card_details FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cards"
ON public.card_details FOR SELECT
TO public
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage cards"
ON public.card_details FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.card_details;
