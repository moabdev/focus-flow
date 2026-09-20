import { useState, useCallback, useEffect, useMemo } from 'react';
import { Flashcard, FlashcardDeck, FlashcardReviewRating } from '../types';
import { storageFlashcardsService } from '../services/storageFlashcards';

export interface UseFlashcardsReturn {
  decks: FlashcardDeck[];
  cards: Flashcard[];
  activeDeckId: string | null;
  activeDeck: FlashcardDeck | null;
  activeDeckCards: Flashcard[];
  dueCardsCount: number;
  totalCardsCount: number;
  isStudyModalOpen: boolean;
  isDeckModalOpen: boolean;
  editingDeck: FlashcardDeck | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProjectId: string | 'all';
  setSelectedProjectId: (id: string | 'all') => void;
  // Ações
  setActiveDeckId: (id: string | null) => void;
  openStudyModal: (deckId: string) => void;
  closeStudyModal: () => void;
  openCreateDeckModal: () => void;
  openEditDeckModal: (deck: FlashcardDeck) => void;
  closeDeckModal: () => void;
  createDeck: (data: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>) => FlashcardDeck;
  updateDeck: (id: string, updates: Partial<Omit<FlashcardDeck, 'id' | 'created_at'>>) => FlashcardDeck | null;
  deleteDeck: (id: string) => void;
  createCard: (deckId: string, front: string, back: string, hint?: string, tags?: string[]) => Flashcard;
  updateCard: (id: string, updates: Partial<Flashcard>) => Flashcard | null;
  deleteCard: (id: string) => void;
  recordReview: (cardId: string, rating: FlashcardReviewRating) => Flashcard | null;
  importCards: (deckId: string, rawText: string) => number;
  exportDeck: (deckId: string) => string;
  refresh: () => void;
}

export const useFlashcards = (): UseFlashcardsReturn => {
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => storageFlashcardsService.getDecksWithStats());
  const [cards, setCards] = useState<Flashcard[]>(() => storageFlashcardsService.getLocalCards());
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');

  const refresh = useCallback(() => {
    setDecks(storageFlashcardsService.getDecksWithStats());
    setCards(storageFlashcardsService.getLocalCards());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeDeck = useMemo(() => {
    if (!activeDeckId) return null;
    return decks.find((d) => d.id === activeDeckId) || null;
  }, [decks, activeDeckId]);

  const activeDeckCards = useMemo(() => {
    if (!activeDeckId) return [];
    return cards.filter((c) => c.deck_id === activeDeckId);
  }, [cards, activeDeckId]);

  const totalCardsCount = useMemo(() => cards.length, [cards]);
  const dueCardsCount = useMemo(() => {
    return decks.reduce((acc, d) => acc + (d.due_count || 0), 0);
  }, [decks]);

  const openStudyModal = useCallback((deckId: string) => {
    setActiveDeckId(deckId);
    setIsStudyModalOpen(true);
  }, []);

  const closeStudyModal = useCallback(() => {
    setIsStudyModalOpen(false);
    refresh();
  }, [refresh]);

  const openCreateDeckModal = useCallback(() => {
    setEditingDeck(null);
    setIsDeckModalOpen(true);
  }, []);

  const openEditDeckModal = useCallback((deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setIsDeckModalOpen(true);
  }, []);

  const closeDeckModal = useCallback(() => {
    setIsDeckModalOpen(false);
    setEditingDeck(null);
    refresh();
  }, [refresh]);

  const handleCreateDeck = useCallback(
    (data: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>) => {
      const created = storageFlashcardsService.createDeck(data);
      refresh();
      return created;
    },
    [refresh]
  );

  const handleUpdateDeck = useCallback(
    (id: string, updates: Partial<Omit<FlashcardDeck, 'id' | 'created_at'>>) => {
      const updated = storageFlashcardsService.updateDeck(id, updates);
      refresh();
      return updated;
    },
    [refresh]
  );

  const handleDeleteDeck = useCallback(
    (id: string) => {
      storageFlashcardsService.deleteDeck(id);
      if (activeDeckId === id) setActiveDeckId(null);
      refresh();
    },
    [activeDeckId, refresh]
  );

  const handleCreateCard = useCallback(
    (deckId: string, front: string, back: string, hint?: string, tags?: string[]) => {
      const newCard = storageFlashcardsService.createCard(deckId, front, back, hint, tags);
      refresh();
      return newCard;
    },
    [refresh]
  );

  const handleUpdateCard = useCallback(
    (id: string, updates: Partial<Flashcard>) => {
      const updated = storageFlashcardsService.updateCard(id, updates);
      refresh();
      return updated;
    },
    [refresh]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      storageFlashcardsService.deleteCard(id);
      refresh();
    },
    [refresh]
  );

  const handleRecordReview = useCallback(
    (cardId: string, rating: FlashcardReviewRating) => {
      const updated = storageFlashcardsService.recordReview(cardId, rating);
      refresh();
      return updated;
    },
    [refresh]
  );

  const handleImportCards = useCallback(
    (deckId: string, rawText: string) => {
      const count = storageFlashcardsService.importCardsFromText(deckId, rawText);
      refresh();
      return count;
    },
    [refresh]
  );

  const handleExportDeck = useCallback((deckId: string) => {
    return storageFlashcardsService.exportDeckToJSON(deckId);
  }, []);

  return {
    decks,
    cards,
    activeDeckId,
    activeDeck,
    activeDeckCards,
    dueCardsCount,
    totalCardsCount,
    isStudyModalOpen,
    isDeckModalOpen,
    editingDeck,
    searchQuery,
    setSearchQuery,
    selectedProjectId,
    setSelectedProjectId,
    setActiveDeckId,
    openStudyModal,
    closeStudyModal,
    openCreateDeckModal,
    openEditDeckModal,
    closeDeckModal,
    createDeck: handleCreateDeck,
    updateDeck: handleUpdateDeck,
    deleteDeck: handleDeleteDeck,
    createCard: handleCreateCard,
    updateCard: handleUpdateCard,
    deleteCard: handleDeleteCard,
    recordReview: handleRecordReview,
    importCards: handleImportCards,
    exportDeck: handleExportDeck,
    refresh,
  };
};
