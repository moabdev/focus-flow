import { Project, Subtask, CalendarEvent, UserSettings } from '../types';

export const STORAGE_KEYS = {
  PROJECTS: 'focusflow_projects',
  SUBTASKS: 'focusflow_subtasks',
  TASKS: 'focusflow_tasks', // legado
  CALENDAR: 'focusflow_calendar_events',
  SESSIONS: 'focusflow_sessions',
  SETTINGS: 'focusflow_settings',
  SCRATCHPAD: 'focusflow_scratchpad',
  MANTRAS: 'focusflow_mantras',
};

export const DEFAULT_SETTINGS: UserSettings = {
  pomodoro_time: 25,
  short_break_time: 5,
  long_break_time: 15,
  long_break_interval: 4,
  theme: 'ruby',
  color_mode: 'dark',
  dark_mode_running: true,
  alarm_sound: 'crystal',
  ambient_sound: 'none',
  sound_volume: 0.8,
  ambient_volume: 0.5,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  strict_focus_mode: false,
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'FocusFlow: Plataforma & Engenharia',
    description: 'Desenvolvimento do ecossistema moderno com timer, projetos, subtasks e calendário.',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    color: '#ff2a5f',
    icon: '🚀',
    total_elapsed_seconds: 5400, // 1h 30m
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    title: 'Inteligência Artificial & Agentes Autônomos',
    description: 'Estudos aprofundados de RAG multimodal, embeddings e fluxos agentic.',
    start_date: '2026-09-10',
    end_date: '2026-11-30',
    color: '#0ea5e9',
    icon: '🤖',
    total_elapsed_seconds: 3600, // 1h
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    project_id: 'proj-1',
    title: 'Arquitetura de Projetos e Time-Tracking por Subtask',
    discipline: 'Engenharia de Software',
    priority: 'alta',
    pomodoros_estimated: 4,
    pomodoros_completed: 2,
    elapsed_seconds: 3000,
    is_completed: false,
    notes: '# Planejamento da Arquitetura\n\n- [x] Modelagem de interfaces no TypeScript\n- [x] Rastreamento preciso de tempo em segundos\n- [ ] Conectar cronômetro ao tempo acumulado\n\n> 💡 *Dica:* Cada subtask acumula tempo individualmente e alimenta o total do projeto.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    project_id: 'proj-1',
    title: 'Editor de Anotações estilo Notion com Markdown',
    discipline: 'Frontend UX',
    priority: 'alta',
    pomodoros_estimated: 3,
    pomodoros_completed: 1,
    elapsed_seconds: 2400,
    is_completed: false,
    notes: '# Requisitos do Editor Notion-style\n\n- Tipografia refinada (JetBrains Mono & Outfit)\n- Checklists interativos clicáveis\n- Callouts com emoji e destaque visual',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-3',
    project_id: 'proj-2',
    title: 'Implementação de RAG com Embeddings e Vector Store',
    discipline: 'Inteligência Artificial',
    priority: 'media',
    pomodoros_estimated: 5,
    pomodoros_completed: 2,
    elapsed_seconds: 3600,
    is_completed: false,
    notes: '# Pipeline de Recuperação\n\n1. Chunking contextual de documentos\n2. Indexação vetorial em alta dimensão\n3. Re-ranking semântico',
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Foco: Arquitetura FocusFlow',
    description: 'Desenvolvimento das novas abas de projetos e time-blocking',
    start_time: `${new Date().toISOString().split('T')[0]}T09:00`,
    end_time: `${new Date().toISOString().split('T')[0]}T10:30`,
    project_id: 'proj-1',
    subtask_id: 'sub-1',
    color: '#ff2a5f',
    is_completed: false,
  },
  {
    id: 'cal-2',
    title: 'Estudo: RAG & Vetores Semânticos',
    description: 'Leitura técnica e implementação de embeddings',
    start_time: `${new Date().toISOString().split('T')[0]}T14:00`,
    end_time: `${new Date().toISOString().split('T')[0]}T15:30`,
    project_id: 'proj-2',
    subtask_id: 'sub-3',
    color: '#0ea5e9',
    is_completed: false,
  },
];
