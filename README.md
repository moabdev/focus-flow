# FocusFlow 🎯

> **Plataforma de Alta Performance para Estudos, Pomodoro, Gestão de Tempo e Inteligência Artificial**, desenvolvida com **React 18**, **TypeScript 5**, **Vite**, **Supabase**, **Gemini API** e estilização refinada em **Glassmorphism**.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Vitest](https://img.shields.io/badge/Tests-105%20Passing-10b981?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 🌟 Visão Geral

O **FocusFlow** é uma solução completa para concurseiros, vestibulandos, desenvolvedores e estudantes de alta performance. O aplicativo combina a técnica Pomodoro com **Gamificação (Medalhas e Níveis)**, **Time-Blocking em Calendário**, **Gestão de Projetos e Subtarefas (com anotações estilo Notion)**, e agora conta com uma poderosa **Suíte de Inteligência Artificial**.

Desenvolvido sob o paradigma **Offline-First**, o FocusFlow pode ser instalado como **PWA** e funciona 100% sem internet ou sem login através do `localStorage`, oferecendo sincronização em nuvem e autenticação Google segura via **Supabase**.

---

## ✨ Novidades e Recursos Exclusivos

### 🤖 1. Integração com Inteligência Artificial (Google Gemini)
O FocusFlow agora conta com o **"Flow"**, nosso Agente de IA, integrado de forma profunda em diversas partes da aplicação:
- **Voice Agent (Copiloto de Voz):** Assistente flutuante acionado por voz para controlar o timer, criar tarefas e responder dúvidas sobre seus projetos.
- **Gerador de Flashcards AI:** Gere baralhos de flashcards automaticamente a partir das suas anotações do Notion.
- **Gerador de Quiz AI:** Teste seus conhecimentos gerando quizzes interativos baseados no seu material de estudo.
- **Copilot nas Estatísticas:** Análise inteligente do seu desempenho e dicas personalizadas na aba "Copilot" dos seus relatórios.

### 🧠 2. Flashcards & Repetição Espaçada (SRS)
- **Criação de Decks:** Crie baralhos ilimitados ou deixe a IA gerar para você.
- **Algoritmo de Estudo:** Sistema de repetição espaçada inteligente para maximizar a retenção de memória a longo prazo.
- **Importação/Exportação:** Compartilhe e faça backup dos seus Decks.

### 🗺️ 3. Mapas Mentais (Mind Maps)
- **Editor Visual:** Crie mapas mentais interativos para organizar ideias complexas.
- **Nós e Conexões:** Conecte conceitos de forma orgânica com uma interface drag-and-drop.
- **Integração com Projetos:** Vincule mapas mentais diretamente a disciplinas e subtarefas.

### 📅 4. Integração com Google Calendar
- Sincronização bidirecional e eventos. Suas tarefas e blocos de tempo agora podem ser gerenciados diretamente em sincronia com o serviço de calendário da Google (via `googleCalendarService`).

### ✉️ 5. Convites de Grupos via E-mail (Brevo)
- Facilidade para adicionar novos membros aos seus Grupos de Estudo através do envio automatizado de e-mails via integração com a API da **Brevo**.

---

## 🚀 Funcionalidades Clássicas

### ⏱️ Cronômetro Pomodoro & Foco
- **Anel SVG Preciso:** Contagem regressiva compensada por delta de timestamp.
- **Modo Foco Rigoroso:** Detecta troca de abas e alerta contra distrações.
- **Atalhos Globais:** `Espaço` (Iniciar/Pausar), `Alt+S` (Pular ciclo).

### 🌧️ Áudio Ambiente Nativo
- Chuva Suave, Ruído Marrom e Ruído Branco sintetizados offline (sem arquivos mp3 pesados) via **Web Audio API**.

### 🏆 Gamificação & Sistema de Conquistas
- 12 Medalhas (Bronze, Prata, Ouro e Diamante) baseadas em horas líquidas, dias de ofensiva e subtarefas concluídas, com animações (*canvas-confetti*).

### 📂 Gestão de Projetos com Editor Notion-like
- Subtarefas retráteis, prioridades, e anotações ricas para cada card.
- **Ditado por Voz:** Transcrição em tempo real (Speech-to-Text).

### 👥 Grupos de Estudo com Chat
- Salas de estudo com código de convite, chat em tempo real e reações.

### 📊 Relatórios & Estatísticas
- Heatmap Anual estilo GitHub, Leaderboard semanal e Exportação de Sessões (CSV/PDF).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite |
| **Inteligência Artificial** | SDK `@google/genai` (Google Gemini API) |
| **Estilização** | Vanilla CSS / Design Tokens / Glassmorphism |
| **Backend / DB** | Supabase (PostgreSQL + RLS) |
| **Serviço de E-mail** | Brevo API |
| **Áudio** | Web Audio API Nativa |
| **Testes** | Vitest, Testing Library, jsdom, Cypress (100+ testes) |
| **Deploy** | Vercel |

---

## 🚀 Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/moabdev/focus-flow.git
cd focusflow
npm install
```

### 2. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e preencha as variáveis:
```env
# Banco de Dados
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica

# Inteligência Artificial
VITE_GEMINI_API_KEY=sua-chave-do-google-ai-studio

# E-mail (Opcional)
VITE_BREVO_API_KEY=sua-chave
VITE_BREVO_SENDER_EMAIL=seu-email
VITE_BREVO_SENDER_NAME=FocusFlow
```
> O app funciona **Offline-First**. Sem as chaves, os dados são salvos no `localStorage` e as funções de IA ficam desabilitadas graciosamente.

### 3. Iniciar o Servidor
```bash
npm run dev
```
Acesse `http://localhost:5173`.

---

## 🧪 Testes

O projeto possui rigorosa cobertura de testes de componentes, hooks e serviços de integração (incluindo testes para IA e Voice Agent).

```bash
# Unitários e Integração
npm test

# E2E (Cypress)
npm run cypress:open
```

---

## 📄 Licença e Créditos

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).

Feito com ☕ e foco por [Moab Macena](https://github.com/moabdev).
