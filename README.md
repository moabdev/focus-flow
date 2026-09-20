# FocusFlow 🎯

> **Plataforma de Alta Performance para Estudos, Pomodoro e Gestão de Tempo**, desenvolvida com **React 18**, **TypeScript 5**, **Vite**, **Supabase (PostgreSQL + Google OAuth)** e estilização refinada em **Glassmorphism**.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-100%20Passing-10b981?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 🌟 Visão Geral

O **FocusFlow** é uma solução completa para concurseiros, vestibulandos, desenvolvedores e estudantes de alta performance. O aplicativo combina a técnica Pomodoro com **Gamificação (Medalhas e Níveis)**, **Time-Blocking em Calendário**, **Gestão de Projetos e Subtarefas (com anotações estilo Notion)**, **Grupos de Estudo colaborativos com chat em tempo real**, **Relatórios exportáveis (CSV e PDF formatado)** e **Áudio Ambiente nativo sintetizado via Web Audio API**.

Desenvolvido sob o paradigma **Offline-First**, o FocusFlow pode ser instalado como **PWA** e funciona 100% sem internet ou sem login através do `localStorage`, oferecendo sincronização em nuvem e autenticação Google segura via **Supabase**.

---

## ✨ Funcionalidades Principais

### ⏱️ 1. Cronômetro Pomodoro & Foco
- **Anel SVG Preciso:** Contagem regressiva compensada por delta de timestamp (imune a congelamento por abas inativas do navegador).
- **Ciclos Configuráveis:** Pomodoro (25 min padrão), Pausa Curta (5 min) e Pausa Longa (15 min).
- **Vinculação Direta de Subtarefas:** Selecione a subtarefa em foco para acumular automaticamente ciclos e tempo dedicado ao projeto pai.
- **Modo Foco Rigoroso (Anti-Distração):** Detecta se o estudante troca de aba ou minimiza a janela enquanto o cronômetro está ativo, emitindo alertas imediatos.
- **Atalhos Globais:** `Espaço` (Iniciar/Pausar), `Alt+S` (Pular ciclo), `Alt+R` (Reiniciar), `Alt+Z` (Modo Zen).

### 🌧️ 2. Áudio Ambiente Nativo (Web Audio API)
- Síntese de áudio matemática 100% offline (sem arquivos de áudio externos para carregamento ultrarrápido):
  - 🌧️ **Chuva Suave**
  - 🎧 **Ruído Marrom** (*Brownian Noise* - excelente para hiperfoco, TDAH e bloqueio de ruídos externos)
  - 📻 **Ruído Branco**
- Controle de volume deslizante individual e alarmes harmônicos (Sino Zen 528Hz, Cristal e Digital Tech).

### 🏆 3. Gamificação & Sistema de Conquistas (Badges)
- **12 Medalhas em 4 Tiers:** Bronze, Prata, Ouro e Diamante.
- Conquistas calculadas com base em pomodoros concluídos, horas líquidas de estudo, dias consecutivos de ofensiva e subtarefas finalizadas.
- **Feedback Celebrativo:** Notificações Toast automáticas ao desbloquear novas conquistas.
- **Galeria de Conquistas:** Visualização do progresso percentual e requisitos de cada medalha no painel de estatísticas.

### 📅 4. Calendário Integrado & Time-Blocking
- Visualizações dinâmicas por **Dia**, **Semana** e **Mês**.
- Criação de blocos de tempo com vinculação direta a projetos, subtarefas, cores personalizadas e horários precisos.
- Alternância visual de eventos pendentes e concluídos.

### 📂 5. Gestão de Projetos & Subtarefas com Anotações Notion
- **Cards Leves com Accordion:** Subtarefas retráteis por projeto para máxima clareza visual.
- **Anotações Ricas:** Editor integrado estilo Notion para cada subtarefa, permitindo registrar resumos, fórmulas e insights.
- **Metadados Completos:** Prioridade (Alta, Média, Baixa com dots coloridos), estimativa vs. realização de ciclos Pomodoro, prazos relativos inteligentes (Hoje, Amanhã, Atrasada) e botão rápido *"Focar Agora"*.
- **Página de Detalhes do Projeto:** Visão panorâmica individual com KPIs, progresso percentual e gerenciamento de tarefas.

### 👥 6. Grupos de Estudo com Chat ao Vivo
- **Salas de Estudo Colaborativas:** Criação de grupos com código de convite compartilhável.
- **Gestão Completa de Membros:** O criador do grupo pode excluir a sala permanentemente; membros participantes podem entrar e sair a qualquer momento.
- **Chat em Tempo Real:** Envio de mensagens e botões de incentivo rápido (*Reações de Comemoração*).

### 📊 7. Relatórios & Estatísticas de Estudo
- **Heatmap Anual de Consistência:** Grade de 365 dias estilo GitHub mapeando o volume diário de sessões.
- **Exportação de Sessões em CSV:** Arquivo formatado com BOM UTF-8 (compatível com Microsoft Excel e Google Sheets).
- **Exportação de Tarefas em CSV:** Relatório detalhado com status de subtarefas por projeto.
- **Relatório Oficial de Produtividade (Impressão / Salvar em PDF):** Documento formal diagramado para comprovação de horas complementares ou estágio.

