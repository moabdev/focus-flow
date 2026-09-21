import React from 'react';
import { FileText, LayoutGrid, Columns, Plus, Trash2 } from 'lucide-react';
import { Project, Subtask } from '@/features/core/types';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';
import { DraftCard } from './DraftCard';
import { DraftEditor } from './DraftEditor';
import { DraftsFilters } from './DraftsFilters';
import { useDrafts } from './useDrafts';

interface DraftsViewProps {
  projects: Project[];
  subtasks: Subtask[];
  onOpenTimerTab?: () => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({ projects = [], subtasks = [] }) => {
  const {
    notes,
    activeNote,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    selectedProjectFilter,
    setSelectedProjectFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    copiedId,
    noteToDelete,
    setNoteToDelete,
    isSaved,
    textareaRef,
    isSpeechSupported,
    isListening,
    toggleSpeech,
    handleCreateDraft,
    handleUpdateActiveNote,
    handleCopyNote,
    handleConfirmDelete,
    formatDate,
    getWordCount,
    sortedNotes,
    projectSubtasks,
  } = useDrafts(projects, subtasks);

  return (
    <div className="drafts-container">
      <div className="drafts-header-bar">
        <div className="drafts-title-row">
          <div className="drafts-title-icon-halo">
            <FileText size={22} color="var(--accent-primary)" />
          </div>
          <div className="drafts-title-text-group">
            <div className="drafts-title-headline-wrap">
              <h2 className="drafts-title-heading">Rascunhos & Anotações Rápidas</h2>
              <span className="drafts-stats-badge">
                <FileText size={13} /> {notes.length} {notes.length === 1 ? 'rascunho' : 'rascunhos'} ({notes.filter((n) => !!n.project_id).length} vinculados)
              </span>
            </div>
            <p className="drafts-title-desc">Ideias, resumos de estudo e insights vinculados aos seus projetos e subtarefas.</p>
          </div>
        </div>
        <div className="drafts-header-actions">
          <div className="drafts-view-toggle-group">
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} /> <span>Grade</span>
            </button>
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <Columns size={14} /> <span>Editor</span>
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-new-draft" onClick={handleCreateDraft}>
            <Plus size={16} /> <span>Novo Rascunho</span>
          </button>
        </div>
      </div>

      <DraftsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedProjectFilter={selectedProjectFilter}
        setSelectedProjectFilter={setSelectedProjectFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        projects={projects}
        totalNotes={notes.length}
        unassignedNotesCount={notes.filter((n) => !n.project_id).length}
        getProjectNoteCount={(projectId) => notes.filter((n) => n.project_id === projectId).length}
      />

      {viewMode === 'grid' && (
        <div className="drafts-grid">
          {sortedNotes.map((note) => (
            <DraftCard
              key={note.id}
              note={note}
              project={projects.find((p) => p.id === note.project_id)}
              subtask={subtasks.find((s) => s.id === note.subtask_id)}
              isCopied={copiedId === note.id}
              wordCount={getWordCount(note.content)}
              formatDate={formatDate}
              onClick={() => {
                setActiveNoteId(note.id);
                setViewMode('split');
              }}
              onCopy={handleCopyNote}
              onDelete={(note, e) => {
                e.stopPropagation();
                setNoteToDelete(note);
              }}
            />
          ))}
          {sortedNotes.length === 0 && (
            <div className="drafts-empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="drafts-empty-icon-halo">
                <FileText size={28} color="var(--accent-primary)" />
              </div>
              <h3>Nenhum rascunho encontrado</h3>
              <button type="button" className="btn btn-primary" onClick={handleCreateDraft}>
                <Plus size={15} /> <span>Criar Primeiro Rascunho</span>
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'split' && (
        <div className="drafts-split-layout">
          <div className="drafts-split-list-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-glass-subtle)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Rascunhos ({sortedNotes.length})
              </span>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }} onClick={handleCreateDraft}>
                <Plus size={13} /> <span>Novo</span>
              </button>
            </div>
            <div className="drafts-split-scroll">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`draft-split-item ${note.id === activeNote?.id ? 'active' : ''}`}
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <div className="draft-split-item-title">{note.title || 'Sem título'}</div>
                  <div className="draft-split-item-snippet">{note.content?.trim() || 'Rascunho vazio...'}</div>
                  <div className="draft-split-item-meta">
                    <span>{projects.find((p) => p.id === note.project_id)?.title || 'Geral'}</span>
                    <span>{formatDate(note.updated_at || note.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DraftEditor
            activeNote={activeNote}
            projects={projects}
            projectSubtasks={projectSubtasks}
            isSaved={isSaved}
            isSpeechSupported={isSpeechSupported}
            isListening={isListening}
            copiedId={copiedId}
            textareaRef={textareaRef}
            handleUpdateActiveNote={handleUpdateActiveNote}
            handleCreateDraft={handleCreateDraft}
            toggleSpeech={toggleSpeech}
            getWordCount={getWordCount}
            formatDate={formatDate}
            handleCopyNote={handleCopyNote}
            setNoteToDelete={setNoteToDelete}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Excluir Rascunho"
        message={<>Tem certeza que deseja excluir permanentemente o rascunho <strong>"{noteToDelete?.title}"</strong>?</>}
        confirmText="Excluir Rascunho"
        cancelText="Cancelar"
        variant="danger"
        confirmIcon={<Trash2 size={24} className="confirm-icon-danger" />}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};
