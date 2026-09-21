import { Flashcard, FlashcardReviewRating } from '@/features/core/types';

/**
 * Algoritmo SuperMemo 2 (SM-2) para Repetição Espaçada
 * Referência: P.A. Wozniak (1990), Optimization of learning.
 */

export interface SM2Result {
  repetition: number;
  interval_days: number;
  ease_factor: number;
  due_date: string;
  lapses: number;
  last_reviewed_at: string;
}

/**
 * Formata uma data para string YYYY-MM-DD
 */
export const formatDateToISOString = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Calcula a nova data de vencimento com base no intervalo de dias
 */
export const addDaysToDate = (days: number, fromDate: Date = new Date()): string => {
  const target = new Date(fromDate.getTime());
  target.setDate(target.getDate() + days);
  return formatDateToISOString(target);
};

/**
 * Aplica o cálculo SM-2 em um cartão com base na avaliação do usuário:
 * 0 - Errei (Again): reinicia repetições, intervalo de 1 dia, penalidade no EF
 * 1 - Difícil (Hard): avança repetições, crescimento moderado (1.2x), leve penalidade no EF
 * 2 - Bom (Good): avança repetições, intervalo padrão exponencial (1 -> 6 -> int * EF)
 * 3 - Fácil (Easy): avança repetições, bônus de crescimento (1.3x) e aumento no EF
 */
export const calculateNextReview = (
  card: Pick<Flashcard, 'repetition' | 'interval_days' | 'ease_factor' | 'lapses'>,
  rating: FlashcardReviewRating,
  now: Date = new Date()
): SM2Result => {
  let repetition = card.repetition || 0;
  let interval = card.interval_days || 0;
  let easeFactor = card.ease_factor || 2.5;
  let lapses = card.lapses || 0;

  if (rating === 0) {
    // Errei: Reinicia ciclo
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapses += 1;
  } else if (rating === 1) {
    // Difícil: Mantém ou avança com cautela
    repetition += 1;
    if (interval === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 2) {
    // Bom: Crescimento normal de intervalos
    repetition += 1;
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    // Mantém o fator de facilidade estável
  } else if (rating === 3) {
    // Fácil: Bônus de facilidade e intervalo expandido
    repetition += 1;
    if (repetition === 1) {
      interval = 2;
    } else if (repetition === 2) {
      interval = 8;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
    }
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  // Garante arredondamento de precisão de 2 casas decimais no easeFactor
  easeFactor = Math.round(easeFactor * 100) / 100;

  return {
    repetition,
    interval_days: interval,
    ease_factor: easeFactor,
    due_date: addDaysToDate(interval, now),
    lapses,
    last_reviewed_at: now.toISOString(),
  };
};

/**
 * Verifica se um cartão está pendente para revisão hoje ou atrasado
 */
export const isCardDue = (card: Flashcard, referenceDate: Date = new Date()): boolean => {
  const todayStr = formatDateToISOString(referenceDate);
  if (!card.due_date) return true;
  return card.due_date <= todayStr;
};

/**
 * Filtra todos os cartões que estão prontos para estudo hoje
 */
export const filterDueCards = (cards: Flashcard[], referenceDate: Date = new Date()): Flashcard[] => {
  return cards.filter((c) => isCardDue(c, referenceDate));
};

/**
 * Cria um novo cartão inicializado com os valores padrão do SM-2
 */
export const createDefaultCard = (
  deckId: string,
  front: string,
  back: string,
  hint?: string,
  tags: string[] = []
): Flashcard => {
  const now = new Date();
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deck_id: deckId,
    front: front.trim(),
    back: back.trim(),
    hint: hint?.trim() || undefined,
    tags,
    repetition: 0,
    interval_days: 0,
    ease_factor: 2.5,
    due_date: formatDateToISOString(now), // Pronto para revisão hoje
    lapses: 0,
    created_at: now.toISOString(),
  };
};
