import React from 'react';
import { Clock, BookOpen, Layers, Flame } from 'lucide-react';

interface FlashcardsStatsBannerProps {
  dueCardsCount: number;
  totalCardsCount: number;
  decksCount: number;
}

export const FlashcardsStatsBanner: React.FC<FlashcardsStatsBannerProps> = ({
  dueCardsCount,
  totalCardsCount,
  decksCount,
}) => {
  return (
    <div className="flashcards-stats-banner">
      <div className="flashcard-stat-card">
        <div className="flashcard-stat-icon stat-icon-due">
          <Clock size={22} />
        </div>
        <div className="flashcard-stat-info">
          <span className="flashcard-stat-val">{dueCardsCount}</span>
          <span className="flashcard-stat-label">Para Revisar Hoje</span>
        </div>
      </div>

      <div className="flashcard-stat-card">
        <div className="flashcard-stat-icon stat-icon-total">
          <BookOpen size={22} />
        </div>
        <div className="flashcard-stat-info">
          <span className="flashcard-stat-val">{totalCardsCount}</span>
          <span className="flashcard-stat-label">Total de Cartões</span>
        </div>
      </div>

      <div className="flashcard-stat-card">
        <div className="flashcard-stat-icon stat-icon-decks">
          <Layers size={22} />
        </div>
        <div className="flashcard-stat-info">
          <span className="flashcard-stat-val">{decksCount}</span>
          <span className="flashcard-stat-label">Baralhos Criados</span>
        </div>
      </div>

      <div className="flashcard-stat-card">
        <div className="flashcard-stat-icon stat-icon-streak">
          <Flame size={22} />
        </div>
        <div className="flashcard-stat-info">
          <span className="flashcard-stat-val">SM-2</span>
          <span className="flashcard-stat-label">Algoritmo Ativo</span>
        </div>
      </div>
    </div>
  );
};
