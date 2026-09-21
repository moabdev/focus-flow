import React from 'react';

interface FlashcardStudyRatingsProps {
  onAnswer: (rating: number) => void;
}

export const FlashcardStudyRatings: React.FC<FlashcardStudyRatingsProps> = ({ onAnswer }) => {
  return (
    <div className="study-ratings-bar">
      <button
        className="btn-rating btn-rating-again"
        onClick={() => onAnswer(0)}
        title="Atalho: Tecla 1"
      >
        <span className="btn-rating-title">Errei [1]</span>
        <span className="btn-rating-sub">1 dia</span>
      </button>

      <button
        className="btn-rating btn-rating-hard"
        onClick={() => onAnswer(1)}
        title="Atalho: Tecla 2"
      >
        <span className="btn-rating-title">Difícil [2]</span>
        <span className="btn-rating-sub">Crescimento lento</span>
      </button>

      <button
        className="btn-rating btn-rating-good"
        onClick={() => onAnswer(2)}
        title="Atalho: Tecla 3"
      >
        <span className="btn-rating-title">Bom [3]</span>
        <span className="btn-rating-sub">Intervalo normal</span>
      </button>

      <button
        className="btn-rating btn-rating-easy"
        onClick={() => onAnswer(3)}
        title="Atalho: Tecla 4"
      >
        <span className="btn-rating-title">Fácil [4]</span>
        <span className="btn-rating-sub">Intervalo longo</span>
      </button>
    </div>
  );
};
