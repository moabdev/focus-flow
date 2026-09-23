import '../styles/notion.css';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Subtask, Project } from '@/features/core/types';
import { NotionToolbar } from './notion/NotionToolbar';
import { NotionMarkdownRenderer } from './notion/NotionMarkdownRenderer';
import { NotionEditorHeader } from './notion/NotionEditorHeader';
import { NotionDictationBanner } from './notion/NotionDictationBanner';
import { AIGenerateFlashcardsModal } from './notion/AIGenerateFlashcardsModal';
import { AIGenerateQuizModal } from './notion/AIGenerateQuizModal';
import { useNotionEditor } from '../hooks/useNotionEditor';

interface NotionNoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  subtask: Subtask | null;
  project?: Project | null;
  onSaveNotes: (subtaskId: string, notes: string) => void;
}

export const NotionNoteEditor: React.FC<NotionNoteEditorProps> = ({
  isOpen,
  onClose,
  subtask,
  project,
  onSaveNotes,
}) => {
  const {
    content,
    handleContentChange,
    viewMode,
    setViewMode,
    saveIndicator,
    textareaRef,
    isGenerating,
    generatedFlashcards,
    isAIModalOpen,
    setIsAIModalOpen,
    isGeneratingQuiz,
    generatedQuiz,
    isQuizModalOpen,
    setIsQuizModalOpen,
    speech,
    handleClose,
    handleSaveAIFlashcards,
    insertTextAtCursor,
  } = useNotionEditor({
    subtask,
    project,
    onSaveNotes,
    isOpen,
    onClose,
  });

  if (!isOpen || !subtask) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-box notion-editor-modal"
        style={{ maxWidth: '840px', height: '85vh', maxHeight: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <NotionEditorHeader
          project={project}
          subtask={subtask}
          saveIndicator={saveIndicator}
          onClose={handleClose}
        />

        <NotionToolbar
          onInsertText={insertTextAtCursor}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isListening={speech.isListening}
          onToggleSpeech={speech.toggleListening}
          isSpeechSupported={speech.isSupported}
        />

        <NotionDictationBanner
          isListening={speech.isListening}
          interimTranscript={speech.interimTranscript}
          onStopSpeech={speech.stopListening}
        />

        {speech.errorMessage && (
          <div className="notion-speech-error">
            <AlertCircle size={14} />
            <span>{speech.errorMessage}</span>
          </div>
        )}

        <div className={`notion-editor-body view-${viewMode}`}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="notion-pane editor-pane">
              <textarea
                ref={textareaRef}
                className="notion-textarea"
                placeholder="Comece a digitar suas anotações ou digite # para títulos, - [ ] para tarefas..."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="notion-pane preview-pane">
              <NotionMarkdownRenderer
                content={content}
                onContentChange={handleContentChange}
              />
            </div>
          )}
        </div>
      </div>

      <AIGenerateFlashcardsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        flashcards={generatedFlashcards}
        onSave={handleSaveAIFlashcards}
        isSaving={false}
      />
      <AIGenerateQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        quiz={generatedQuiz}
      />
    </div>
  );
};
