import { FunctionDeclaration, Type } from '@google/genai';

// Declaração de Ferramentas para o Gemini
export const voiceAgentFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'controlPomodoro',
    description: 'Controla o timer de Pomodoro e foco do usuário (iniciar, pausar, avançar, pular, mudar tempo).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['start', 'pause', 'resume', 'stop', 'skip'],
          description: 'Ação a ser executada no timer.',
        },
        durationMinutes: {
          type: Type.NUMBER,
          description: 'Duração opcional em minutos caso o usuário queira um tempo específico (ex: 25, 50, 15).',
        },
        taskTitle: {
          type: Type.STRING,
          description: 'Título ou assunto da tarefa a ser focada.',
        },
        mode: {
          type: Type.STRING,
          enum: ['pomodoro', 'shortBreak', 'longBreak'],
          description: 'Modo do timer.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manageTasks',
    description: 'Cria, conclui, busca ou remove tarefas e subtarefas no FocusFlow.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['create', 'complete', 'delete', 'list'],
          description: 'Ação com a tarefa.',
        },
        title: {
          type: Type.STRING,
          description: 'Título da tarefa a ser criada ou concluída.',
        },
        projectName: {
          type: Type.STRING,
          description: 'Nome do projeto ao qual a tarefa pertence.',
        },
        priority: {
          type: Type.STRING,
          enum: ['baixa', 'media', 'alta'],
          description: 'Prioridade da tarefa.',
        },
        estimatedPomodoros: {
          type: Type.NUMBER,
          description: 'Estimativa de pomodoros (ex: 1, 2, 4).',
        },
        dueDate: {
          type: Type.STRING,
          description: 'Data de entrega no formato YYYY-MM-DD.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manageCalendar',
    description: 'Agenda compromissos ou blocos de estudo no calendário com sincronização automática.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['create_event', 'get_events_today', 'delete_event'],
          description: 'Ação no calendário.',
        },
        title: {
          type: Type.STRING,
          description: 'Título do evento ou compromisso.',
        },
        startTime: {
          type: Type.STRING,
          description: 'Horário de início (formato ISO ou YYYY-MM-DDTHH:mm).',
        },
        endTime: {
          type: Type.STRING,
          description: 'Horário de término (formato ISO ou YYYY-MM-DDTHH:mm).',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'createStudyMaterial',
    description: 'Cria notas rápidas, anotações de estudo, mantras ou flashcards ditados pelo usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['quick_note', 'flashcard', 'mantra'],
          description: 'Tipo de material de estudo a criar.',
        },
        title: {
          type: Type.STRING,
          description: 'Título da nota ou conceito.',
        },
        content: {
          type: Type.STRING,
          description: 'Conteúdo detalhado da nota ou frase do mantra.',
        },
        front: {
          type: Type.STRING,
          description: 'Frente do flashcard (pergunta ou conceito).',
        },
        back: {
          type: Type.STRING,
          description: 'Verso do flashcard (resposta ou explicação).',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'navigateApp',
    description: 'Navega para uma tela específica da aplicação (timer, projects, calendar, ranking, drafts, flashcards, mindmaps).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          enum: ['timer', 'projects', 'project-detail', 'calendar', 'groups', 'ranking', 'drafts', 'flashcards', 'mindmaps'],
          description: 'Nome da view para navegar.',
        },
      },
      required: ['view'],
    },
  },
  {
    name: 'summarizeProductivity',
    description: 'Solicita um resumo falado do progresso, estatísticas de foco e tarefas concluídas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeframe: {
          type: Type.STRING,
          enum: ['today', 'week'],
          description: 'Período a resumir.',
        },
      },
    },
  },
  {
    name: 'controlTheme',
    description: 'Altera o tema (claro/escuro) ou paleta de cores da aplicação.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['light', 'dark', 'system', 'palette'],
          description: 'Ação para o tema',
        },
        palette: {
          type: Type.STRING,
          enum: ['ruby', 'ocean', 'matcha', 'oled', 'sunset'],
          description: 'Paleta de cores (se action for palette)',
        }
      },
      required: ['action'],
    },
  },
  {
    name: 'controlAmbientSound',
    description: 'Controla o som ambiente (chuva, ruído branco) e seu volume.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['play', 'stop', 'change_volume'],
          description: 'Ação com o som ambiente.',
        },
        sound: {
          type: Type.STRING,
          enum: ['none', 'rain', 'brownNoise', 'whiteNoise'],
          description: 'Tipo de som ambiente.',
        },
        volume: {
          type: Type.NUMBER,
          description: 'Volume do som entre 0.0 e 1.0.',
        }
      },
      required: ['action'],
    },
  },
  {
    name: 'toggleUI',
    description: 'Abre, fecha ou alterna painéis da interface como o modo Zen, paleta de comandos, configurações ou scratchpad.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        panel: {
          type: Type.STRING,
          enum: ['zenMode', 'commandPalette', 'scratchpad', 'settings'],
          description: 'Painel da interface.',
        },
        action: {
          type: Type.STRING,
          enum: ['open', 'close', 'toggle'],
          description: 'O que fazer com o painel.',
        }
      },
      required: ['panel', 'action'],
    },
  }
];
