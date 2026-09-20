import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  Trophy,
  FileSpreadsheet,
  Download,
  Printer,
  CheckSquare,
} from 'lucide-react';
import { StudyMetrics, Project, Subtask } from '../types';
import { HeatmapCalendar } from './stats/HeatmapCalendar';
import { BadgesGallery } from './stats/BadgesGallery';
import { badgeService } from '../services/badgeService';
import { reportExportService } from '../services/reportExportService';
import { useToast } from '../context/ToastContext';

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

  const totalSubjectMinutes = Object.values(metrics.subjectMinutes).reduce((a, b) => a + b, 0);

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

        {/* Abas de Navegação */}
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
          {/* ABA 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <>
              {/* Banner de Ofensiva (Streak) */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background:
                    'linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 42, 95, 0.2) 100%)',
                  border: '1px solid rgba(255, 107, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(255, 107, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff6b00',
                    }}
                  >
                    <Flame size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ff7700' }}>
                      {metrics.streak.currentStreak}{' '}
                      {metrics.streak.currentStreak === 1 ? 'Dia Seguido' : 'Dias Seguidos'} de Foco!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      A constância diária é o fator decisivo para a aprovação e domínio técnico.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Cartões de Desempenho (KPIs) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <Clock size={18} color="var(--accent-primary)" style={{ margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tempo Hoje</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatHoursMinutes(metrics.todayMinutes)}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <Award size={18} color="var(--accent-primary)" style={{ margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esta Semana</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatHoursMinutes(metrics.weekMinutes)}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pomodoros</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {metrics.totalPomodoros}
                  </div>
                </div>
              </div>

              {/* Mapa Anual de Consistência (Heatmap 52 Semanas) */}
              <HeatmapCalendar sessions={metrics.history} />

              {/* Gráfico de Distribuição por Matéria */}
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Distribuição de Estudo por Disciplina
                </div>

                {Object.keys(metrics.subjectMinutes).length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Conclua seu primeiro ciclo de Pomodoro para visualizar o gráfico por matéria.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {Object.entries(metrics.subjectMinutes).map(([disc, mins]) => {
                      const pct =
                        totalSubjectMinutes > 0 ? Math.round((mins / totalSubjectMinutes) * 100) : 0;
                      return (
                        <div key={disc} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{disc}</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {formatHoursMinutes(mins)} ({pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: '8px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: 'var(--accent-primary)',
                                borderRadius: 'var(--radius-full)',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Histórico Recente de Sessões */}
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                  Histórico Recente
                </div>

                {metrics.history.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Nenhuma sessão registrada ainda.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {metrics.history.map((s) => {
                      const date = new Date(s.completed_at);
                      const timeFormatted = date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const dateFormatted = date.toLocaleDateString([], {
                        day: '2-digit',
                        month: '2-digit',
                      });

                      return (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(0, 0, 0, 0.15)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>●</span>
                            <span style={{ fontWeight: 600 }}>{s.discipline}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {s.duration_minutes} min • {dateFormatted} às {timeFormatted}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ABA 2: CONQUISTAS (BADGES) */}
          {activeTab === 'badges' && <BadgesGallery badges={badges} />}

          {/* ABA 3: EXPORTAR RELATÓRIOS */}
          {activeTab === 'export' && (
            <div className="export-reports-container">
              {/* Card 1: Relatório Oficial PDF (Featured) */}
              <div className="export-report-card featured">
                <div className="export-report-info">
                  <div className="export-report-icon">
                    <Printer size={22} />
                  </div>
                  <div className="export-report-text">
                    <div className="export-report-title">
                      Relatório Oficial de Produtividade
                      <span className="export-report-badge">PDF / Impressão</span>
                    </div>
                    <div className="export-report-desc">
                      Gera um documento formatado com cabeçalho oficial, totalizadores e distribuição de
                      horas por matéria. Ideal para comprovação acadêmica (horas complementares), estágio ou arquivo pessoal.
                    </div>
                  </div>
                </div>
                <div className="export-report-actions">
                  <button
                    type="button"
                    className="btn btn-featured"
                    onClick={handlePrintReport}
                  >
                    <Printer size={16} />
                    Gerar PDF / Imprimir
                  </button>
                </div>
              </div>

              {/* Card 2: Histórico de Sessões CSV */}
              <div className="export-report-card">
                <div className="export-report-info">
                  <div className="export-report-icon">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="export-report-text">
                    <div className="export-report-title">
                      Histórico de Sessões de Foco
                    </div>
                    <div className="export-report-desc">
                      Exporta todas as {metrics.history.length} sessões registradas em planilha CSV (com codificação UTF-8
                      BOM para compatibilidade com Microsoft Excel e Google Planilhas).
                    </div>
                  </div>
                </div>
                <div className="export-report-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExportSessions}
                  >
                    <Download size={16} />
                    Baixar Sessões CSV
                  </button>
                </div>
              </div>

              {/* Card 3: Inventário de Tarefas e Projetos CSV */}
              <div className="export-report-card">
                <div className="export-report-info">
                  <div className="export-report-icon">
                    <CheckSquare size={22} />
                  </div>
                  <div className="export-report-text">
                    <div className="export-report-title">
                      Tarefas & Projetos Vinculados
                    </div>
                    <div className="export-report-desc">
                      Exporta a listagem completa de projetos, subtarefas, estimativas de pomodoros,
                      status de conclusão e prioridades em formato tabular.
                    </div>
                  </div>
                </div>
                <div className="export-report-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleExportTasks}
                  >
                    <Download size={16} />
                    Baixar Tarefas CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
