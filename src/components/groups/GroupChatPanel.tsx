import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Users,
  Sparkles,
  Share2,
  Check,
  Trash2,
  LogOut,
  UserPlus,
  BookOpen,
  Mail,
  Edit3,
  Info,
} from 'lucide-react';
import { StudyGroup, GroupMessage, GroupMember } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { GroupRulesModal } from './GroupRulesModal';
import { InviteEmailModal } from './InviteEmailModal';
import { EditGroupModal } from './EditGroupModal';
import { GroupInfoModal } from './GroupInfoModal';
import { GroupMembersModal } from './GroupMembersModal';

interface GroupChatPanelProps {
  group: StudyGroup;
  messages: GroupMessage[];
  members: GroupMember[];
  isMember: boolean;
  isCreator: boolean;
  isAdmin?: boolean;
  onSendMessage: (text: string) => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup?: (groupId: string, data: Partial<StudyGroup>) => void;
  onOpenMembersModal?: () => void;
  onRemoveMember?: (member: GroupMember) => void;
  showMembersPanel?: boolean;
  onToggleMembersPanel?: () => void;
}

const QUICK_CHEERS = [
  '🔥 Foco total!',
  '🚀 Iniciando 25m agora!',
  '👏 Parabéns pelo ciclo!',
  '⚡ Quase terminando a meta!',
  '☕ Pausa rápida de 5 min!',
  '🎯 Meta diária alcançada!',
];

