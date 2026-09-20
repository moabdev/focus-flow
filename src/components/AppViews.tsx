import React from 'react';
import { QuoteBanner } from './QuoteBanner';
import { TimerCard } from './TimerCard';
import { ProjectManager } from './ProjectManager';
import { CalendarView } from './CalendarView';
import { ProjectDetailView } from './projects/ProjectDetailView';
import { StudyGroupsView } from './groups/StudyGroupsView';
import { WeeklyLeaderboardView } from './ranking/WeeklyLeaderboardView';
import { DraftsView } from './drafts/DraftsView';
import type {
  Quote,
  TimerMode,
  Subtask,
  Project,
  PriorityLevel,
  CalendarEvent,
  AppViewMode,
  CalendarViewMode,
  SupabaseProfile,
} from '../types';

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
  // User & Ranking props
  userProfile: SupabaseProfile | null;
  weekMinutes: number;
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
  selectedProjectDetailId,
  onOpenProjectDetail,
  onBackFromProjectDetail,
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
  userProfile,
  weekMinutes,
}) => {
  const currentDetailProject = projects.find((p) => p.id === selectedProjectDetailId);
  const detailSubtasks = subtasks.filter((s) => s.project_id === selectedProjectDetailId);

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
            onOpenProjectDetail={onOpenProjectDetail}
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
          onOpenProjectDetail={onOpenProjectDetail}
        />
      )}

      {/* Visão 3: Página Individual de Detalhes do Projeto */}
      {currentView === 'project-detail' && currentDetailProject && (
        <ProjectDetailView
          project={currentDetailProject}
          subtasks={detailSubtasks}
          activeSubtaskId={activeSubtaskId}
          onSelectActiveSubtask={setActiveSubtaskId}
          onBack={onBackFromProjectDetail}
          onDeleteProject={deleteProject}
          onCreateSubtask={onCreateSubtask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onToggleSubtaskCompleted={onToggleSubtaskCompleted}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}

      {/* Visão 4: Calendário & Time-Blocking */}
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

      {/* Visão 5: Grupos de Estudo & Chat */}
      {currentView === 'groups' && (
        <StudyGroupsView
          userProfile={userProfile}
          isUserStudying={timer.isRunning}
          activeTaskTitle={activeSubtask?.title}
        />
      )}

      {/* Visão 6: Ranking Semanal de Foco */}
      {currentView === 'ranking' && (
        <WeeklyLeaderboardView
          currentUserMinutes={weekMinutes}
          userProfile={userProfile}
        />
      )}

      {/* Visão 7: Rascunhos & Notas Rápidas */}
      {currentView === 'drafts' && (
        <DraftsView
          projects={projects}
          subtasks={subtasks}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}
    </>
  );
};
