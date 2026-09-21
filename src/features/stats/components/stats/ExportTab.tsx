import React from 'react';
import { FileSpreadsheet, Download, Printer, CheckSquare } from 'lucide-react';

interface ExportTabProps {
  historyLength: number;
  onPrintReport: () => void;
  onExportSessions: () => void;
  onExportTasks: () => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  historyLength,
  onPrintReport,
  onExportSessions,
  onExportTasks,
}) => {
  return (
    <div className="export-reports-container">
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
          <button type="button" className="btn btn-featured" onClick={onPrintReport}>
            <Printer size={16} />
            Gerar PDF / Imprimir
          </button>
        </div>
      </div>

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
              Exporta todas as {historyLength} sessões registradas em planilha CSV (com codificação UTF-8
              BOM para compatibilidade com Microsoft Excel e Google Planilhas).
            </div>
          </div>
        </div>
        <div className="export-report-actions">
          <button type="button" className="btn btn-primary" onClick={onExportSessions}>
            <Download size={16} />
            Baixar Sessões CSV
          </button>
        </div>
      </div>

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
          <button type="button" className="btn btn-secondary" onClick={onExportTasks}>
            <Download size={16} />
            Baixar Tarefas CSV
          </button>
        </div>
      </div>
    </div>
  );
};