### 🎨 8. Design System em Glassmorphism & 5 Paletas de Cores
- **Paletas Exclusivas:**
  - 🔴 **Ruby Focus** (Carmim e Rosa neon)
  - 🔵 **Deep Ocean** (Azul profundo e Ciano)
  - 🟢 **Matcha Zen** (Verde menta e sálvia)
  - ⚫ **Midnight OLED** (Preto absoluto para telas AMOLED)
  - 🟠 **Sunset Glow** (Pêssego e Âmbar)
- **Modo Claro & Modo Escuro** disponíveis em todas as paletas.
- **Barras de Scroll Dinâmicas:** Scrollbars estilizadas que sincronizam automaticamente com as cores da paleta selecionada.

### 🧭 9. Sidebar Fixa Desktop & Modo Colapsado Inteligente
- **Desktop Fixo:** O shell da aplicação ocupa 100vh com rolagem independente exclusiva na área de conteúdo — a sidebar **permanece 100% imóvel** ao rolar a página.
- **Modo Colapsado (74px):**
  - Header com logo centralizada e botão pill moderno.
  - Grade 2x2 para ferramentas rápidas (Áudio, Tema, Zen, Configurações).
  - Botões simétricos 44px × 44px com mini badges de ofensiva e contagem de projetos.
  - Tooltips instantâneos no hover (`[data-tooltip]`).
  - Popovers flutuantes desacoplados do limite da barra lateral.

### 📱 10. Responsividade Extrema (320px até 4K)
- Otimização cirúrgica para smartphones ultra-compactos (iPhone SE 1ª geração, telas externas de dobráveis) sem quebras de layout ou transbordamentos horizontais.
- Header inteligente com recolhimento de rótulos entre 400px e 520px.

### ⌨️ 11. Command Palette (`Ctrl+K` / `⌘+K`)
- Busca instantânea e atalhos rápidos de navegação por teclado para qualquer tela, modal ou ação da plataforma.

### 🛡️ 12. Diálogos com ConfirmModal Customizado
- Eliminação de alertas nativos do navegador (`window.confirm`), substituídos por diálogos acessíveis em Glassmorphism com variantes visuais dedicadas (`danger`, `warning`, `primary`).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite |
| **Estilização** | Vanilla CSS / Design Tokens / Glassmorphism (`backdrop-filter`) |
| **Ícones** | Lucide React |
| **Backend / DB** | Supabase (PostgreSQL + Row Level Security - RLS) |
| **Autenticação** | Supabase Auth (Google OAuth) |
| **Áudio** | Web Audio API Nativa |
| **PWA** | Service Worker + Web App Manifest |
| **Testes Unitários/Integração** | Vitest, Testing Library, jsdom (100 testes aprovados) |
| **Testes E2E** | Cypress |
| **Deploy** | Vercel |

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm`

### 2. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/moabdev/focus-flow.git
cd focusflow
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example` (opcional, caso deseje sincronizar com Supabase):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
```

> **Nota:** O FocusFlow é **Offline-First**. Se nenhuma variável de ambiente for configurada, a plataforma funcionará normalmente salvando os dados no `localStorage`.

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em `http://localhost:5173`.

---

## 🧪 Execução de Testes

### Testes Unitários e de Integração (Vitest)
Executa a suíte de 100 testes automatizados cobrindo ações de timer, projetos, subtarefas, calendário, grupos, relatórios, sidebar e modais:
```bash
npm test
```
Ou para execução única em CI:
```bash
npm test -- --run
```

### Testes End-to-End (Cypress)
```bash
npm run cypress:run
```
Ou para abrir o painel interativo:
```bash
npm run cypress:open
```

### Validação de Build de Produção
```bash
npm run build
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Para habilitar persistência remota e login com o Google:
1. Crie um projeto no [Supabase](https://supabase.com/).
2. No painel do Supabase, abra o **SQL Editor**.
3. Execute o script contido em [supabase-schema.sql](./supabase-schema.sql). O script configura:
   - Tabela `profiles` com sincronização automática do `auth.users` via trigger.
   - Tabelas `projects`, `subtasks`, `calendar_events`, `study_sessions`, `study_groups`, `group_members` e `group_messages`.
   - Políticas de segurança **RLS (Row Level Security)** por usuário.
4. Em **Authentication > Providers**, habilite o provedor **Google** configurando seu Client ID e Secret.

---

## 🌐 Deploy na Vercel

O FocusFlow está pronto para deploy com zero configuração extra:
1. Importe o repositório na [Vercel](https://vercel.com/).
2. A Vercel detectará automaticamente o preset **Vite**.
3. Em **Build and Output Settings**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Em **Environment Variables**, configure as credenciais do Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.

---

## 📄 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).

---

Feito com ☕ e foco por [Moab Macena](https://github.com/moabdev).
