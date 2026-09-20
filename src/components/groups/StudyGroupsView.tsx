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

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [showMembersPanel, setShowMembersPanel] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'groups' | 'chat' | 'members'>('chat');

  const categories = ['Todas', ...Array.from(new Set(groups.map((g) => g.category)))];

  const filteredGroups = groups.filter((g) => {
    const matchesCategory = selectedCategory === 'Todas' || g.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
  });

  const getGroupFocusCount = (groupId: string) => {
    const gMembers = storageGroups.getMembers(groupId);
    return gMembers.filter((m) => m.current_status === 'focusing').length;
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const focusingMembers = members.filter((m) => m.current_status === 'focusing');
  const breakMembers = members.filter((m) => m.current_status === 'break');
  const idleMembers = members.filter((m) => m.current_status === 'idle');

  return (
    <div className="study-groups-container">
      {/* Topo da Visão de Grupos */}
      <div className="groups-header-bar">
        <div>
          <div className="groups-title-row">
            <div className="groups-title-icon-halo">
              <Users size={22} color="var(--accent-primary)" />
            </div>
            <h2 className="pm-title">Grupos de Estudo & Chat ao Vivo</h2>
            <span className="groups-live-pulse-badge">
              <span className="live-radar-dot" />
              {groups.reduce((acc, g) => acc + getGroupFocusCount(g.id), 0)} focando agora
            </span>
          </div>
          <p className="pm-subtitle">
            Estude em comunidade, compartilhe metas de foco e motive seus colegas em tempo real.
          </p>
        </div>

        <div className="groups-header-actions-top">
          <button
            className="filter-chip btn-enter-code"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <KeyRound size={15} /> Entrar com Código
          </button>
          <button className="btn btn-primary btn-new-group" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Novo Grupo
          </button>
        </div>
      </div>

      {/* Seletor Mobile de Abas */}
      <div className="groups-mobile-nav-bar">
        <button
          className={`mobile-tab-btn ${mobileTab === 'groups' ? 'active' : ''}`}
          onClick={() => setMobileTab('groups')}
        >
          Salas ({groups.length})
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          Chat #{activeGroup?.name || 'Geral'}
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'members' ? 'active' : ''}`}
          onClick={() => setMobileTab('members')}
        >
          Membros ({members.length})
        </button>
      </div>

      {/* Grid Principal com 3 Colunas Fluidas */}
      <div className={`groups-layout ${!showMembersPanel ? 'hide-members' : ''} mobile-${mobileTab}`}>
        {/* Coluna 1: Lista de Grupos */}
        <div className="groups-sidebar-panel glass-panel">
          <div className="groups-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por sala ou tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Filtros de Categoria */}
          <div className="groups-category-filter-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="groups-list">
            {filteredGroups.map((grp) => {
              const userIsCreator = grp.created_by && isSameUser(grp.created_by, currentUserName);
              const groupFocusing = getGroupFocusCount(grp.id);

              return (
                <button
                  key={grp.id}
                  className={`group-item-card ${grp.id === activeGroupId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveGroupId(grp.id);
                    setMobileTab('chat');
                  }}
                >
                  <div className="group-item-icon-wrap">
                    <span className="group-item-icon">{grp.avatar_icon}</span>
                  </div>
                  <div className="group-item-info">
                    <div className="group-item-top-row">
                      <span className="group-item-name">{grp.name}</span>
                      {userIsCreator && (
                        <span className="group-creator-mini-pill">Criador</span>
                      )}
                    </div>
                    <div className="group-item-meta">
                      <span className="group-category-tag">{grp.category}</span>
                      <span>•</span>
                      <span>{grp.member_count} membros</span>
                      {groupFocusing > 0 && (
                        <span className="group-focusing-indicator">
                          <span className="live-dot-mini" /> {groupFocusing} em foco
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="empty-groups-filter">
                <Sparkles size={24} color="var(--text-muted)" />
                <p>Nenhuma sala encontrada para esta busca.</p>
                {selectedCategory !== 'Todas' && (
                  <button
                    type="button"
                    className="filter-chip"
                    style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setSelectedCategory('Todas')}
                  >
                    Ver todas as categorias
                  </button>
                )}
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
            showMembersPanel={showMembersPanel}
            onToggleMembersPanel={() => setShowMembersPanel((prev) => !prev)}
          />
        ) : (
          <div className="group-chat-panel glass-panel empty-selection">
            <Sparkles size={36} color="var(--accent-primary)" />
            <h3>Selecione um grupo de estudos</h3>
            <p>Escolha uma sala ao lado ou crie uma nova para estudar em comunidade.</p>
          </div>
        )}

        {/* Coluna 3: Membros do Grupo e Status ao Vivo */}
        {showMembersPanel && (
          <div className="group-members-panel glass-panel">
            <div className="group-members-header">
              <div className="group-members-title">
                <Users size={15} />
                <span>Membros ({members.length})</span>
              </div>
              {focusingMembers.length > 0 && (
                <span className="members-focusing-badge">
                  <span className="live-dot-mini" /> {focusingMembers.length} em foco
                </span>
              )}
            </div>

            <div className="members-scroll-area">
              {/* Seção 1: Focando Agora */}
              {focusingMembers.length > 0 && (
                <div className="members-group-section">
                  <div className="members-section-label focusing">
                    <span>Focando Agora — {focusingMembers.length}</span>
                  </div>
                  {focusingMembers.map((m) => {
                    const isItemCreator = m.role === 'admin';
                    return (
                      <div key={m.id} className="member-item-row focusing">
                        <div className="member-avatar-wrap">
                          <div className="member-avatar-circle">
                            {m.user_avatar ? <img src={m.user_avatar} alt={m.user_name} /> : m.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="member-status-indicator focusing" title="Em foco no Pomodoro" />
                        </div>
                        <div className="member-info">
                          <div className="member-name-row">
                            <span className="member-name">{m.user_name}</span>
                            {isItemCreator && <span className="member-role-badge">Criador</span>}
                          </div>
                          {m.current_task_title && (
                            <div className="member-task-sub" title={m.current_task_title}>
                              🎯 {m.current_task_title}
                            </div>
                          )}
                          <div className="member-weekly-time">
                            ⏱️ {formatSeconds(m.weekly_seconds)} esta semana
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seção 2: Em Pausa */}
              {breakMembers.length > 0 && (
                <div className="members-group-section">
                  <div className="members-section-label break">
                    <span>Em Pausa — {breakMembers.length}</span>
                  </div>
                  {breakMembers.map((m) => {
                    const isItemCreator = m.role === 'admin';
                    return (
                      <div key={m.id} className="member-item-row">
                        <div className="member-avatar-wrap">
                          <div className="member-avatar-circle">
                            {m.user_avatar ? <img src={m.user_avatar} alt={m.user_name} /> : m.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="member-status-indicator break" title="Em pausa rápida" />
                        </div>
                        <div className="member-info">
                          <div className="member-name-row">
                            <span className="member-name">{m.user_name}</span>
                            {isItemCreator && <span className="member-role-badge">Criador</span>}
                          </div>
                          <div className="member-weekly-time">
                            ☕ Pausa • {formatSeconds(m.weekly_seconds)} semanais
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seção 3: Disponíveis */}
              {idleMembers.length > 0 && (
                <div className="members-group-section">
                  <div className="members-section-label idle">
                    <span>Disponíveis — {idleMembers.length}</span>
                  </div>
                  {idleMembers.map((m) => {
                    const isItemCreator = m.role === 'admin';
                    return (
                      <div key={m.id} className="member-item-row">
                        <div className="member-avatar-wrap">
                          <div className="member-avatar-circle">
                            {m.user_avatar ? <img src={m.user_avatar} alt={m.user_name} /> : m.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="member-status-indicator idle" title="Disponível" />
                        </div>
                        <div className="member-info">
                          <div className="member-name-row">
                            <span className="member-name">{m.user_name}</span>
                            {isItemCreator && <span className="member-role-badge">Criador</span>}
                          </div>
                          <div className="member-weekly-time">
                            {formatSeconds(m.weekly_seconds)} semanais
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {members.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Nenhum membro nesta sala ainda.
                </div>
              )}
            </div>
          </div>
        )}
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
