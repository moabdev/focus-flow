import { useState, useEffect, useRef, useCallback } from 'react';
import { storageService } from '@/features/core/api/storage';
import { QuickNote, Project, Subtask } from '@/features/core/types';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';

export const useScratchpad = (isOpen: boolean, onClose: () => void, projects: Project[] = [], subtasks: Subtask[] = []) => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = storageService.getQuickNotes();
      setNotes(loaded);
      if (loaded.length > 0) {
        setActiveNoteId((prev) => (loaded.some((n) => n.id === prev) ? prev : loaded[0].id));
      }
    }
  }, [isOpen]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal || !transcript.trim() || !activeNote) return;

      const textarea = textareaRef.current;
      const cleanTranscript = transcript.trim();
      const prev = activeNote.content || '';
      let newContent = '';

      if (textarea) {
        const start = textarea.selectionStart ?? prev.length;
        const end = textarea.selectionEnd ?? prev.length;
        const before = prev.substring(0, start);
        const after = prev.substring(end);
        const needSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
        const prefix = needSpaceBefore ? ' ' : '';
        newContent = `${before}${prefix}${cleanTranscript} ${after}`;

        setTimeout(() => {
          if (textareaRef.current) {
            const nextCursor = start + prefix.length + cleanTranscript.length + 1;
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
            textareaRef.current.focus();
          }
        }, 25);
      } else {
        const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
        newContent = `${prev}${needSpace ? ' ' : ''}${cleanTranscript} `;
      }

      storageService.updateQuickNote(activeNote.id, { content: newContent });
      setNotes(storageService.getQuickNotes());
      setIsSaved(true);
    },
    [activeNote]
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    interimTranscript,
    errorMessage: speechError,
    toggleListening: toggleSpeech,
    stopListening: stopSpeech,
  } = useSpeechRecognition({
    lang: 'pt-BR',
    continuous: true,
    interimResults: true,
    onResult: handleSpeechResult,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSpeech]);

  const handleCloseDrawer = () => {
    if (isListening) stopSpeech();
    onClose();
  };

  const handleCreateNote = () => {
    const newNote = storageService.createQuickNote({
      title: 'Novo Rascunho',
      content: '',
      project_id: null,
      subtask_id: null,
    });
    const updated = storageService.getQuickNotes();
    setNotes(updated);
    setActiveNoteId(newNote.id);
  };

  const handleTitleChange = (newTitle: string) => {
    if (!activeNote) return;
    storageService.updateQuickNote(activeNote.id, { title: newTitle });
    setNotes(storageService.getQuickNotes());
  };

  const handleContentChange = (newVal: string) => {
    if (!activeNote) return;
    setIsSaved(false);
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, content: newVal } : n)));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      storageService.updateQuickNote(activeNote.id, { content: newVal });
      setIsSaved(true);
    }, 400);
  };

  const handleProjectChange = (projId: string) => {
    if (!activeNote) return;
    const pid = projId === '' ? null : projId;
    storageService.updateQuickNote(activeNote.id, { project_id: pid, subtask_id: null });
    setNotes(storageService.getQuickNotes());
  };

  const handleSubtaskChange = (subId: string) => {
    if (!activeNote) return;
    const sid = subId === '' ? null : subId;
    storageService.updateQuickNote(activeNote.id, { subtask_id: sid });
    setNotes(storageService.getQuickNotes());
  };

  const handleDeleteNote = (id: string) => {
    storageService.deleteQuickNote(id);
    const remaining = storageService.getQuickNotes();
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining[0]?.id || null);
    }
    setConfirmDeleteId(null);
  };

  const handleCopyNote = () => {
    if (!activeNote?.content) return;
    navigator.clipboard?.writeText(activeNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const availableSubtasks = activeNote?.project_id ? subtasks.filter((s) => s.project_id === activeNote.project_id) : subtasks;

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return {
    notes,
    filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    isSaved,
    copied,
    searchQuery,
    setSearchQuery,
    confirmDeleteId,
    setConfirmDeleteId,
    textareaRef,
    isSpeechSupported,
    isListening,
    interimTranscript,
    speechError,
    toggleSpeech,
    stopSpeech,
    handleCloseDrawer,
    handleCreateNote,
    handleTitleChange,
    handleContentChange,
    handleProjectChange,
    handleSubtaskChange,
    handleDeleteNote,
    handleCopyNote,
    availableSubtasks,
  };
};
