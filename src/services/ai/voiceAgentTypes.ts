import { AppViewMode, PriorityLevel, TimerMode } from '@/features/core/types';

// Tipos de ferramentas executáveis pelo Voice Agent
export interface ControlPomodoroArgs {
  action: 'start' | 'pause' | 'resume' | 'stop' | 'skip';
  durationMinutes?: number;
  taskTitle?: string;
  mode?: TimerMode;
}

export interface ManageTasksArgs {
  action: 'create' | 'complete' | 'delete' | 'list';
  title?: string;
  projectName?: string;
  priority?: PriorityLevel;
  estimatedPomodoros?: number;
  dueDate?: string;
}

export interface ManageCalendarArgs {
  action: 'create_event' | 'get_events_today' | 'delete_event';
  title?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateStudyMaterialArgs {
  type: 'quick_note' | 'flashcard' | 'mantra';
  title?: string;
  content?: string;
  front?: string;
  back?: string;
}

export interface NavigateAppArgs {
  view: AppViewMode;
}

export interface SummarizeProductivityArgs {
  timeframe?: 'today' | 'week';
}

export interface ControlThemeArgs {
  action: 'light' | 'dark' | 'system' | 'palette';
  palette?: string;
}

export interface ControlAmbientSoundArgs {
  action: 'play' | 'stop' | 'change_volume';
  sound?: 'none' | 'rain' | 'brownNoise' | 'whiteNoise';
  volume?: number;
}

export interface ToggleUIArgs {
  panel: 'zenMode' | 'commandPalette' | 'scratchpad' | 'settings';
  action: 'open' | 'close' | 'toggle';
}

export type AgentToolCall =
  | { name: 'controlPomodoro'; args: ControlPomodoroArgs }
  | { name: 'manageTasks'; args: ManageTasksArgs }
  | { name: 'manageCalendar'; args: ManageCalendarArgs }
  | { name: 'createStudyMaterial'; args: CreateStudyMaterialArgs }
  | { name: 'navigateApp'; args: NavigateAppArgs }
  | { name: 'summarizeProductivity'; args: SummarizeProductivityArgs }
  | { name: 'controlTheme'; args: ControlThemeArgs }
  | { name: 'controlAmbientSound'; args: ControlAmbientSoundArgs }
  | { name: 'toggleUI'; args: ToggleUIArgs };

export interface AgentResponse {
  speechText: string;
  toolCalls: AgentToolCall[];
}

export interface AgentAppContext {
  currentTime: string;
  currentDate: string;
  currentView: AppViewMode;
  isTimerRunning: boolean;
  timerMode: TimerMode;
  timerRemainingFormatted: string;
  activeTaskTitle?: string;
  activeProjectTitle?: string;
  pendingTasksCount: number;
  completedTasksCount: number;
  todayEventsCount: number;
  todayEventsDetails: string;
  availableProjects: { id: string; title: string }[];
  recentSubtasks: { id: string; title: string; is_completed: boolean; projectName?: string }[];
}
