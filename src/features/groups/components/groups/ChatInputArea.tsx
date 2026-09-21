import React, { useState } from 'react';
import { Send, Sparkles, UserPlus } from 'lucide-react';
import { StudyGroup } from '@/features/core/types';

const QUICK_CHEERS = [
  '🔥 Foco total!',
  '🚀 Iniciando 25m agora!',
  '👏 Parabéns pelo ciclo!',
  '⚡ Quase terminando a meta!',
  '☕ Pausa rápida de 5 min!',
  '🎯 Meta diária alcançada!',
];

interface ChatInputAreaProps {
  group: StudyGroup;
  isMember: boolean;
  onSendMessage: (text: string) => void;
  onJoinGroup: (groupId: string) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ group, isMember, onSendMessage, onJoinGroup }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isMember) {
    return (
      <div className="group-not-member-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sparkles size={18} color="var(--accent-primary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              Você não participa deste grupo
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Entre para interagir no chat ao vivo e compartilhar suas sessões de foco com a comunidade.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
          onClick={() => onJoinGroup(group.id)}
        >
          <UserPlus size={14} />
          <span>Entrar no Grupo</span>
        </button>
      </div>
    );
  }

  return (
    <div className="group-chat-input-area">
      <div className="quick-cheer-chips">
        {QUICK_CHEERS.map((cheer) => (
          <button key={cheer} type="button" className="cheer-chip" onClick={() => onSendMessage(cheer)}>
            {cheer}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-text-input"
          placeholder={`Conversar em #${group.name}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-full)' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
