# MathGaling Intelligent Tutoring System - System Architecture

## Table of Contents
1. [High-Level System Overview](#high-level-system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Architecture](#database-architecture)
5. [Intelligent Engine Architecture](#intelligent-engine-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Security Architecture](#security-architecture)
9. [Integration Architecture](#integration-architecture)
10. [Scalability Architecture](#scalability-architecture)

## High-Level System Overview

### 1. System Context Diagram

```mermaid
graph TB
    subgraph "External Actors"
        S[Students]
        T[Teachers]
        P[Parents]
        A[Administrators]
    end
    
    subgraph "MathGaling Intelligent Tutoring System"
        ITS[ITS Platform]
    end
    
    subgraph "External Systems"
        EMAIL[Email Service]
        SMS[SMS Service]
        LMS[School LMS]
        SIS[Student Information System]
    end
    
    S -->|Practice & Learn| ITS
    T -->|Manage & Monitor| ITS
    P -->|Track Progress| ITS
    A -->|Administer System| ITS
    
    ITS -->|Notifications| EMAIL
    ITS -->|Alerts| SMS
    ITS -.->|Integration| LMS
    ITS -.->|Data Exchange| SIS
    
    style ITS fill:#e1f5fe
    style S fill:#f3e5f5
    style T fill:#e8f5e8
    style P fill:#fff3e0
    style A fill:#fce4ec
```

### 2. High-Level Architecture Overview

```mermaid
graph TB
    subgraph "User Layer"
        UI[React Frontend Applications]
        MOBILE[Mobile Web Interface]
    end
    
    subgraph "API Gateway Layer"
        API[Express.js API Server]
        NETLIFY[Netlify Functions]
    end
    
    subgraph "Business Logic Layer"
        BKT[BKT Algorithm Engine]
        FUZZY[Fuzzy Logic Engine]
        CONTENT[Content Management]
        ASSESS[Assessment Engine]
        RECOMMEND[Recommendation Engine]
    end
    
    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        FILES[File Storage]
        CACHE[Redis Cache]
    end
    
    subgraph "External Services"
        AUTH[Supabase Auth]
        EMAIL_SVC[Email Service]
        MONITORING[Monitoring & Analytics]
    end
    
    UI --> API
    MOBILE --> API
    API --> NETLIFY
    
    NETLIFY --> BKT
    NETLIFY --> FUZZY
    NETLIFY --> CONTENT
    NETLIFY --> ASSESS
    NETLIFY --> RECOMMEND
    
    BKT --> DB
    FUZZY --> DB
    CONTENT --> DB
    ASSESS --> DB
    RECOMMEND --> DB
    
    CONTENT --> FILES
    NETLIFY --> CACHE
    
    API --> AUTH
    NETLIFY --> EMAIL_SVC
    API --> MONITORING
    
    style UI fill:#e3f2fd
    style API fill:#f1f8e9
    style BKT fill:#fff3e0
    style DB fill:#fce4ec
```

## Frontend Architecture

### 1. React Application Structure

```mermaid
graph TD
    subgraph "React Application"
        APP[App.js - Root Component]
        
        subgraph "Context Providers"
            AUTH_CTX[AuthContext]
            THEME_CTX[ThemeContext]
            NOTIF_CTX[NotificationContext]
        end
        
        subgraph "Routing"
            ROUTER[React Router]
            PRIVATE[PrivateRoute]
            PUBLIC[PublicRoute]
        end
        
        subgraph "Shared Components"
            HEADER[Header]
            FOOTER[Footer]
            LOGIN[Login/Signup]
            LOADING[Loading Spinner]
            MODAL[Modal Components]
        end
        
        subgraph "Student Components"
            S_DASH[Student Dashboard]
            S_QUIZ[Quiz View]
            S_PROG[Progress View]
            S_INBOX[Student Inbox]
        end
        
        subgraph "Teacher Components"
            T_DASH[Teacher Dashboard]
            T_CLASS[Classroom Management]
            T_CONTENT[Content Management]
            T_ANALYTICS[Performance Analytics]
        end
        
        subgraph "Parent Components"
            P_DASH[Parent Dashboard]
            P_CHILD[Child Progress]
            P_REPORT[Weekly Reports]
        end
        
        subgraph "Admin Components"
            A_DASH[Admin Dashboard]
            A_USER[User Management]
            A_CONTENT[Content Review]
            A_SYSTEM[System Settings]
        end
        
        subgraph "Services"
            API_SVC[API Service]
            AUTH_SVC[Auth Service]
            UTILS[Utility Functions]
        end
    end
    
    APP --> AUTH_CTX
    APP --> THEME_CTX
    APP --> NOTIF_CTX
    APP --> ROUTER
    
    ROUTER --> PRIVATE
    ROUTER --> PUBLIC
    
    PRIVATE --> S_DASH
    PRIVATE --> T_DASH
    PRIVATE --> P_DASH
    PRIVATE --> A_DASH
    
    PUBLIC --> LOGIN
    
    S_DASH --> S_QUIZ
    S_DASH --> S_PROG
    S_DASH --> S_INBOX
    
    T_DASH --> T_CLASS
    T_DASH --> T_CONTENT
    T_DASH --> T_ANALYTICS
    
    P_DASH --> P_CHILD
    P_DASH --> P_REPORT
    
    A_DASH --> A_USER
    A_DASH --> A_CONTENT
    A_DASH --> A_SYSTEM
    
    S_QUIZ --> API_SVC
    T_CLASS --> API_SVC
    P_CHILD --> API_SVC
    A_USER --> API_SVC
    
    API_SVC --> AUTH_SVC
    
    style APP fill:#e1f5fe
    style AUTH_CTX fill:#f3e5f5
    style S_DASH fill:#e8f5e8
    style T_DASH fill:#fff3e0
    style P_DASH fill:#fce4ec
    style A_DASH fill:#f1f8e9
```

### 2. Component Hierarchy and Data Flow

```mermaid
graph TD
    subgraph "Student Learning Flow"
        SD[Student Dashboard]
        QV[Quiz View]
        QQ[Quiz Question]
        QR[Quiz Results]
        PV[Progress View]
        
        SD -->|Start Quiz| QV
        QV -->|Load Question| QQ
        QQ -->|Submit Answer| QR
        QR -->|Update Progress| PV
        QR -->|Next Question| QQ
        QR -->|Complete Quiz| SD
    end
    
    subgraph "Teacher Management Flow"
        TD[Teacher Dashboard]
        CM[Classroom Management]
        CV[Classroom View]
        SV[Student View]
        PM[Performance Metrics]
        
        TD -->|Manage Classes| CM
        CM -->|View Classroom| CV
        CV -->|View Student| SV
        SV -->|Check Performance| PM
        PM -->|Back to Classroom| CV
    end
    
    subgraph "Parent Monitoring Flow"
        PD[Parent Dashboard]
        CP[Child Progress]
        WR[Weekly Report]
        
        PD -->|View Child| CP
        CP -->|View Report| WR
        WR -->|Back to Progress| CP
    end
    
    subgraph "State Management"
        GS[Global State]
        LS[Local State]
        CS[Component State]
        
        SD --> GS
        QV --> LS
        QQ --> CS
    end
    
    style SD fill:#e3f2fd
    style TD fill:#f1f8e9
    style PD fill:#fce4ec
```

## Backend Architecture

### 1. API Server Architecture

```mermaid
graph TB
    subgraph "API Gateway Layer"
        NETLIFY_FN[Netlify Functions]
        EXPRESS[Express.js Server]
    end
    
    subgraph "Middleware Layer"
        CORS[CORS Handler]
        AUTH_MW[Authentication Middleware]
        VALID[Validation Middleware]
        RATE[Rate Limiting]
        LOG[Logging Middleware]
        ERROR[Error Handler]
    end
    
    subgraph "Route Layer"
        STUDENT_R[Student Routes]
        TEACHER_R[Teacher Routes]
        PARENT_R[Parent Routes]
        ADMIN_R[Admin Routes]
        CONTENT_R[Content Routes]
        AUTH_R[Auth Routes]
    end
    
    subgraph "Controller Layer"
        STUDENT_C[Student Controller]
        TEACHER_C[Teacher Controller]
        PARENT_C[Parent Controller]
        ADMIN_C[Admin Controller]
        CONTENT_C[Content Controller]
        AUTH_C[Auth Controller]
        BKT_C[BKT Controller]
        PDF_C[PDF Controller]
    end
    
    subgraph "Service Layer"
        BKT_SVC[BKT Service]
        FUZZY_SVC[Fuzzy Logic Service]
        CONTENT_SVC[Content Service]
        NOTIF_SVC[Notification Service]
        EMAIL_SVC[Email Service]
        FILE_SVC[File Service]
    end
    
    subgraph "Data Access Layer"
        MODELS[Sequelize Models]
        DB_UTILS[Database Utilities]
        MIGRATIONS[Migration Scripts]
        SEEDERS[Data Seeders]
    end
    
    NETLIFY_FN --> EXPRESS
    EXPRESS --> CORS
    CORS --> AUTH_MW
    AUTH_MW --> VALID
    VALID --> RATE
    RATE --> LOG
    
    LOG --> STUDENT_R
    LOG --> TEACHER_R
    LOG --> PARENT_R
    LOG --> ADMIN_R
    LOG --> CONTENT_R
    LOG --> AUTH_R
    
    STUDENT_R --> STUDENT_C
    TEACHER_R --> TEACHER_C
    PARENT_R --> PARENT_C
    ADMIN_R --> ADMIN_C
    CONTENT_R --> CONTENT_C
    AUTH_R --> AUTH_C
    
    STUDENT_C --> BKT_SVC
    STUDENT_C --> CONTENT_SVC
    TEACHER_C --> NOTIF_SVC
    PARENT_C --> EMAIL_SVC
    ADMIN_C --> FILE_SVC
    CONTENT_C --> FUZZY_SVC
    
    BKT_SVC --> MODELS
    CONTENT_SVC --> MODELS
    NOTIF_SVC --> MODELS
    
    MODELS --> DB_UTILS
    
    LOG --> ERROR
    
    style NETLIFY_FN fill:#e1f5fe
    style EXPRESS fill:#f3e5f5
    style BKT_SVC fill:#fff3e0
    style MODELS fill:#fce4ec
```

### 2. API Endpoint Structure

```mermaid
graph LR
    subgraph "Authentication Endpoints"
        A1[POST /api/auth/login]
        A2[POST /api/auth/register]
        A3[POST /api/auth/logout]
        A4[GET /api/auth/profile]
    end
    
    subgraph "Student Endpoints"
        S1[GET /api/students/:id]
        S2[GET /api/students/:id/knowledge-states]
        S3[POST /api/students/:id/responses]
        S4[GET /api/students/:id/quiz]
        S5[GET /api/students/:id/progress]
        S6[GET /api/students/:id/messages]
    end
    
    subgraph "Teacher Endpoints"
        T1[GET /api/teachers/:id/classrooms]
        T2[POST /api/classrooms]
        T3[GET /api/classrooms/:id/students]
        T4[GET /api/classrooms/:id/performance]
        T5[POST /api/content-items]
        T6[POST /api/parent-student-links]
    end
    
    subgraph "Parent Endpoints"
        P1[GET /api/parents/:id/children]
        P2[GET /api/students/:id/weekly-report]
        P3[GET /api/students/:id/detailed-progress]
    end
    
    subgraph "Admin Endpoints"
        AD1[GET /api/admin/users]
        AD2[POST /api/admin/users]
        AD3[PUT /api/admin/users/:id]
        AD4[DELETE /api/admin/users/:id]
        AD5[GET /api/admin/content-review]
        AD6[POST /api/admin/pdf-upload]
    end
    
    subgraph "Content Endpoints"
        C1[GET /api/content-items]
        C2[POST /api/content-items]
        C3[PUT /api/content-items/:id]
        C4[DELETE /api/content-items/:id]
        C5[GET /api/knowledge-components]
        C6[POST /api/pdf-content]
    end
    
    style A1 fill:#e3f2fd
    style S1 fill:#e8f5e8
    style T1 fill:#fff3e0
    style P1 fill:#fce4ec
    style AD1 fill:#f1f8e9
    style C1 fill:#f3e5f5
```

## Database Architecture

### 1. Entity Relationship Diagram

```mermaid
erDiagram
    STUDENTS {
        int id PK
        string auth_id UK
        string username UK
        string email UK
        string first_name
        string last_name
        int grade
        timestamp created_at
    }
    
    TEACHERS {
        int id PK
        string auth_id UK
        string username UK
        string email UK
        string first_name
        string last_name
        timestamp created_at
    }
    
    PARENTS {
        int id PK
        string auth_id UK
        string username UK
        string email UK
        string first_name
        string last_name
        timestamp created_at
    }
    
    ADMINS {
        int id PK
        string auth_id UK
        string username UK
        string email UK
        string first_name
        string last_name
        timestamp created_at
    }
    
    CLASSROOMS {
        int id PK
        int teacher_id FK
        string name
        string description
        int grade
        boolean active
        timestamp created_at
    }
    
    KNOWLEDGE_COMPONENTS {
        int id PK
        string name
        string description
        int grade
        int difficulty
        json prerequisites
        json metadata
        timestamp created_at
    }
    
    CONTENT_ITEMS {
        int id PK
        int kc_id FK
        int teacher_id FK
        string question_text
        json options
        string correct_answer
        string explanation
        int difficulty
        string question_type
        string image_url
        boolean active
        timestamp created_at
    }
    
    KNOWLEDGE_STATES {
        int id PK
        int student_id FK
        int kc_id FK
        decimal mastery_level
        int attempts
        decimal p_transit
        decimal p_guess
        decimal p_slip
        timestamp last_updated
    }
    
    RESPONSES {
        int id PK
        int student_id FK
        int content_item_id FK
        int kc_id FK
        boolean correct
        int time_spent
        int hints_used
        int attempts
        decimal mastery_before
        decimal mastery_after
        decimal fuzzy_adjustment
        string adjustment_reason
        boolean practice_mode
        timestamp created_at
    }
    
    CLASSROOM_STUDENTS {
        int classroom_id FK
        int student_id FK
        timestamp joined_at
    }
    
    PARENT_STUDENTS {
        int parent_id FK
        int student_id FK
        timestamp linked_at
    }
    
    LEARNING_PATHS {
        int id PK
        int student_id FK
        string name
        json path_data
        boolean active
        timestamp created_at
    }
    
    LEARNING_PATH_COMPONENTS {
        int id PK
        int learning_path_id FK
        int kc_id FK
        int sequence_order
        boolean completed
        timestamp completed_at
    }
    
    MESSAGES {
        int id PK
        int sender_id FK
        int recipient_id FK
        string sender_type
        string recipient_type
        string subject
        text content
        boolean read
        timestamp created_at
    }
    
    NOTIFICATIONS {
        int id PK
        int user_id FK
        string user_type
        string notification_type
        string title
        text content
        boolean read
        json metadata
        timestamp created_at
    }
    
    PDF_UPLOADS {
        int id PK
        int teacher_id FK
        string filename
        string file_path
        string status
        json extraction_data
        int total_pages
        int processed_pages
        timestamp uploaded_at
    }
    
    FUZZY_PARAMETERS {
        int id PK
        string parameter_name
        text membership_function
        decimal domain_min
        decimal domain_max
        timestamp created_at
    }
    
    FUZZY_RULES {
        int id PK
        string rule_name
        text condition_logic
        text conclusion_logic
        decimal weight
        boolean active
        timestamp created_at
    }
    
    ENGAGEMENT_METRICS {
        int id PK
        int student_id FK
        date metric_date
        int session_count
        int total_time_spent
        int questions_answered
        decimal avg_response_time
        decimal accuracy_rate
        int streak_days
        timestamp last_activity
    }
    
    %% Relationships
    TEACHERS ||--o{ CLASSROOMS : creates
    TEACHERS ||--o{ CONTENT_ITEMS : creates
    TEACHERS ||--o{ PDF_UPLOADS : uploads
    
    STUDENTS ||--o{ KNOWLEDGE_STATES : has
    STUDENTS ||--o{ RESPONSES : gives
    STUDENTS ||--o{ LEARNING_PATHS : follows
    STUDENTS ||--o{ ENGAGEMENT_METRICS : generates
    
    PARENTS ||--o{ PARENT_STUDENTS : links
    STUDENTS ||--o{ PARENT_STUDENTS : linked_by
    
    CLASSROOMS ||--o{ CLASSROOM_STUDENTS : contains
    STUDENTS ||--o{ CLASSROOM_STUDENTS : belongs_to
    
    KNOWLEDGE_COMPONENTS ||--o{ CONTENT_ITEMS : categorizes
    KNOWLEDGE_COMPONENTS ||--o{ KNOWLEDGE_STATES : tracks
    KNOWLEDGE_COMPONENTS ||--o{ RESPONSES : evaluates
    KNOWLEDGE_COMPONENTS ||--o{ LEARNING_PATH_COMPONENTS : includes
    
    CONTENT_ITEMS ||--o{ RESPONSES : answered_in
    
    LEARNING_PATHS ||--o{ LEARNING_PATH_COMPONENTS : contains
    
    STUDENTS ||--o{ MESSAGES : sends
    STUDENTS ||--o{ MESSAGES : receives
    TEACHERS ||--o{ MESSAGES : sends
    TEACHERS ||--o{ MESSAGES : receives
    PARENTS ||--o{ MESSAGES : sends
    PARENTS ||--o{ MESSAGES : receives
    
    STUDENTS ||--o{ NOTIFICATIONS : receives
    TEACHERS ||--o{ NOTIFICATIONS : receives
    PARENTS ||--o{ NOTIFICATIONS : receives
```

### 2. Database Schema Organization

```mermaid
graph TD
    subgraph "User Management Schema"
        U1[Students Table]
        U2[Teachers Table]
        U3[Parents Table]
        U4[Admins Table]
        U5[User Relationships]
    end
    
    subgraph "Educational Content Schema"
        E1[Knowledge Components]
        E2[Content Items]
        E3[PDF Uploads]
        E4[Learning Paths]
        E5[Content Metadata]
    end
    
    subgraph "Learning Analytics Schema"
        L1[Knowledge States]
        L2[Student Responses]
        L3[Engagement Metrics]
        L4[Progress Tracking]
        L5[Performance History]
    end
    
    subgraph "Intelligent Systems Schema"
        I1[BKT Parameters]
        I2[Fuzzy Logic Rules]
        I3[Fuzzy Parameters]
        I4[Algorithm Configurations]
        I5[Machine Learning Models]
    end
    
    subgraph "Communication Schema"
        C1[Messages]
        C2[Notifications]
        C3[Parent Reports]
        C4[System Alerts]
        C5[Communication Logs]
    end
    
    subgraph "System Administration Schema"
        S1[System Settings]
        S2[Audit Logs]
        S3[Performance Metrics]
        S4[Error Logs]
        S5[Backup Information]
    end
    
    U1 --> L1
    U1 --> L2
    U1 --> C1
    
    E1 --> L1
    E2 --> L2
    
    L1 --> I1
    L2 --> I2
    
    style U1 fill:#e3f2fd
    style E1 fill:#e8f5e8
    style L1 fill:#fff3e0
    style I1 fill:#fce4ec
    style C1 fill:#f1f8e9
    style S1 fill:#f3e5f5
```

## Intelligent Engine Architecture

### 1. BKT and Fuzzy Logic Integration

```mermaid
graph TB
    subgraph "Intelligent Processing Pipeline"
        INPUT[Student Response Input]
        
        subgraph "Data Preprocessing"
            VALID[Input Validation]
            CONTEXT[Context Gathering]
            HISTORY[History Retrieval]
        end
        
        subgraph "BKT Algorithm Engine"
            BKT_INIT[Initialize BKT Parameters]
            BKT_EVIDENCE[Evidence Update]
            BKT_LEARNING[Learning Transition]
            BKT_OUTPUT[Base Mastery Update]
        end
        
        subgraph "Fuzzy Logic Engine"
            FUZZ_INPUT[Fuzzification]
            FUZZ_RULES[Rule Evaluation]
            FUZZ_INFER[Inference Process]
            FUZZ_DEFUZZ[Defuzzification]
            FUZZ_OUTPUT[Adjustment Factor]
        end
        
        subgraph "Integration Layer"
            COMBINE[Combine BKT + Fuzzy]
            CONSTRAINTS[Apply Constraints]
            VALIDATE_OUT[Validate Output]
        end
        
        subgraph "Decision Engine"
            MASTERY_CHECK[Mastery Evaluation]
            INTERVENTION[Intervention Logic]
            RECOMMENDATION[Content Recommendation]
            ADAPTATION[Learning Path Adaptation]
        end
        
        subgraph "Output Processing"
            UPDATE_STATE[Update Knowledge State]
            LOG_RESPONSE[Log Response Data]
            TRIGGER_ALERTS[Trigger Notifications]
            GENERATE_FEEDBACK[Generate Feedback]
        end
    end
    
    INPUT --> VALID
    VALID --> CONTEXT
    CONTEXT --> HISTORY
    
    HISTORY --> BKT_INIT
    BKT_INIT --> BKT_EVIDENCE
    BKT_EVIDENCE --> BKT_LEARNING
    BKT_LEARNING --> BKT_OUTPUT
    
    HISTORY --> FUZZ_INPUT
    FUZZ_INPUT --> FUZZ_RULES
    FUZZ_RULES --> FUZZ_INFER
    FUZZ_INFER --> FUZZ_DEFUZZ
    FUZZ_DEFUZZ --> FUZZ_OUTPUT
    
    BKT_OUTPUT --> COMBINE
    FUZZ_OUTPUT --> COMBINE
    COMBINE --> CONSTRAINTS
    CONSTRAINTS --> VALIDATE_OUT
    
    VALIDATE_OUT --> MASTERY_CHECK
    MASTERY_CHECK --> INTERVENTION
    INTERVENTION --> RECOMMENDATION
    RECOMMENDATION --> ADAPTATION
    
    ADAPTATION --> UPDATE_STATE
    UPDATE_STATE --> LOG_RESPONSE
    LOG_RESPONSE --> TRIGGER_ALERTS
    TRIGGER_ALERTS --> GENERATE_FEEDBACK
    
    style BKT_INIT fill:#e3f2fd
    style FUZZ_INPUT fill:#f1f8e9
    style COMBINE fill:#fff3e0
    style MASTERY_CHECK fill:#fce4ec
```

### 2. Real-time Processing Architecture

```mermaid
graph LR
    subgraph "Real-time Processing Queue"
        QUEUE[Response Queue]
        WORKER1[Worker Process 1]
        WORKER2[Worker Process 2]
        WORKER3[Worker Process 3]
    end
    
    subgraph "Processing Stages"
        STAGE1[Quick Response Processing]
        STAGE2[Detailed Analysis]
        STAGE3[Learning Path Updates]
        STAGE4[Notification Generation]
    end
    
    subgraph "Caching Layer"
        REDIS[Redis Cache]
        SESSION[Session Cache]
        RESULT[Result Cache]
    end
    
    subgraph "Data Persistence"
        IMMEDIATE[Immediate Updates]
        BATCH[Batch Processing]
        ANALYTICS[Analytics Pipeline]
    end
    
    QUEUE --> WORKER1
    QUEUE --> WORKER2
    QUEUE --> WORKER3
    
    WORKER1 --> STAGE1
    WORKER2 --> STAGE2
    WORKER3 --> STAGE3
    
    STAGE1 --> REDIS
    STAGE2 --> SESSION
    STAGE3 --> RESULT
    
    STAGE1 --> IMMEDIATE
    STAGE2 --> BATCH
    STAGE3 --> ANALYTICS
    
    STAGE4 --> IMMEDIATE
    
    style QUEUE fill:#e3f2fd
    style WORKER1 fill:#f1f8e9
    style REDIS fill:#fff3e0
    style IMMEDIATE fill:#fce4ec
```

## Deployment Architecture

### 1. Current Production Deployment - Netlify + Supabase

```mermaid
graph TB
    %% User Layer
    subgraph "Users"
        U1[👨‍🎓 Students<br/>Grade 3-4]
        U2[👩‍🏫 Teachers<br/>Classroom Management]
        U3[👨‍👩‍👧‍👦 Parents<br/>Progress Monitoring]
        U4[👤 Admins<br/>System Management]
    end

    %% Frontend Layer - Netlify CDN
    subgraph "Netlify Platform - Frontend"
        subgraph "Static Site Hosting"
            BUILD[🔨 Build Process<br/>React Production Build]
            CDN[🌐 Global CDN<br/>Static Assets Distribution]
            EDGE[⚡ Edge Locations<br/>Worldwide]
        end
        
        subgraph "React Application Bundle"
            APP_JS[📦 Main App Bundle<br/>362KB gzipped]
            CSS_BUNDLE[🎨 CSS Styles<br/>41.8KB gzipped]
            LOGO_ASSETS[🦉 Logo & Images<br/>206KB optimized]
        end
    end

    %% Serverless Functions Layer
    subgraph "Netlify Functions - Backend API"
        API_FUNC[🔧 Single API Function<br/>/netlify/functions/api.js]
        
        subgraph "API Endpoints"
            AUTH_EP[🔐 /api/auth/*<br/>Login, Register, Profile]
            STUDENT_EP[👨‍🎓 /api/students/*<br/>Quiz, Progress, KC Rec]
            TEACHER_EP[👩‍🏫 /api/teachers/*<br/>Classrooms, Analytics]
            PARENT_EP[👪 /api/parents/*<br/>Child Progress, Reports]
            ADMIN_EP[⚙️ /api/admin/*<br/>User Management, Content]
            IMAGE_EP[🖼️ /api/images/*<br/>Question Images Serving]
        end
    end

    %% Supabase Backend
    subgraph "Supabase Backend Services"
        subgraph "Authentication System"
            SUPABASE_AUTH[🔑 Supabase Auth<br/>JWT Token Management<br/>User Sessions]
        end
        
        subgraph "PostgreSQL Database"
            subgraph "Core Tables"
                USER_TABLES[(👥 User Management<br/>students, teachers<br/>parents, Admins)]
                CONTENT_TABLES[(📚 Educational Content<br/>knowledge_components<br/>content_items)]
                LEARNING_TABLES[(📈 Learning Analytics<br/>knowledge_states<br/>responses, engagement)]
                CLASS_TABLES[(🏫 Classroom System<br/>classrooms, classroom_students<br/>parent_students)]
            end
        end
        
        subgraph "File Storage"
            SUPABASE_STORAGE[📁 Supabase Storage<br/>Question Images<br/>PDF Uploads<br/>User Assets]
        end
    end

    %% AI/Intelligence Layer
    subgraph "Intelligent Learning Engine"
        BKT_ENGINE[🧠 Bayesian Knowledge Tracing<br/>95% Mastery Threshold<br/>P(L), P(T), P(G), P(S)]
        KC_RECOMMEND[🎯 KC Recommendation<br/>Sequential Curriculum Path<br/>Adaptive Learning]
        FUZZY_LOGIC[⚙️ Fuzzy Logic Adjustments<br/>Context-aware Mastery<br/>Performance Optimization]
    end

    %% Build and Deployment Pipeline
    subgraph "CI/CD Pipeline"
        GITHUB[📂 GitHub Repository<br/>feature-migration branch]
        NETLIFY_BUILD[🔄 Netlify Auto-Build<br/>Git Hook Deployment]
        ENV_VARS[🔐 Environment Variables<br/>SUPABASE_URL<br/>SUPABASE_ANON_KEY<br/>JWT_SECRET]
    end

    %% User Connections
    U1 --> CDN
    U2 --> CDN
    U3 --> CDN
    U4 --> CDN

    %% Build Pipeline
    GITHUB --> NETLIFY_BUILD
    NETLIFY_BUILD --> BUILD
    ENV_VARS --> API_FUNC
    
    %% Frontend Distribution
    BUILD --> APP_JS
    BUILD --> CSS_BUNDLE
    BUILD --> LOGO_ASSETS
    
    APP_JS --> CDN
    CSS_BUNDLE --> CDN
    LOGO_ASSETS --> CDN
    
    CDN --> EDGE

    %% API Function Routing
    CDN --> API_FUNC
    API_FUNC --> AUTH_EP
    API_FUNC --> STUDENT_EP
    API_FUNC --> TEACHER_EP
    API_FUNC --> PARENT_EP
    API_FUNC --> ADMIN_EP
    API_FUNC --> IMAGE_EP

    %% Backend Connections
    AUTH_EP --> SUPABASE_AUTH
    STUDENT_EP --> SUPABASE_AUTH
    TEACHER_EP --> SUPABASE_AUTH
    PARENT_EP --> SUPABASE_AUTH
    ADMIN_EP --> SUPABASE_AUTH

    STUDENT_EP --> USER_TABLES
    STUDENT_EP --> CONTENT_TABLES
    STUDENT_EP --> LEARNING_TABLES
    
    TEACHER_EP --> USER_TABLES
    TEACHER_EP --> CLASS_TABLES
    TEACHER_EP --> LEARNING_TABLES
    
    PARENT_EP --> USER_TABLES
    PARENT_EP --> CLASS_TABLES
    
    ADMIN_EP --> USER_TABLES
    ADMIN_EP --> CONTENT_TABLES
    
    IMAGE_EP --> SUPABASE_STORAGE

    %% Intelligence Integration
    STUDENT_EP --> BKT_ENGINE
    STUDENT_EP --> KC_RECOMMEND
    STUDENT_EP --> FUZZY_LOGIC
    
    BKT_ENGINE --> LEARNING_TABLES
    KC_RECOMMEND --> CONTENT_TABLES
    FUZZY_LOGIC --> LEARNING_TABLES

    %% Styling
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef functionClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dbClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef aiClass fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef buildClass fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class U1,U2,U3,U4 userClass
    class BUILD,CDN,EDGE,APP_JS,CSS_BUNDLE,LOGO_ASSETS frontendClass
    class API_FUNC,AUTH_EP,STUDENT_EP,TEACHER_EP,PARENT_EP,ADMIN_EP,IMAGE_EP functionClass
    class SUPABASE_AUTH,USER_TABLES,CONTENT_TABLES,LEARNING_TABLES,CLASS_TABLES,SUPABASE_STORAGE dbClass
    class BKT_ENGINE,KC_RECOMMEND,FUZZY_LOGIC aiClass
    class GITHUB,NETLIFY_BUILD,ENV_VARS buildClass
```

### 2. Detailed Architecture Specifications

#### **Current Production Configuration:**
- **Frontend**: React SPA deployed on Netlify CDN
- **Backend**: Single Netlify Function handling all API routes (`/netlify/functions/api.js`)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for images and uploads
- **Domain**: Custom domain with SSL/TLS encryption
- **Build**: Automated deployment from GitHub repository

#### **Performance Metrics:**
- **Bundle Size**: 362KB JavaScript + 41.8KB CSS (gzipped)
- **CDN Response**: <100ms globally via Netlify Edge
- **API Response**: <200ms average for database operations
- **First Load**: <2 seconds on 3G connections
- **Interactive**: <1 second for subsequent navigation

#### **Scalability Features:**
- **Auto-scaling**: Netlify Functions scale automatically with traffic
- **Global CDN**: Static assets served from 100+ edge locations
- **Database**: Supabase handles connection pooling and auto-scaling
- **Caching**: Browser caching + CDN caching for optimal performance

### 2. Environment Architecture

```mermaid
graph TD
    subgraph "Development Environment"
        DEV_LOCAL[Local Development]
        DEV_DB[Local PostgreSQL]
        DEV_SERVER[Local Express Server]
        DEV_REACT[React Dev Server]
    end
    
    subgraph "Staging Environment"
        STAGE_NETLIFY[Staging Netlify]
        STAGE_SUPABASE[Staging Supabase]
        STAGE_FUNC[Staging Functions]
        STAGE_DB[Staging Database]
    end
    
    subgraph "Production Environment"
        PROD_NETLIFY[Production Netlify]
        PROD_SUPABASE[Production Supabase]
        PROD_FUNC[Production Functions]
        PROD_DB[Production Database]
        PROD_CDN[Production CDN]
        PROD_MONITOR[Production Monitoring]
    end
    
    subgraph "CI/CD Pipeline"
        GIT_PUSH[Git Push]
        GITHUB_ACTIONS[GitHub Actions]
        TESTS[Automated Tests]
        BUILD_STAGE[Build & Deploy to Staging]
        REVIEW[Code Review]
        MERGE[Merge to Main]
        BUILD_PROD[Build & Deploy to Production]
    end
    
    DEV_LOCAL --> DEV_DB
    DEV_LOCAL --> DEV_SERVER
    DEV_LOCAL --> DEV_REACT
    
    GIT_PUSH --> GITHUB_ACTIONS
    GITHUB_ACTIONS --> TESTS
    TESTS --> BUILD_STAGE
    BUILD_STAGE --> STAGE_NETLIFY
    STAGE_NETLIFY --> STAGE_SUPABASE
    
    REVIEW --> MERGE
    MERGE --> BUILD_PROD
    BUILD_PROD --> PROD_NETLIFY
    PROD_NETLIFY --> PROD_SUPABASE
    PROD_NETLIFY --> PROD_CDN
    
    PROD_NETLIFY --> PROD_MONITOR
    
    style DEV_LOCAL fill:#e8f5e8
    style STAGE_NETLIFY fill:#fff3e0
    style PROD_NETLIFY fill:#fce4ec
    style GITHUB_ACTIONS fill:#e3f2fd
```

## Data Flow Architecture

### 1. Student Learning Data Flow

```mermaid
graph TD
    subgraph "Student Interaction"
        STUDENT[Student]
        LOGIN[Login/Authentication]
        DASHBOARD[Dashboard View]
        QUIZ[Quiz Taking]
        SUBMIT[Submit Response]
    end
    
    subgraph "Frontend Processing"
        VALIDATE[Client Validation]
        FORMAT[Data Formatting]
        API_CALL[API Request]
    end
    
    subgraph "Backend Processing"
        AUTH_CHECK[Authentication Check]
        PERMISSION[Permission Validation]
        BKT_PROCESS[BKT Processing]
        FUZZY_PROCESS[Fuzzy Logic Processing]
        DB_UPDATE[Database Update]
    end
    
    subgraph "Intelligent Processing"
        CONTEXT_GATHER[Context Gathering]
        ALGORITHM_RUN[Run Algorithms]
        DECISION_MAKE[Make Decisions]
        RECOMMENDATION[Generate Recommendations]
    end
    
    subgraph "Response Generation"
        FEEDBACK[Generate Feedback]
        NEXT_CONTENT[Select Next Content]
        PROGRESS_UPDATE[Update Progress]
        NOTIFICATION[Send Notifications]
    end
    
    subgraph "Data Storage"
        KNOWLEDGE_STATE[Knowledge States]
        RESPONSE_LOG[Response Logs]
        ENGAGEMENT[Engagement Metrics]
        ANALYTICS[Analytics Data]
    end
    
    STUDENT --> LOGIN
    LOGIN --> DASHBOARD
    DASHBOARD --> QUIZ
    QUIZ --> SUBMIT
    
    SUBMIT --> VALIDATE
    VALIDATE --> FORMAT
    FORMAT --> API_CALL
    
    API_CALL --> AUTH_CHECK
    AUTH_CHECK --> PERMISSION
    PERMISSION --> BKT_PROCESS
    BKT_PROCESS --> FUZZY_PROCESS
    FUZZY_PROCESS --> DB_UPDATE
    
    DB_UPDATE --> CONTEXT_GATHER
    CONTEXT_GATHER --> ALGORITHM_RUN
    ALGORITHM_RUN --> DECISION_MAKE
    DECISION_MAKE --> RECOMMENDATION
    
    RECOMMENDATION --> FEEDBACK
    FEEDBACK --> NEXT_CONTENT
    NEXT_CONTENT --> PROGRESS_UPDATE
    PROGRESS_UPDATE --> NOTIFICATION
    
    DB_UPDATE --> KNOWLEDGE_STATE
    DB_UPDATE --> RESPONSE_LOG
    DB_UPDATE --> ENGAGEMENT
    DB_UPDATE --> ANALYTICS
    
    FEEDBACK --> STUDENT
    
    style STUDENT fill:#e3f2fd
    style BKT_PROCESS fill:#f1f8e9
    style ALGORITHM_RUN fill:#fff3e0
    style KNOWLEDGE_STATE fill:#fce4ec
```

### 2. Teacher-Student Data Flow

```mermaid
graph LR
    subgraph "Teacher Actions"
        TEACHER[Teacher]
        CREATE_CONTENT[Create Content]
        MANAGE_CLASS[Manage Classroom]
        VIEW_PROGRESS[View Progress]
        SEND_MESSAGE[Send Messages]
    end
    
    subgraph "Content Processing"
        VALIDATE_CONTENT[Validate Content]
        CATEGORIZE[Categorize by KC]
        SET_DIFFICULTY[Set Difficulty]
        APPROVE[Approve Content]
    end
    
    subgraph "Student Impact"
        CONTENT_POOL[Available Content]
        RECOMMENDATION_ENGINE[Recommendation Engine]
        STUDENT_QUIZ[Student Quiz]
        STUDENT_PROGRESS[Student Progress]
    end
    
    subgraph "Feedback Loop"
        PERFORMANCE_DATA[Performance Data]
        CONTENT_EFFECTIVENESS[Content Effectiveness]
        TEACHER_ANALYTICS[Teacher Analytics]
        CONTENT_IMPROVEMENT[Content Improvement]
    end
    
    TEACHER --> CREATE_CONTENT
    TEACHER --> MANAGE_CLASS
    TEACHER --> VIEW_PROGRESS
    TEACHER --> SEND_MESSAGE
    
    CREATE_CONTENT --> VALIDATE_CONTENT
    VALIDATE_CONTENT --> CATEGORIZE
    CATEGORIZE --> SET_DIFFICULTY
    SET_DIFFICULTY --> APPROVE
    
    APPROVE --> CONTENT_POOL
    CONTENT_POOL --> RECOMMENDATION_ENGINE
    RECOMMENDATION_ENGINE --> STUDENT_QUIZ
    STUDENT_QUIZ --> STUDENT_PROGRESS
    
    STUDENT_PROGRESS --> PERFORMANCE_DATA
    PERFORMANCE_DATA --> CONTENT_EFFECTIVENESS
    CONTENT_EFFECTIVENESS --> TEACHER_ANALYTICS
    TEACHER_ANALYTICS --> CONTENT_IMPROVEMENT
    
    TEACHER_ANALYTICS --> VIEW_PROGRESS
    CONTENT_IMPROVEMENT --> CREATE_CONTENT
    
    style TEACHER fill:#e8f5e8
    style RECOMMENDATION_ENGINE fill:#fff3e0
    style STUDENT_QUIZ fill:#e3f2fd
    style TEACHER_ANALYTICS fill:#fce4ec
```

## Security Architecture

### 1. Authentication and Authorization Flow

```mermaid
graph TD
    subgraph "User Authentication"
        USER[User Login]
        CREDENTIALS[Username/Password]
        SUPABASE_AUTH[Supabase Authentication]
        JWT_TOKEN[JWT Token Generation]
    end
    
    subgraph "Authorization Layers"
        ROLE_CHECK[Role-based Access Control]
        PERMISSION[Permission Validation]
        RESOURCE_ACCESS[Resource Access Control]
        RLS[Row Level Security]
    end
    
    subgraph "Security Measures"
        RATE_LIMIT[Rate Limiting]
        INPUT_VALID[Input Validation]
        SQL_PROTECT[SQL Injection Protection]
        XSS_PROTECT[XSS Protection]
        CSRF_PROTECT[CSRF Protection]
    end
    
    subgraph "Data Protection"
        ENCRYPT_TRANSIT[Encryption in Transit]
        ENCRYPT_REST[Encryption at Rest]
        DATA_MASK[Data Masking]
        AUDIT_LOG[Audit Logging]
    end
    
    subgraph "Session Management"
        SESSION_CREATE[Session Creation]
        SESSION_VALID[Session Validation]
        SESSION_EXPIRE[Session Expiration]
        REFRESH_TOKEN[Token Refresh]
    end
    
    USER --> CREDENTIALS
    CREDENTIALS --> SUPABASE_AUTH
    SUPABASE_AUTH --> JWT_TOKEN
    
    JWT_TOKEN --> ROLE_CHECK
    ROLE_CHECK --> PERMISSION
    PERMISSION --> RESOURCE_ACCESS
    RESOURCE_ACCESS --> RLS
    
    ROLE_CHECK --> RATE_LIMIT
    PERMISSION --> INPUT_VALID
    RESOURCE_ACCESS --> SQL_PROTECT
    
    INPUT_VALID --> XSS_PROTECT
    XSS_PROTECT --> CSRF_PROTECT
    
    CSRF_PROTECT --> ENCRYPT_TRANSIT
    ENCRYPT_TRANSIT --> ENCRYPT_REST
    ENCRYPT_REST --> DATA_MASK
    DATA_MASK --> AUDIT_LOG
    
    JWT_TOKEN --> SESSION_CREATE
    SESSION_CREATE --> SESSION_VALID
    SESSION_VALID --> SESSION_EXPIRE
    SESSION_EXPIRE --> REFRESH_TOKEN
    
    style SUPABASE_AUTH fill:#e3f2fd
    style ROLE_CHECK fill:#f1f8e9
    style ENCRYPT_TRANSIT fill:#fff3e0
    style SESSION_CREATE fill:#fce4ec
```

### 2. Data Privacy and Compliance

```mermaid
graph TB
    subgraph "Privacy Compliance Framework"
        COPPA[COPPA Compliance]
        FERPA[FERPA Compliance]
        GDPR[GDPR Compliance]
        PRIVACY_POLICY[Privacy Policy]
    end
    
    subgraph "Data Classification"
        PII[Personally Identifiable Information]
        EDUCATIONAL[Educational Records]
        BEHAVIORAL[Behavioral Data]
        SYSTEM[System Data]
    end
    
    subgraph "Access Controls"
        PARENT_CONSENT[Parental Consent]
        STUDENT_RIGHTS[Student Rights]
        TEACHER_ACCESS[Teacher Access]
        ADMIN_ACCESS[Admin Access]
    end
    
    subgraph "Data Lifecycle"
        COLLECTION[Data Collection]
        PROCESSING[Data Processing]
        STORAGE[Data Storage]
        RETENTION[Data Retention]
        DELETION[Data Deletion]
    end
    
    subgraph "Monitoring and Auditing"
        ACCESS_LOG[Access Logging]
        CHANGE_LOG[Change Logging]
        PRIVACY_AUDIT[Privacy Audits]
        BREACH_DETECT[Breach Detection]
    end
    
    COPPA --> PARENT_CONSENT
    FERPA --> EDUCATIONAL
    GDPR --> STUDENT_RIGHTS
    
    PII --> PARENT_CONSENT
    EDUCATIONAL --> TEACHER_ACCESS
    BEHAVIORAL --> STUDENT_RIGHTS
    SYSTEM --> ADMIN_ACCESS
    
    PARENT_CONSENT --> COLLECTION
    COLLECTION --> PROCESSING
    PROCESSING --> STORAGE
    STORAGE --> RETENTION
    RETENTION --> DELETION
    
    TEACHER_ACCESS --> ACCESS_LOG
    ADMIN_ACCESS --> CHANGE_LOG
    STORAGE --> PRIVACY_AUDIT
    PROCESSING --> BREACH_DETECT
    
    style COPPA fill:#e3f2fd
    style PII fill:#f1f8e9
    style PARENT_CONSENT fill:#fff3e0
    style ACCESS_LOG fill:#fce4ec
```

## Integration Architecture

### 1. External System Integration

```mermaid
graph TD
    subgraph "MathGaling Core"
        CORE_API[Core API]
        DATA_SYNC[Data Synchronization]
        WEBHOOK[Webhook Handler]
    end
    
    subgraph "School Information Systems"
        SIS[Student Information System]
        LMS[Learning Management System]
        GRADEBOOK[Digital Gradebook]
    end
    
    subgraph "Communication Services"
        EMAIL_SERVICE[Email Service Provider]
        SMS_SERVICE[SMS Service]
        NOTIFICATION[Push Notifications]
    end
    
    subgraph "Analytics and Monitoring"
        ANALYTICS[Learning Analytics Platform]
        MONITORING[System Monitoring]
        REPORTING[Business Intelligence]
    end
    
    subgraph "Content Providers"
        TEXTBOOK[Digital Textbooks]
        ASSESSMENT[Assessment Banks]
        MULTIMEDIA[Multimedia Resources]
    end
    
    subgraph "Authentication Services"
        SSO[Single Sign-On]
        LDAP[LDAP Directory]
        OAUTH[OAuth Providers]
    end
    
    CORE_API <--> SIS
    CORE_API <--> LMS
    CORE_API <--> GRADEBOOK
    
    DATA_SYNC --> EMAIL_SERVICE
    DATA_SYNC --> SMS_SERVICE
    WEBHOOK --> NOTIFICATION
    
    CORE_API --> ANALYTICS
    CORE_API --> MONITORING
    CORE_API --> REPORTING
    
    CORE_API <--> TEXTBOOK
    CORE_API <--> ASSESSMENT
    CORE_API <--> MULTIMEDIA
    
    CORE_API --> SSO
    CORE_API --> LDAP
    CORE_API --> OAUTH
    
    style CORE_API fill:#e3f2fd
    style SIS fill:#f1f8e9
    style EMAIL_SERVICE fill:#fff3e0
    style ANALYTICS fill:#fce4ec
```

### 2. API Integration Patterns

```mermaid
graph LR
    subgraph "Integration Patterns"
        REST[REST APIs]
        WEBHOOK[Webhooks]
        GRAPHQL[GraphQL]
        WEBSOCKET[WebSockets]
        BATCH[Batch Processing]
    end
    
    subgraph "Data Exchange Formats"
        JSON[JSON]
        XML[XML]
        CSV[CSV]
        EXCEL[Excel Files]
    end
    
    subgraph "Security Protocols"
        API_KEY[API Keys]
        OAUTH2[OAuth 2.0]
        JWT_AUTH[JWT Authentication]
        MUTUAL_TLS[Mutual TLS]
    end
    
    subgraph "Error Handling"
        RETRY[Retry Logic]
        CIRCUIT[Circuit Breaker]
        FALLBACK[Fallback Mechanisms]
        LOGGING[Error Logging]
    end
    
    REST --> JSON
    WEBHOOK --> JSON
    GRAPHQL --> JSON
    BATCH --> CSV
    BATCH --> EXCEL
    
    REST --> API_KEY
    WEBHOOK --> OAUTH2
    GRAPHQL --> JWT_AUTH
    WEBSOCKET --> MUTUAL_TLS
    
    REST --> RETRY
    WEBHOOK --> CIRCUIT
    GRAPHQL --> FALLBACK
    WEBSOCKET --> LOGGING
    
    style REST fill:#e3f2fd
    style JSON fill:#f1f8e9
    style API_KEY fill:#fff3e0
    style RETRY fill:#fce4ec
```

## Scalability Architecture

### 1. Horizontal Scaling Strategy

```mermaid
graph TB
    subgraph "Load Distribution"
        LB[Load Balancer]
        CDN_EDGE[CDN Edge Servers]
        REGIONAL[Regional Distribution]
    end
    
    subgraph "Application Scaling"
        SERVERLESS[Serverless Functions]
        AUTO_SCALE[Auto-scaling Groups]
        CONTAINER[Container Orchestration]
    end
    
    subgraph "Database Scaling"
        READ_REPLICA[Read Replicas]
        WRITE_MASTER[Write Master]
        SHARDING[Database Sharding]
        CACHE_LAYER[Caching Layer]
    end
    
    subgraph "Content Scaling"
        STATIC_CDN[Static Content CDN]
        IMAGE_OPT[Image Optimization]
        LAZY_LOAD[Lazy Loading]
        COMPRESSION[Content Compression]
    end
    
    subgraph "Processing Scaling"
        QUEUE_SYSTEM[Message Queues]
        WORKER_POOL[Worker Pool]
        BATCH_JOBS[Batch Job Processing]
        ASYNC_PROC[Async Processing]
    end
    
    LB --> CDN_EDGE
    CDN_EDGE --> REGIONAL
    
    LB --> SERVERLESS
    SERVERLESS --> AUTO_SCALE
    AUTO_SCALE --> CONTAINER
    
    SERVERLESS --> READ_REPLICA
    SERVERLESS --> WRITE_MASTER
    READ_REPLICA --> SHARDING
    WRITE_MASTER --> CACHE_LAYER
    
    CDN_EDGE --> STATIC_CDN
    STATIC_CDN --> IMAGE_OPT
    IMAGE_OPT --> LAZY_LOAD
    LAZY_LOAD --> COMPRESSION
    
    SERVERLESS --> QUEUE_SYSTEM
    QUEUE_SYSTEM --> WORKER_POOL
    WORKER_POOL --> BATCH_JOBS
    BATCH_JOBS --> ASYNC_PROC
    
    style LB fill:#e3f2fd
    style SERVERLESS fill:#f1f8e9
    style READ_REPLICA fill:#fff3e0
    style QUEUE_SYSTEM fill:#fce4ec
```

### 2. Performance Optimization Architecture

```mermaid
graph TD
    subgraph "Frontend Optimization"
        CODE_SPLIT[Code Splitting]
        TREE_SHAKE[Tree Shaking]
        MINIFY[Minification]
        BUNDLE_OPT[Bundle Optimization]
    end
    
    subgraph "API Optimization"
        QUERY_OPT[Query Optimization]
        INDEX_OPT[Database Indexing]
        CONN_POOL[Connection Pooling]
        CACHE_API[API Caching]
    end
    
    subgraph "Algorithm Optimization"
        BKT_OPT[BKT Algorithm Optimization]
        FUZZY_OPT[Fuzzy Logic Optimization]
        PARALLEL[Parallel Processing]
        VECTORIZE[Vectorization]
    end
    
    subgraph "Data Optimization"
        COMPRESS[Data Compression]
        PARTITION[Data Partitioning]
        ARCHIVE[Data Archiving]
        PREFETCH[Data Prefetching]
    end
    
    subgraph "Monitoring and Profiling"
        PERF_MONITOR[Performance Monitoring]
        PROFILING[Code Profiling]
        METRICS[Performance Metrics]
        ALERTS[Performance Alerts]
    end
    
    CODE_SPLIT --> TREE_SHAKE
    TREE_SHAKE --> MINIFY
    MINIFY --> BUNDLE_OPT
    
    QUERY_OPT --> INDEX_OPT
    INDEX_OPT --> CONN_POOL
    CONN_POOL --> CACHE_API
    
    BKT_OPT --> FUZZY_OPT
    FUZZY_OPT --> PARALLEL
    PARALLEL --> VECTORIZE
    
    COMPRESS --> PARTITION
    PARTITION --> ARCHIVE
    ARCHIVE --> PREFETCH
    
    BUNDLE_OPT --> PERF_MONITOR
    CACHE_API --> PROFILING
    VECTORIZE --> METRICS
    PREFETCH --> ALERTS
    
    style CODE_SPLIT fill:#e3f2fd
    style QUERY_OPT fill:#f1f8e9
    style BKT_OPT fill:#fff3e0
    style PERF_MONITOR fill:#fce4ec
```

## Summary

This comprehensive system architecture document provides a complete technical blueprint for the MathGaling Intelligent Tutoring System. The architecture emphasizes:

### **Key Architectural Principles:**
- **Microservices-oriented**: Modular, scalable component design
- **Cloud-native**: Leveraging Netlify and Supabase for scalability
- **Security-first**: Comprehensive security and privacy protection
- **Performance-optimized**: Efficient algorithms and caching strategies
- **User-centric**: Designed around the learning experience

### **Technology Choices:**
- **Frontend**: React with modern hooks and context patterns
- **Backend**: Serverless Express.js functions on Netlify
- **Database**: PostgreSQL with Supabase for managed services
- **Intelligence**: Custom BKT and Fuzzy Logic engines
- **Deployment**: Automated CI/CD with GitHub Actions

### **Scalability Features:**
- **Horizontal scaling**: Auto-scaling serverless functions
- **Database optimization**: Read replicas and intelligent caching
- **Content delivery**: Global CDN with edge optimization
- **Real-time processing**: Efficient queue and worker systems

This architecture supports the system's current needs while providing a foundation for future growth, ensuring the platform can serve thousands of students, teachers, and parents with high performance and reliability.