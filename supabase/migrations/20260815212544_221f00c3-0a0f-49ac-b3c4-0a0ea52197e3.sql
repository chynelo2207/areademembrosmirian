-- 1. plan enum
DO $$ BEGIN
  CREATE TYPE public.access_plan AS ENUM ('classico', 'completo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. access grants (buyers allowlist)
CREATE TABLE IF NOT EXISTS public.access_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  plan public.access_plan NOT NULL DEFAULT 'classico',
  source text NOT NULL DEFAULT 'manual',
  order_id text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grants_email_key ON public.access_grants (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_grants TO authenticated;
GRANT ALL ON public.access_grants TO service_role;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS access_grants_select_own ON public.access_grants;
CREATE POLICY access_grants_select_own ON public.access_grants
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS access_grants_admin_all ON public.access_grants;
CREATE POLICY access_grants_admin_all ON public.access_grants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS access_grants_set_updated_at ON public.access_grants;
CREATE TRIGGER access_grants_set_updated_at BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. modules: which plan unlocks it
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS required_plan public.access_plan NOT NULL DEFAULT 'completo';

UPDATE public.modules SET required_plan = 'classico' WHERE position <= 1;

-- 4. app settings (upgrade link etc.)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text NOT NULL PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_select_authenticated ON public.app_settings;
CREATE POLICY app_settings_select_authenticated ON public.app_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS app_settings_admin_all ON public.app_settings;
CREATE POLICY app_settings_admin_all ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('upgrade_url', 'https://pay.cakto.com.br/3dh9kbz'),
  ('upgrade_price_label', 'R$ 20,00'),
  ('classic_price_label', 'R$ 27,90'),
  ('complete_price_label', 'R$ 47,90')
ON CONFLICT (key) DO NOTHING;

-- 5. helper functions
CREATE OR REPLACE FUNCTION public.my_plan()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'
    ELSE (
      SELECT g.plan::text FROM public.access_grants g
      WHERE lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_module(_module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.my_plan() = 'admin' THEN true
    WHEN public.my_plan() = 'completo' THEN true
    WHEN public.my_plan() = 'classico' THEN EXISTS (
      SELECT 1 FROM public.modules m
      WHERE m.id = _module_id AND m.required_plan = 'classico'
    )
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.my_plan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_module(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_module(uuid) TO authenticated;

-- 6. gate lessons + materials by plan
DROP POLICY IF EXISTS lessons_select_authenticated ON public.lessons;
CREATE POLICY lessons_select_authenticated ON public.lessons
  FOR SELECT TO authenticated
  USING (public.can_view_module(module_id));

DROP POLICY IF EXISTS materials_select_authenticated ON public.materials;
CREATE POLICY materials_select_authenticated ON public.materials
  FOR SELECT TO authenticated
  USING (module_id IS NULL OR public.can_view_module(module_id));