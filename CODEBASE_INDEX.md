# MathGaling Intelligent Tutoring System - Codebase Index

## Project Overview

**MathGaling** is a comprehensive Intelligent Tutoring System (ITS) designed for Philippine Grade 3-4 Mathematics education. The system implements Bayesian Knowledge Tracing (BKT) and Fuzzy Logic algorithms to provide personalized learning experiences.

**Key Technologies:**
- **Frontend**: React 19, React Router, Context API
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Render.com, Vercel, Netlify

## Directory Structure

### Root Level
```
mathgaling/
├── client/                 # React frontend application
├── api/                    # API routes and functions
├── scripts/                # Build and utility scripts
├── netlify/                # Netlify deployment configuration
├── .workflows/             # Workflow definitions
├── .templates/             # Template files
├── .roo/                   # Roo configuration
├── .modes/                 # Mode definitions
├── .processes/             # Process definitions
└── Documentation/          # Extensive documentation files
```

### Client Application (`client/`)
```
client/
├── src/
│   ├── components/         # React components organized by user role
│   │   ├── student/        # Student-specific components
│   │   ├── teacher/        # Teacher-specific components
│   │   ├── parent/         # Parent-specific components
│   │   ├── admin/          # Admin-specific components
│   │   ├── shared/         # Shared/common components
│   │   └── review/         # Review components
│   ├── context/            # React Context providers
│   │   └── AuthContext.js  # Authentication context
│   ├── services/           # API service layer
│   │   └── reviewService.js
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS and styling
│   ├── assets/             # Static assets
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── server/                 # Backend server (Express.js)
│   ├── models/             # Sequelize database models
│   ├── routes/             # API route definitions
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   ├── migrations/         # Database migrations
│   ├── seeders/            # Database seeders
│   ├── utils/              # Server utilities
│   └── index.js            # Server entry point
├── public/                 # Public static files
└── build/                  # Production build output
```

## Core Components

### Frontend Components

#### Student Components (`client/src/components/student/`)
- **Dashboard**: Student learning interface
- **Quiz Interface**: Interactive assessment components
- **Progress Tracking**: Learning progress visualization
- **Content Viewer**: Educational material display

#### Teacher Components (`client/src/components/teacher/`)
- **Classroom Management**: Student and class administration
- **Content Management**: Educational material creation and editing
- **Analytics Dashboard**: Student performance monitoring
- **Assessment Tools**: Quiz and assignment creation

#### Parent Components (`client/src/components/parent/`)
- **Child Progress**: Student performance tracking
- **Weekly Reports**: Automated progress reports
- **Communication**: Teacher-student-parent messaging

#### Admin Components (`client/src/components/admin/`)
- **User Management**: System user administration
- **Content Review**: Educational material approval
- **System Settings**: Platform configuration

#### Shared Components (`client/src/components/shared/`)
- **Navigation**: Header, footer, sidebar
- **Forms**: Reusable form components
- **Modals**: Dialog and popup components
- **Loading States**: Spinners and progress indicators

### Backend Architecture

#### Server Structure (`client/server/`)
- **Models**: Sequelize ORM models for database entities
- **Routes**: Express.js route definitions
- **Controllers**: Business logic handlers
- **Middleware**: Authentication, validation, error handling
- **Migrations**: Database schema management
- **Seeders**: Initial data population

#### API Routes (`api/`)
- **Authentication**: User login, registration, session management
- **Content**: Educational material CRUD operations
- **Assessment**: Quiz and assignment management
- **Analytics**: Performance data and reporting
- **User Management**: Profile and role management

## Key Features

### 1. Intelligent Tutoring Engine
- **Bayesian Knowledge Tracing (BKT)**: Student knowledge state estimation
- **Fuzzy Logic Engine**: Adaptive difficulty adjustment
- **Recommendation System**: Personalized content suggestions

### 2. Multi-Role User System
- **Students**: Interactive learning interface
- **Teachers**: Classroom and content management
- **Parents**: Progress monitoring and communication
- **Administrators**: System-wide management

### 3. Content Management
- **PDF Content**: Educational material storage and display
- **Quiz System**: Interactive assessments with adaptive difficulty
- **Progress Tracking**: Comprehensive learning analytics

