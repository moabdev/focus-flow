// Definições de tipos centrais do FocusFlow

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export type PriorityLevel = 'baixa' | 'media' | 'alta';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  discipline: string;
  pomodoros_estimated: number;
  pomodoros_completed: number;
  is_completed: boolean;
  priority: PriorityLevel;
  created_at?: string;
}

export interface StudySession {
  id: string;
  user_id?: string;
  discipline: string;
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
