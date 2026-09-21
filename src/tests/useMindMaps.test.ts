import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMindMaps } from '@/features/mindmaps/hooks/useMindMaps';
import { storageMindMapsService } from '@/features/mindmaps/api/storageMindMaps';
import { MindMap, MindMapNode } from '@/features/core/types';

vi.mock('@/features/mindmaps/api/storageMindMaps', () => ({
  storageMindMapsService: {
    getLocalMindMaps: vi.fn(() => []),
    createMindMap: vi.fn(),
    updateMindMap: vi.fn(),
    deleteMindMap: vi.fn(),
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    toggleNodeCollapse: vi.fn(),
  }
}));

describe('useMindMaps Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar mapas mentais na montagem', () => {
    const mockMaps = [
      { id: 'm-1', title: 'Mapa 1', description: '', root_node_id: 'n-1', nodes: [] as MindMapNode[], created_at: '', updated_at: '' }
    ];
    vi.mocked(storageMindMapsService.getLocalMindMaps).mockReturnValue(mockMaps);
    
    const { result } = renderHook(() => useMindMaps());
    
    expect(result.current.maps).toEqual(mockMaps);
    expect(storageMindMapsService.getLocalMindMaps).toHaveBeenCalled();
  });

  it('deve selecionar um mapa e um nó ativo', () => {
    const mockNode: MindMapNode = { id: 'n-1', text: 'Raiz', children: [], x: 0, y: 0, type: 'root' };
    const mockMaps = [
      { id: 'm-1', title: 'Mapa', root_node_id: 'n-1', nodes: [mockNode] } as MindMap
    ];
    vi.mocked(storageMindMapsService.getLocalMindMaps).mockReturnValue(mockMaps);
    
    const { result } = renderHook(() => useMindMaps());
    
    act(() => {
      result.current.setActiveMapId('m-1');
    });
    
    expect(result.current.activeMap?.id).toBe('m-1');
    
    act(() => {
      result.current.setSelectedNodeId('n-1');
    });
    
    expect(result.current.selectedNode?.id).toBe('n-1');
    expect(result.current.selectedNode?.text).toBe('Raiz');
  });

  it('deve abrir e fechar modal de criação', () => {
    const { result } = renderHook(() => useMindMaps());
    
    expect(result.current.isCreateModalOpen).toBe(false);
    
    act(() => {
      result.current.openCreateModal();
    });
    expect(result.current.isCreateModalOpen).toBe(true);
    
    act(() => {
      result.current.closeCreateModal();
    });
    expect(result.current.isCreateModalOpen).toBe(false);
  });

  it('deve delegar operações de mapa para o storageService', () => {
    const { result } = renderHook(() => useMindMaps());
    
    const newMap = { id: 'm-2', root_node_id: 'n-1' } as MindMap;
    vi.mocked(storageMindMapsService.createMindMap).mockReturnValue(newMap);
    
    act(() => {
      result.current.createMap('Novo Mapa');
    });
    
    expect(storageMindMapsService.createMindMap).toHaveBeenCalledWith('Novo Mapa', '', undefined, 'blank');
    expect(result.current.activeMapId).toBe('m-2');
    expect(result.current.selectedNodeId).toBe('n-1');
    
    act(() => {
      result.current.updateMap('m-2', { title: 'Editado' });
    });
    
    expect(storageMindMapsService.updateMindMap).toHaveBeenCalledWith('m-2', { title: 'Editado' });
    
    act(() => {
      result.current.deleteMap('m-2');
    });
    
    expect(storageMindMapsService.deleteMindMap).toHaveBeenCalledWith('m-2');
    expect(result.current.activeMapId).toBeNull();
  });

  it('deve delegar operações de nós para o storageService', () => {
    const { result } = renderHook(() => useMindMaps());
    
    // Set active map for node operations
    act(() => {
      result.current.setActiveMapId('m-1');
    });
    
    const newNode = { id: 'n-2' } as MindMapNode;
    vi.mocked(storageMindMapsService.addNode).mockReturnValue(newNode);
    
    act(() => {
      result.current.addNode('n-1', 'Filho');
    });
    
    expect(storageMindMapsService.addNode).toHaveBeenCalledWith('m-1', 'n-1', 'Filho', undefined, undefined);
    expect(result.current.selectedNodeId).toBe('n-2');
    
    act(() => {
      result.current.updateNode('n-2', { text: 'Edit' });
    });
    
    expect(storageMindMapsService.updateNode).toHaveBeenCalledWith('m-1', 'n-2', { text: 'Edit' });
    
    act(() => {
      result.current.toggleCollapse('n-2');
    });
    
    expect(storageMindMapsService.toggleNodeCollapse).toHaveBeenCalledWith('m-1', 'n-2');
    
    act(() => {
      result.current.deleteNode('n-2');
    });
    
    expect(storageMindMapsService.deleteNode).toHaveBeenCalledWith('m-1', 'n-2');
    expect(result.current.selectedNodeId).toBeNull();
  });
});
