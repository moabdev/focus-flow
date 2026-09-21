import React from 'react';
import { Search } from 'lucide-react';
import { Project } from '@/features/core/types';

interface DraftsFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedProjectFilter: string;
  setSelectedProjectFilter: (val: string) => void;
  sortBy: 'recent' | 'oldest' | 'title';
  setSortBy: (val: 'recent' | 'oldest' | 'title') => void;
  projects: Project[];
  totalNotes: number;
  unassignedNotesCount: number;
  getProjectNoteCount: (projectId: string) => number;
}

export const DraftsFilters: React.FC<DraftsFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedProjectFilter,
  setSelectedProjectFilter,
  sortBy,
  setSortBy,
  projects,
  totalNotes,
  unassignedNotesCount,
  getProjectNoteCount,
}) => {
  return (
    <div className="drafts-filter-bar">
      <div className="drafts-search-box">
        <Search size={15} />
        <input
          type="text"
          placeholder="Buscar por título ou conteúdo das notas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      <div className="drafts-filters-right">
        <select
          className="drafts-project-filter-select"
          value={selectedProjectFilter}
          onChange={(e) => setSelectedProjectFilter(e.target.value)}
          title="Filtrar por projeto vinculado"
        >
          <option value="todos">Todos os Projetos ({totalNotes})</option>
          <option value="sem-projeto">Sem Projeto ({unassignedNotesCount})</option>
          {projects.map((p) => {
            const count = getProjectNoteCount(p.id);
            return (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.title} ({count})
              </option>
            );
          })}
        </select>

        <select
          className="drafts-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'title')}
          title="Ordenar rascunhos"
        >
          <option value="recent">Mais recentes primeiro</option>
          <option value="oldest">Mais antigos primeiro</option>
          <option value="title">Ordem alfabética (A-Z)</option>
        </select>
      </div>
    </div>
  );
};
