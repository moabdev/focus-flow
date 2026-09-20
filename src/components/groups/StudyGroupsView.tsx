import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Sparkles, KeyRound } from 'lucide-react';
import { StudyGroup, GroupMember, GroupMessage, SupabaseProfile } from '../../types';
import { storageGroups, isSameUser, isGroupCreator } from '../../services/storageGroups';
import { GroupChatPanel } from './GroupChatPanel';
import { CreateGroupModal } from './CreateGroupModal';
import { JoinGroupModal } from './JoinGroupModal';
import { useToast } from '../../context/ToastContext';

interface StudyGroupsViewProps {
  userProfile?: SupabaseProfile | null;
  isUserStudying?: boolean;
  activeTaskTitle?: string;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({
  userProfile,
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>(() => storageGroups.getGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(() => groups[0]?.id || '');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const toast = useToast();

  const currentUserName = userProfile?.full_name || 'Você';

  // Carrega membros e mensagens sempre que o grupo ativo mudar
  useEffect(() => {
    if (activeGroupId) {
      setMembers(storageGroups.getMembers(activeGroupId));
      setMessages(storageGroups.getMessages(activeGroupId));
    } else {
      setMembers([]);
      setMessages([]);
    }
  }, [activeGroupId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const isMember = members.some((m) => isSameUser(m.user_name, currentUserName));
  const isCreator = activeGroup ? isGroupCreator(activeGroup, members, currentUserName) : false;

  const handleCreateGroup = (data: {
    name: string;
    description: string;
    category: string;
    avatar_icon: string;
  }) => {
    const newGroup = storageGroups.createGroup(data, currentUserName);
    const updated = storageGroups.getGroups();
    setGroups(updated);
    setActiveGroupId(newGroup.id);
    toast.success(`Grupo "${newGroup.name}" criado com sucesso!`, 'Grupo Criado');
  };

  const handleJoinGroup = (code: string) => {
    const res = storageGroups.joinGroupByCode(code, currentUserName);
    if (res.success && res.group) {
      setGroups(storageGroups.getGroups());
      setActiveGroupId(res.group.id);
      toast.success(`Você entrou no grupo "${res.group.name}"!`, 'Bem-vindo(a)');
    }
    return res;
  };

  const handleJoinDirect = (groupId: string) => {
    const res = storageGroups.joinGroup(groupId, currentUserName);
    if (res.success && res.group) {
      setGroups(storageGroups.getGroups());
      setMembers(storageGroups.getMembers(groupId));
      setMessages(storageGroups.getMessages(groupId));
      toast.success(`Você entrou no grupo "${res.group.name}"!`, 'Bem-vindo(a)');
    } else {
      toast.error(res.error || 'Erro ao entrar no grupo.', 'Erro');
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    const res = storageGroups.leaveGroup(groupId, currentUserName);
    if (res.success) {
      setGroups(storageGroups.getGroups());
      setMembers(storageGroups.getMembers(groupId));
      setMessages(storageGroups.getMessages(groupId));
      toast.info(`Você saiu do grupo "${target?.name || ''}".`, 'Grupo');
    } else {
      toast.error(res.error || 'Erro ao sair do grupo.', 'Erro');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    storageGroups.deleteGroup(groupId);
    const updated = storageGroups.getGroups();
    setGroups(updated);
    if (activeGroupId === groupId) {
      setActiveGroupId(updated[0]?.id || '');
    }
    toast.success(`Grupo "${target?.name || ''}" foi excluído.`, 'Grupo Excluído');
  };

  const handleSendMessage = (text: string) => {
    if (!activeGroupId) return;
    storageGroups.sendMessage(activeGroupId, text, currentUserName);
    setMessages(storageGroups.getMessages(activeGroupId));
  };

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
  });

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="study-groups-container">
      {/* Topo da Visão de Grupos */}
      <div className="groups-header-bar">
        <div>
          <h2 className="pm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--accent-primary)" />
            Grupos de Estudo & Chat
          </h2>
          <p className="pm-subtitle">
            Estude em comunidade, compartilhe metas de foco e motive seus colegas em tempo real.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="filter-chip"
            onClick={() => setIsJoinModalOpen(true)}
            style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <KeyRound size={15} /> Entrar com Código
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Novo Grupo
          </button>
        </div>
      </div>

      {/* Grid Principal com 3 Colunas: Grupos, Chat, Membros */}
      <div className="groups-layout">
        {/* Coluna 1: Lista de Grupos */}
        <div className="groups-sidebar-panel glass-panel">
          <div className="groups-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="groups-list">
            {filteredGroups.map((grp) => {
              const userIsCreator = grp.created_by && isSameUser(grp.created_by, currentUserName);

              return (
                <button
                  key={grp.id}
                  className={`group-item-card ${grp.id === activeGroupId ? 'active' : ''}`}
                  onClick={() => setActiveGroupId(grp.id)}
                >
                  <span className="group-item-icon">{grp.avatar_icon}</span>
                  <div className="group-item-info">
                    <div className="group-item-name">{grp.name}</div>
                    <div className="group-item-meta">
                      {grp.category} • {grp.member_count} membros
                      {userIsCreator && (
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}> • Criador</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredGroups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Nenhum grupo encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Feed e Painel do Chat */}
        {activeGroup ? (
          <GroupChatPanel
            group={activeGroup}
            messages={messages}
            members={members}
            isMember={isMember}
            isCreator={isCreator}
            onSendMessage={handleSendMessage}
            onJoinGroup={handleJoinDirect}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        ) : (
          <div className="group-chat-panel glass-panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={32} color="var(--accent-primary)" />
            <p>Selecione um grupo para começar a conversar.</p>
          </div>
        )}

        {/* Coluna 3: Membros do Grupo */}
        <div className="group-members-panel glass-panel">
          <div className="group-members-title">
            <span>Membros ({members.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.map((m) => {
              const isItemCreator = m.role === 'admin';

              return (
                <div key={m.id} className="member-item-row">
                  <span
                    className={`member-status-indicator ${m.current_status}`}
                    title={
                      m.current_status === 'focusing'
                        ? 'Em Foco'
                        : m.current_status === 'break'
                        ? 'Em Pausa'
                        : 'Disponível'
                    }
                  />
                  <div className="member-info">
                    <div className="member-name" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{m.user_name}</span>
                      {isItemCreator && <span className="member-role-badge">Criador</span>}
                    </div>
                    {m.current_task_title && (
                      <div className="member-task-sub" title={m.current_task_title}>
                        {m.current_task_title}
                      </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {formatSeconds(m.weekly_seconds)} semanais
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Criação de Grupo */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Modal de Entrada com Código de Convite */}
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinGroup={handleJoinGroup}
      />
    </div>
  );
};
