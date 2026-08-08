CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cta_label text NOT NULL DEFAULT 'Quero saber mais',
  cta_url text,
  image_url text,
  price_label text,
  highlight boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_select_authenticated ON public.offers
  FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY offers_admin_all ON public.offers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER offers_set_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));