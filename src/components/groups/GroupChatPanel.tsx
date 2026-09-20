import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Sparkles } from 'lucide-react';
import { StudyGroup, GroupMessage } from '../../types';

interface GroupChatPanelProps {
  group: StudyGroup;
  messages: GroupMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_CHEERS = [
  '🔥 Foco total!',
  '🚀 Iniciando 25m agora!',
  '👏 Parabéns pelo ciclo!',
  '⚡ Quase terminando a meta!',
  '☕ Pausa rápida de 5 min!',
];

export const GroupChatPanel: React.FC<GroupChatPanelProps> = ({
  group,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickCheer = (cheer: string) => {
    onSendMessage(cheer);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="group-chat-panel glass-panel">
      {/* Topo do Chat */}
      <div className="group-chat-header">
        <div className="group-chat-title-group">
          <span className="group-chat-icon">{group.avatar_icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 className="group-chat-name">{group.name}</h3>
              <span className="group-code-pill">{group.code}</span>
            </div>
            <p className="group-chat-desc">{group.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Users size={15} />
          <span>{group.member_count} membros</span>
        </div>
      </div>

      {/* Feed de Mensagens */}
      <div className="group-messages-feed">
        {messages.map((msg) => {
          if (msg.type === 'system_focus') {
            return (
              <div key={msg.id} className="system-focus-message">
                <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {msg.text}
              </div>
            );
          }

          const isMe = msg.user_name === 'Você';

          return (
            <div key={msg.id} className={`chat-message-row ${isMe ? 'me' : ''}`}>
              <div className="chat-avatar">{msg.user_name.charAt(0)}</div>
              <div>
                <div className="chat-meta">
                  <span>{msg.user_name}</span>
                  <span>{formatTime(msg.created_at)}</span>
                </div>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Envio e Reações Rápidas */}
      <div className="group-chat-input-area">
        <div className="quick-cheer-chips">
          {QUICK_CHEERS.map((cheer) => (
            <button
              key={cheer}
              type="button"
              className="cheer-chip"
              onClick={() => handleQuickCheer(cheer)}
            >
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
          <button type="submit" className="main-start-btn" style={{ padding: '0.65rem 1rem' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
