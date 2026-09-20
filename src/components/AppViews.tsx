import React from 'react';
import { QuoteBanner } from './QuoteBanner';
import { TimerCard } from './TimerCard';
import { ProjectManager } from './ProjectManager';
import { CalendarView } from './CalendarView';
import type {
  Quote,
  TimerMode,
  Subtask,
  Project,
  PriorityLevel,
  CalendarEvent,
} from '../types';

export interface AppViewsProps {
  currentView: 'timer' | 'projects' | 'calendar';
  setCurrentView: (view: 'timer' | 'projects' | 'calendar') => void;
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
  calendarView: 'day' | 'week' | 'month';
  setCalendarView: (view: 'day' | 'week' | 'month') => void;
  addEvent: (eventData: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventCompleted: (id: string) => Promise<void>;
}

export const AppViews: React.FC<AppViewsProps> = ({
  currentView,
  setCurrentView,
  activeQuote,
  getRandomQuote,
  addMantra,
  isRotating,
  timer,
  activeSubtask,
  activeProject,
  playClick,
  projects,
  subtasks,
  activeSubtaskId,
  setActiveSubtaskId,
  createProject,
  updateProject,
  deleteProject,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtaskCompleted,
  events,
  selectedDate,
  setSelectedDate,
  calendarView,
  setCalendarView,
  addEvent,
  updateEvent,
  deleteEvent,
  toggleEventCompleted,
}) => {
  return (
    <>
      {/* Visão 1: Timer & Foco */}
      {currentView === 'timer' && (
        <>
          <QuoteBanner
            quote={activeQuote}
            onRefreshQuote={() => {
              playClick();
              getRandomQuote();
            }}
            onAddMantra={addMantra}
            isRotating={isRotating}
          />

          <TimerCard
            mode={timer.mode}
            onChangeMode={(m) => {
              playClick();
              timer.changeMode(m);
            }}
            formattedTime={timer.formattedTime}
            progressPercent={timer.progressPercent}
            isRunning={timer.isRunning}
            cycleCount={timer.cycleCount}
            onToggle={() => {
              playClick();
              timer.toggle();
            }}
            onSkip={() => {
              playClick();
              timer.skip();
            }}
            onReset={() => {
              playClick();
              timer.reset();
            }}
            activeTask={activeSubtask}
            activeProject={activeProject}
            onOpenTasksScroll={() => setCurrentView('projects')}
          />

          <ProjectManager
            projects={projects}
            subtasks={subtasks}
            activeSubtaskId={activeSubtaskId}
            onSelectActiveSubtask={setActiveSubtaskId}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onCreateSubtask={(pId, title, disc, est, prio, notes, due) =>
              onCreateSubtask(pId, title, disc, est, prio, notes, due)
            }
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onToggleSubtaskCompleted={onToggleSubtaskCompleted}
            onOpenTimerTab={() => setCurrentView('timer')}
          />
        </>
      )}

      {/* Visão 2: Projetos & Subtasks */}
      {currentView === 'projects' && (
        <ProjectManager
          projects={projects}
          subtasks={subtasks}
          activeSubtaskId={activeSubtaskId}
          onSelectActiveSubtask={setActiveSubtaskId}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onCreateSubtask={(pId, title, disc, est, prio, notes, due) =>
            onCreateSubtask(pId, title, disc, est, prio, notes, due)
          }
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onToggleSubtaskCompleted={onToggleSubtaskCompleted}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}

      {/* Visão 3: Calendário & Time-Blocking */}
      {currentView === 'calendar' && (
        <CalendarView
          events={events}
          projects={projects}
          subtasks={subtasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendarView={calendarView}
          onChangeView={setCalendarView}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
          onToggleEventCompleted={toggleEventCompleted}
          onSelectSubtaskForFocus={(sId) => setActiveSubtaskId(sId)}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}
    </>
  );
};
