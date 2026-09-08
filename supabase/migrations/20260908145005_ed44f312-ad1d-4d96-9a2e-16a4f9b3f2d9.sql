ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS required_plan public.access_plan NOT NULL DEFAULT 'classico';

DROP POLICY IF EXISTS materials_select_authenticated ON public.materials;
CREATE POLICY materials_select_authenticated ON public.materials
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR required_plan = 'classico'::public.access_plan
  OR public.my_plan() = 'completo'
);