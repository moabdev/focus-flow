import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AIGenerateFlashcardsModal } from '@/features/notion/components/notion/AIGenerateFlashcardsModal';
import { AIGenerateQuizModal } from '@/features/notion/components/notion/AIGenerateQuizModal';
import { ToastProvider } from '@/features/core/contexts/ToastContext';

describe('Componentes de Inteligência Artificial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AIGenerateFlashcardsModal', () => {
    const mockFlashcards = [
      { front: 'Pergunta 1', back: 'Resposta 1', tags: ['teste'] },
      { front: 'Pergunta 2', back: 'Resposta 2', tags: ['teste'] },
    ];

    it('não deve renderizar quando isOpen for falso', () => {
      const { container } = render(
        <AIGenerateFlashcardsModal isOpen={false} onClose={vi.fn()} flashcards={[]} onSave={vi.fn()} isSaving={false} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('deve renderizar a lista de flashcards e permitir a remoção de um card do rascunho', () => {
      render(
        <AIGenerateFlashcardsModal isOpen={true} onClose={vi.fn()} flashcards={mockFlashcards} onSave={vi.fn()} isSaving={false} />
      );
      
      expect(screen.getByText('Pergunta 1')).toBeInTheDocument();
      expect(screen.getByText('Pergunta 2')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByTitle('Remover Cartão');
      expect(removeButtons).toHaveLength(2);
      
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByText('Pergunta 1')).not.toBeInTheDocument();
      expect(screen.getByText('Pergunta 2')).toBeInTheDocument();
    });

    it('deve chamar onSave com os cards remanescentes ao clicar em Salvar', () => {
      const onSave = vi.fn();
      render(
        <AIGenerateFlashcardsModal isOpen={true} onClose={vi.fn()} flashcards={mockFlashcards} onSave={onSave} isSaving={false} />
      );
      
      const saveBtn = screen.getByText(/Salvar 2 Cartões/i);
      fireEvent.click(saveBtn);
      
      expect(onSave).toHaveBeenCalledWith(mockFlashcards);
    });
  });

  describe('AIGenerateQuizModal', () => {
    const mockQuiz = [
      {
        question: 'Qual é a capital do Brasil?',
        options: ['Rio de Janeiro', 'Brasília', 'São Paulo', 'Belo Horizonte'],
        correct_answer_index: 1,
        explanation: 'Brasília foi inaugurada em 1960.'
      }
    ];

    it('não deve renderizar quando isOpen for falso', () => {
      const { container } = render(
        <AIGenerateQuizModal isOpen={false} onClose={vi.fn()} quiz={[]} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('deve renderizar a pergunta e opções, e mostrar a justificativa após seleção', () => {
      render(
        <AIGenerateQuizModal isOpen={true} onClose={vi.fn()} quiz={mockQuiz} />
      );
      
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();
      expect(screen.getByText('Brasília')).toBeInTheDocument();
      expect(screen.getByText('Questão 1 de 1')).toBeInTheDocument();
      
      // Select the wrong answer
      fireEvent.click(screen.getByText('Rio de Janeiro'));
      
      // Explanation should appear
      expect(screen.getByText(/Justificativa:/i)).toBeInTheDocument();
      expect(screen.getByText('Brasília foi inaugurada em 1960.')).toBeInTheDocument();
      
      // Next/Results button should appear
      const resultsBtn = screen.getByText('Ver Resultados');
      expect(resultsBtn).toBeInTheDocument();
    });
  });
});
