// Definições de tipos centrais do FocusFlow

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export type PriorityLevel = 'baixa' | 'media' | 'alta';

export type AppViewMode = 'timer' | 'projects' | 'project-detail' | 'calendar' | 'groups' | 'ranking';

export type CalendarViewMode = 'day' | 'week' | 'month';

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  color: string;       // Código de cor hex ou tag
  icon?: string;        // Emoji ou identificador
  total_elapsed_seconds: number;
  created_at: string;
}

export interface Subtask {
  id: string;
  project_id?: string;
  user_id?: string;
  title: string;
  discipline?: string;
  priority: PriorityLevel;
  pomodoros_estimated: number;
  pomodoros_completed: number;
  elapsed_seconds?: number;
  is_completed: boolean;
  notes?: string;      // Anotações ricas estilo Notion
  due_date?: string;   // YYYY-MM-DD
  created_at?: string;
}

// Tipo Task mantido como alias compatível de Subtask
export type Task = Subtask;

export interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_time: string; // YYYY-MM-DDTHH:mm ou ISO
  end_time: string;   // YYYY-MM-DDTHH:mm ou ISO
  project_id?: string;
  subtask_id?: string;
  color?: string;
  is_completed?: boolean;
}

export interface StudySession {
  id: string;
  user_id?: string;
  discipline: string;
  project_id?: string;
  subtask_id?: string;
  duration_minutes: number;
  completed_at: string; // ISO String
}

export type ColorMode = 'dark' | 'light' | 'system';

export type ThemePalette = 'ruby' | 'ocean' | 'matcha' | 'oled' | 'sunset';

export type AlarmSound = 'crystal' | 'bell' | 'digital' | 'marimba';

export type AmbientSound = 'none' | 'rain' | 'brownNoise' | 'whiteNoise';

export interface UserSettings {
  pomodoro_time: number; // in minutes
  short_break_time: number;
  long_break_time: number;
  long_break_interval: number;
  theme: ThemePalette;
  color_mode: ColorMode;
  dark_mode_running: boolean;
  alarm_sound: AlarmSound;
  ambient_sound: AmbientSound;
  sound_volume: number; // 0 to 1
  ambient_volume: number; // 0 to 1
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  strict_focus_mode?: boolean;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'foco' | 'disciplina' | 'resiliencia' | 'calma';
  isMantra?: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export interface StudyMetrics {
  todayMinutes: number;
  weekMinutes: number;
  totalPomodoros: number;
  subjectMinutes: Record<string, number>;
  history: StudySession[];
  streak: StreakInfo;
}

export interface SupabaseProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

// Grupos de Estudo & Chat
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar_icon: string;
  code: string;
  member_count: number;
  created_at: string;
  created_by?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'admin' | 'member';
  current_status: 'focusing' | 'break' | 'idle';
  current_task_title?: string;
  weekly_seconds: number;
  streak_days: number;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  type: 'chat' | 'system_focus' | 'milestone';
  created_at: string;
}

// Ranking Semanal (Leaderboard)
export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  weekly_seconds: number;
  pomodoros_completed: number;
  streak_days: number;
  is_current_user?: boolean;
}

// Sistema de Gamificação & Conquistas (Badges)
export type BadgeTier = 'bronze' | 'prata' | 'ouro' | 'diamante';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number; // 0 a 100
  current_value: number;
  target_value: number;
  unit: string;
}
