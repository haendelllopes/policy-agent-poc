# 📐 Diagramas de Arquitetura - Melhorias Flowly

**Data:** 10 de outubro de 2025

---

## 🗄️ Diagrama de Banco de Dados

```mermaid
erDiagram
    tenants ||--o{ users : "tem"
    tenants ||--o{ trilhas : "possui"
    tenants ||--o{ departments : "possui"
    tenants ||--o{ positions : "possui"
    
    users ||--o{ colaborador_trilhas : "realiza"
    users ||--o{ colaborador_sentimentos : "tem histórico"
    users ||--o{ agente_anotacoes : "sobre"
    users }o--|| departments : "pertence a"
    users }o--|| positions : "tem cargo"
    
    trilhas ||--o{ trilha_conteudos : "contém"
    trilhas ||--o{ colaborador_trilhas : "atribuída a"
    trilhas ||--o{ trilha_segmentacao : "segmentada por"
    trilhas ||--o{ agente_anotacoes : "sobre"
    
    departments ||--o{ trilha_segmentacao : "pode acessar"
    positions ||--o{ trilha_segmentacao : "pode acessar"
    
    colaborador_trilhas ||--o{ conteudo_aceites : "aceita conteúdos"
    colaborador_trilhas ||--o{ quiz_tentativas : "realiza quiz"
    
    agente_anotacoes }o--|| onboarding_improvements : "gera"
    
    users {
        uuid id PK
        uuid tenant_id FK
        string name
        string email
        uuid department_id FK
        uuid position_id FK
        string sentimento_atual
        timestamp sentimento_atualizado_em
    }
    
    trilhas {
        uuid id PK
        uuid tenant_id FK
        string nome
        string segmentacao_tipo
        jsonb segmentacao_config
        boolean ativo
    }
    
    trilha_segmentacao {
        uuid id PK
        uuid trilha_id FK
        uuid department_id FK
        uuid position_id FK
        boolean incluir
    }
    
    colaborador_sentimentos {
        uuid id PK
        uuid tenant_id FK
        uuid colaborador_id FK
        string sentimento
        decimal intensidade
        string origem
        text mensagem_analisada
        jsonb fatores_detectados
        uuid trilha_id FK
    }
    
    agente_anotacoes {
        uuid id PK
        uuid tenant_id FK
        uuid colaborador_id FK
        uuid trilha_id FK
        string tipo
        string titulo
        text anotacao
        string sentimento
        decimal intensidade_sentimento
        jsonb contexto
        text[] tags
        boolean relevante
        boolean gerou_melhoria
        uuid improvement_id FK
    }
    
    onboarding_improvements {
        uuid id PK
        uuid tenant_id FK
        string categoria
        string prioridade
        string titulo
        text descricao
        jsonb contexto
        string status
    }
```

---

## 🔄 Fluxo 1: Captura de Sentimento e Adaptação de Resposta

```mermaid
sequenceDiagram
    participant C as Colaborador
    participant W as WhatsApp/N8N
    participant AI as OpenAI API
    participant DB as Banco de Dados
    participant A as Agente IA

    C->>W: Envia mensagem
    W->>AI: Analisa sentimento da mensagem
    AI-->>W: {sentimento, intensidade, fatores}
    
    W->>DB: Salva em colaborador_sentimentos
    DB-->>W: Sentimento salvo
    
    W->>DB: Atualiza users.sentimento_atual (via trigger)
    DB-->>W: Atualizado
    
    W->>DB: Busca sentimento_atual do colaborador
    DB-->>W: Sentimento: negativo
    
    W->>A: Adapta tom da resposta
    Note over A: Tom empático e acolhedor
    
    A-->>W: Resposta adaptada
    W->>DB: Registra ação_agente
    W->>C: Envia resposta personalizada
    
    Note over C,W: "Entendo sua dificuldade.<br/>Como posso te ajudar? 💙"
```

---

## 🔄 Fluxo 2: Criação de Anotação e Geração de Melhoria

