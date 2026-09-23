import '../../styles/groups-chat.css';
import React, { useState } from 'react';
import { Users, Share2, Check, Trash2, LogOut, UserPlus, BookOpen, Mail, Edit3, Info } from 'lucide-react';
import { StudyGroup, GroupMessage, GroupMember } from '@/features/core/types';
import { useToast } from '@/features/core/contexts/ToastContext';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';
import { GroupRulesModal } from './GroupRulesModal';
import { InviteEmailModal } from './InviteEmailModal';
import { EditGroupModal } from './EditGroupModal';
import { GroupInfoModal } from './GroupInfoModal';
import { GroupMembersModal } from './GroupMembersModal';
import { ChatMessagesFeed } from './ChatMessagesFeed';
import { ChatInputArea } from './ChatInputArea';

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
  onToggleMembersPanel,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isEmailInviteModalOpen, setIsEmailInviteModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const isAdmin = propIsAdmin ?? isCreator;
  const activeFocusingMembers = members.filter((m) => m.current_status === 'focusing');
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
      return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="group-chat-panel glass-panel">
      <div className="group-chat-header">
        <div className="group-chat-identity">
          <div className="group-chat-icon-wrap" onClick={() => setIsInfoModalOpen(true)} title="Clique para ver informações completas">
            <span className="group-chat-icon">{group.avatar_icon}</span>
          </div>
          <div className="group-chat-titles" onClick={() => setIsInfoModalOpen(true)} title="Clique para ver informações completas">
            <h3 className="group-chat-name">{group.name}</h3>
            <span className="group-chat-subinfo">{group.category} • {group.code}</span>
          </div>
          <button type="button" className="group-info-pill-btn" onClick={() => setIsInfoModalOpen(true)} title="Ver detalhes da sala">
            <Info size={13} /><span>Info</span>
          </button>
        </div>

        <div className="group-chat-toolbar">
          <div className="group-chat-pills-row">
            <button
              className="group-members-btn"
              onClick={() => {
                if (onOpenMembersModal) onOpenMembersModal();
                else if (onToggleMembersPanel) onToggleMembersPanel();
                else setIsMembersModalOpen(true);
              }}
              title={`Ver ${group.member_count} membros da sala`}
              type="button"
            >
              <Users size={13} />
              <span>Membros</span>
              <span className="members-count-pill">{group.member_count}</span>
              {activeFocusingMembers.length > 0 && <span className="live-dot-mini" title={`${activeFocusingMembers.length} em foco`} />}
            </button>
            <button className="group-rules-btn" onClick={() => setIsRulesModalOpen(true)} type="button">
              <BookOpen size={13} />
              <span>Regras</span>
              {group.rules && group.rules.length > 0 && <span className="rules-count-pill">{group.rules.length}</span>}
            </button>
            <button className="group-invite-btn" onClick={handleCopyInvite} type="button">
              {copied ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
              <span>{copied ? 'Copiado!' : 'Convidar'}</span>
            </button>
            <button className="group-invite-email-btn" onClick={() => setIsEmailInviteModalOpen(true)} type="button">
              <Mail size={13} /><span>E-mail</span>
            </button>
          </div>

          <div className="group-header-actions">
            {isAdmin && onUpdateGroup && (
              <button type="button" className="btn btn-secondary btn-chat-header-action" onClick={() => setIsEditGroupModalOpen(true)}>
                <Edit3 size={13} /><span>Editar Grupo</span>
              </button>
            )}
            {isCreator ? (
              <button type="button" className="btn btn-danger btn-chat-header-action" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 size={13} /><span>Excluir Grupo</span>
              </button>
            ) : isMember ? (
              <button type="button" className="btn btn-secondary btn-chat-header-action" onClick={() => setIsLeaveModalOpen(true)}>
                <LogOut size={13} /><span>Sair</span>
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-chat-header-action" onClick={() => onJoinGroup(group.id)}>
                <UserPlus size={13} /><span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeFocusingMembers.length > 0 && (
        <div className="live-focus-radar-banner">
          <div className="live-radar-pulse"><span className="live-radar-dot" /></div>
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

      <ChatMessagesFeed group={group} messages={messages} formatTime={formatTime} />
      <ChatInputArea group={group} isMember={isMember} onSendMessage={onSendMessage} onJoinGroup={onJoinGroup} />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Grupo de Estudos"
        message={<>Tem certeza que deseja excluir permanentemente o grupo <strong>"{group.name}"</strong>?</>}
        confirmText="Excluir Grupo"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => { setIsDeleteModalOpen(false); onDeleteGroup(group.id); }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Sair do Grupo"
        message={<>Deseja realmente sair do grupo <strong>"{group.name}"</strong>?</>}
        confirmText="Sair do Grupo"
        cancelText="Permanecer"
        variant="warning"
        confirmIcon={<LogOut size={24} className="confirm-icon-warning" />}
        onConfirm={() => { setIsLeaveModalOpen(false); onLeaveGroup(group.id); }}
        onCancel={() => setIsLeaveModalOpen(false)}
      />

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

      <GroupRulesModal
        isOpen={isRulesModalOpen}
        group={group}
        isAdmin={isAdmin}
        onClose={() => setIsRulesModalOpen(false)}
        onOpenEdit={() => setIsEditGroupModalOpen(true)}
      />

      <InviteEmailModal isOpen={isEmailInviteModalOpen} group={group} onClose={() => setIsEmailInviteModalOpen(false)} />

      {onUpdateGroup && (
        <EditGroupModal isOpen={isEditGroupModalOpen} group={group} onClose={() => setIsEditGroupModalOpen(false)} onUpdateGroup={onUpdateGroup} />
      )}

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

