import { describe, it, expect, beforeEach } from 'vitest';
import { StorageFlashcardsService } from '@/features/flashcards/api/storageFlashcards';

describe('StorageFlashcardsService', () => {
  let service: StorageFlashcardsService;

  beforeEach(() => {
    localStorage.clear();
    service = new StorageFlashcardsService();
  });

  it('deve iniciar com 0 baralhos (dados de exemplo removidos)', () => {
    const decks = service.getLocalDecks();
    expect(decks.length).toBe(0);
  });

  it('deve criar um novo baralho com sucesso', () => {
    const created = service.createDeck({
      title: 'Farmacologia Clínica',
      description: 'Mecanismos de ação e posologias',
      color: '#ec4899',
      icon: '💊',
      tags: ['Medicina'],
    });

    expect(created.id).toMatch(/^deck-/);
    expect(created.title).toBe('Farmacologia Clínica');

    const all = service.getLocalDecks();
    expect(all.find((d) => d.id === created.id)).toBeDefined();
  });

  it('deve adicionar cartões a um baralho e calcular a contagem de revisões pendentes', () => {
    const deck = service.createDeck({
      title: 'TypeScript Avançado',
      color: '#3b82f6',
      icon: '📘',
    });

    const card1 = service.createCard(deck.id, 'O que é inferência condicional?', 'Inferência com a keyword "infer" em tipos condicionais.');
    const card2 = service.createCard(deck.id, 'O que é mapped type?', 'Mapeamento de propriedades de um tipo existente usando [K in keyof T].');

    const deckCards = service.getCardsForDeck(deck.id);
    expect(deckCards.length).toBe(2);
    expect(deckCards[0].front).toBe(card1.front);
    expect(deckCards[1].front).toBe(card2.front);

    const decksWithStats = service.getDecksWithStats();
    const target = decksWithStats.find((d) => d.id === deck.id);
    expect(target?.card_count).toBe(2);
    expect(target?.due_count).toBe(2); // ambos criados com vencimento para hoje
  });

  it('deve registrar revisão com SM-2 e atualizar a data do cartão', () => {
    const deck = service.createDeck({ title: 'Test Deck', color: '#10b981', icon: '📝' });
    const card = service.createCard(deck.id, 'Pergunta', 'Resposta');

    // Avalia com Bom (Rating 2)
    const reviewed = service.recordReview(card.id, 2);
    expect(reviewed).not.toBeNull();
    expect(reviewed?.repetition).toBe(1);
    expect(reviewed?.interval_days).toBe(1);

    // Salvo no localStorage
    const saved = service.getLocalCards().find((c) => c.id === card.id);
    expect(saved?.repetition).toBe(1);
  });

  it('deve deletar um baralho e seus respectivos cartões em cascata', () => {
    const deck = service.createDeck({ title: 'Baralho Temporário', color: '#64748b', icon: '🗑️' });
    service.createCard(deck.id, 'P1', 'R1');
    service.createCard(deck.id, 'P2', 'R2');

    expect(service.getCardsForDeck(deck.id).length).toBe(2);

    service.deleteDeck(deck.id);

    expect(service.getLocalDecks().find((d) => d.id === deck.id)).toBeUndefined();
    expect(service.getCardsForDeck(deck.id).length).toBe(0);
  });

  it('deve importar cartões a partir de texto com separador ponto e vírgula', () => {
    const deck = service.createDeck({ title: 'Import Deck', color: '#f59e0b', icon: '📥' });
    const text = `
      O que é JSX?;Sintaxe que estende JavaScript para descrever a interface;Usado no React
      O que é Virtual DOM?;Representação leve da árvore DOM real mantida em memória;Performance
    `;

    const importedCount = service.importCardsFromText(deck.id, text);
    expect(importedCount).toBe(2);

    const cards = service.getCardsForDeck(deck.id);
    expect(cards.length).toBe(2);
    expect(cards[0].front).toBe('O que é JSX?');
    expect(cards[0].hint).toBe('Usado no React');
  });
});
