import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, HelpCircle, RotateCw } from 'lucide-react';
import { Flashcard, FlashcardDeck, FlashcardReviewRating } from '@/features/core/types';
import { isCardDue } from '@/features/flashcards/api/spacedRepetition';
import { FlashcardStudySessionFinished } from './FlashcardStudySessionFinished';
import { FlashcardStudyRatings } from './FlashcardStudyRatings';

interface FlashcardStudyModalProps {
  deck: FlashcardDeck;
  cards: Flashcard[];
  isOpen: boolean;
  onClose: () => void;
  onRecordReview: (cardId: string, rating: FlashcardReviewRating) => void;
  onStartPomodoroForDeck?: (deck: FlashcardDeck) => void;
}

export const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  deck,
  cards,
  isOpen,
  onClose,
  onRecordReview,
  onStartPomodoroForDeck,
}) => {
  const studyQueue = useMemo(() => {
    const due = cards.filter((c) => isCardDue(c));
    return due.length > 0 ? due : cards;
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      setIsFinished(false);
      setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    }
  }, [isOpen, deck.id]);

  const currentCard = studyQueue[currentIndex];
  const totalInSession = studyQueue.length;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleAnswer = useCallback(
    (rating: FlashcardReviewRating) => {
      if (!currentCard) return;

      onRecordReview(currentCard.id, rating);

      setSessionStats((prev) => ({
        ...prev,
        again: rating === 0 ? prev.again + 1 : prev.again,
        hard: rating === 1 ? prev.hard + 1 : prev.hard,
        good: rating === 2 ? prev.good + 1 : prev.good,
        easy: rating === 3 ? prev.easy + 1 : prev.easy,
      }));

      if (currentIndex + 1 < totalInSession) {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((i) => i + 1);
      } else {
        setIsFinished(true);
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // fallback se canvas não suportado
        }
      }
    },
    [currentCard, currentIndex, onRecordReview, totalInSession]
  );

  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key.toLowerCase() === 'd') {
        setShowHint((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleAnswer(0);
        else if (e.key === '2') handleAnswer(1);
        else if (e.key === '3') handleAnswer(2);
        else if (e.key === '4') handleAnswer(3);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, isFlipped, handleFlip, handleAnswer, onClose]);

  if (!isOpen) return null;

  const progressPercent = totalInSession > 0 ? Math.round(((currentIndex + (isFinished ? 1 : 0)) / totalInSession) * 100) : 100;
  const retentionRate =
    sessionStats.good + sessionStats.easy + sessionStats.hard + sessionStats.again > 0
      ? Math.round(
          ((sessionStats.good + sessionStats.easy) /
            (sessionStats.good + sessionStats.easy + sessionStats.hard + sessionStats.again)) *
            100
        )
      : 100;

  return (
    <div className="study-modal-overlay" onClick={onClose}>
      <div className="study-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="study-header">
          <div className="study-deck-badge">
            <span style={{ fontSize: '1.25rem' }}>{deck.icon}</span>
            <span>{deck.title}</span>
          </div>

          <div className="study-progress-info">
            <span>
              {isFinished ? totalInSession : currentIndex + 1} de {totalInSession}
            </span>
            <button
              className="btn-deck-icon"
              onClick={onClose}
              title="Fechar Sessão (Esc)"
              aria-label="Fechar Sessão"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="study-progress-bar">
          <div className="study-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {!isFinished && currentCard ? (
          <>
            <div
              className={`flip-card-wrapper ${isFlipped ? 'flipped' : ''}`}
              onClick={handleFlip}
              title="Clique para virar o cartão (Espaço)"
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <div className="card-face-tag">
                    <span>Pergunta / Conceito</span>
                    {currentCard.tags && currentCard.tags.length > 0 && (
                      <span className="deck-tag-pill">{currentCard.tags[0]}</span>
                    )}
                  </div>

                  <div className="card-main-text">{currentCard.front}</div>

                  <div>
                    {currentCard.hint && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint((prev) => !prev);
                        }}
                        style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
                      >
                        {showHint ? (
                          <div className="card-hint-box">💡 Dica: {currentCard.hint}</div>
                        ) : (
                          <span className="card-flip-prompt" style={{ color: '#f59e0b' }}>
                            <HelpCircle size={14} /> Mostrar Dica [D]
                          </span>
                        )}
                      </div>
                    )}

                    <div className="card-flip-prompt">
                      <RotateCw size={14} /> Pressione <kbd>Espaço</kbd> ou clique para virar
                    </div>
                  </div>
                </div>

                <div className="flip-card-back">
                  <div className="card-face-tag">
                    <span style={{ color: 'var(--accent-primary)' }}>Resposta / Solução</span>
                    <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                  </div>

                  <div className="card-main-text">{currentCard.back}</div>

                  <div className="card-flip-prompt">
                    Avalie sua lembrança abaixo <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>
                  </div>
                </div>
              </div>
            </div>

            {isFlipped ? (
              <FlashcardStudyRatings onAnswer={(rating) => handleAnswer(rating as FlashcardReviewRating)} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <button className="btn-study-deck" onClick={handleFlip}>
                  <RotateCw size={16} /> Virar Cartão (Espaço)
                </button>
              </div>
            )}
          </>
        ) : (
          <FlashcardStudySessionFinished
            totalInSession={totalInSession}
            retentionRate={retentionRate}
            sessionStats={sessionStats}
            deck={deck}
            onClose={onClose}
            onStartPomodoroForDeck={onStartPomodoroForDeck}
          />
        )}
      </div>
    </div>
  );
};
