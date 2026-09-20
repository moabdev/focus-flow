import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Sparkles } from 'lucide-react';
import { StudyGroup, GroupMember, GroupMessage, SupabaseProfile } from '../../types';
import { storageGroups } from '../../services/storageGroups';
import { GroupChatPanel } from './GroupChatPanel';
import { CreateGroupModal } from './CreateGroupModal';

interface StudyGroupsViewProps {
  userProfile?: SupabaseProfile | null;
  isUserStudying?: boolean;
  activeTaskTitle?: string;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({
  userProfile,
  isUserStudying,
  activeTaskTitle,
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>(() => storageGroups.getGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(() => groups[0]?.id || '');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Carrega membros e mensagens sempre que o grupo ativo mudar
  useEffect(() => {
    if (activeGroupId) {
      setMembers(storageGroups.getMembers(activeGroupId));
      setMessages(storageGroups.getMessages(activeGroupId));
    }
  }, [activeGroupId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const handleCreateGroup = (data: {
    name: string;
    description: string;
    category: string;
    avatar_icon: string;
  }) => {
    const newGroup = storageGroups.createGroup(data);
    setGroups(storageGroups.getGroups());
    setActiveGroupId(newGroup.id);
  };

  const handleSendMessage = (text: string) => {
    if (!activeGroupId) return;
    const sender = userProfile?.full_name || 'Você';
    storageGroups.sendMessage(activeGroupId, text, sender);
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

        <button className="main-start-btn" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} /> Novo Grupo
        </button>
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
            {filteredGroups.map((grp) => (
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
                  </div>
                </div>
              </button>
            ))}

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
            onSendMessage={handleSendMessage}
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
            <span>Membros Online ({members.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.map((m) => (
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
                  <div className="member-name">{m.user_name}</div>
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
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Criação de Grupo */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};
