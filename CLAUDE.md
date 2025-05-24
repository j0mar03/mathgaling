# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Install dependencies: `npm run install-all`
- Run development server: `npm start` (runs both client and server)
- Run server only: `cd client/server && npm run dev`
- Run client only: `cd client && npm start`
- Database migrate: `cd client/server && npm run migrate`
- Database seed: `cd client/server && npm run seed`
- Run tests: `cd client && npm test` or `cd client/server && npm test`
- Run single test: `cd client && npm test -- -t "test description"` (Jest)

## Code Style Guidelines
- React functional components with hooks
- Async/await for asynchronous code
- Error handling: try/catch blocks for async code
- Naming: camelCase for variables/functions, PascalCase for components/classes
- Components: One component per file, named same as file
- Imports: Group by external, then internal, then relative paths
- API calls: Use service files in `client/src/services`
- State management: Context API with useReducer for complex state
- Server: Express with MVC pattern (routes, controllers, models)
- Database: Sequelize ORM with PostgreSQL

## Supabase/Netlify Deployment Notes
**IMPORTANT**: This app is deployed on Netlify with Supabase as the database.

### Key Differences from Local Development:
1. **API Routes**: All handled through `/netlify/functions/api.js`
2. **Authentication**: Uses Supabase Auth + database records
3. **Table Names**: Use lowercase (students, teachers, parents) except "Admins"
4. **Auto-increment Issues**: Supabase sequences may be out of sync, handle duplicate key errors

### When Working with Supabase:
1. Always check if user exists before creating
2. Handle duplicate key errors (code: '23505') gracefully
3. Use auth_id (email) as the unique identifier
4. Test on staging Supabase instance before production

### Common Issues:
- **Duplicate key errors**: Run the setup script in `/scripts/setup-supabase.sql`
- **Login failures**: Check both Supabase Auth and database records
- **Table not found**: Ensure using correct case (lowercase except Admins)

### Environment Variables:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_API_KEY=xxx
```

## Recent Quiz System Fixes (Jan 2025)
Key issues resolved in the quiz system:

### 1. Image Serving in Production
- **Issue**: Images not accessible in Netlify deployment
- **Fix**: Updated `netlify.toml` to copy uploads during build, added image endpoints to `/netlify/functions/api.js`

### 2. KC ID Loss During Quiz Navigation
- **Issue**: `kc_id` parameter lost after first question, causing "Question text not available"
- **Fix**: Modified `handleNextQuestion` in `QuizView.js` to preserve KC ID in all navigation calls
- **Critical**: Always preserve URL parameters when navigating between quiz questions

### 3. Missing Student Progress API
- **Issue**: Student progress page failing due to missing endpoints
- **Fix**: Added `/api/students/:id/knowledge-states` and `/api/students/:id/grade-knowledge-components` to Netlify function

### 4. Debug Messages for Image-less Questions
- **Fix**: Return `null` instead of debug div when no image exists

### Quiz Navigation Pattern:
Maintain this URL structure: `/student/quiz/{id}?kc_id={kc_id}&mode=sequential&qnum={num}&correct={count}`

## Git Push Preparation
- Add memory because of upcoming git push
- Added memory placeholder

## Recent Login System Improvements (Jan 2025)
Major overhaul of the authentication system:

### 1. Role-Based Login
- **Feature**: Role selection screen (Student/Teacher/Parent) before login
- **Components**: `LoginImproved.js` and `SignupImproved.js` replace old login/signup
- **Student Login**: Uses username instead of email for child-friendly experience

### 2. Username Support for Students
- **Database**: Students can have a `username` field
- **Login Flow**: Students login with username, internally converted to `{username}@student.mathgaling.com`
- **API Updates**: `/api/auth/login` accepts both `email` and `username` parameters

### 3. Visual Improvements
- **Child-Friendly UI**: Larger fonts, colorful icons, friendly language for students
- **Role-Specific Colors**: Each role has a unique color theme
- **Accessibility**: WCAG compliant contrast, keyboard navigation, reduced motion support

### 4. AuthContext Updates
- **Method Signature**: `login(emailOrUsername, password, isStudent)`
- **Auto-Detection**: Automatically detects username vs email based on @ symbol
- **Username Storage**: Stores username in user object for display

### 5. Database Requirements
- **New Column**: Add `username` column to `students` table:
  ```sql
  ALTER TABLE students ADD COLUMN username VARCHAR(50) UNIQUE;
  ```
- **Backward Compatibility**: Existing students without username can still login with email
- **Login Logic**: System tries username first, falls back to email for existing students

### 6. Teacher Dashboard Updates
- **CreateStudentModal**: Now supports both username and email creation methods
- **Radio Selection**: Teachers can choose username (recommended) or email for new students
- **Auto-generation**: Generates usernames and emails automatically
- **Credentials Display**: Shows appropriate login method in preview

### 7. Admin Panel Updates
- **AddUserForm**: Updated to support username for student accounts
- **Dual Mode**: Admin can create students with username or email
- **Validation**: Proper validation for username format (alphanumeric only)

### 8. Real-Time Knowledge Component Performance (Jan 2025)
Enhanced the classroom Knowledge Components section with live data:

- **Real-Time Calculations**: KC performance now calculates from actual student knowledge states
- **Auto-Refresh**: Performance data updates every 30 seconds automatically
- **Compact Design**: New compact table layout with visual mastery distributions
- **Performance Metrics**: Shows average mastery, student counts, and mastery level distributions
- **Visual Indicators**: Color-coded mastery bars and distribution charts
- **API Enhancement**: Updated `/api/classrooms/:id/knowledge-components` to include:
  - `averageMastery`: Real average from student knowledge states
  - `totalStudents`: Total students in classroom
  - `studentsWithData`: Students with knowledge state data
  - `masteryLevels`: Distribution across 5 mastery levels (very low to very high)
- **Responsive Design**: Mobile-friendly compact layout

## Memories
- Fix math mastery
- Add to memory
- Improved login system with role selection and username support for students
- claude memory: simple add to memory
- add to memory