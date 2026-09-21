import {
  Quote,
  TimerMode,
  Subtask,
  Project,
  PriorityLevel,
  CalendarEvent,
  AppViewMode,
  CalendarViewMode,
  SupabaseProfile,
  StudyMetrics,
} from '@/features/core/types';

export interface AppViewsProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  // Quote & Timer props
  activeQuote: Quote;
  getRandomQuote: () => void;
  addMantra: (text: string, author?: string) => void;
  isRotating: boolean;
  timer: {
    mode: TimerMode;
    formattedTime: string;
    progressPercent: number;
    isRunning: boolean;
    cycleCount: number;
    changeMode: (mode: TimerMode) => void;
    toggle: () => void;
    skip: () => void;
    reset: () => void;
  };
  activeSubtask: Subtask | null;
  activeProject: Project | null;
  playClick: () => void;
  // Project & Subtask props
  projects: Project[];
  subtasks: Subtask[];
  activeSubtaskId: string | null;
  setActiveSubtaskId: (id: string | null) => void;
  selectedProjectDetailId: string | null;
  onOpenProjectDetail: (id: string) => void;
  onBackFromProjectDetail: () => void;
  createProject: (data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    color?: string;
    icon?: string;
  }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  onCreateSubtask: (
    projectId: string,
    title: string,
    discipline?: string,
    estimated?: number,
    priority?: PriorityLevel,
    notes?: string,
    due_date?: string
  ) => Promise<Subtask | null>;
  onUpdateSubtask: (id: string, data: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onToggleSubtaskCompleted: (id: string) => Promise<void>;
  // Calendar props
  events: CalendarEvent[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  calendarView: CalendarViewMode;
  setCalendarView: (view: CalendarViewMode) => void;
  addEvent: (eventData: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventCompleted: (id: string) => Promise<void>;
  importGoogleEvents: (events: CalendarEvent[]) => void;
  bulkUpdateEvents: (events: CalendarEvent[]) => void;
  googleSyncStatus: import('@/features/calendar/hooks/useCalendar').GoogleSyncStatus;
  lastGoogleSync: Date | null;
  onManualGoogleSync: () => void;
  // User & Ranking props
  userProfile: SupabaseProfile | null;
  weekMinutes: number;
  metrics: StudyMetrics;
}
