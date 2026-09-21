import React, { useState } from 'react';
import { X, Brain, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { GeneratedQuiz } from '@/services/ai/geminiService';

interface AIGenerateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: GeneratedQuiz;
}

export const AIGenerateQuizModal: React.FC<AIGenerateQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = quiz[currentIndex];

  const handleSelectOption = (index: number) => {
    if (showExplanation) return; // Prevent changing answer after it's locked
    
    setSelectedOptionIndex(index);
    setShowExplanation(true);
    
    if (index === currentQuestion.correct_answer_index) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIsFinished(false);
    setShowExplanation(false);
  };

  const handleClose = () => {
    setTimeout(() => {
      resetQuiz();
    }, 300);
    onClose();
  };

  const renderResult = () => {
    const percentage = Math.round((score / quiz.length) * 100);
    let message = 'Tente revisar suas anotações e tente novamente!';
    if (percentage >= 80) message = 'Excelente trabalho! Você dominou o assunto.';
    else if (percentage >= 50) message = 'Bom progresso! Mas ainda há espaço para melhorar.';

    return (
      <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.5s ease-out' }}>
        <h2 style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '10px' }}>{percentage}%</h2>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
          Você acertou {score} de {quiz.length} questões.
        </h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleClose}>
            Fechar
          </button>
          <button className="btn-primary" onClick={resetQuiz}>
            Refazer Quiz
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 9999 }}>
      <div className="modal-box glass-panel" style={{ maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} style={{ color: 'var(--color-primary)' }} />
            Quiz Interativo (IA)
          </h3>
          <button className="icon-btn" onClick={handleClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '20px 16px', minHeight: '300px' }}>
          {quiz.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>
              Nenhum quiz gerado.
            </div>
          ) : isFinished ? (
            renderResult()
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                <span>Questão {currentIndex + 1} de {quiz.length}</span>
                <span>Acertos: {score}</span>
              </div>

              <h4 style={{ fontSize: '1.1rem', marginBottom: '24px', lineHeight: 1.5 }}>
                {currentQuestion.question}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.options.map((option, idx) => {
                  const btnStyle = { 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--color-border)', 
                    background: 'var(--color-bg-tertiary)', 
                    textAlign: 'left' as const, 
                    cursor: showExplanation ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  };

                  let Icon = null;
                  let iconColor = '';

                  if (showExplanation) {
                    if (idx === currentQuestion.correct_answer_index) {
                      btnStyle.border = '1px solid var(--color-success)';
                      btnStyle.background = 'rgba(16, 185, 129, 0.1)';
                      Icon = CheckCircle;
                      iconColor = 'var(--color-success)';
                    } else if (idx === selectedOptionIndex) {
                      btnStyle.border = '1px solid var(--color-danger)';
                      btnStyle.background = 'rgba(239, 68, 68, 0.1)';
                      Icon = XCircle;
                      iconColor = 'var(--color-danger)';
                    }
                  } else if (selectedOptionIndex === idx) {
                     btnStyle.border = '1px solid var(--color-primary)';
                  }

                  return (
                    <button 
                      key={idx}
                      style={btnStyle}
                      onClick={() => handleSelectOption(idx)}
                      disabled={showExplanation}
                    >
                      <span style={{ fontSize: '0.95rem' }}>{option}</span>
                      {Icon && <Icon size={18} color={iconColor} />}
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div style={{ 
                  marginTop: '24px', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: 'var(--color-bg-tertiary)',
                  borderLeft: '4px solid var(--color-primary)',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                    Justificativa:
                  </strong>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {showExplanation && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button className="btn-primary" onClick={handleNextQuestion} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentIndex < quiz.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
