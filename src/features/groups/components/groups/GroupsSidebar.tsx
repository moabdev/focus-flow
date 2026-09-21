import React from 'react';
import { Search } from 'lucide-react';
import { StudyGroup } from '@/features/core/types';
import { isSameUser } from '@/features/groups/api/storageGroups';

interface GroupsSidebarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  filteredGroups: StudyGroup[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  setMobileTab: (tab: 'groups' | 'chat') => void;
  currentUserName: string;
  getGroupFocusCount: (id: string) => number;
}

export const GroupsSidebar: React.FC<GroupsSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredGroups,
  activeGroupId,
  setActiveGroupId,
  setMobileTab,
  currentUserName,
  getGroupFocusCount,
}) => {
  return (
    <div className="groups-sidebar-panel glass-panel">
      <div className="groups-search-box">
        <Search size={15} />
        <input
          type="text"
          placeholder="Buscar sala ou tema..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')} title="Limpar busca">
            ×
          </button>
        )}
      </div>

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
                  {userIsCreator && <span className="group-creator-mini-pill admin">👑 Admin</span>}
                </div>
                <div className="group-item-meta">
                  <span className="group-category-tag">{grp.category}</span>
                  <span>•</span>
                  <span>{grp.member_count} membros</span>
                  {groupFocusing > 0 && (
                    <span className="group-focusing-indicator">
                      <span className="live-dot-mini" /> {groupFocusing} focando
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="empty-groups-filter">
            <p>Nenhuma sala encontrada para esta busca.</p>
            {selectedCategory !== 'Todas' && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                onClick={() => setSelectedCategory('Todas')}
              >
                Ver todas as categorias
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
