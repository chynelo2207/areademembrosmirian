-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'aluno');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- MODULES
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  coming_soon boolean NOT NULL DEFAULT false,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_select_authenticated" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "modules_admin_all" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LESSONS
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  video_url text,
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_module_idx ON public.lessons(module_id, position);
GRANT SELECT ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select_authenticated" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROGRESS
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select_own" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_delete_own" ON public.lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MATERIALS
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_url text,
  kind text NOT NULL DEFAULT 'pdf',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_select_authenticated" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_admin_all" ON public.materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_select_authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "announcements_admin_all" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED MODULES
INSERT INTO public.modules (title, description, position, coming_soon) VALUES
 ('Como montar um molde / molde', 'A base de tudo: construção do molde passo a passo.', 1, false),
 ('Aulas de Crepagem', 'Técnicas de crepagem aplicadas ao corset.', 2, false),
 ('Interpretação de modelo - Penélope', 'Do desenho à peça: interpretação completa do modelo Penélope.', 3, false),
 ('Dica de Ouro', 'Segredos que aceleram seu resultado.', 4, false),
 ('Aulas de medidas assertivas', 'Como medir sem erro e garantir o caimento.', 5, false),
 ('Aulas de medida para peças sob medida', 'Medidas para peças exclusivas sob medida.', 6, false),
 ('Aula de corselet avançado técnicas em método internacional', 'Método internacional aplicado ao corselet avançado.', 7, false),
 ('Aula de corselet estruturado em tecido plano', 'Estrutura e montagem em tecido plano.', 8, false),
 ('Aula de variação de modelos através de um único molde', 'Em breve: múltiplos modelos a partir de um só molde.', 9, true),
 ('Aula de corselet estruturado em tecidos delicados', 'Em breve: estrutura em tecidos delicados.', 10, true),
 ('Aula técnicas profissionais de estrutura, montagem e acabamento alto padrão', 'Em breve: acabamento de alto padrão.', 11, true);

-- SEED LESSONS
INSERT INTO public.lessons (module_id, title, position, duration_minutes)
SELECT m.id, 'Aula ' || g, g, 12 + (g * 3)
FROM public.modules m
CROSS JOIN LATERAL generate_series(1, (ARRAY[6,2,11,2,3,4,4,2,0,0,0])[m.position]) AS g;

-- SEED MATERIALS
INSERT INTO public.materials (title, description, kind, position, module_id)
SELECT 'Molde base em PDF (A4)', 'Molde base para impressão em folhas A4.', 'pdf', 1, id FROM public.modules WHERE position = 1;
INSERT INTO public.materials (title, description, kind, position, module_id)
SELECT 'Tabela de medidas assertivas', 'Planilha para registrar as medidas da cliente.', 'planilha', 2, id FROM public.modules WHERE position = 5;
INSERT INTO public.materials (title, description, kind, position) VALUES
 ('Lista de materiais e fornecedores', 'Tudo que você precisa para começar, com indicações de fornecedores.', 'pdf', 3),
 ('Guia de acabamentos alto padrão', 'Referências de acabamento profissional.', 'pdf', 4);

-- SEED ANNOUNCEMENTS
INSERT INTO public.announcements (title, body, pinned) VALUES
 ('Bem-vinda à área de membros!', 'Aqui você encontra todas as aulas, materiais e avisos do Curso Corset ou Corselet Noiva e Moda Festa. Comece pelo módulo "Como montar um molde".', true),
 ('Novos módulos em produção', 'Estamos gravando as aulas de variação de modelos, tecidos delicados e acabamento alto padrão. Assim que liberadas, aparecem automaticamente aqui.', false);