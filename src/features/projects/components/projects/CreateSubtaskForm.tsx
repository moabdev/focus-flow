import React, { useState } from 'react';
import { PriorityLevel } from '@/features/core/types';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'baixa', label: 'Baixa', badgeColor: '#10b981' },
  { value: 'media', label: 'Média', badgeColor: '#f59e0b' },
  { value: 'alta', label: 'Alta', badgeColor: '#ff2a5f' },
];

interface CreateSubtaskFormProps {
  onSubmit: (title: string, estimated: number, priority: PriorityLevel, dueDate: string) => void;
  onCancel: () => void;
}

export const CreateSubtaskForm: React.FC<CreateSubtaskFormProps> = ({ onSubmit, onCancel }) => {
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskEstimated, setSubtaskEstimated] = useState(2);
  const [subtaskPriority, setSubtaskPriority] = useState<PriorityLevel>('media');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    onSubmit(subtaskTitle.trim(), subtaskEstimated, subtaskPriority, subtaskDueDate);
    setSubtaskTitle('');
    setSubtaskEstimated(2);
    setSubtaskPriority('media');
    setSubtaskDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="add-subtask-form inline-form">
      <input
        type="text"
        className="subtask-input"
        placeholder="Nome da subtarefa..."
        value={subtaskTitle}
        onChange={(e) => setSubtaskTitle(e.target.value)}
        autoFocus
        required
      />

      <div className="subtask-form-controls">
        <div className="form-mini-group">
          <label>Pomodoros:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={subtaskEstimated}
            onChange={(e) => setSubtaskEstimated(parseInt(e.target.value) || 1)}
            style={{ width: '50px' }}
          />
        </div>

        <div className="form-mini-group">
          <label>Prioridade:</label>
          <CustomSelect
            value={subtaskPriority}
            options={PRIORITY_OPTIONS}
            onChange={(val) => setSubtaskPriority(val as PriorityLevel)}
            style={{ minWidth: '110px' }}
          />
        </div>

        <div className="form-mini-group">
          <label>Prazo:</label>
          <input
            type="date"
            value={subtaskDueDate}
            onChange={(e) => setSubtaskDueDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </form>
  );
};
