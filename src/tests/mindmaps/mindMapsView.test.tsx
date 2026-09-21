import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MindMapsView } from '../../features/mindmaps/components/mindmaps/MindMapsView';

describe('MindMapsView Component', () => {
  const defaultProps = {
    onOpenMindMap: vi.fn(),
    projects: [],
  };

  it('deve renderizar a tela vazia quando não há mapas', () => {
    render(<MindMapsView {...defaultProps} />);
    
    expect(screen.getByText(/Mapas Mentais Interativos/i)).toBeInTheDocument();
  });

  it('deve abrir modal de criação ao clicar em Novo Mapa', () => {
    render(<MindMapsView {...defaultProps} />);
    
    const newBtns = screen.getAllByRole('button', { name: /Novo Mapa/i });
    fireEvent.click(newBtns[0]);
    
    expect(screen.getByText('Novo Mapa Mental')).toBeInTheDocument();
  });
});
