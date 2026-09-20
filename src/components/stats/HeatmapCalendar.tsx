import React, { useMemo, useState } from 'react';
import { StudySession } from '../../types';

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

  // Gera as 52 semanas (7 linhas x 52 colunas)
  const { weeks, monthLabels, totalActiveDays, totalMinutesYear } = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();
    const todayMidnight = new Date(todayY, todayM, todayD);

    const endOfWeek = new Date(todayMidnight);
    endOfWeek.setDate(todayMidnight.getDate() + (6 - todayMidnight.getDay()));

    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - 52 * 7 + 1);

    const generatedWeeks: DayData[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentWeek: DayData[] = [];
    let lastMonth = -1;
    let activeDays = 0;
    let totalMinutes = 0;

    const curr = new Date(startDate);
    let weekIdx = 0;

    while (curr <= endOfWeek) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const day = curr.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (month !== lastMonth && curr.getDay() === 0) {
        const monthShort = curr.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        months.push({ label: monthShort, weekIndex: weekIdx });
        lastMonth = month;
      }

      const isFuture = curr > todayMidnight;
      const data = sessionMap.get(dateStr) || { minutes: 0, count: 0 };

      let level = 0;
      if (!isFuture && data.minutes > 0) {
        if (data.minutes <= 25) level = 1;
        else if (data.minutes <= 60) level = 2;
        else if (data.minutes <= 120) level = 3;
        else level = 4;
        activeDays++;
        totalMinutes += data.minutes;
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
        minutes: isFuture ? 0 : data.minutes,
        count: isFuture ? 0 : data.count,
        level: isFuture ? 0 : level,
        isFuture,
      };

      currentWeek.push(dayObj);

      if (currentWeek.length === 7) {
        generatedWeeks.push(currentWeek);
        currentWeek = [];
        weekIdx++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    return {
      weeks: generatedWeeks,
      monthLabels: months,
      totalActiveDays: activeDays,
      totalMinutesYear: totalMinutes,
    };
  }, [sessionMap]);

  return (
    <div className="heatmap-container glass-panel">
      <div className="heatmap-header">
        <div className="heatmap-title-wrap">
          <span className="heatmap-title">Mapa Anual de Consistência</span>
          <span className="heatmap-subtitle">
            {totalActiveDays} {totalActiveDays === 1 ? 'dia ativo' : 'dias ativos'} • {Math.round(totalMinutesYear / 60)}h no último ano
          </span>
        </div>

        {hoveredDay && (
          <div className="heatmap-tooltip">
            <strong>{hoveredDay.formattedDate}</strong>: {hoveredDay.minutes} min ({hoveredDay.count} sessões)
          </div>
        )}
      </div>

      <div className="heatmap-scroll-area">
        {/* Linha dos meses */}
        <div className="heatmap-months-row">
          <div className="heatmap-day-label-space" />
          <div className="heatmap-months-track">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="heatmap-month-label"
                style={{ left: `${(m.weekIndex / 52) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid dos dias */}
        <div className="heatmap-body">
          <div className="heatmap-day-labels">
            <span>Dom</span>
            <span>Ter</span>
            <span>Qui</span>
            <span>Sáb</span>
          </div>

          <div className="heatmap-grid" role="grid" aria-label="Heatmap de Estudos Anual">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="heatmap-week-column">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`heatmap-cell level-${day.level} ${day.isFuture ? 'future' : ''}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={`${day.formattedDate}: ${day.minutes} min`}
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
