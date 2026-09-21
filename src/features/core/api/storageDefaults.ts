import { Project, Subtask, CalendarEvent, UserSettings, FlashcardDeck, Flashcard, MindMap } from '@/features/core/types';

export const STORAGE_KEYS = {
  INITIALIZED: 'focusflow_defaults_initialized',
  PROJECTS: 'focusflow_projects',
  SUBTASKS: 'focusflow_subtasks',
  TASKS: 'focusflow_tasks', // legado
  CALENDAR: 'focusflow_calendar_events',
  SESSIONS: 'focusflow_sessions',
  SETTINGS: 'focusflow_settings',
  SCRATCHPAD: 'focusflow_scratchpad',
  QUICK_NOTES: 'focusflow_quick_notes',
  MANTRAS: 'focusflow_mantras',
  FLASHCARD_DECKS: 'focusflow_flashcard_decks',
  FLASHCARDS: 'focusflow_flashcards',
  MIND_MAPS: 'focusflow_mind_maps',
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

export const DEFAULT_PROJECTS: Project[] = [];
export const DEFAULT_SUBTASKS: Subtask[] = [];
export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [];
export const DEFAULT_FLASHCARD_DECKS: FlashcardDeck[] = [];
export const DEFAULT_FLASHCARDS: Flashcard[] = [];
export const DEFAULT_MIND_MAPS: MindMap[] = [];
