-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Integrada com Supabase Auth e Google OAuth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Tarefas de Estudo (Legado / Standalone)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  discipline TEXT DEFAULT 'Geral',
  pomodoros_estimated INT DEFAULT 1,
  pomodoros_completed INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('baixa', 'media', 'alta')) DEFAULT 'media',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Projetos de Estudo / Trabalho
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  color TEXT DEFAULT '#ff2a5f',
  icon TEXT DEFAULT '📁',
  total_elapsed_seconds BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Subtarefas (Subtasks com suporte a notas ricas tipo Notion)
CREATE TABLE IF NOT EXISTS public.subtasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  discipline TEXT DEFAULT 'Geral',
  priority TEXT CHECK (priority IN ('baixa', 'media', 'alta')) DEFAULT 'media',
  pomodoros_estimated INT DEFAULT 1,
  pomodoros_completed INT DEFAULT 0,
  elapsed_seconds BIGINT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Histórico de Sessões de Estudo (Alimenta as Estatísticas, Heatmap e Streak)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  discipline TEXT DEFAULT 'Geral',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL,
  duration_minutes INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Preferências e Configurações do Usuário (inclui Modo Foco Rigoroso e Volume Ambiente)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pomodoro_time INT DEFAULT 25,
  short_break_time INT DEFAULT 5,
  long_break_time INT DEFAULT 15,
  long_break_interval INT DEFAULT 4,
  theme TEXT DEFAULT 'ruby',
  color_mode TEXT DEFAULT 'dark' CHECK (color_mode IN ('light', 'dark', 'system')),
  dark_mode_running BOOLEAN DEFAULT TRUE,
  alarm_sound TEXT DEFAULT 'crystal',
  ambient_sound TEXT DEFAULT 'none',
  sound_volume FLOAT DEFAULT 0.8,
  ambient_volume FLOAT DEFAULT 0.5,
  auto_start_breaks BOOLEAN DEFAULT FALSE,
  auto_start_pomodoros BOOLEAN DEFAULT FALSE,
  strict_focus_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 8. Anotações Rápidas Legadas (Scratchpad Simples)
CREATE TABLE IF NOT EXISTS public.scratchpad (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 9. Tabela de Calendário & Agendamento (Time-Blocking)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#ff2a5f',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabela de Conquistas e Medalhas Desbloqueadas (Gamificação / Badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 11. Tabela de Grupos de Estudo Comunitários (com Regras da Sala e Código)
CREATE TABLE IF NOT EXISTS public.study_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  avatar_icon TEXT DEFAULT '💻',
  code TEXT UNIQUE NOT NULL,
  member_count INT DEFAULT 1,
  created_by TEXT,
  rules TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Tabela de Membros dos Grupos e Status de Foco ao Vivo
CREATE TABLE IF NOT EXISTS public.group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  current_status TEXT DEFAULT 'idle' CHECK (current_status IN ('focusing', 'break', 'idle')),
  current_task_title TEXT,
  weekly_seconds BIGINT DEFAULT 0,
  streak_days INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Tabela de Mensagens do Chat em Tempo Real
CREATE TABLE IF NOT EXISTS public.group_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'system_focus', 'milestone')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Tabela de Notas Rápidas & Rascunhos Vinculados (DraftsView / Scratchpad Rápido)
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova Anotação',
  content TEXT DEFAULT '',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Sistema de Flashcards (Decks e Cards)
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0ea5e9',
  icon TEXT DEFAULT '📚',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id TEXT PRIMARY KEY,
  deck_id TEXT REFERENCES public.flashcard_decks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  tags TEXT[] DEFAULT '{}',
  repetition INT DEFAULT 0,
  interval_days INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  due_date TEXT NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  lapses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Sistema de Mapas Mentais
