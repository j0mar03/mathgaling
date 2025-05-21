# ITS-KIDS Architecture Map

This document provides an overview of the Intelligent Tutoring System architecture, focusing on user relationships and data flow.

## System Overview

The ITS-KIDS platform is a comprehensive educational tool designed to provide personalized learning experiences for students, with monitoring capabilities for teachers and parents.

### Core Components

1. **Frontend Application (React)**
   - User interfaces for all user types (students, teachers, parents, admin)
   - Dashboard visualizations
   - Interactive learning components

2. **Backend Server (Node.js/Express)**
   - API endpoints for data access
   - Authentication and authorization
   - Business logic processing

3. **Database (PostgreSQL)**
   - User data storage
   - Learning content management
   - Tracking of student progress and knowledge states

4. **Bayesian Knowledge Tracing (BKT) Engine**
   - Probabilistic model for tracking student knowledge
   - Adaptive content selection
   - Learning path optimization

## User Types and Relationships

### Student
- Central user of the system
- Completes learning activities and assessments
- Receives personalized content based on knowledge state
- **Relationships**: Associated with teachers (via classrooms) and parents

### Teacher
- Creates and manages classrooms
- Monitors student progress and performance
- Creates and uploads learning content
- **Relationships**: Manages multiple students in classrooms

### Parent
- Monitors their children's progress
- Receives reports on student performance
- **Relationships**: Linked to one or more students (their children)

### Administrator
- Manages system users and content
- Configures global system settings
- **Relationships**: Oversees all system components

## Data Models and Relationships

```
Parent <---> Student <---> Teacher
               ^              ^
               |              |
           Knowledge      Classroom
               ^              ^
               |              |
           Learning Path      |
               ^              |
               |              |
           Content Items <----+
```

### Key Relationship Tables

1. **ParentStudent**: Many-to-many relationship between parents and students
2. **ClassroomStudent**: Many-to-many relationship between classrooms and students
3. **LearningPathComponents**: Associates knowledge components with learning paths

## API Endpoints

### Student-Focused Endpoints
- `/api/students/:id` - Get student profile
- `/api/students/:id/knowledge-states` - Get student's knowledge states
- `/api/students/:id/learning-path` - Get student's personalized learning path
- `/api/students/:id/recommended-content` - Get recommended content for student

### Teacher-Focused Endpoints
- `/api/teachers/:id/classrooms` - Get teacher's classrooms
- `/api/classrooms/:id/students` - Get students in a classroom
- `/api/classrooms/:id/performance` - Get classroom performance metrics

### Parent-Focused Endpoints
- `/api/parents/:id/children` - Get parent's associated children
- `/api/parents/students/:studentId/weekly-report` - Get weekly progress report

## Authentication and Authorization

The system implements JSON Web Token (JWT) based authentication with role-based access control:

1. User logs in with credentials
2. Server validates credentials and issues a JWT with user role and ID
3. Client includes JWT in Authorization header for subsequent requests
4. Server validates token and authorizes access based on user role

## Development Notes

- **Testing Mode**: The system includes optional authentication middleware for development testing
- **Database Migrations**: Sequelize migrations maintain database schema versioning
- **Seeders**: Data seeders are provided for testing various components

## Implementation Details

The system uses:
- Sequelize ORM for database interactions
- Express.js for routing
- React for frontend views
- Custom BKT implementation for knowledge tracking
