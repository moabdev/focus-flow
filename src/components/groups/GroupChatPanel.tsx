import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Sparkles, Share2, Check, Trash2, LogOut, UserPlus } from 'lucide-react';
import { StudyGroup, GroupMessage, GroupMember } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface GroupChatPanelProps {
  group: StudyGroup;
  messages: GroupMessage[];
  members: GroupMember[];
  isMember: boolean;
  isCreator: boolean;
  onSendMessage: (text: string) => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
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
  isMember,
  isCreator,
  onSendMessage,
  onJoinGroup,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
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

  const toast = useToast();

  const handleCopyInvite = () => {
    const inviteText = `Venha estudar comigo no FocusFlow! Entre no grupo "${group.name}" usando o código de convite: ${group.code}`;
    try {
      navigator.clipboard.writeText(inviteText);
    } catch {}
    setCopied(true);
    toast.success(`Código ${group.code} copiado para a área de transferência!`, 'Convite Copiado');
    setTimeout(() => setCopied(false), 2500);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 className="group-chat-name">{group.name}</h3>
              <span className="group-code-pill" title="Código de Convite">{group.code}</span>
              <button
                className="group-invite-btn"
                onClick={handleCopyInvite}
                title="Copiar convite com código para compartilhar"
                type="button"
              >
                {copied ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
                <span>{copied ? 'Copiado!' : 'Convidar'}</span>
              </button>
            </div>
            <p className="group-chat-desc">{group.description}</p>
          </div>
        </div>

        <div className="group-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.35rem' }}>
            <Users size={15} />
            <span>{group.member_count}</span>
          </div>

          {isCreator ? (
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setIsDeleteModalOpen(true)}
              title="Excluir este grupo de estudos (Apenas Criador)"
            >
              <Trash2 size={13} />
              <span>Excluir Grupo</span>
            </button>
          ) : isMember ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setIsLeaveModalOpen(true)}
              title="Sair deste grupo"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
              onClick={() => onJoinGroup(group.id)}
              title="Entrar neste grupo para participar"
            >
              <UserPlus size={13} />
              <span>Entrar</span>
            </button>
          )}
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

      {/* Área de Envio e Reações Rápidas ou Banner de Entrada */}
      {isMember ? (
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
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-full)' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
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
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Grupo de Estudos"
        message={
          <>
            Tem certeza que deseja excluir permanentemente o grupo <strong>"{group.name}"</strong>? Todas as mensagens, membros e histórico do chat serão apagados.
          </>
        }
        confirmText="Excluir Grupo"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteGroup(group.id);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Sair do Grupo"
        message={
          <>
            Deseja realmente sair do grupo <strong>"{group.name}"</strong>? Você poderá entrar novamente mais tarde se o grupo for público ou se tiver o código de convite.
          </>
        }
        confirmText="Sair do Grupo"
        cancelText="Permanecer"
        variant="warning"
        confirmIcon={<LogOut size={24} className="confirm-icon-warning" />}
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          onLeaveGroup(group.id);
        }}
        onCancel={() => setIsLeaveModalOpen(false)}
      />
    </div>
  );
};
