# HIMAYA - System Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph "User Interface Layer"
        A[📱 Basic Phone<br/>IVR/USSD]
        B[📱 Smartphone<br/>PWA/Web App]
        C[💬 WhatsApp<br/>Bot Interface]
    end

    subgraph "API Gateway"
        D[🔀 Load Balancer<br/>nginx/AWS ALB]
        E[🛡️ Rate Limiter<br/>Express Middleware]
    end

    subgraph "Application Layer"
        F[🎤 Voice Service<br/>STT/TTS Processing]
        G[📋 Scheme Service<br/>CRUD Operations]
        H[👤 User Service<br/>Registration/Auth]
        I[🌐 Language Service<br/>i18n/Translation]
    end

    subgraph "Data Layer"
        J[(📊 Scheme DB<br/>JSON/SQLite)]
        K[(👥 User DB<br/>JSON/SQLite)]
        L[📦 Cache<br/>In-Memory/Redis]
    end

    subgraph "External Services"
        M[📞 Telephony<br/>Twilio/Exotel]
        N[🗣️ Speech API<br/>Google/Azure]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    F --> I
    G --> J
    H --> K
    F --> L
    G --> L
    F --> N
    A -.-> M
    M -.-> F
```

## Component Details

### 1. User Interface Layer

| Channel | Technology | Target Users |
|---------|-----------|--------------|
| IVR | Twilio/Exotel Voice | Basic phone users |
| USSD | Telecom Gateway | Feature phone users |
| PWA | Web Speech API | Smartphone users |
| WhatsApp | WhatsApp Business API | Messaging users |

### 2. Voice Processing Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant IVR as IVR System
    participant STT as Speech-to-Text
    participant NLU as Intent Parser
    participant SVC as Scheme Service
    participant TTS as Text-to-Speech

    U->>IVR: Speaks query
    IVR->>STT: Audio stream
    STT->>NLU: Transcribed text
    NLU->>SVC: Detected intent + entities
    SVC->>NLU: Scheme data
    NLU->>TTS: Response text
    TTS->>IVR: Audio response
    IVR->>U: Speaks response
```

### 3. Offline-First Architecture

```mermaid
flowchart LR
    subgraph "Device"
        SW[Service Worker]
        IC[IndexedDB Cache]
        UI[User Interface]
    end

    subgraph "Network"
        API[Backend API]
    end

    UI --> SW
    SW --> IC
    SW -->|Online| API
    API -->|Sync| SW
    IC -->|Offline| UI
```

**Cache Strategy:**
- **Schemes**: Cache-first, background sync
- **User Data**: Network-first with fallback
- **Static Assets**: Cache-first, versioned

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Runtime | Node.js 18+ | Async I/O, large ecosystem |
| Framework | Express.js | Lightweight, flexible routing |
| Database | JSON/SQLite | Simple for prototype, upgradeable |
| Voice (Dev) | Web Speech API | No API keys, built-in browser support |
| Voice (Prod) | Google Cloud Speech | Best accuracy for Indian languages |
| PWA | Vanilla JS + Service Workers | No build step, maximum compatibility |
| Caching | In-memory (→ Redis) | Start simple, scale when needed |

## Scalability Roadmap

```mermaid
gantt
    title Scalability Phases
    dateFormat  YYYY-MM
    section Phase 1
    Single Server (100 users)      :2024-01, 3M
    section Phase 2
    Load Balanced (10K users)      :2024-04, 3M
    section Phase 3
    Regional Deploy (100K users)   :2024-07, 6M
    section Phase 4
    Multi-Region (1M+ users)       :2025-01, 12M
```

## Security Considerations

1. **Data Privacy**: All PII encrypted at rest
2. **API Security**: Rate limiting, API key authentication
3. **Voice Data**: Not stored, processed in-memory only
4. **Compliance**: Aligned with India's DPDP Bill 2023
