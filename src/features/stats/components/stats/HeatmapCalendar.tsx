import '../../styles/heatmap.css';
import React, { useMemo, useState } from 'react';
import { StudySession } from '@/features/core/types';

interface HeatmapCalendarProps {
  sessions: StudySession[];
}

interface DayData {
  date: Date;
  dateStr: string;
  formattedDate: string;
  minutes: number;
  count: number;
  level: number;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ sessions }) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Mapeia sessões por dia (YYYY-MM-DD)
  const sessionMap = useMemo(() => {
    const map = new Map<string, { minutes: number; count: number }>();
    sessions.forEach((s) => {
      if (!s.completed_at) return;
      const d = new Date(s.completed_at);
      if (isNaN(d.getTime())) return;
      // Formata como YYYY-MM-DD local
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const existing = map.get(key) || { minutes: 0, count: 0 };
      map.set(key, {
        minutes: existing.minutes + (s.duration_minutes || 0),
        count: existing.count + 1,
      });
    });
    return map;
  }, [sessions]);

  const { weeks, monthLabel, totalActiveDays, totalMinutesPeriod } = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayMidnight = new Date(todayY, todayM, now.getDate());

    const firstDayOfMonth = new Date(todayY, todayM, 1);
    const lastDayOfMonth = new Date(todayY, todayM + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const generatedWeeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    let activeDays = 0;
    let totalMinutes = 0;

    const curr = new Date(startDate);

    while (curr <= endDate) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const day = curr.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isCurrentMonth = month === todayM;
      const isFuture = curr > todayMidnight;
      
      let minutes = 0;
      let count = 0;
      let level = 0;
      
      if (isCurrentMonth && !isFuture) {
        const data = sessionMap.get(dateStr) || { minutes: 0, count: 0 };
        minutes = data.minutes;
        count = data.count;
        if (minutes > 0) {
          if (minutes <= 25) level = 1;
          else if (minutes <= 60) level = 2;
          else if (minutes <= 120) level = 3;
          else level = 4;
          activeDays++;
          totalMinutes += minutes;
        }
      }

      const dayObj: DayData = {
        date: new Date(curr),
        dateStr,
        formattedDate: curr.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        minutes,
        count,
        level,
        isFuture,
        isCurrentMonth,
      };

      currentWeek.push(dayObj);

      if (currentWeek.length === 7) {
        generatedWeeks.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    const mLabel = firstDayOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonthLabel = mLabel.charAt(0).toUpperCase() + mLabel.slice(1);

    return {
      weeks: generatedWeeks,
      monthLabel: capitalizedMonthLabel,
      totalActiveDays: activeDays,
      totalMinutesPeriod: totalMinutes,
    };
  }, [sessionMap]);

  return (
    <div className="heatmap-container glass-panel">
      <div className="heatmap-header">
        <div className="heatmap-title-wrap">
          <span className="heatmap-title">Mapa Mensal de Consistência</span>
          <span className="heatmap-subtitle">
            {totalActiveDays} {totalActiveDays === 1 ? 'dia ativo' : 'dias ativos'} • {Math.round(totalMinutesPeriod / 60)}h no último mês
          </span>
        </div>

        {hoveredDay && (
          <div className="heatmap-tooltip">
            <strong>{hoveredDay.formattedDate}</strong>: {hoveredDay.minutes} min ({hoveredDay.count} sessões)
          </div>
        )}
      </div>

      <div className="heatmap-scroll-area" style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Coluna Esquerda: Espaço vazio + Rótulos dos Dias */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="heatmap-day-label-space" style={{ height: '1.4rem' }} />
          <div className="heatmap-day-labels">
            <span>Dom</span>
            <span>Ter</span>
            <span>Qui</span>
            <span>Sáb</span>
          </div>
        </div>

        {/* Coluna Direita: Trilho dos Meses + Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="heatmap-months-track" style={{ height: '1.4rem', display: 'flex', justifyContent: 'center' }}>
            <span className="heatmap-month-label" style={{ position: 'static' }}>
              {monthLabel}
            </span>
          </div>

          <div className="heatmap-grid" role="grid" aria-label="Heatmap de Estudos Mensal">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="heatmap-week-column">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`heatmap-cell level-${day.level} ${day.isFuture ? 'future' : ''}`}
                    style={{ visibility: day.isCurrentMonth ? 'visible' : 'hidden' }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={day.isCurrentMonth ? `${day.formattedDate}: ${day.minutes} min` : undefined}
                    role="gridcell"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend-footer">
        <span className="heatmap-legend-text">Menos</span>
        <div className="heatmap-cell level-0" />
        <div className="heatmap-cell level-1" />
        <div className="heatmap-cell level-2" />
        <div className="heatmap-cell level-3" />
        <div className="heatmap-cell level-4" />
        <span className="heatmap-legend-text">Mais foco</span>
      </div>
    </div>
  );
};

