import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  Columns,
  Trash2,
  Copy,
  Check,
  Folder,
  CheckSquare,
  Mic,
  MicOff,
  Sparkles,
} from 'lucide-react';
import { storageService } from '@/features/core/api/storage';
import { QuickNote, Project, Subtask } from '@/features/core/types';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';
import { useToast } from '@/features/core/contexts/ToastContext';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';

interface DraftsViewProps {
  projects: Project[];
  subtasks: Subtask[];
  onOpenTimerTab?: () => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  projects = [],
  subtasks = [],
}) => {
  const [notes, setNotes] = useState<QuickNote[]>(() => storageService.getQuickNotes());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<QuickNote | null>(null);
  const [isSaved, setIsSaved] = useState(true);

  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Recarrega notas do storage
  const refreshNotes = useCallback(() => {
    const loaded = storageService.getQuickNotes();
    setNotes(loaded);
    if (loaded.length > 0 && (!activeNoteId || !loaded.some((n) => n.id === activeNoteId))) {
      setActiveNoteId(loaded[0].id);
    }
  }, [activeNoteId]);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  // Transcrição de voz integrada
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal || !transcript.trim() || !activeNote) return;

      const textarea = textareaRef.current;
      const cleanTranscript = transcript.trim();
      const prev = activeNote.content || '';
      let newContent = '';

      if (textarea) {
        const start = textarea.selectionStart ?? prev.length;
        const end = textarea.selectionEnd ?? prev.length;
        const before = prev.substring(0, start);
        const after = prev.substring(end);
        const needSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
        newContent = `${before}${needSpace ? ' ' : ''}${cleanTranscript} ${after}`;

        setTimeout(() => {
          if (textareaRef.current) {
            const nextCursor = start + (needSpace ? 1 : 0) + cleanTranscript.length + 1;
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
            textareaRef.current.focus();
          }
        }, 25);
      } else {
        const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
        newContent = `${prev}${needSpace ? ' ' : ''}${cleanTranscript} `;
      }

      storageService.updateQuickNote(activeNote.id, { content: newContent });
      refreshNotes();
      setIsSaved(true);
      toast.info('Texto inserido via ditado por voz.', 'Ditado');
    },
    [activeNote, refreshNotes, toast]
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    toggleListening: toggleSpeech,
  } = useSpeechRecognition({
    lang: 'pt-BR',
    continuous: true,
    interimResults: true,
    onResult: handleSpeechResult,
  });

  // Atalho Alt+D para microfone quando no modo dividido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSpeech]);

  // Criação de novo rascunho
  const handleCreateDraft = () => {
    const newNote = storageService.createQuickNote({
      title: 'Novo Rascunho',
      content: '',
      project_id: selectedProjectFilter !== 'todos' && selectedProjectFilter !== 'sem-projeto' ? selectedProjectFilter : null,
      subtask_id: null,
    });
    refreshNotes();
    setActiveNoteId(newNote.id);
    setViewMode('split');
    toast.success('Novo rascunho criado com sucesso!', 'Rascunho Criado');
  };

  // Atualização do rascunho ativo
  const handleUpdateActiveNote = (updates: Partial<QuickNote>) => {
    if (!activeNote) return;
    setIsSaved(false);
    storageService.updateQuickNote(activeNote.id, updates);
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)));
    setTimeout(() => setIsSaved(true), 300);
  };

  // Cópia de conteúdo
  const handleCopyNote = (note: QuickNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      navigator.clipboard.writeText(note.content || note.title);
      setCopiedId(note.id);
      toast.success(`Rascunho "${note.title}" copiado para a área de transferência!`, 'Copiado');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('Não foi possível copiar para a área de transferência.', 'Erro');
    }
  };

  // Exclusão com confirmação
  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    storageService.deleteQuickNote(noteToDelete.id);
    const title = noteToDelete.title;
    setNoteToDelete(null);
    refreshNotes();
    toast.info(`Rascunho "${title}" excluído.`, 'Rascunho Excluído');
  };

  // Formatação de data
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Contagem de palavras
  const getWordCount = (text?: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Filtragem e ordenação
  const filteredNotes = notes.filter((note) => {
    // Filtro por projeto
    if (selectedProjectFilter === 'sem-projeto') {
      if (note.project_id) return false;
    } else if (selectedProjectFilter !== 'todos') {
      if (note.project_id !== selectedProjectFilter) return false;
    }

    // Filtro por busca
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (note.title || '').toLowerCase().includes(q);
    const contentMatch = (note.content || '').toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    }
    // recent
    return new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime();
  });

  // Subtarefas do projeto vinculado
  const projectSubtasks = subtasks.filter((s) => s.project_id === activeNote?.project_id);
  const linkedCount = notes.filter((n) => !!n.project_id).length;

  return (
    <div className="drafts-container">
      {/* Header Superior da Tela */}
      <div className="drafts-header-bar">
        <div className="drafts-title-row">
          <div className="drafts-title-icon-halo">
            <FileText size={22} color="var(--accent-primary)" />
          </div>
          <div className="drafts-title-text-group">
            <div className="drafts-title-headline-wrap">
              <h2 className="drafts-title-heading">Rascunhos & Anotações Rápidas</h2>
              <span className="drafts-stats-badge">
                <FileText size={13} /> {notes.length} {notes.length === 1 ? 'rascunho' : 'rascunhos'} ({linkedCount} vinculados)
              </span>
            </div>
            <p className="drafts-title-desc">
              Ideias, resumos de estudo e insights vinculados aos seus projetos e subtarefas.
            </p>
          </div>
        </div>

        <div className="drafts-header-actions">
          {/* Alternância de Modo de Visualização */}
          <div className="drafts-view-toggle-group">
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visualizar em Grade de Cards"
            >
              <LayoutGrid size={14} />
              <span>Grade</span>
            </button>
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Visualizar em Painel Dividido com Editor"
            >
              <Columns size={14} />
              <span>Editor</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-new-draft"
            onClick={handleCreateDraft}
            title="Criar um novo rascunho de estudos"
          >
            <Plus size={16} />
            <span>Novo Rascunho</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
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
          {/* Filtro por Projeto */}
          <select
            className="drafts-project-filter-select"
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            title="Filtrar por projeto vinculado"
          >
            <option value="todos">Todos os Projetos ({notes.length})</option>
            <option value="sem-projeto">Sem Projeto ({notes.filter((n) => !n.project_id).length})</option>
            {projects.map((p) => {
              const count = notes.filter((n) => n.project_id === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.icon || '📁'} {p.title} ({count})
                </option>
              );
            })}
          </select>

          {/* Ordenação */}
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

      {/* MODO 1: Grade de Cards */}
      {viewMode === 'grid' && (
        <div className="drafts-grid">
          {sortedNotes.map((note) => {
            const proj = projects.find((p) => p.id === note.project_id);
            const sub = subtasks.find((s) => s.id === note.subtask_id);
            const words = getWordCount(note.content);
            const isCopied = copiedId === note.id;

            return (
              <div
                key={note.id}
                className="draft-card"
                onClick={() => {
                  setActiveNoteId(note.id);
                  setViewMode('split');
                }}
                title="Clique para editar este rascunho"
              >
                <div className="draft-card-header">
                  {proj ? (
                    <span className="draft-card-project-tag">
                      <span className="draft-project-dot" style={{ background: proj.color }} />
                      <span>{proj.title}</span>
                    </span>
                  ) : (
                    <span className="draft-card-project-tag" style={{ color: 'var(--text-muted)' }}>
                      Geral
                    </span>
                  )}
                  <span className="draft-card-date">{formatDate(note.updated_at || note.created_at)}</span>
                </div>

                <div className="draft-card-title-row">
                  <FileText size={16} className="draft-card-icon" />
                  <h3 className="draft-card-title">{note.title || 'Sem título'}</h3>
                </div>

                {sub && (
                  <div className="draft-card-subtask-badge" title={`Subtarefa: ${sub.title}`}>
                    <CheckSquare size={12} />
                    <span>{sub.title}</span>
                  </div>
                )}

                <p className={`draft-card-preview ${!note.content?.trim() ? 'empty' : ''}`}>
                  {note.content?.trim() || 'Rascunho vazio. Clique para começar a escrever anotações de estudo...'}
                </p>

                <div className="draft-card-footer">
                  <span className="draft-card-stats">
                    {words} {words === 1 ? 'palavra' : 'palavras'} • {(note.content || '').length} caracteres
                  </span>

                  <div className="draft-card-actions">
                    <button
                      type="button"
                      className="draft-action-btn"
                      onClick={(e) => handleCopyNote(note, e)}
                      title="Copiar texto do rascunho"
                    >
                      {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>

                    <button
                      type="button"
                      className="draft-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete(note);
                      }}
                      title="Excluir rascunho"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedNotes.length === 0 && (
            <div className="drafts-empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="drafts-empty-icon-halo">
                <FileText size={28} color="var(--accent-primary)" />
              </div>
              <h3>
                {searchQuery || selectedProjectFilter !== 'todos'
                  ? 'Nenhum rascunho encontrado'
                  : 'Nenhum rascunho criado ainda'}
              </h3>
              <p>
                {searchQuery || selectedProjectFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca ou projeto para encontrar suas notas.'
                  : 'Crie seu primeiro rascunho de estudos para anotar ideias, fórmulas e resumos.'}
              </p>
              {searchQuery || selectedProjectFilter !== 'todos' ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProjectFilter('todos');
                  }}
                >
                  Limpar Filtros
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateDraft}
                >
                  <Plus size={15} />
                  <span>Criar Primeiro Rascunho</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODO 2: Painel Dividido (Master-Detail) */}
      {viewMode === 'split' && (
        <div className="drafts-split-layout">
          {/* Coluna Esquerda: Lista de Rascunhos */}
          <div className="drafts-split-list-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-glass-subtle)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Rascunhos ({sortedNotes.length})
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
                onClick={handleCreateDraft}
              >
                <Plus size={13} />
                <span>Novo</span>
              </button>
            </div>

            <div className="drafts-split-scroll">
              {sortedNotes.map((note) => {
                const proj = projects.find((p) => p.id === note.project_id);
                const isActive = note.id === activeNote?.id;

                return (
                  <div
                    key={note.id}
                    className={`draft-split-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    <div className="draft-split-item-title">{note.title || 'Sem título'}</div>
                    <div className="draft-split-item-snippet">
                      {note.content?.trim() || 'Rascunho vazio...'}
                    </div>
                    <div className="draft-split-item-meta">
                      <span>{proj ? proj.title : 'Geral'}</span>
                      <span>{formatDate(note.updated_at || note.created_at)}</span>
                    </div>
                  </div>
                );
              })}

              {sortedNotes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Nenhum rascunho nesta lista.
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Editor Completo do Rascunho Ativo */}
          {activeNote ? (
            <div className="drafts-split-editor-panel">
              {/* Topo do Editor: Título e Status de Salvamento */}
              <div className="drafts-editor-top-bar">
                <input
                  type="text"
                  className="drafts-editor-title-input"
                  placeholder="Título do rascunho..."
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="drafts-save-status">
                    <Check size={13} /> {isSaved ? 'Salvo' : 'Salvando...'}
                  </span>
                </div>
              </div>

              {/* Barra de Metadados: Vínculo com Projeto e Subtarefa + Ditado por Voz */}
              <div className="drafts-editor-meta-row">
                <div className="drafts-linking-controls">
                  {/* Seleção de Projeto */}
                  <div className="drafts-link-group">
                    <Folder size={14} color="var(--accent-primary)" />
                    <select
                      className="drafts-link-select"
                      value={activeNote.project_id || ''}
                      onChange={(e) => {
                        const pId = e.target.value || null;
                        handleUpdateActiveNote({ project_id: pId, subtask_id: null });
                      }}
                      title="Vincular a um projeto"
                    >
                      <option value="">Nenhum Projeto</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || '📁'} {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção de Subtarefa (se houver projeto vinculado) */}
                  {activeNote.project_id && projectSubtasks.length > 0 && (
                    <div className="drafts-link-group">
                      <CheckSquare size={14} color="#10b981" />
                      <select
                        className="drafts-link-select"
                        value={activeNote.subtask_id || ''}
                        onChange={(e) => handleUpdateActiveNote({ subtask_id: e.target.value || null })}
                        title="Vincular a uma subtarefa"
                      >
                        <option value="">Nenhuma Subtarefa</option>
                        {projectSubtasks.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Ditado por Voz */}
                <div className="drafts-editor-speech-box">
                  {isSpeechSupported && (
                    <button
                      type="button"
                      className={`draft-mic-btn ${isListening ? 'active' : ''}`}
                      onClick={toggleSpeech}
                      title={isListening ? 'Parar ditado por voz (Alt+D)' : 'Iniciar ditado por voz (Alt+D)'}
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      <span>{isListening ? 'Ouvindo...' : 'Ditar (Alt+D)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Área de Escrita */}
              <div className="drafts-textarea-wrapper">
                <textarea
                  ref={textareaRef}
                  className="drafts-editor-textarea"
                  placeholder="Escreva livremente suas ideias, resumos de matérias, anotações de questões ou tópicos de estudo..."
                  value={activeNote.content || ''}
                  onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                />
              </div>

              {/* Rodapé do Editor: Contadores e Ações Rápidas */}
              <div className="drafts-editor-bottom-bar">
                <div className="drafts-editor-counts">
                  {getWordCount(activeNote.content)} palavras • {(activeNote.content || '').length} caracteres • {formatDate(activeNote.updated_at || activeNote.created_at)}
                </div>

                <div className="drafts-editor-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    onClick={(e) => handleCopyNote(activeNote, e)}
                  >
                    {copiedId === activeNote.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedId === activeNote.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    onClick={() => setNoteToDelete(activeNote)}
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="drafts-split-editor-panel empty-selection" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '2rem' }}>
              <Sparkles size={36} color="var(--accent-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Selecione um rascunho</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Escolha uma nota na lista ao lado ou crie um novo rascunho para começar a editar.
              </p>
              <button type="button" className="btn btn-primary" onClick={handleCreateDraft}>
                <Plus size={14} />
                <span>Novo Rascunho</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Excluir Rascunho"
        message={
          <>
            Tem certeza que deseja excluir permanentemente o rascunho <strong>"{noteToDelete?.title}"</strong>? Esta ação não pode ser desfeita.
          </>
        }
        confirmText="Excluir Rascunho"
        cancelText="Cancelar"
        variant="danger"
        confirmIcon={<Trash2 size={24} className="confirm-icon-danger" />}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};
