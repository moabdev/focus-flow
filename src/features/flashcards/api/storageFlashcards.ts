import { Flashcard, FlashcardDeck, FlashcardReviewRating } from '@/features/core/types';
import { STORAGE_KEYS, DEFAULT_FLASHCARD_DECKS, DEFAULT_FLASHCARDS } from '@/features/core/api/storageDefaults';
import { calculateNextReview, createDefaultCard, filterDueCards, isCardDue } from '@/features/flashcards/api/spacedRepetition';

export class StorageFlashcardsService {
  // ----------------------------------------------------------------------------
  // Baralhos (Decks)
  // ----------------------------------------------------------------------------

  public getLocalDecks(): FlashcardDeck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARD_DECKS);
      if (!data) {
        this.saveLocalDecks(DEFAULT_FLASHCARD_DECKS);
        return DEFAULT_FLASHCARD_DECKS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Falha ao ler flashcard decks do localStorage', e);
      return DEFAULT_FLASHCARD_DECKS;
    }
  }

  public saveLocalDecks(decks: FlashcardDeck[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
    } catch (e) {
      console.error('Falha ao salvar flashcard decks no localStorage', e);
    }
  }

  // ----------------------------------------------------------------------------
  // Cartões (Cards)
  // ----------------------------------------------------------------------------

  public getLocalCards(): Flashcard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
      if (!data) {
        this.saveLocalCards(DEFAULT_FLASHCARDS);
        return DEFAULT_FLASHCARDS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Falha ao ler flashcards do localStorage', e);
      return DEFAULT_FLASHCARDS;
    }
  }

  public saveLocalCards(cards: Flashcard[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
    } catch (e) {
      console.error('Falha ao salvar flashcards no localStorage', e);
    }
  }

  // ----------------------------------------------------------------------------
  // Consultas e Estatísticas
  // ----------------------------------------------------------------------------

  public getDecksWithStats(): FlashcardDeck[] {
    const decks = this.getLocalDecks();
    const cards = this.getLocalCards();
    const now = new Date();

    return decks.map((deck) => {
      const deckCards = cards.filter((c) => c.deck_id === deck.id);
      const dueCards = deckCards.filter((c) => isCardDue(c, now));
      return {
        ...deck,
        card_count: deckCards.length,
        due_count: dueCards.length,
      };
    });
  }

  public getCardsForDeck(deckId: string): Flashcard[] {
    const cards = this.getLocalCards();
    return cards.filter((c) => c.deck_id === deckId);
  }

  public getDueCardsForDeck(deckId: string): Flashcard[] {
    const cards = this.getCardsForDeck(deckId);
    return filterDueCards(cards);
  }

  public getAllDueCards(): Flashcard[] {
    const cards = this.getLocalCards();
    return filterDueCards(cards);
  }

  // ----------------------------------------------------------------------------
  // CRUD de Baralhos
  // ----------------------------------------------------------------------------

  public createDeck(data: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>): FlashcardDeck {
    const decks = this.getLocalDecks();
    const now = new Date().toISOString();
    const newDeck: FlashcardDeck = {
      ...data,
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    decks.unshift(newDeck);
    this.saveLocalDecks(decks);
    return newDeck;
  }

  public updateDeck(id: string, updates: Partial<Omit<FlashcardDeck, 'id' | 'created_at'>>): FlashcardDeck | null {
    const decks = this.getLocalDecks();
    const index = decks.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const updatedDeck: FlashcardDeck = {
      ...decks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    decks[index] = updatedDeck;
    this.saveLocalDecks(decks);
    return updatedDeck;
  }

  public deleteDeck(deckId: string): void {
    // Remove o baralho
    const decks = this.getLocalDecks().filter((d) => d.id !== deckId);
    this.saveLocalDecks(decks);

    // Remove todos os cartões vinculados a este baralho
    const cards = this.getLocalCards().filter((c) => c.deck_id !== deckId);
    this.saveLocalCards(cards);
  }

  // ----------------------------------------------------------------------------
  // CRUD de Cartões
  // ----------------------------------------------------------------------------

  public createCard(
    deckId: string,
    front: string,
    back: string,
    hint?: string,
    tags: string[] = []
  ): Flashcard {
    const newCard = createDefaultCard(deckId, front, back, hint, tags);
    const cards = this.getLocalCards();
    cards.push(newCard);
    this.saveLocalCards(cards);

    // Atualiza o timestamp do baralho
    this.updateDeck(deckId, {});
    return newCard;
  }

  public updateCard(id: string, updates: Partial<Flashcard>): Flashcard | null {
    const cards = this.getLocalCards();
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updatedCard: Flashcard = {
      ...cards[index],
      ...updates,
    };
    cards[index] = updatedCard;
    this.saveLocalCards(cards);
    return updatedCard;
  }

  public deleteCard(id: string): void {
    const cards = this.getLocalCards().filter((c) => c.id !== id);
    this.saveLocalCards(cards);
  }

  // ----------------------------------------------------------------------------
  // Execução de Revisão (SM-2)
  // ----------------------------------------------------------------------------

  public recordReview(cardId: string, rating: FlashcardReviewRating): Flashcard | null {
    const cards = this.getLocalCards();
    const index = cards.findIndex((c) => c.id === cardId);
    if (index === -1) return null;

    const card = cards[index];
    const sm2Result = calculateNextReview(card, rating);

    const updatedCard: Flashcard = {
      ...card,
      ...sm2Result,
    };

    cards[index] = updatedCard;
    this.saveLocalCards(cards);
    return updatedCard;
  }

  // ----------------------------------------------------------------------------
  // Importação & Exportação
  // ----------------------------------------------------------------------------

  /**
   * Importa cartões a partir de texto (formato CSV/TSV ou Ponto e Vírgula: Frente;Verso;Dica)
   */
  public importCardsFromText(deckId: string, rawText: string): number {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const newCards: Flashcard[] = [];

    for (const line of lines) {
      // Tenta separar por ';' ou por '\t'
      const separator = line.includes(';') ? ';' : '\t';
      const parts = line.split(separator);

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts[1].trim();
        const hint = parts[2] ? parts[2].trim() : undefined;

        if (front && back) {
          newCards.push(createDefaultCard(deckId, front, back, hint));
        }
      }
    }

    if (newCards.length > 0) {
      const existing = this.getLocalCards();
      this.saveLocalCards([...existing, ...newCards]);
      this.updateDeck(deckId, {});
    }

    return newCards.length;
  }

  public exportDeckToJSON(deckId: string): string {
    const deck = this.getLocalDecks().find((d) => d.id === deckId);
    const cards = this.getCardsForDeck(deckId);
    return JSON.stringify({ deck, cards }, null, 2);
  }
}

export const storageFlashcardsService = new StorageFlashcardsService();
