import React, { Suspense, lazy } from 'react';
import { QuoteBanner } from '@/features/quotes/components/QuoteBanner';
import { TimerCard } from '@/features/timer/components/TimerCard';
import { ProjectManager } from '@/features/projects/components/ProjectManager';
import { AppViewsProps } from './AppViews.types';
import { ViewLoadingFallback } from './ViewLoadingFallback';

// Lazy loading de visões secundárias para reduzir bundle inicial
const CalendarView = lazy(() => import('@/features/calendar/components/CalendarView').then((m) => ({ default: m.CalendarView })));
const ProjectDetailView = lazy(() =>
  import('@/features/projects/components/projects/ProjectDetailView').then((m) => ({ default: m.ProjectDetailView }))
);
const StudyGroupsView = lazy(() =>
  import('@/features/groups/components/groups/StudyGroupsView').then((m) => ({ default: m.StudyGroupsView }))
);
const WeeklyLeaderboardView = lazy(() =>
  import('@/features/stats/components/ranking/WeeklyLeaderboardView').then((m) => ({ default: m.WeeklyLeaderboardView }))
);
const DraftsView = lazy(() => import('@/features/drafts/components/drafts/DraftsView').then((m) => ({ default: m.DraftsView })));
const FlashcardsView = lazy(() =>
  import('@/features/flashcards/components/flashcards/FlashcardsView').then((m) => ({ default: m.FlashcardsView }))
);
const MindMapsView = lazy(() =>
  import('@/features/mindmaps/components/mindmaps/MindMapsView').then((m) => ({ default: m.MindMapsView }))
);



export const AppViews: React.FC<AppViewsProps> = React.memo(({
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
  importGoogleEvents,
  bulkUpdateEvents,
  googleSyncStatus,
  lastGoogleSync,
  onManualGoogleSync,
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

      {/* Visões Secundárias Carregadas Sob Demanda (Code Splitting) */}
      <Suspense fallback={<ViewLoadingFallback />}>
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
            onImportGoogleEvents={importGoogleEvents}
            onBulkUpdateEvents={bulkUpdateEvents}
            googleSyncStatus={googleSyncStatus}
            lastGoogleSync={lastGoogleSync}
            onManualSync={onManualGoogleSync}
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

        {/* Visão 8: Flashcards & Repetição Espaçada */}
        {currentView === 'flashcards' && (
          <FlashcardsView
            projects={projects}
            onOpenTimerTab={() => setCurrentView('timer')}
          />
        )}

        {/* Visão 9: Mapas Mentais Interativos */}
        {currentView === 'mindmaps' && (
          <MindMapsView
            projects={projects}
            onOpenTimerTab={() => setCurrentView('timer')}
          />
        )}
      </Suspense>
    </>
  );
});
