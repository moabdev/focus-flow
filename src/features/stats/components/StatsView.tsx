import React, { useState, useMemo } from 'react';
import { BarChart3, Trophy, FileSpreadsheet } from 'lucide-react';
import { StudyMetrics, Project, Subtask } from '@/features/core/types';
import { BadgesGallery } from './stats/BadgesGallery';
import { OverviewTab } from './stats/OverviewTab';
import { ExportTab } from './stats/ExportTab';
import { badgeService } from '@/features/stats/api/badgeService';
import { reportExportService } from '@/features/stats/api/reportExportService';
import { useToast } from '@/features/core/contexts/ToastContext';

interface StatsViewProps {
  metrics: StudyMetrics;
  subtasks?: Subtask[];
  projects?: Project[];
  userName?: string;
}

export const StatsView: React.FC<StatsViewProps> = ({
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
    <div className="stats-view-container fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem', padding: 'var(--spacing-lg)' }}>
      <div className="stats-view-header">
        <h2 className="pm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={26} color="var(--accent-primary)" />
          Estatísticas, Conquistas & Relatórios
        </h2>
        <p className="pm-subtitle" style={{ marginTop: '0.5rem' }}>Acompanhe seu progresso, destrave conquistas e gere relatórios de desempenho.</p>
      </div>

      <div className="stats-view-tabs pm-status-filters" style={{ flexWrap: 'wrap' }}>
        <button
          className={`filter-chip ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={15} style={{ display: 'inline', marginRight: '5px' }} />
          Visão Geral
        </button>
        <button
          className={`filter-chip ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <Trophy size={15} style={{ display: 'inline', marginRight: '5px' }} />
          Conquistas ({unlockedCount}/{badges.length})
        </button>
        <button
          className={`filter-chip ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          <FileSpreadsheet size={15} style={{ display: 'inline', marginRight: '5px' }} />
          Exportar Relatórios
        </button>
      </div>

      <div className="stats-view-content" style={{ flex: 1, overflowY: 'auto' }}>
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
  );
};