### 4. Communication System
- **Messaging**: Inter-user communication
- **Notifications**: Automated alerts and updates
- **Reports**: Automated progress reporting

## Database Schema

### Core Entities
- **Users**: Student, teacher, parent, admin accounts
- **Classrooms**: Teacher-student groupings
- **Content**: Educational materials and resources
- **Assessments**: Quizzes and assignments
- **Progress**: Student learning analytics
- **Messages**: Communication system

### Relationships
- Teachers manage multiple classrooms
- Students belong to classrooms
- Parents are linked to students
- Content is organized by subjects and topics
- Progress tracks student performance over time

## Deployment Architecture

### Multi-Platform Support
- **Render.com**: Primary hosting platform
- **Vercel**: Alternative deployment option
- **Netlify**: Static site hosting with functions

### Environment Configuration
- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live system deployment

## Development Workflow

### Local Development
1. **Setup**: Clone repository and install dependencies
2. **Database**: Configure PostgreSQL connection
3. **Environment**: Set up environment variables
4. **Start**: Run client and server concurrently

### Build Process
1. **Dependencies**: Install all required packages
2. **Build**: Create production-ready client build
3. **Deploy**: Upload to hosting platform
4. **Database**: Run migrations and seeders

## Documentation Structure

### Technical Documentation
- **SYSTEM_ARCHITECTURE.md**: Comprehensive system design
- **SOFTWARE_DEVELOPMENT_GUIDE.md**: Development practices
- **SUPABASE_MIGRATION_GUIDE.md**: Database migration procedures
- **TESTING-INSTRUCTIONS.md**: Testing procedures

### Feature Documentation
- **QUIZ_IMPLEMENTATION_GUIDE.md**: Assessment system details
- **BKT_ALGORITHM_EXPLANATION.md**: Knowledge tracing implementation
- **FUZZY_LOGIC_ENGINE_EXPLANATION.md**: Adaptive difficulty system
- **USER_MANUAL.md**: End-user documentation

### Planning Documents
- **PLAN.md**: Project roadmap and milestones
- **CONTENT_MANAGEMENT_PLAN.md**: Content strategy
- **WEEKLY_REPORT_ENHANCEMENTS.md**: Reporting system improvements

## Key Algorithms

### Bayesian Knowledge Tracing (BKT)
- **Purpose**: Estimate student knowledge state
- **Implementation**: Probabilistic model for learning assessment
- **Files**: BKT-related documentation and implementation

### Fuzzy Logic Engine
- **Purpose**: Adaptive difficulty adjustment
- **Implementation**: Fuzzy set theory for content recommendation
- **Files**: Fuzzy logic documentation and engine code

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Role-Based Access**: User permission system
- **Password Hashing**: bcryptjs for secure storage

### Data Protection
- **Input Validation**: Request sanitization
- **CORS Configuration**: Cross-origin resource sharing
- **Environment Variables**: Secure configuration management

## Performance Optimization

### Frontend Optimization
- **React Optimization**: Component memoization and lazy loading
- **Bundle Optimization**: Code splitting and tree shaking
- **Caching**: Browser and API response caching

### Backend Optimization
- **Database Indexing**: Query performance optimization
- **Connection Pooling**: Database connection management
- **Caching**: Redis for frequently accessed data

## Monitoring & Analytics

### System Monitoring
- **Error Tracking**: Application error monitoring
- **Performance Metrics**: Response time and throughput
- **User Analytics**: Usage patterns and engagement

### Learning Analytics
- **Student Progress**: Individual learning trajectories
- **Class Performance**: Aggregate classroom analytics
- **Content Effectiveness**: Material impact assessment

## Future Enhancements

### Planned Features
- **Mobile Application**: Native mobile app development
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Third-party system connections
- **Offline Support**: Offline learning capabilities

### Scalability Improvements
- **Microservices**: Service-oriented architecture
- **Load Balancing**: Distributed system architecture
- **CDN Integration**: Content delivery optimization

---

*This index provides a comprehensive overview of the MathGaling Intelligent Tutoring System codebase. For detailed implementation information, refer to the specific documentation files and source code.* 