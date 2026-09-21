import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { storageFlashcardsService } from '@/features/flashcards/api/storageFlashcards';
import { FlashcardDeck, Flashcard } from '@/features/core/types';

vi.mock('@/features/flashcards/api/storageFlashcards', () => ({
  storageFlashcardsService: {
    getDecksWithStats: vi.fn(() => []),
    getLocalCards: vi.fn(() => []),
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    recordReview: vi.fn(),
    importCardsFromText: vi.fn(),
    exportDeckToJSON: vi.fn(),
  }
}));

describe('useFlashcards Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar baralhos e cartas inicialmente', () => {
    const mockDecks: FlashcardDeck[] = [
      { id: 'd-1', title: 'React', description: '', color: '#000', due_count: 5, created_at: '', updated_at: '' }
    ];
    const mockCards: Flashcard[] = [
      { id: 'c-1', deck_id: 'd-1', front: 'A', back: 'B', tags: [], created_at: '', updated_at: '' }
    ];
    
    vi.mocked(storageFlashcardsService.getDecksWithStats).mockReturnValue(mockDecks);
    vi.mocked(storageFlashcardsService.getLocalCards).mockReturnValue(mockCards);
    
    const { result } = renderHook(() => useFlashcards());
    
    expect(result.current.decks).toEqual(mockDecks);
    expect(result.current.cards).toEqual(mockCards);
    expect(result.current.dueCardsCount).toBe(5);
    expect(result.current.totalCardsCount).toBe(1);
  });

  it('deve selecionar um deck ativo e calcular cartas dele', () => {
    const mockDecks = [{ id: 'd-1' } as FlashcardDeck];
    const mockCards = [{ id: 'c-1', deck_id: 'd-1' } as Flashcard, { id: 'c-2', deck_id: 'd-2' } as Flashcard];
    
    vi.mocked(storageFlashcardsService.getDecksWithStats).mockReturnValue(mockDecks);
    vi.mocked(storageFlashcardsService.getLocalCards).mockReturnValue(mockCards);
    
    const { result } = renderHook(() => useFlashcards());
    
    act(() => {
      result.current.setActiveDeckId('d-1');
    });
    
    expect(result.current.activeDeck?.id).toBe('d-1');
    expect(result.current.activeDeckCards.length).toBe(1);
    expect(result.current.activeDeckCards[0].id).toBe('c-1');
  });

  it('deve abrir e fechar os modais', () => {
    const { result } = renderHook(() => useFlashcards());
    
    expect(result.current.isStudyModalOpen).toBe(false);
    expect(result.current.isDeckModalOpen).toBe(false);
    
    act(() => {
      result.current.openStudyModal('d-1');
    });
    expect(result.current.isStudyModalOpen).toBe(true);
    expect(result.current.activeDeckId).toBe('d-1');
    
    act(() => {
      result.current.closeStudyModal();
    });
    expect(result.current.isStudyModalOpen).toBe(false);
    
    act(() => {
      result.current.openCreateDeckModal();
    });
    expect(result.current.isDeckModalOpen).toBe(true);
    expect(result.current.editingDeck).toBeNull();
    
    act(() => {
      result.current.closeDeckModal();
    });
    expect(result.current.isDeckModalOpen).toBe(false);
  });

  it('deve criar e atualizar um deck delegando para o storage service', () => {
    const { result } = renderHook(() => useFlashcards());
    
    const mockNewDeck = { id: 'd-2', title: 'New' } as FlashcardDeck;
    vi.mocked(storageFlashcardsService.createDeck).mockReturnValue(mockNewDeck);
    
    let created: any;
    act(() => {
      created = result.current.createDeck({ title: 'New', description: '', color: '' });
    });
    
    expect(storageFlashcardsService.createDeck).toHaveBeenCalled();
    expect(created).toEqual(mockNewDeck);
    
    act(() => {
      result.current.updateDeck('d-2', { title: 'Updated' });
    });
    expect(storageFlashcardsService.updateDeck).toHaveBeenCalledWith('d-2', { title: 'Updated' });
  });

  it('deve criar uma carta', () => {
    const { result } = renderHook(() => useFlashcards());
    
    act(() => {
      result.current.createCard('d-1', 'Front', 'Back');
    });
    
    expect(storageFlashcardsService.createCard).toHaveBeenCalledWith('d-1', 'Front', 'Back', undefined, undefined);
  });

  it('deve registrar uma revisão de carta', () => {
    const { result } = renderHook(() => useFlashcards());
    
    act(() => {
      result.current.recordReview('c-1', 4);
    });
    
    expect(storageFlashcardsService.recordReview).toHaveBeenCalledWith('c-1', 4);
  });

  it('deve deletar deck', () => {
    const { result } = renderHook(() => useFlashcards());
    
    act(() => {
      result.current.deleteDeck('d-1');
    });
    
    expect(storageFlashcardsService.deleteDeck).toHaveBeenCalledWith('d-1');
  });

  it('deve importar e exportar', () => {
    const { result } = renderHook(() => useFlashcards());
    
    vi.mocked(storageFlashcardsService.importCardsFromText).mockReturnValue(5);
    vi.mocked(storageFlashcardsService.exportDeckToJSON).mockReturnValue('{"cards":[]}');
    
    let count = 0;
    act(() => {
      count = result.current.importCards('d-1', 'Q;A');
    });
    expect(count).toBe(5);
    expect(storageFlashcardsService.importCardsFromText).toHaveBeenCalled();
    
    let json = '';
    act(() => {
      json = result.current.exportDeck('d-1');
    });
    expect(json).toBe('{"cards":[]}');
    expect(storageFlashcardsService.exportDeckToJSON).toHaveBeenCalled();
  });
});
