
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
ON public.site_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.site_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value) VALUES ('withdrawal_fee_percent', '3');
