REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
DROP POLICY IF EXISTS "Public can read published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can read published testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can read all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));