export const GroupChatPanel: React.FC<GroupChatPanelProps> = ({
  group,
  messages,
  members,
  isMember,
  isCreator,
  isAdmin: propIsAdmin,
  onSendMessage,
  onJoinGroup,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateGroup,
  onOpenMembersModal,
  onRemoveMember,
  showMembersPanel,
  onToggleMembersPanel,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isEmailInviteModalOpen, setIsEmailInviteModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = propIsAdmin ?? isCreator;
  const activeFocusingMembers = members.filter((m) => m.current_status === 'focusing');

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
      {/* Topo do Chat Compacto & Sem Sobreposição */}
      <div className="group-chat-header">
        <div className="group-chat-identity">
          <div
            className="group-chat-icon-wrap"
            onClick={() => setIsInfoModalOpen(true)}
            title="Clique para ver informações completas da sala"
          >
            <span className="group-chat-icon">{group.avatar_icon}</span>
          </div>
          <div
            className="group-chat-titles"
            onClick={() => setIsInfoModalOpen(true)}
            title="Clique para ver informações completas da sala"
          >
            <h3 className="group-chat-name">{group.name}</h3>
            <span className="group-chat-subinfo">
              {group.category} • {group.code}
            </span>
          </div>

          <button
            type="button"
            className="group-info-pill-btn"
            onClick={() => setIsInfoModalOpen(true)}
            title="Ver detalhes da sala, descrição completa e código"
          >
            <Info size={13} />
            <span>Info</span>
          </button>
        </div>

        {/* Toolbar Unificada de Ações do Chat */}
        <div className="group-chat-toolbar">
          <div className="group-chat-pills-row">
            {/* Botão de Membros da Sala (Abre modal de membros e status ao vivo) */}
            <button
              className="group-members-btn"
              onClick={() => {
                if (onOpenMembersModal) {
                  onOpenMembersModal();
                } else if (onToggleMembersPanel) {
                  onToggleMembersPanel();
                } else {
                  setIsMembersModalOpen(true);
                }
              }}
              title={`Ver ${group.member_count} membros da sala e status ao vivo`}
              type="button"
            >
              <Users size={13} />
              <span>Membros</span>
              <span className="members-count-pill">{group.member_count}</span>
              {activeFocusingMembers.length > 0 && (
                <span
                  className="live-dot-mini"
                  title={`${activeFocusingMembers.length} em foco`}
                />
              )}
            </button>

            {/* Botão de Regras */}
            <button
              className="group-rules-btn"
              onClick={() => setIsRulesModalOpen(true)}
              title="Visualizar regras de convivência e foco"
              type="button"
            >
              <BookOpen size={13} />
              <span>Regras</span>
              {group.rules && group.rules.length > 0 && (
                <span className="rules-count-pill">{group.rules.length}</span>
              )}
            </button>

            {/* Botão de Copiar Convite */}
            <button
              className="group-invite-btn"
              onClick={handleCopyInvite}
              title="Copiar convite com código para compartilhar"
              type="button"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
              <span>{copied ? 'Copiado!' : 'Convidar'}</span>
            </button>

            {/* Botão de Convite por E-mail */}
            <button
              className="group-invite-email-btn"
              onClick={() => setIsEmailInviteModalOpen(true)}
              title="Enviar convite por e-mail"
              type="button"
            >
              <Mail size={13} />
              <span>E-mail</span>
            </button>
          </div>

          <div className="group-header-actions">
            {/* Botão Editar Grupo (Apenas Administrador) */}
            {isAdmin && onUpdateGroup && (
              <button
                type="button"
                className="btn btn-secondary btn-chat-header-action"
                onClick={() => setIsEditGroupModalOpen(true)}
                title="Editar título, descrição e regras do grupo"
              >
                <Edit3 size={13} />
                <span>Editar Grupo</span>
              </button>
            )}

            {isCreator ? (
              <button
                type="button"
                className="btn btn-danger btn-chat-header-action"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Excluir este grupo de estudos (Apenas Criador)"
              >
                <Trash2 size={13} />
                <span>Excluir Grupo</span>
              </button>
            ) : isMember ? (
              <button
                type="button"
                className="btn btn-secondary btn-chat-header-action"
                onClick={() => setIsLeaveModalOpen(true)}
                title="Sair deste grupo"
              >
                <LogOut size={13} />
                <span>Sair</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-chat-header-action"
                onClick={() => onJoinGroup(group.id)}
                title="Entrar neste grupo para participar"
              >
                <UserPlus size={13} />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Radar de Foco ao Vivo na Sala */}
      {activeFocusingMembers.length > 0 && (
        <div className="live-focus-radar-banner">
          <div className="live-radar-pulse">
            <span className="live-radar-dot" />
          </div>
          <div className="live-radar-info">
            <span className="live-radar-count">
              {activeFocusingMembers.length} {activeFocusingMembers.length === 1 ? 'colega em foco agora' : 'colegas em foco agora'}:
            </span>
            <span className="live-radar-names">
              {activeFocusingMembers.map((m) => `⚡ ${m.user_name}${m.current_task_title ? ` (${m.current_task_title})` : ''}`).join(' • ')}
            </span>
          </div>
        </div>
      )}

      {/* Feed de Mensagens */}
      <div className="group-messages-feed">
        {messages.length === 0 && (
          <div className="empty-chat-state">
            <span className="empty-chat-icon">{group.avatar_icon}</span>
            <h4>Bem-vindo(a) ao #{group.name}</h4>
            <p>Seja o primeiro a enviar uma mensagem ou envie uma reação rápida abaixo para quebrar o gelo!</p>
          </div>
        )}

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

      {/* Modal de Confirmação de Exclusão */}
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

      {/* Modal de Confirmação de Saída */}
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

      {/* Modal de Informações da Sala (Sobre o Grupo) */}
      <GroupInfoModal
        isOpen={isInfoModalOpen}
        group={group}
        members={members}
        isAdmin={isAdmin}
        isCreator={isCreator}
        onClose={() => setIsInfoModalOpen(false)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenEmailInvite={() => setIsEmailInviteModalOpen(true)}
        onOpenEdit={() => setIsEditGroupModalOpen(true)}
      />

      {/* Modal de Visualização de Regras */}
      <GroupRulesModal
        isOpen={isRulesModalOpen}
        group={group}
        isAdmin={isAdmin}
        onClose={() => setIsRulesModalOpen(false)}
        onOpenEdit={() => setIsEditGroupModalOpen(true)}
      />

      {/* Modal de Convite por E-mail */}
      <InviteEmailModal
        isOpen={isEmailInviteModalOpen}
        group={group}
        onClose={() => setIsEmailInviteModalOpen(false)}
      />

      {/* Modal de Edição de Grupo */}
      {onUpdateGroup && (
        <EditGroupModal
          isOpen={isEditGroupModalOpen}
          group={group}
          onClose={() => setIsEditGroupModalOpen(false)}
          onUpdateGroup={onUpdateGroup}
        />
      )}

      {/* Modal de Membros da Sala (para visualização direta no painel) */}
      {!onOpenMembersModal && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          group={group}
          members={members}
          isAdmin={isAdmin}
          isCreator={isCreator}
          onClose={() => setIsMembersModalOpen(false)}
          onRemoveMember={onRemoveMember}
        />
      )}
    </div>
  );
};
