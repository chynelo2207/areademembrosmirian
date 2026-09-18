-- 1. Admin passa a poder ver o progresso de QUALQUER aluno (antes só via "auth.uid() = user_id",
--    ou seja, nem o admin conseguia ver o progresso de outra pessoa pelo app).
DROP POLICY IF EXISTS progress_select_admin ON public.lesson_progress;
CREATE POLICY progress_select_admin ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Nova tabela: registra quando um aluno abre/baixa um material (molde, PDF, planilha...),
--    mesmo depois que o acesso dela for revogado (o registro fica, não é apagado).
CREATE TABLE IF NOT EXISTS public.material_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_views_user_idx ON public.material_views (user_id);
CREATE INDEX IF NOT EXISTS material_views_material_idx ON public.material_views (material_id);

GRANT SELECT, INSERT ON public.material_views TO authenticated;
GRANT ALL ON public.material_views TO service_role;
ALTER TABLE public.material_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS material_views_insert_own ON public.material_views;
CREATE POLICY material_views_insert_own ON public.material_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS material_views_select_own ON public.material_views;
CREATE POLICY material_views_select_own ON public.material_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS material_views_select_admin ON public.material_views;
CREATE POLICY material_views_select_admin ON public.material_views
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. A partir de agora, os webhooks (cakto/wiapy) vão registrar TODO evento de compra e
--    reembolso na tabela "purchases" (que já existia, mas só o wiapy usava). Isso preserva
--    o histórico ("essa pessoa comprou o clássico dia X, pediu reembolso dia Y") mesmo depois
--    que o acesso dela (access_grants) for removido. Nada a fazer aqui além de já deixar o
--    índice pronto pra consulta por e-mail com status.
CREATE INDEX IF NOT EXISTS purchases_email_status_idx ON public.purchases (lower(email), status);
