import React, { useState } from 'react';
import { Sparkles, Brain, Clock, Calendar, CheckCircle } from 'lucide-react';
import { StudySession } from '@/features/core/types';
import { ProductivityInsights, generateProductivityInsights } from '@/services/ai/geminiService';
import { useToast } from '@/features/core/contexts/ToastContext';

interface CopilotTabProps {
  history: StudySession[];
}

export const CopilotTab: React.FC<CopilotTabProps> = ({ history }) => {
  const [insights, setInsights] = useState<ProductivityInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleGenerateInsights = async () => {
    if (history.length === 0) {
      toast.warning('Você precisa ter completado algumas sessões de foco (pomodoros) para gerar insights.', 'Histórico Vazio');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Chave de API do Gemini não configurada pelo desenvolvedor (VITE_GEMINI_API_KEY).', 'Falta API Key');
      return;
    }

    setIsLoading(true);
    toast.info('A IA está analisando seus dados. Isso pode levar alguns segundos...', 'Analisando...');

    try {
      // Summarize history to save tokens
      const recentHistory = history.slice(-50); // Pegar apenas as últimas 50 sessões
      const summary = recentHistory.map(s => {
        const date = new Date(s.completed_at);
        const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${day} às ${time} - ${s.discipline} (${s.duration_minutes} min)`;
      }).join('\n');

      const data = await generateProductivityInsights(summary, apiKey);
      setInsights(data);
      toast.success('Análise de produtividade concluída!', 'Sucesso');
    } catch (error: any) {
      toast.error(`Falha ao gerar insights: ${error.message}`, 'Erro na IA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '8px' }}>
          <Sparkles size={24} /> Co-piloto de Produtividade
        </h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
          Deixe a inteligência artificial analisar seus hábitos de estudo e sugerir a melhor rotina baseada no seu ritmo biológico e histórico real.
        </p>
      </div>

      {!insights && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
          <button 
            className="btn-primary" 
            onClick={handleGenerateInsights} 
            disabled={isLoading || history.length === 0}
            style={{ padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Analisando Dados...
              </>
            ) : (
              <>
                <Brain size={18} />
                Gerar Insights do Meu Histórico
              </>
            )}
          </button>
        </div>
      )}

      {insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
          
          <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-primary)' }}>
            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
              <Brain size={16} color="var(--color-primary)" />
              Análise Comportamental
            </h5>
            <p style={{ color: 'var(--color-text)', lineHeight: 1.5, fontSize: '0.95rem' }}>{insights.analysis}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--color-border)' }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                <Clock size={16} color="var(--accent-secondary)" />
                Seus Melhores Horários
              </h5>
              <p style={{ color: 'var(--color-text)', fontWeight: 500 }}>{insights.best_times}</p>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--color-border)' }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                <Calendar size={16} color="var(--accent-primary)" />
                Sugestão de Cronograma
              </h5>
              <p style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{insights.schedule_suggestion}</p>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)', borderRadius: '12px', padding: '16px', border: '1px dashed var(--color-primary)', textAlign: 'center' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--color-primary)', fontWeight: 500 }}>
              "{insights.motivational_tip}"
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button 
              className="btn-secondary" 
              onClick={handleGenerateInsights} 
              disabled={isLoading}
              style={{ fontSize: '0.85rem' }}
            >
              Recalcular Insights
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
