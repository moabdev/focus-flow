import React from 'react';
import {
  X,
  Users,
  UserMinus,
  Sparkles,
  Coffee,
  Clock,
  Radio,
} from 'lucide-react';
import { StudyGroup, GroupMember } from '../../types';

interface GroupMembersModalProps {
  isOpen: boolean;
  group: StudyGroup;
  members: GroupMember[];
  currentUserName?: string;
  isAdmin?: boolean;
  isCreator?: boolean;
  onClose: () => void;
  onRemoveMember?: (member: GroupMember) => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  group,
  members,
  currentUserName = 'Você',
  isAdmin = false,
  isCreator = false,
  onClose,
  onRemoveMember,
}) => {
  if (!isOpen) return null;

  const isSameUser = (u1?: string, u2?: string) => {
    if (!u1 || !u2) return false;
    const clean = (s: string) => s.trim().toLowerCase();
    const c1 = clean(u1);
    const c2 = clean(u2);
    if (c1 === c2) return true;
    if ((c1 === 'você' || c1 === 'voce') && (c2 === 'você' || c2 === 'voce')) return true;
    return false;
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const focusingMembers = members.filter((m) => m.current_status === 'focusing');
  const breakMembers = members.filter((m) => m.current_status === 'break');
  const idleMembers = members.filter((m) => m.current_status === 'idle');

  const renderMemberRow = (m: GroupMember, statusClass: string = '') => {
    const isItemAdmin = m.role === 'admin' || (group.created_by && isSameUser(m.user_name, group.created_by));
    const canRemove = (isAdmin || isCreator) && !isItemAdmin && !isSameUser(m.user_name, currentUserName) && onRemoveMember;

    return (
      <div key={m.id} className={`member-item-row ${statusClass}`}>
        <div className="member-avatar-wrap">
          <div className="member-avatar-circle">
            {m.user_avatar ? <img src={m.user_avatar} alt={m.user_name} /> : m.user_name.charAt(0).toUpperCase()}
          </div>
          <span
            className={`member-status-indicator ${m.current_status}`}
            title={
              m.current_status === 'focusing'
                ? 'Em foco no Pomodoro'
                : m.current_status === 'break'
                ? 'Em pausa rápida'
                : 'Disponível'
            }
          />
        </div>
        <div className="member-info">
          <div className="member-name-row">
            <span className="member-name">{m.user_name}</span>
            {isItemAdmin && <span className="member-role-badge admin" title="Administrador do Grupo">👑 Admin</span>}
          </div>
          {m.current_task_title && (
            <div className="member-task-sub" title={m.current_task_title}>
              🎯 {m.current_task_title}
            </div>
          )}
          <div className="member-weekly-time">
            {m.current_status === 'break' ? '☕ Pausa • ' : ''}
            ⏱️ {formatSeconds(m.weekly_seconds)} esta semana
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            className="member-remove-btn"
            title={`Remover ${m.user_name} do grupo`}
            onClick={() => onRemoveMember(m)}
          >
            <UserMinus size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel group-members-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="group-info-icon-badge">
              <Users size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                Membros da Sala
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                #{group.name} • {members.length} {members.length === 1 ? 'membro cadastrado' : 'membros cadastrados'}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-form group-members-modal-body">
          {/* Radar e Contadores de Status */}
          <div className="members-modal-summary-bar">
            <div className="members-modal-stat-pill">
              <Users size={13} />
              <span>{members.length} {members.length === 1 ? 'Total' : 'Totais'}</span>
            </div>

            {focusingMembers.length > 0 && (
              <div className="members-modal-stat-pill focusing">
                <Radio size={13} className="live-icon-pulse" />
                <span>{focusingMembers.length} {focusingMembers.length === 1 ? 'Focando Agora' : 'Focando Agora'}</span>
              </div>
            )}

            {breakMembers.length > 0 && (
              <div className="members-modal-stat-pill break">
                <Coffee size={13} />
                <span>{breakMembers.length} Em Pausa</span>
              </div>
            )}

            {idleMembers.length > 0 && (
              <div className="members-modal-stat-pill idle">
                <Clock size={13} />
                <span>{idleMembers.length} Disponíveis</span>
              </div>
            )}
          </div>

          {/* Lista de Membros Organizada */}
          <div className="members-modal-scroll-list">
            {/* Seção 1: Focando Agora */}
            {focusingMembers.length > 0 && (
              <div className="members-group-section">
                <div className="members-section-label focusing">
                  <Sparkles size={13} />
                  <span>Focando Agora — {focusingMembers.length}</span>
                </div>
                {focusingMembers.map((m) => renderMemberRow(m, 'focusing'))}
              </div>
            )}

            {/* Seção 2: Em Pausa */}
            {breakMembers.length > 0 && (
              <div className="members-group-section">
                <div className="members-section-label break">
                  <Coffee size={13} />
                  <span>Em Pausa — {breakMembers.length}</span>
                </div>
                {breakMembers.map((m) => renderMemberRow(m))}
              </div>
            )}

            {/* Seção 3: Disponíveis */}
            {idleMembers.length > 0 && (
              <div className="members-group-section">
                <div className="members-section-label idle">
                  <Clock size={13} />
                  <span>Disponíveis — {idleMembers.length}</span>
                </div>
                {idleMembers.map((m) => renderMemberRow(m))}
              </div>
            )}

            {members.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum membro nesta sala ainda.
              </div>
            )}
          </div>

          {/* Rodapé com botão de fechar */}
          <div className="modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isAdmin || isCreator ? '👑 Você é administrador desta sala' : 'Membro participante'}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '0.55rem 1.4rem' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
