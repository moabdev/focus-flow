import React from 'react';
import { X, Flame, Clock, Award, BarChart3, CheckCircle2 } from 'lucide-react';
import { StudyMetrics } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: StudyMetrics;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, metrics }) => {
  if (!isOpen) return null;

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  const totalSubjectMinutes = Object.values(metrics.subjectMinutes).reduce((a, b) => a + b, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="var(--accent-primary)" />
            <h3 className="modal-title">Estatísticas de Estudo & Produtividade</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-content">
          {/* Banner de Ofensiva (Streak) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 42, 95, 0.2) 100%)',
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
                  {metrics.streak.currentStreak} {metrics.streak.currentStreak === 1 ? 'Dia Seguido' : 'Dias Seguidos'} de Foco!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  A constância diária é o fator decisivo para a aprovação e domínio técnico.
                </div>
              </div>
            </div>
          </div>

          {/* 3 Cartões de Desempenho (KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
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

          {/* Gráfico de Distribuição por Matéria */}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Distribuição de Estudo por Disciplina
            </div>

            {Object.keys(metrics.subjectMinutes).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Conclua seu primeiro ciclo de Pomodoro para visualizar o gráfico por matéria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Object.entries(metrics.subjectMinutes).map(([disc, mins]) => {
                  const pct = totalSubjectMinutes > 0 ? Math.round((mins / totalSubjectMinutes) * 100) : 0;
                  return (
                    <div key={disc} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
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
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhuma sessão registrada ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {metrics.history.map((s) => {
                  const date = new Date(s.completed_at);
                  const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

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
        </div>
      </div>
    </div>
  );
};
