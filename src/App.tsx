import React from 'react';
import { Header } from '@/features/core/components/Header';
import { Sidebar } from '@/features/core/components/Sidebar';
import { AppViews } from '@/features/core/components/AppViews';
import { AppModals } from '@/features/core/components/AppModals';
import { VoiceAgentButton, VoiceAgentWidget } from '@/features/voice-agent';
import { useAppController } from '@/features/core/hooks/useAppController';

export const App: React.FC = () => {
  const {
    colorMode, toggleColorMode,
    ambient, setAmbient, ambientVolume, setAmbientVolume, playClick, playAlarm,
    settings, handleUpdateSettings,
    nav, handleSelectProject,
    projectsHook,
    calendarHook,
    quotesHook,
    statsHook,
    timerWithFlush,
    authAndSync,
    voiceAgent
  } = useAppController();

  return (
    <div className="app-shell">
      <Sidebar
        currentView={nav.currentView}
        onChangeView={nav.setCurrentView}
        streakDays={statsHook.metrics.streak.currentStreak}
        projects={projectsHook.projects}
        selectedProjectId={projectsHook.activeProject?.id || 'todos'}
        onSelectProject={handleSelectProject}
        onOpenProjectDetail={nav.handleOpenProjectDetail}
        onCreateProject={() => nav.setCurrentView('projects')}
        colorMode={colorMode}
        onToggleColorMode={toggleColorMode}
        ambientSound={ambient}
        ambientVolume={ambientVolume}
        onSelectAmbient={setAmbient}
        onSetAmbientVolume={setAmbientVolume}
        userProfile={authAndSync.userProfile}
        onGoogleLogin={authAndSync.handleGoogleLogin}
        onSignOut={authAndSync.handleSignOut}
        onOpenSettings={() => nav.handleOpenSettings('timer', playClick)}
        onOpenStats={() => nav.setCurrentView('stats')}
        onToggleScratchpad={() => nav.setIsScratchpadOpen((prev) => !prev)}
        onEnterZenMode={() => nav.setIsZenModeOpen(true)}
        isCollapsed={nav.isSidebarCollapsed}
        onToggleCollapse={nav.handleToggleSidebarCollapse}
        isMobileOpen={nav.isMobileSidebarOpen}
        onCloseMobile={() => nav.setIsMobileSidebarOpen(false)}
      />

      <div className={`app-main-layout ${nav.isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          streakDays={statsHook.metrics.streak.currentStreak}
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
          userProfile={authAndSync.userProfile}
          onGoogleLogin={authAndSync.handleGoogleLogin}
          onSignOut={authAndSync.handleSignOut}
          onOpenSettings={() => nav.handleOpenSettings('timer', playClick)}
          onOpenStats={() => nav.setCurrentView('stats')}
          onOpenCommandPalette={() => nav.setIsCommandPaletteOpen(true)}
          currentView={nav.currentView}
          onOpenMobileSidebar={() => nav.setIsMobileSidebarOpen(true)}
          isTimerRunning={timerWithFlush.isRunning}
          timerFormattedTime={timerWithFlush.formattedTime}
          activeTaskTitle={projectsHook.activeSubtask?.title}
          activeProjectTitle={projectsHook.activeProject?.title}
          onOpenTimerTab={() => nav.setCurrentView('timer')}
          syncInfo={authAndSync.syncInfo}
          onManualSync={authAndSync.handleManualSync}
        />

        <main className={`app-container view-${nav.currentView}`}>
          <AppViews
            currentView={nav.currentView}
            setCurrentView={nav.setCurrentView}
            activeQuote={quotesHook.activeQuote}
            getRandomQuote={quotesHook.getRandomQuote}
            addMantra={quotesHook.addMantra}
            isRotating={quotesHook.isRotating}
            timer={timerWithFlush}
            activeSubtask={projectsHook.activeSubtask}
            activeProject={projectsHook.activeProject}
            playClick={playClick}
            projects={projectsHook.projects}
            subtasks={projectsHook.subtasks}
            activeSubtaskId={projectsHook.activeSubtaskId}
            setActiveSubtaskId={projectsHook.setActiveSubtaskId}
            selectedProjectDetailId={nav.selectedProjectDetailId}
            onOpenProjectDetail={nav.handleOpenProjectDetail}
            onBackFromProjectDetail={nav.handleBackFromProjectDetail}
            createProject={projectsHook.createProject}
            updateProject={projectsHook.updateProject}
            deleteProject={projectsHook.deleteProject}
            onCreateSubtask={projectsHook.createSubtask}
            onUpdateSubtask={projectsHook.updateSubtask}
            onDeleteSubtask={projectsHook.deleteSubtask}
            onToggleSubtaskCompleted={projectsHook.toggleSubtaskCompleted}
            events={calendarHook.events}
            selectedDate={calendarHook.selectedDate}
            setSelectedDate={calendarHook.setSelectedDate}
            calendarView={calendarHook.calendarView}
            setCalendarView={calendarHook.setCalendarView}
            addEvent={calendarHook.addEvent}
            updateEvent={calendarHook.updateEvent}
            deleteEvent={calendarHook.deleteEvent}
            toggleEventCompleted={calendarHook.toggleEventCompleted}
            importGoogleEvents={calendarHook.importGoogleEvents}
            bulkUpdateEvents={calendarHook.bulkUpdateEvents}
            googleSyncStatus={calendarHook.googleSyncStatus}
            lastGoogleSync={calendarHook.lastGoogleSync}
            onManualGoogleSync={calendarHook.pullFromGoogle}
            outlookSyncStatus={calendarHook.outlookSyncStatus}
            lastOutlookSync={calendarHook.lastOutlookSync}
            onManualOutlookSync={calendarHook.pullFromOutlook}
            availableOutlookCalendars={calendarHook.availableOutlookCalendars}
            selectedOutlookCalendars={calendarHook.selectedOutlookCalendars}
            toggleOutlookCalendarSelection={calendarHook.toggleOutlookCalendarSelection}
            userProfile={authAndSync.userProfile}
            weekMinutes={statsHook.metrics.weekMinutes}
            metrics={statsHook.metrics}
          />
        </main>
      </div>

      <AppModals
        isScratchpadOpen={nav.isScratchpadOpen}
        onCloseScratchpad={() => nav.setIsScratchpadOpen(false)}
        isSettingsOpen={nav.isSettingsOpen}
        onCloseSettings={() => nav.setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlayAlarm={playAlarm}
        userProfile={authAndSync.userProfile}
        settingsTab={nav.settingsTab}
        isZenModeOpen={nav.isZenModeOpen}
        onCloseZenMode={() => nav.setIsZenModeOpen(false)}
        timer={timerWithFlush}
        activeSubtask={projectsHook.activeSubtask}
        activeQuote={quotesHook.activeQuote}
        ambient={ambient}
        onToggleAmbient={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')}
        isCommandPaletteOpen={nav.isCommandPaletteOpen}
        onCloseCommandPalette={() => nav.setIsCommandPaletteOpen(false)}
        onNavigate={nav.setCurrentView}
        onOpenProjectDetail={nav.handleOpenProjectDetail}
        onOpenGroup={() => nav.setCurrentView('groups')}
        onOpenZenMode={() => nav.setIsZenModeOpen(true)}
        onOpenSettings={(tab) => nav.handleOpenSettings(tab, playClick)}
        onOpenStats={() => nav.setCurrentView('stats')}
        onToggleTheme={toggleColorMode}
        projects={projectsHook.projects}
      />

      <VoiceAgentButton
        status={voiceAgent.status}
        isOpen={voiceAgent.isOpen}
        onClick={() => voiceAgent.setIsOpen(!voiceAgent.isOpen)}
      />

      <VoiceAgentWidget
        isOpen={voiceAgent.isOpen}
        onClose={() => voiceAgent.setIsOpen(false)}
        status={voiceAgent.status}
        messages={voiceAgent.messages}
        transcript={voiceAgent.transcript}
        isMuted={voiceAgent.isMuted}
        onToggleMute={() => voiceAgent.setIsMuted(!voiceAgent.isMuted)}
        audioLevel={voiceAgent.audioLevel}
        onStartListening={voiceAgent.startListening}
        onStopListening={voiceAgent.stopListening}
        onSendMessage={voiceAgent.sendMessage}
        onClearHistory={voiceAgent.clearHistory}
        errorMessage={voiceAgent.errorMessage}
      />
    </div>
  );
};
