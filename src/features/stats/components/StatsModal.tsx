import React, { useState, useMemo } from 'react';
import { X, BarChart3, Trophy, FileSpreadsheet } from 'lucide-react';
import { StudyMetrics, Project, Subtask } from '@/features/core/types';
import { BadgesGallery } from './stats/BadgesGallery';
import { OverviewTab } from './stats/OverviewTab';
import { ExportTab } from './stats/ExportTab';
import { badgeService } from '@/features/stats/api/badgeService';
import { reportExportService } from '@/features/stats/api/reportExportService';
import { useToast } from '@/features/core/contexts/ToastContext';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: StudyMetrics;
  subtasks?: Subtask[];
  projects?: Project[];
  userName?: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  metrics,
  subtasks = [],
  projects = [],
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'export'>('overview');
  const toast = useToast();

  const completedTasksCount = useMemo(() => {
    return subtasks.filter((t) => t.is_completed).length;
  }, [subtasks]);

  const badges = useMemo(() => {
    return badgeService.getBadges(metrics, completedTasksCount);
  }, [metrics, completedTasksCount]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  if (!isOpen) return null;

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  const handleExportSessions = () => {
    try {
      reportExportService.exportSessionsCSV(metrics.history);
      toast.success('Arquivo CSV com o histórico de sessões baixado com sucesso!', 'Exportação Concluída');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar sessões.', 'Erro na Exportação');
    }
  };

  const handleExportTasks = () => {
    try {
      reportExportService.exportTasksCSV(subtasks, projects);
      toast.success('Arquivo CSV de tarefas e projetos baixado com sucesso!', 'Exportação Concluída');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar tarefas.', 'Erro na Exportação');
    }
  };

  const handlePrintReport = () => {
    try {
      reportExportService.printReportSummary({
        sessions: metrics.history,
        projects,
        tasks: subtasks,
        userName,
      });
      toast.info('Janela de impressão e exportação em PDF aberta.', 'Relatório Oficial');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir relatório.', 'Erro');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="var(--accent-primary)" />
            <h3 className="modal-title">Estatísticas, Conquistas & Relatórios</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={15} style={{ display: 'inline', marginRight: '5px' }} />
            Visão Geral
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            <Trophy size={15} style={{ display: 'inline', marginRight: '5px' }} />
            Conquistas ({unlockedCount}/{badges.length})
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <FileSpreadsheet size={15} style={{ display: 'inline', marginRight: '5px' }} />
            Exportar Relatórios
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && <OverviewTab metrics={metrics} formatHoursMinutes={formatHoursMinutes} />}
          {activeTab === 'badges' && <BadgesGallery badges={badges} />}
          {activeTab === 'export' && (
            <ExportTab
              historyLength={metrics.history.length}
              onPrintReport={handlePrintReport}
              onExportSessions={handleExportSessions}
              onExportTasks={handleExportTasks}
            />
          )}
        </div>
      </div>
    </div>
  );
};
