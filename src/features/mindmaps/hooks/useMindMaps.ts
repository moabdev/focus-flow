import { useState, useCallback, useEffect, useMemo } from 'react';
import { MindMap, MindMapNode } from '@/features/core/types';
import { storageMindMapsService, MindMapTemplate } from '@/features/mindmaps/api/storageMindMaps';

export interface UseMindMapsReturn {
  maps: MindMap[];
  activeMapId: string | null;
  activeMap: MindMap | null;
  selectedNodeId: string | null;
  selectedNode: MindMapNode | null;
  isCreateModalOpen: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Ações
  setActiveMapId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  createMap: (title: string, description?: string, projectId?: string, template?: MindMapTemplate) => MindMap;
  updateMap: (id: string, updates: Partial<Omit<MindMap, 'id' | 'created_at'>>) => MindMap | null;
  deleteMap: (id: string) => void;
  addNode: (parentId: string, text?: string, color?: string, notes?: string) => MindMapNode | null;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => MindMapNode | null;
  deleteNode: (nodeId: string) => boolean;
  toggleCollapse: (nodeId: string) => boolean;
  refresh: () => void;
}

export const useMindMaps = (): UseMindMapsReturn => {
  const [maps, setMaps] = useState<MindMap[]>(() => storageMindMapsService.getLocalMindMaps());
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(() => {
    const local = storageMindMapsService.getLocalMindMaps();
    setMaps(local);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeMap = useMemo(() => {
    if (!activeMapId) return null;
    return maps.find((m) => m.id === activeMapId) || null;
  }, [maps, activeMapId]);

  const selectedNode = useMemo(() => {
    if (!activeMap || !selectedNodeId) return null;
    return activeMap.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [activeMap, selectedNodeId]);

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    refresh();
  }, [refresh]);

  const handleCreateMap = useCallback(
    (title: string, description: string = '', projectId?: string, template: MindMapTemplate = 'blank') => {
      const created = storageMindMapsService.createMindMap(title, description, projectId, template);
      refresh();
      setActiveMapId(created.id);
      setSelectedNodeId(created.root_node_id);
      return created;
    },
    [refresh]
  );

  const handleUpdateMap = useCallback(
    (id: string, updates: Partial<Omit<MindMap, 'id' | 'created_at'>>) => {
      const updated = storageMindMapsService.updateMindMap(id, updates);
      refresh();
      return updated;
    },
    [refresh]
  );

  const handleDeleteMap = useCallback(
    (id: string) => {
      storageMindMapsService.deleteMindMap(id);
      if (activeMapId === id) {
        setActiveMapId(null);
        setSelectedNodeId(null);
      }
      refresh();
    },
    [activeMapId, refresh]
  );

  const handleAddNode = useCallback(
    (parentId: string, text?: string, color?: string, notes?: string) => {
      if (!activeMapId) return null;
      const newNode = storageMindMapsService.addNode(activeMapId, parentId, text, color, notes);
      refresh();
      if (newNode) setSelectedNodeId(newNode.id);
      return newNode;
    },
    [activeMapId, refresh]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<MindMapNode>) => {
      if (!activeMapId) return null;
      const updated = storageMindMapsService.updateNode(activeMapId, nodeId, updates);
      refresh();
      return updated;
    },
    [activeMapId, refresh]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeMapId) return false;
      const ok = storageMindMapsService.deleteNode(activeMapId, nodeId);
      refresh();
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      return ok;
    },
    [activeMapId, selectedNodeId, refresh]
  );

  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      if (!activeMapId) return false;
      const ok = storageMindMapsService.toggleNodeCollapse(activeMapId, nodeId);
      refresh();
      return ok;
    },
    [activeMapId, refresh]
  );

  return {
    maps,
    activeMapId,
    activeMap,
    selectedNodeId,
    selectedNode,
    isCreateModalOpen,
    searchQuery,
    setSearchQuery,
    setActiveMapId,
    setSelectedNodeId,
    openCreateModal,
    closeCreateModal,
    createMap: handleCreateMap,
    updateMap: handleUpdateMap,
    deleteMap: handleDeleteMap,
    addNode: handleAddNode,
    updateNode: handleUpdateNode,
    deleteNode: handleDeleteNode,
    toggleCollapse: handleToggleCollapse,
    refresh,
  };
};
