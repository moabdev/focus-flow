import { StudySession, Subtask, Project } from '@/features/core/types';

export class ReportExportService {
  /**
   * Exporta histórico de sessões em CSV com suporte a UTF-8 (BOM para Excel)
   */
  public exportSessionsCSV(sessions: StudySession[]): void {
    if (!sessions || sessions.length === 0) {
      throw new Error('Não há sessões registradas para exportar.');
    }

    const headers = ['ID', 'Data', 'Horário', 'Disciplina / Matéria', 'Duração (minutos)', 'Duração (horas)'];
    const rows = sessions.map((s) => {
      const dateObj = new Date(s.completed_at);
      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('pt-BR')
        : s.completed_at;
      const timeStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '';
      const durationHours = (s.duration_minutes / 60).toFixed(2).replace('.', ',');

      return [
        `"${s.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(s.discipline || 'Geral').replace(/"/g, '""')}"`,
        s.duration_minutes,
        `"${durationHours}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    this.downloadFile(csvContent, `focusflow_sessoes_${this.getDateSlug()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporta tarefas e projetos em CSV
   */
  public exportTasksCSV(tasks: Subtask[], projects: Project[]): void {
    if (!tasks || tasks.length === 0) {
      throw new Error('Não há tarefas para exportar.');
    }

    const projectMap = new Map(projects.map((p) => [p.id, p.title]));
    const headers = ['ID', 'Projeto', 'Título da Tarefa', 'Disciplina', 'Prioridade', 'Pomodoros Est.', 'Pomodoros Concl.', 'Status', 'Data Limite'];
    
    const rows = tasks.map((t) => {
      const projectName = t.project_id ? (projectMap.get(t.project_id) || 'Sem projeto') : 'Geral';
      const status = t.is_completed ? 'Concluída' : 'Pendente';
      return [
        `"${t.id}"`,
        `"${projectName.replace(/"/g, '""')}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.discipline || 'Geral').replace(/"/g, '""')}"`,
        `"${t.priority}"`,
        t.pomodoros_estimated,
        t.pomodoros_completed,
        `"${status}"`,
        `"${t.due_date || '-'}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    this.downloadFile(csvContent, `focusflow_tarefas_${this.getDateSlug()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Abre janela de impressão formatada para salvar como PDF
   */
  public printReportSummary(params: {
    sessions: StudySession[];
    projects: Project[];
    tasks: Subtask[];
    userName?: string;
  }): void {
    const { sessions, projects: _projects, tasks, userName } = params;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const completedTasks = tasks.filter((t) => t.is_completed).length;

    // Agrupamento por disciplina
    const subjectMap: Record<string, number> = {};
    sessions.forEach((s) => {
      const disc = s.discipline || 'Geral';
      subjectMap[disc] = (subjectMap[disc] || 0) + s.duration_minutes;
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('O navegador bloqueou a abertura da janela de impressão. Permita pop-ups.');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>FocusFlow - Relatório Oficial de Estudos</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2.5rem; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem; }
          h1 { margin: 0; color: #ff2a5f; font-size: 1.8rem; letter-spacing: -0.5px; }
          .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center; }
          .card-value { font-size: 1.6rem; font-weight: 800; color: #0f172a; }
          .card-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; margin-top: 0.2rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 2rem; }
          th { background: #f1f5f9; text-align: left; padding: 0.6rem 0.8rem; font-size: 0.85rem; color: #475569; border-bottom: 1px solid #cbd5e1; }
          td { padding: 0.6rem 0.8rem; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; }
          .footer { margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>FocusFlow • Relatório de Produtividade</h1>
            <div class="subtitle">Estudante: ${userName || 'Usuário FocusFlow'} | Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
          <button onclick="window.print()" style="background: #ff2a5f; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Imprimir / Salvar PDF
          </button>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-value">${totalHours}h</div>
            <div class="card-label">Horas Totais Dedicadas</div>
          </div>
          <div class="card">
            <div class="card-value">${sessions.length}</div>
            <div class="card-label">Ciclos Pomodoro Concluídos</div>
          </div>
          <div class="card">
            <div class="card-value">${completedTasks}/${tasks.length}</div>
            <div class="card-label">Tarefas Finalizadas</div>
          </div>
        </div>

        <h3 style="margin-bottom: 0.5rem; color: #0f172a;">Distribuição por Disciplina</h3>
        <table>
          <thead>
            <tr>
              <th>Disciplina</th>
              <th>Horas Dedicadas</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(subjectMap)
              .map(([disc, mins]) => {
                const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
                return `
                <tr>
                  <td><strong>${disc}</strong></td>
                  <td>${(mins / 60).toFixed(1)}h (${mins} min)</td>
                  <td>${pct}%</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento gerado automaticamente pelo FocusFlow - Foco & Produtividade nos Estudos.
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  private downloadFile(content: string, fileName: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private getDateSlug(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
}

export const reportExportService = new ReportExportService();
