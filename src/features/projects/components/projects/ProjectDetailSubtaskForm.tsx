import React, { useState } from 'react';
import { PriorityLevel } from '@/features/core/types';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';

const DETAIL_PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'baixa', label: 'Baixa prioridade', badgeColor: '#10b981' },
  { value: 'media', label: 'Média prioridade', badgeColor: '#f59e0b' },
  { value: 'alta', label: 'Alta prioridade', badgeColor: '#ff2a5f' },
];

interface ProjectDetailSubtaskFormProps {
  onSubmit: (title: string, discipline: string, priority: PriorityLevel, estimated: number) => void;
  onCancel: () => void;
}

export const ProjectDetailSubtaskForm: React.FC<ProjectDetailSubtaskFormProps> = ({ onSubmit, onCancel }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newEstimated, setNewEstimated] = useState(2);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('media');
  const [newDiscipline, setNewDiscipline] = useState('Geral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSubmit(newTitle.trim(), newDiscipline, newPriority, newEstimated);
    setNewTitle('');
    setNewEstimated(2);
    setNewPriority('media');
    setNewDiscipline('Geral');
  };

  return (
    <form className="add-subtask-form inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="subtask-input"
        placeholder="Nome da subtarefa..."
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        autoFocus
      />
      <div className="add-subtask-options">
        <input
          type="text"
          placeholder="Disciplina (ex: React, Civil)"
          value={newDiscipline}
          onChange={(e) => setNewDiscipline(e.target.value)}
          className="subtask-input"
          style={{ width: '130px' }}
        />
        <CustomSelect
          value={newPriority}
          options={DETAIL_PRIORITY_OPTIONS}
          onChange={(val) => setNewPriority(val as PriorityLevel)}
          style={{ width: '165px' }}
        />
        <input
          type="number"
          min="1"
          max="20"
          value={newEstimated}
          onChange={(e) => setNewEstimated(parseInt(e.target.value) || 1)}
          className="subtask-num-input"
          title="Ciclos de pomodoro estimados"
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
          Salvar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