CREATE TABLE IF NOT EXISTS public.mind_maps (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  root_node_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mind_map_nodes (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT REFERENCES public.mind_maps(id) ON DELETE CASCADE NOT NULL,
  parent_id TEXT REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_collapsed BOOLEAN DEFAULT false,
  x FLOAT,
  y FLOAT,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 17. Migrações Seguras (Garante atualização caso as tabelas já existam no banco)
-- ==============================================================================
-- ==============================================================================
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL;

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS sound_volume FLOAT DEFAULT 0.8;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ambient_volume FLOAT DEFAULT 0.5;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS strict_focus_mode BOOLEAN DEFAULT FALSE;

ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}';

-- Remove com segurança constraints de chave estrangeira e políticas em study_groups antes de alterar o tipo de created_by
DO $$
DECLARE
  pol RECORD;
  fk RECORD;
BEGIN
  IF to_regclass('public.study_groups') IS NOT NULL THEN
    -- 1. Remove todas as políticas da tabela study_groups (serão recriadas na Seção 16)
    FOR pol IN (
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'study_groups'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.study_groups', pol.policyname);
    END LOOP;

    -- 2. Remove qualquer Foreign Key constraint associada a created_by (ex: study_groups_created_by_fkey)
    FOR fk IN (
      SELECT conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.study_groups'::regclass
        AND a.attname = 'created_by'
        AND c.contype = 'f'
    ) LOOP
      EXECUTE format('ALTER TABLE public.study_groups DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    -- Remoção explícita por garantia adicional
    ALTER TABLE public.study_groups DROP CONSTRAINT IF EXISTS study_groups_created_by_fkey;

    -- 3. Altera com segurança o tipo da coluna created_by para TEXT
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'study_groups' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE public.study_groups ALTER COLUMN created_by TYPE TEXT USING created_by::text;
    END IF;
  END IF;
END $$;

ALTER TABLE public.quick_notes ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Nova Anotação';
ALTER TABLE public.quick_notes ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.quick_notes ADD COLUMN IF NOT EXISTS subtask_id TEXT REFERENCES public.subtasks(id) ON DELETE SET NULL;
ALTER TABLE public.quick_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 16. Habilitar Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratchpad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Individuais (Dados privados do usuário)
DROP POLICY IF EXISTS "Acesso individual - profiles" ON public.profiles;
CREATE POLICY "Acesso individual - profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Leitura pública de perfis autenticados" ON public.profiles;
CREATE POLICY "Leitura pública de perfis autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Acesso individual - quick_notes" ON public.quick_notes;
CREATE POLICY "Acesso individual - quick_notes" ON public.quick_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - tasks" ON public.tasks;
CREATE POLICY "Acesso individual - tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - projects" ON public.projects;
CREATE POLICY "Acesso individual - projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - subtasks" ON public.subtasks;
CREATE POLICY "Acesso individual - subtasks" ON public.subtasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - study_sessions" ON public.study_sessions;
CREATE POLICY "Acesso individual - study_sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - user_settings" ON public.user_settings;
CREATE POLICY "Acesso individual - user_settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - scratchpad" ON public.scratchpad;
CREATE POLICY "Acesso individual - scratchpad" ON public.scratchpad
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - calendar_events" ON public.calendar_events;
CREATE POLICY "Acesso individual - calendar_events" ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acesso individual - user_badges" ON public.user_badges;
CREATE POLICY "Acesso individual - user_badges" ON public.user_badges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas de RLS Comunitárias (Grupos de Estudo & Chat)
DROP POLICY IF EXISTS "Grupos visíveis para autenticados" ON public.study_groups;
CREATE POLICY "Grupos visíveis para autenticados" ON public.study_groups
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Criar grupos autenticados" ON public.study_groups;
CREATE POLICY "Criar grupos autenticados" ON public.study_groups
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizar próprio grupo" ON public.study_groups;
CREATE POLICY "Atualizar próprio grupo" ON public.study_groups
  FOR UPDATE TO authenticated USING (created_by = auth.uid()::text OR created_by IS NULL);

DROP POLICY IF EXISTS "Excluir próprio grupo" ON public.study_groups;
CREATE POLICY "Excluir próprio grupo" ON public.study_groups
  FOR DELETE TO authenticated USING (created_by = auth.uid()::text OR created_by IS NULL);

DROP POLICY IF EXISTS "Membros visíveis para autenticados" ON public.group_members;
CREATE POLICY "Membros visíveis para autenticados" ON public.group_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Entrar e gerenciar membros autenticados" ON public.group_members;
CREATE POLICY "Entrar e gerenciar membros autenticados" ON public.group_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Mensagens visíveis para autenticados" ON public.group_messages;
CREATE POLICY "Mensagens visíveis para autenticados" ON public.group_messages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enviar mensagens autenticados" ON public.group_messages;
CREATE POLICY "Enviar mensagens autenticados" ON public.group_messages
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem deletar suas notas" ON public.quick_notes;
CREATE POLICY "Usuários podem deletar suas notas" ON public.quick_notes FOR DELETE USING (auth.uid() = user_id);

-- Flashcard Decks
DROP POLICY IF EXISTS "Usuários podem ver seus próprios baralhos" ON public.flashcard_decks;
CREATE POLICY "Usuários podem ver seus próprios baralhos" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar baralhos" ON public.flashcard_decks;
CREATE POLICY "Usuários podem criar baralhos" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus baralhos" ON public.flashcard_decks;
CREATE POLICY "Usuários podem atualizar seus baralhos" ON public.flashcard_decks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus baralhos" ON public.flashcard_decks;
CREATE POLICY "Usuários podem deletar seus baralhos" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- Flashcards
DROP POLICY IF EXISTS "Usuários podem ver seus próprios cartões" ON public.flashcards;
CREATE POLICY "Usuários podem ver seus próprios cartões" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar cartões" ON public.flashcards;
CREATE POLICY "Usuários podem criar cartões" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus cartões" ON public.flashcards;
CREATE POLICY "Usuários podem atualizar seus cartões" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus cartões" ON public.flashcards;
CREATE POLICY "Usuários podem deletar seus cartões" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Mind Maps
DROP POLICY IF EXISTS "Usuários podem ver seus próprios mapas mentais" ON public.mind_maps;
CREATE POLICY "Usuários podem ver seus próprios mapas mentais" ON public.mind_maps FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar mapas mentais" ON public.mind_maps;
CREATE POLICY "Usuários podem criar mapas mentais" ON public.mind_maps FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus mapas mentais" ON public.mind_maps;
CREATE POLICY "Usuários podem atualizar seus mapas mentais" ON public.mind_maps FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus mapas mentais" ON public.mind_maps;
CREATE POLICY "Usuários podem deletar seus mapas mentais" ON public.mind_maps FOR DELETE USING (auth.uid() = user_id);

-- Mind Map Nodes
DROP POLICY IF EXISTS "Usuários podem ver nós de seus mapas" ON public.mind_map_nodes;
CREATE POLICY "Usuários podem ver nós de seus mapas" ON public.mind_map_nodes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Usuários podem criar nós em seus mapas" ON public.mind_map_nodes;
CREATE POLICY "Usuários podem criar nós em seus mapas" ON public.mind_map_nodes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Usuários podem atualizar nós de seus mapas" ON public.mind_map_nodes;
CREATE POLICY "Usuários podem atualizar nós de seus mapas" ON public.mind_map_nodes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Usuários podem deletar nós de seus mapas" ON public.mind_map_nodes;
CREATE POLICY "Usuários podem deletar nós de seus mapas" ON public.mind_map_nodes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

-- ==============================================================================
-- 19. Funções Utilitárias e Triggers
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_project_id ON public.subtasks(project_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed_at ON public.study_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id ON public.quick_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_project_id ON public.quick_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);

-- ==============================================================================
-- 18. Habilitar Supabase Realtime (WebSockets para Grupos, Membros, Mensagens e Notas)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_groups'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.study_groups;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quick_notes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_notes;
    END IF;
  END IF;
END $$;

-- ==============================================================================
-- 19. Triggers para Atualização Automática de updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_quick_notes_updated_at ON public.quick_notes;
CREATE TRIGGER tr_quick_notes_updated_at
  BEFORE UPDATE ON public.quick_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER tr_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para sincronizar novos usuários do Supabase Auth para a tabela public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
