import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  isCardDue,
  filterDueCards,
  createDefaultCard,
  formatDateToISOString,
  addDaysToDate,
} from '@/features/flashcards/api/spacedRepetition';
import { Flashcard } from '@/features/core/types';

describe('Algoritmo SM-2 de Repetição Espaçada', () => {
  const baseCard: Flashcard = {
    id: 'test-card',
    deck_id: 'test-deck',
    front: 'O que é idempotência?',
    back: 'Propriedade de operações que podem ser aplicadas múltiplas vezes sem mudar o resultado além da aplicação inicial.',
    tags: ['dev', 'api'],
    repetition: 0,
    interval_days: 0,
    ease_factor: 2.5,
    due_date: '2026-09-20',
    lapses: 0,
    created_at: '2026-09-20T12:00:00Z',
  };

  it('deve reiniciar repetições e aplicar intervalo de 1 dia ao avaliar com Errei (Rating 0)', () => {
    const activeCard = { ...baseCard, repetition: 3, interval_days: 10, ease_factor: 2.5, lapses: 0 };
    const now = new Date('2026-09-20T10:00:00Z');
    const result = calculateNextReview(activeCard, 0, now);

    expect(result.repetition).toBe(0);
    expect(result.interval_days).toBe(1);
    expect(result.ease_factor).toBe(2.3); // 2.5 - 0.2
    expect(result.lapses).toBe(1);
    expect(result.due_date).toBe('2026-09-21');
  });

  it('não deve permitir que o ease_factor fique abaixo de 1.3', () => {
    const fragileCard = { ...baseCard, ease_factor: 1.4 };
    const result = calculateNextReview(fragileCard, 0);

    expect(result.ease_factor).toBe(1.3);
  });

  it('deve avançar repetição e crescer intervalo moderadamente ao avaliar com Difícil (Rating 1)', () => {
    const card = { ...baseCard, repetition: 2, interval_days: 5, ease_factor: 2.5 };
    const now = new Date('2026-09-20T10:00:00Z');
    const result = calculateNextReview(card, 1, now);

    expect(result.repetition).toBe(3);
    expect(result.interval_days).toBe(6); // 5 * 1.2 = 6
    expect(result.ease_factor).toBe(2.35); // 2.5 - 0.15
    expect(result.due_date).toBe('2026-09-26');
  });

  it('deve seguir a curva normal (1 -> 6 -> interval * EF) ao avaliar com Bom (Rating 2)', () => {
    const now = new Date('2026-09-20T10:00:00Z');

    // Primeira avaliação Bom
    const firstReview = calculateNextReview(baseCard, 2, now);
    expect(firstReview.repetition).toBe(1);
    expect(firstReview.interval_days).toBe(1);
    expect(firstReview.due_date).toBe('2026-09-21');

    // Segunda avaliação Bom
    const secondReview = calculateNextReview({ ...baseCard, repetition: 1, interval_days: 1 }, 2, now);
    expect(secondReview.repetition).toBe(2);
    expect(secondReview.interval_days).toBe(6);
    expect(secondReview.due_date).toBe('2026-09-26');

    // Terceira avaliação Bom com EF 2.5
    const thirdReview = calculateNextReview({ ...baseCard, repetition: 2, interval_days: 6, ease_factor: 2.5 }, 2, now);
    expect(thirdReview.repetition).toBe(3);
    expect(thirdReview.interval_days).toBe(15); // 6 * 2.5 = 15
    expect(thirdReview.due_date).toBe('2026-10-05');
  });

  it('deve conceder bônus de intervalo e aumentar ease_factor ao avaliar com Fácil (Rating 3)', () => {
    const now = new Date('2026-09-20T10:00:00Z');
    const card = { ...baseCard, repetition: 2, interval_days: 6, ease_factor: 2.5 };
    const result = calculateNextReview(card, 3, now);

    expect(result.repetition).toBe(3);
    // 6 * 2.5 * 1.3 = 19.5 -> 20
    expect(result.interval_days).toBe(20);
    expect(result.ease_factor).toBe(2.65); // 2.5 + 0.15
    expect(result.due_date).toBe('2026-10-10');
  });

  it('deve verificar corretamente cartões vencidos ou agendados para hoje', () => {
    const today = new Date('2026-09-20T12:00:00');
    const duePast = { ...baseCard, due_date: '2026-09-18' };
    const dueToday = { ...baseCard, due_date: '2026-09-20' };
    const dueFuture = { ...baseCard, due_date: '2026-09-25' };

    expect(isCardDue(duePast, today)).toBe(true);
    expect(isCardDue(dueToday, today)).toBe(true);
    expect(isCardDue(dueFuture, today)).toBe(false);

    const filtered = filterDueCards([duePast, dueToday, dueFuture], today);
    expect(filtered.length).toBe(2);
    expect(filtered.map((c) => c.due_date)).toEqual(['2026-09-18', '2026-09-20']);
  });

  it('deve criar cartão padrão com estado inicial pronto para revisão', () => {
    const newCard = createDefaultCard('deck-1', 'Pergunta', 'Resposta', 'Uma dica', ['tag1']);
    expect(newCard.id).toMatch(/^card-/);
    expect(newCard.deck_id).toBe('deck-1');
    expect(newCard.front).toBe('Pergunta');
    expect(newCard.back).toBe('Resposta');
    expect(newCard.hint).toBe('Uma dica');
    expect(newCard.repetition).toBe(0);
    expect(newCard.interval_days).toBe(0);
    expect(newCard.ease_factor).toBe(2.5);
    expect(newCard.due_date).toBe(formatDateToISOString(new Date()));
  });
});