```mermaid
sequenceDiagram
    participant C as Colaborador
    participant W as WhatsApp/N8N
    participant AI as OpenAI API
    participant DB as Banco de Dados
    participant Admin as Dashboard Admin

    C->>W: "Essa trilha de RH tá muito longa..."
    
    W->>AI: Detecta feedback relevante
    AI-->>W: {relevante: true, tipo: "sentimento_trilha"}
    
    W->>AI: Classifica e extrai tags
    AI-->>W: {tags: ["prazo", "volume_conteudo", "rh"]}
    
    W->>DB: Cria anotação em agente_anotacoes
    DB-->>W: Anotação criada
    
    Note over W,DB: Anotações acumulam ao longo do tempo
    
    rect rgb(200, 220, 250)
    Note over W,DB: 1 semana depois - Análise Periódica
    
    W->>DB: Busca anotações relevantes (últimos 30 dias)
    DB-->>W: 15 anotações sobre "trilha RH longa"
    
    W->>AI: Analisa padrão e sugere melhoria
    AI-->>W: Sugestão de melhoria gerada
    
    W->>DB: Salva em onboarding_improvements
    DB-->>W: Melhoria salva
    
    W->>DB: Atualiza anotações: gerou_melhoria = true
    DB-->>W: Atualizado
    
    W->>Admin: Notifica sobre nova sugestão
    Admin-->>W: Notificação recebida
    end
    
    Admin->>DB: Visualiza melhoria sugerida
    Admin->>DB: Aprova e implementa
```

---

## 🔄 Fluxo 3: Roteamento de Trilhas por Cargo/Departamento

```mermaid
flowchart TD
    A[Novo Colaborador Cadastrado] --> B{Tem cargo e<br/>departamento?}
    B -->|Não| C[Atribui apenas trilhas<br/>para TODOS]
    B -->|Sim| D[Busca trilhas aplicáveis]
    
    D --> E{Tipo de<br/>Segmentação?}
    
    E -->|todos| F[✅ Trilha para TODOS]
    E -->|departamentos| G{Departamento<br/>do colaborador<br/>está na lista?}
    E -->|cargos| H{Cargo do<br/>colaborador<br/>está na lista?}
    E -->|departamentos_cargos| I{Combinação<br/>cargo + dept<br/>está na lista?}
    
    G -->|Sim| F
    G -->|Não| J[❌ Trilha não aplicável]
    
    H -->|Sim| F
    H -->|Não| J
    
    I -->|Sim| F
    I -->|Não| J
    
    F --> K[Cria registro em<br/>colaborador_trilhas]
    J --> L[Não cria registro]
    
    C --> K
    K --> M[Agente IA orienta<br/>colaborador sobre<br/>suas trilhas]
    
    M --> N[Colaborador inicia<br/>trilha personalizada]
    
    style F fill:#90EE90
    style J fill:#FFB6C6
    style M fill:#87CEEB
```

---

## 🎯 Arquitetura Geral do Sistema

```mermaid
graph TB
    subgraph "Frontend"
        AD[Dashboard Admin]
        CD[Dashboard Colaborador]
    end
    
    subgraph "Backend API"
        API[Express API]
        AUTH[Autenticação]
        TRILHAS[Rotas Trilhas]
        SENT[Rotas Sentimentos]
        ANOT[Rotas Anotações]
        MELH[Rotas Melhorias]
    end
    
    subgraph "N8N Workflows"
        WF1[Análise de Sentimento]
        WF2[Criação de Anotações]
        WF3[Análise de Padrões<br/>Agendado 1x/semana]
        WF4[Roteamento de Trilhas]
    end
    
    subgraph "IA Services"
        OPENAI[OpenAI API]
        VERTEX[Google Vertex AI]
    end
    
    subgraph "Banco de Dados - PostgreSQL/Supabase"
        T1[(users)]
        T2[(trilhas)]
        T3[(trilha_segmentacao)]
        T4[(colaborador_sentimentos)]
        T5[(agente_anotacoes)]
        T6[(onboarding_improvements)]
    end
    
    subgraph "Canais de Comunicação"
        WA[WhatsApp]
        TG[Telegram]
        WEB[Web Chat]
    end
    
    AD --> API
    CD --> API
    
    API --> AUTH
    API --> TRILHAS
    API --> SENT
    API --> ANOT
    API --> MELH
    
    TRILHAS --> T2
    TRILHAS --> T3
    SENT --> T4
    SENT --> T1
    ANOT --> T5
    MELH --> T6
    
    WA --> WF1
    TG --> WF1
    WEB --> WF1
    
    WF1 --> OPENAI
    WF1 --> T4
    WF1 --> T1
    
    WF2 --> OPENAI
    WF2 --> T5
    
    WF3 --> T5
    WF3 --> OPENAI
    WF3 --> T6
    
    WF4 --> T2
    WF4 --> T3
    WF4 --> T1
    
    style OPENAI fill:#10a37f
    style T4 fill:#FFE4B5
    style T5 fill:#FFE4B5
    style T6 fill:#FFE4B5
    style T3 fill:#FFE4B5
```

