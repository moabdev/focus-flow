import React, { useEffect, useRef } from 'react';
import { AgentStatus } from '../hooks/useVoiceAgent';

interface VoiceWaveformProps {
  status: AgentStatus;
  audioLevel?: number; // 0 a 1
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ status, audioLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Se idle, desenha linha suave estática/sutil
      if (status === 'idle') {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        return;
      }

      // Parâmetros de onda de acordo com o status
      let baseAmplitude = 6;
      let frequency = 0.04;
      let strokeColor = '#e11d48';

      if (status === 'listening') {
        baseAmplitude = Math.max(8, audioLevel * 24);
        frequency = 0.06;
        strokeColor = '#3b82f6'; // Azul escuta
      } else if (status === 'speaking') {
        baseAmplitude = 14 + Math.sin(phase * 2) * 6;
        frequency = 0.05;
        strokeColor = '#e11d48'; // Rosa/Rubi fala
      } else if (status === 'thinking') {
        baseAmplitude = 6 + Math.sin(phase * 4) * 3;
        frequency = 0.08;
        strokeColor = '#a855f7'; // Roxo processando
      } else if (status === 'error') {
        baseAmplitude = 4;
        frequency = 0.1;
        strokeColor = '#ef4444'; // Vermelho erro
      }

      // Desenhar 3 camadas de ondas com fases ligeiramente deslocadas
      const layers = [
        { alpha: 0.8, ampMult: 1.0, width: 2.5 },
        { alpha: 0.4, ampMult: 0.6, width: 1.5 },
        { alpha: 0.2, ampMult: 0.3, width: 1.0 },
      ];

      layers.forEach((layer) => {
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;

        for (let x = 0; x < width; x++) {
          // Envelope Gaussiano nas pontas para suavizar a entrada e saída da onda
          const normalizedX = (x / width) * 2 - 1;
          const envelope = Math.max(0, 1 - Math.pow(normalizedX, 2));

          const y =
            centerY +
            Math.sin(x * frequency + phase * (layer.ampMult + 0.5)) *
              baseAmplitude *
              layer.ampMult *
              envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      ctx.globalAlpha = 1.0;
      phase += 0.08;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, audioLevel]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full max-w-[320px] h-[48px]"
        aria-label={`Visualizador de áudio no estado ${status}`}
      />
      <div className="text-[11px] font-medium tracking-wide uppercase mt-1 opacity-70 flex items-center gap-1.5">
        {status === 'listening' && <span className="text-blue-400 animate-pulse">● Ouvindo você...</span>}
        {status === 'thinking' && <span className="text-purple-400 animate-pulse">● Processando com Gemini...</span>}
        {status === 'speaking' && <span className="text-rose-400">● Falando...</span>}
        {status === 'idle' && <span className="text-gray-400">Pronto para ouvir</span>}
        {status === 'error' && <span className="text-red-400">● Erro de áudio</span>}
      </div>
    </div>
  );
};
