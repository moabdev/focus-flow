import React from 'react';
import { Users, Plus, Sparkles, KeyRound, UserMinus } from 'lucide-react';
import { SupabaseProfile } from '@/features/core/types';
import { GroupChatPanel } from './GroupChatPanel';
import { CreateGroupModal } from './CreateGroupModal';
import { JoinGroupModal } from './JoinGroupModal';
import { GroupMembersModal } from './GroupMembersModal';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';
import { useStudyGroups } from './useStudyGroups';
import { GroupsSidebar } from './GroupsSidebar';

interface StudyGroupsViewProps {
  userProfile?: SupabaseProfile | null;
  isUserStudying?: boolean;
  activeTaskTitle?: string;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({ userProfile }) => {
  const {
    activeGroup,
    activeGroupId,
    setActiveGroupId,
    members,
    messages,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isJoinModalOpen,
    setIsJoinModalOpen,
    isMembersModalOpen,
    setIsMembersModalOpen,
    memberToRemove,
    setMemberToRemove,
    selectedCategory,
    setSelectedCategory,
    mobileTab,
    setMobileTab,
    currentUserName,
    isMember,
    isCreator,
    categories,
    filteredGroups,
    getGroupFocusCount,
    handleCreateGroup,
    handleUpdateGroup,
    handleJoinGroup,
    handleJoinDirect,
    handleLeaveGroup,
    handleDeleteGroup,
    handleConfirmRemoveMember,
    handleSendMessage,
  } = useStudyGroups(userProfile);

  return (
    <div className="study-groups-container">
      <div className="groups-header-bar">
        <div className="groups-title-row">
          <div className="groups-title-icon-halo">
            <Users size={22} color="var(--accent-primary)" />
          </div>
          <div className="groups-title-text-group">
            <div className="groups-title-headline-wrap">
              <h2 className="groups-title-heading">Grupos de Estudo & Chat ao Vivo</h2>
              <span className="groups-live-pulse-badge">
                <span className="live-dot-mini" /> Salas em Tempo Real
              </span>
            </div>
            <p className="groups-title-desc">
              Estude junto com colegas, compartilhe ciclos de Pomodoro e mantenha a consistência.
            </p>
          </div>
        </div>

        <div className="groups-header-actions-top">
          <button className="btn-enter-code" onClick={() => setIsJoinModalOpen(true)}>
            <KeyRound size={15} /><span>Entrar com Código</span>
          </button>
          <button className="btn btn-primary btn-new-group" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /><span>Criar Novo Grupo</span>
          </button>
        </div>
      </div>

      <div className="groups-mobile-nav-bar">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'groups' ? 'active' : ''}`}
          onClick={() => setMobileTab('groups')}
        >
          <span className="mobile-tab-label">Salas ({filteredGroups.length})</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          <span className="mobile-tab-label">Chat #{activeGroup?.name || 'Sala'}</span>
        </button>
        <button
          type="button"
          className="mobile-tab-btn"
          onClick={() => setIsMembersModalOpen(true)}
        >
          <span className="mobile-tab-label">Membros ({members.length})</span>
        </button>
      </div>

      <div className={`groups-layout mobile-${mobileTab}`}>
        <GroupsSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredGroups={filteredGroups}
          activeGroupId={activeGroupId}
          setActiveGroupId={setActiveGroupId}
          setMobileTab={setMobileTab}
          currentUserName={currentUserName}
          getGroupFocusCount={getGroupFocusCount}
        />

        {activeGroup ? (
          <GroupChatPanel
            group={activeGroup}
            messages={messages}
            members={members}
            isMember={isMember}
            isCreator={isCreator}
            isAdmin={isCreator}
            onSendMessage={handleSendMessage}
            onJoinGroup={handleJoinDirect}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            onUpdateGroup={handleUpdateGroup}
            onOpenMembersModal={() => setIsMembersModalOpen(true)}
            onRemoveMember={(m) => setMemberToRemove(m)}
          />
        ) : (
          <div className="group-chat-panel glass-panel empty-selection">
            <Sparkles size={36} color="var(--accent-primary)" />
            <h3>Selecione um grupo de estudos</h3>
            <p>Escolha uma sala ao lado ou crie uma nova para estudar em comunidade.</p>
          </div>
        )}
      </div>

      {activeGroup && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          group={activeGroup}
          members={members}
          currentUserName={currentUserName}
          isAdmin={isCreator}
          isCreator={isCreator}
          onClose={() => setIsMembersModalOpen(false)}
          onRemoveMember={(m) => setMemberToRemove(m)}
        />
      )}

      <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreateGroup={handleCreateGroup} />
      <JoinGroupModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onJoinGroup={handleJoinGroup} />

      <ConfirmModal
        isOpen={!!memberToRemove}
        title="Remover Membro da Sala"
        message={
          <>Tem certeza que deseja remover <strong>"{memberToRemove?.user_name}"</strong> desta sala de estudos? O usuário perderá o acesso ao chat até que entre novamente com o código.</>
        }
        confirmText="Remover Membro"
        cancelText="Cancelar"
        variant="danger"
        confirmIcon={<UserMinus size={24} className="confirm-icon-danger" />}
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
};