---

## 📊 Fluxo de Análise de Sentimento - Detalhado

```mermaid
flowchart LR
    A[Mensagem do<br/>Colaborador] --> B{Contém<br/>conteúdo<br/>relevante?}
    
    B -->|Não| C[Resposta padrão]
    B -->|Sim| D[Enviar para OpenAI]
    
    D --> E[Análise de Sentimento]
    
    E --> F{Sentimento<br/>detectado}
    
    F -->|muito_negativo<br/>intensidade > 0.7| G[🚨 Alerta para RH]
    F -->|muito_negativo<br/>intensidade ≤ 0.7| H[Tom empático<br/>Oferece ajuda]
    F -->|negativo| I[Tom compreensivo<br/>Dá suporte]
    F -->|neutro| J[Tom profissional<br/>padrão]
    F -->|positivo| K[Tom motivador<br/>Reconhecimento]
    F -->|muito_positivo| L[Tom celebrativo<br/>Parabenizações]
    
    G --> M[Salva em DB]
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Atualiza<br/>sentimento_atual<br/>em users]
    
    N --> O[Gera resposta<br/>adaptada]
    
    O --> P[Envia ao<br/>colaborador]
    
    style G fill:#FF6B6B
    style H fill:#FFA07A
    style I fill:#FFD700
    style J fill:#87CEEB
    style K fill:#90EE90
    style L fill:#98FB98
```

---

## 🧠 Sistema de Memória do Agente

```mermaid
graph TD
    A[Conversas do Dia a Dia] --> B{Detecta<br/>feedback<br/>relevante?}
    
    B -->|Não| C[Apenas responde]
    B -->|Sim| D[Cria Anotação]
    
    D --> E[agente_anotacoes]
    
    E --> F{Tipo de<br/>Anotação}
    
    F -->|sentimento_trilha| G[Tag: trilha_id]
    F -->|dificuldade_conteudo| H[Tag: conteudo_id]
    F -->|sugestao_colaborador| I[Tag: sugestao]
    F -->|sentimento_empresa| J[Tag: empresa]
    
    G --> K[Banco de Anotações]
    H --> K
    I --> K
    J --> K
    
    K --> L{Análise Semanal}
    
    L --> M[Agrupa por:<br/>- Tipo<br/>- Tags<br/>- Sentimento<br/>- Trilha]
    
    M --> N{Identifica<br/>Padrões?}
    
    N -->|Sim<br/>≥3 ocorrências| O[Gera Sugestão<br/>de Melhoria]
    N -->|Não| P[Aguarda mais dados]
    
    O --> Q[onboarding_improvements]
    
    Q --> R[Dashboard Admin]
    
    R --> S{Admin<br/>Aprova?}
    
    S -->|Sim| T[Implementa<br/>Melhoria]
    S -->|Não| U[Rejeita e<br/>documenta motivo]
    
    T --> V[Melhoria Contínua]
    
    style O fill:#FFD700
    style T fill:#90EE90
    style V fill:#98FB98
```

---

## 🎨 Interface Admin - Wireframe Conceitual

