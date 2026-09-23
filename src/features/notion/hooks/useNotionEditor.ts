import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/features/core/contexts/ToastContext';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';
import { generateFlashcardsFromNotes, generateQuizFromNotes, GeneratedFlashcard, GeneratedQuiz } from '@/services/ai/geminiService';
import { Subtask, Project } from '@/features/core/types';

interface UseNotionEditorProps {
  subtask: Subtask | null;
  project?: Project | null;
  onSaveNotes: (subtaskId: string, notes: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function useNotionEditor({ subtask, project, onSaveNotes, isOpen, onClose }: UseNotionEditorProps) {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [saveIndicator, setSaveIndicator] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz>([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const { createCard, decks, createDeck } = useFlashcards();
  const toast = useToast();

  useEffect(() => {
    if (subtask) setContent(subtask.notes || '');
  }, [subtask]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!content.trim()) {
      toast.warning('A anotação está vazia. Adicione conteúdo para gerar o quiz.', 'Anotação Vazia');
      return;
    }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Chave de API do Gemini não configurada pelo desenvolvedor (VITE_GEMINI_API_KEY).', 'Falta API Key');
      return;
    }
    setIsGeneratingQuiz(true);
    toast.info('Gerando quiz inteligente...', 'Gerando...');
    try {
      const q = await generateQuizFromNotes(content, apiKey, 5);
      setGeneratedQuiz(q);
      setIsQuizModalOpen(true);
      toast.success(`Quiz gerado com sucesso!`, 'Concluído');
    } catch (error: any) {
      toast.error(`Falha ao gerar quiz: ${error.message}`, 'Erro na IA');
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [content, toast]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!content.trim()) {
      toast.warning('A anotação está vazia. Adicione conteúdo para gerar flashcards.', 'Anotação Vazia');
      return;
    }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Chave de API do Gemini não configurada pelo desenvolvedor (VITE_GEMINI_API_KEY).', 'Falta API Key');
      return;
    }
    setIsGenerating(true);
    toast.info('Gerando flashcards com Inteligência Artificial...', 'Gerando...');
    try {
      const cards = await generateFlashcardsFromNotes(content, apiKey, 5);
      setGeneratedFlashcards(cards);
      setIsAIModalOpen(true);
      toast.success(`${cards.length} flashcards gerados com sucesso!`, 'Concluído');
    } catch (error: any) {
      toast.error(`Falha ao gerar flashcards: ${error.message}`, 'Erro na IA');
    } finally {
      setIsGenerating(false);
    }
  }, [content, toast]);

  useEffect(() => {
    const handleEvent = () => handleGenerateFlashcards();
    const handleQuizEvent = () => handleGenerateQuiz();
    window.addEventListener('generate-ai-flashcards', handleEvent);
    window.addEventListener('generate-ai-quiz', handleQuizEvent);
    return () => {
      window.removeEventListener('generate-ai-flashcards', handleEvent);
      window.removeEventListener('generate-ai-quiz', handleQuizEvent);
    };
  }, [handleGenerateFlashcards, handleGenerateQuiz]);

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    if (subtask) {
      onSaveNotes(subtask.id, newVal);
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 1500);
    }
  };

  const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
    if (!isFinal || !transcript.trim() || !subtask) return;
    const textarea = textareaRef.current;
    const cleanTranscript = transcript.trim();
    setContent((prev) => {
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
      onSaveNotes(subtask.id, newContent);
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 1500);
      return newContent;
    });
  }, [subtask, onSaveNotes]);

  const speech = useSpeechRecognition({
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
        speech.toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, speech.toggleListening]);

  const handleClose = () => {
    if (speech.isListening) speech.stopListening();
    onClose();
  };

  const handleSaveAIFlashcards = async (selectedCards: GeneratedFlashcard[]) => {
    if (selectedCards.length === 0) {
      setIsAIModalOpen(false);
      return;
    }
    try {
      let targetDeckId = '';
      const projDeck = decks.find(d => d.project_id === subtask?.project_id);
      if (projDeck) {
        targetDeckId = projDeck.id;
      } else {
        const deckTitle = project ? `Anotações: ${project.title}` : 'Anotações Gerais';
        const newDeck = createDeck({
          title: deckTitle,
          description: 'Flashcards gerados automaticamente por IA a partir das anotações.',
          color: project ? project.color : '#3b82f6',
          icon: '✨',
          project_id: subtask?.project_id || undefined,
          tags: ['IA', 'Anotações'],
        });
        targetDeckId = newDeck.id;
      }
      for (const card of selectedCards) {
        createCard(targetDeckId, card.front, card.back, card.hint, card.tags);
      }
      toast.success(`${selectedCards.length} flashcards salvos no baralho com sucesso!`, 'Salvo!');
      setIsAIModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar os flashcards no baralho.', 'Erro de Salvamento');
    }
  };

  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !subtask) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const before = content.substring(0, start);
    const after = content.substring(end);

    const inserted = `${prefix}${selectedText}${suffix}`;
    const newContent = `${before}${inserted}${after}`;

    setContent(newContent);
    onSaveNotes(subtask.id, newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  return {
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
  };
}
