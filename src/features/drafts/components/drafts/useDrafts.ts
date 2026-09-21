import { useState, useEffect, useRef, useCallback } from 'react';
import { storageService } from '@/features/core/api/storage';
import { QuickNote, Project, Subtask } from '@/features/core/types';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';
import { useToast } from '@/features/core/contexts/ToastContext';

export const useDrafts = (projects: Project[], subtasks: Subtask[]) => {
  const [notes, setNotes] = useState<QuickNote[]>(() => storageService.getQuickNotes());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<QuickNote | null>(null);
  const [isSaved, setIsSaved] = useState(true);

  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshNotes = useCallback(() => {
    const loaded = storageService.getQuickNotes();
    setNotes(loaded);
    if (loaded.length > 0 && (!activeNoteId || !loaded.some((n) => n.id === activeNoteId))) {
      setActiveNoteId(loaded[0].id);
    }
  }, [activeNoteId]);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

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
        const needSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
        newContent = `${before}${needSpace ? ' ' : ''}${cleanTranscript} ${after}`;
        setTimeout(() => {
          if (textareaRef.current) {
            const nextCursor = start + (needSpace ? 1 : 0) + cleanTranscript.length + 1;
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
            textareaRef.current.focus();
          }
        }, 25);
      } else {
        const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
        newContent = `${prev}${needSpace ? ' ' : ''}${cleanTranscript} `;
      }
      storageService.updateQuickNote(activeNote.id, { content: newContent });
      refreshNotes();
      setIsSaved(true);
      toast.info('Texto inserido via ditado por voz.', 'Ditado');
    },
    [activeNote, refreshNotes, toast]
  );

  const { isSupported: isSpeechSupported, isListening, toggleListening: toggleSpeech } = useSpeechRecognition({
    lang: 'pt-BR',
    continuous: true,
    interimResults: true,
    onResult: handleSpeechResult,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSpeech]);

  const handleCreateDraft = () => {
    const newNote = storageService.createQuickNote({
      title: 'Novo Rascunho',
      content: '',
      project_id: selectedProjectFilter !== 'todos' && selectedProjectFilter !== 'sem-projeto' ? selectedProjectFilter : null,
      subtask_id: null,
    });
    refreshNotes();
    setActiveNoteId(newNote.id);
    setViewMode('split');
    toast.success('Novo rascunho criado com sucesso!', 'Rascunho Criado');
  };

  const handleUpdateActiveNote = (updates: Partial<QuickNote>) => {
    if (!activeNote) return;
    setIsSaved(false);
    storageService.updateQuickNote(activeNote.id, updates);
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)));
    setTimeout(() => setIsSaved(true), 300);
  };

  const handleCopyNote = (note: QuickNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      navigator.clipboard.writeText(note.content || note.title);
      setCopiedId(note.id);
      toast.success(`Rascunho "${note.title}" copiado para a área de transferência!`, 'Copiado');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('Não foi possível copiar para a área de transferência.', 'Erro');
    }
  };

  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    storageService.deleteQuickNote(noteToDelete.id);
    const title = noteToDelete.title;
    setNoteToDelete(null);
    refreshNotes();
    toast.info(`Rascunho "${title}" excluído.`, 'Rascunho Excluído');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const isToday = d.toDateString() === new Date().toDateString();
      if (isToday) return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getWordCount = (text?: string) => (text && text.trim() ? text.trim().split(/\s+/).length : 0);

  const filteredNotes = notes.filter((note) => {
    if (selectedProjectFilter === 'sem-projeto' && note.project_id) return false;
    if (selectedProjectFilter !== 'todos' && selectedProjectFilter !== 'sem-projeto' && note.project_id !== selectedProjectFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (note.title || '').toLowerCase().includes(q) || (note.content || '').toLowerCase().includes(q);
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    return new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime();
  });

  const projectSubtasks = subtasks.filter((s) => s.project_id === activeNote?.project_id);

  return {
    notes,
    activeNote,
    activeNoteId,
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
  };
};