```
┌─────────────────────────────────────────────────────────────────┐
│ Flowly - Dashboard Admin                              [👤 Admin] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│ │ 😊 Sentimento    │  │ 📝 Anotações    │  │ 💡 Melhorias     │ │
│ │    Médio         │  │    Relevantes   │  │    Sugeridas     │ │
│ │                  │  │                  │  │                  │ │
│ │    7.8/10        │  │       23        │  │        5         │ │
│ │  (+0.5 vs mês)   │  │  (últimos 7d)   │  │   (pendentes)   │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 📊 Distribuição de Sentimentos (Últimos 30 dias)          │   │
│ │                                                             │   │
│ │  😄 Muito Positivo  ████████ 35%                          │   │
│ │  🙂 Positivo        ████████████ 40%                      │   │
│ │  😐 Neutro          ████ 15%                              │   │
│ │  😟 Negativo        ██ 8%                                 │   │
│ │  😞 Muito Negativo  █ 2%                                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 💡 Melhorias Sugeridas pelo Agente                         │   │
│ │                                                             │   │
│ │ 🔴 Alta   │ Dividir trilha de RH em 2 partes              │   │
│ │           │ 📊 Baseado em 8 feedbacks negativos           │   │
│ │           │ [Ver Detalhes] [Aprovar] [Rejeitar]           │   │
│ │                                                             │   │
│ │ 🟡 Média  │ Adicionar vídeos explicativos sobre benefícios│   │
│ │           │ 📊 Baseado em 5 dúvidas recorrentes           │   │
│ │           │ [Ver Detalhes] [Aprovar] [Rejeitar]           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 🚨 Alertas - Colaboradores com Sentimento Muito Negativo   │   │
│ │                                                             │   │
│ │ • João Silva (Dev) - 😞 há 2 dias                         │   │
│ │   Última msg: "Não tá dando certo, muito complicado"      │   │
│ │   [Conversar] [Oferecer Ajuda]                            │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Experiência do Colaborador - Exemplo de Conversa

```
┌─────────────────────────────────────────────┐
│ 💬 WhatsApp - Flowly Bot                    │
├─────────────────────────────────────────────┤
│                                             │
│ [10:00] Colaborador:                        │
│ Tô com dificuldade nessa trilha de RH      │
│ Tem muito conteúdo pra ler 😕              │
│                                             │
│ [10:01] Flowly Bot:                         │
│ Entendo sua dificuldade, João! 💙          │
│                                             │
│ Sei que pode parecer bastante conteúdo,    │
│ mas vou te ajudar a organizar melhor:      │
│                                             │
│ 📌 Foque primeiro nos 3 primeiros docs     │
│ 📌 Você tem 5 dias ainda, sem pressa!      │
│ 📌 Posso resumir os pontos principais?     │
│                                             │
│ Como posso te ajudar agora? 😊            │
│                                             │
│ [10:02] Colaborador:                        │
│ Sim! Seria ótimo um resumo                 │
│                                             │
│ [10:03] Flowly Bot:                         │
│ Perfeito! Aqui vai um resumo da            │
│ Trilha de RH:                              │
│                                             │
│ ✅ Benefícios: Plano saúde, VR, VT        │
│ ✅ Férias: 30 dias após 1 ano             │
│ ✅ Horário: Flexível, 8h/dia              │
│                                             │
│ Melhorou? 😊                               │
│                                             │
│ [10:04] Colaborador:                        │
│ Muito melhor! Obrigado! 😊                │
│                                             │
│ [10:05] Flowly Bot:                         │
│ Que ótimo! Fico feliz em ajudar! 🎉       │
│ Qualquer dúvida, é só chamar! 💪          │
│                                             │
└─────────────────────────────────────────────┘

🤖 Nos bastidores:
   ✅ Sentimento detectado: negativo → muito_positivo
   ✅ Tom adaptado: empático → celebrativo
   ✅ Anotação criada: "dificuldade_conteudo" na trilha RH
   ✅ Tags: ["volume_conteudo", "rh", "prazo"]
```

---

## 🔐 Segurança e Privacidade - RLS (Row Level Security)

```mermaid
graph TD
    A[Usuário faz request] --> B{Autenticado?}
    
    B -->|Não| C[❌ 401 Unauthorized]
    B -->|Sim| D{Qual role?}
    
    D -->|admin| E[✅ Acesso a todos os<br/>dados do tenant]
    D -->|colaborador| F[✅ Acesso apenas aos<br/>próprios dados]
    D -->|system/n8n| G[✅ Acesso via API key]
    
    E --> H{Qual tabela?}
    F --> H
    G --> H
    
    H -->|agente_anotacoes| I{RLS Check:<br/>tenant_id = user.tenant_id}
    H -->|colaborador_sentimentos| J{RLS Check:<br/>colaborador_id = user.id<br/>OR user.role = 'admin'}
    H -->|trilhas| K{RLS Check:<br/>tenant_id = user.tenant_id<br/>AND ativo = true}
    
    I -->|Pass| L[✅ Retorna dados]
    I -->|Fail| M[❌ Dados filtrados]
    
    J -->|Pass| L
    J -->|Fail| M
    
    K -->|Pass| L
    K -->|Fail| M
    
    style C fill:#FF6B6B
    style M fill:#FF6B6B
    style L fill:#90EE90
```

---

**Última atualização:** 10 de outubro de 2025  
**Criado por:** Haendell Lopes + AI Assistant



