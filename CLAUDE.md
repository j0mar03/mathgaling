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

## Parent-Student Linking System (Jan 2025)

### Current Issue Being Debugged:
- **Problem**: 500 error when linking parent to student
- **Test Case**: Trying to link parent_id=1 to student_id=21 in classroom_id=30
- **Database Status**: Both parent 1 and student 21 exist in database
- **Manual SQL Insert**: Works with parent_id=1 and student_id=6
- **Frontend sends**: parent_id=1, student_id=21, classroom_id=30

### Tables Required:
1. **parent_students** (junction table)
   - parent_id (FK to parents.id)
   - student_id (FK to students.id)
   - PRIMARY KEY (parent_id, student_id)

2. **classroom_students** (for teacher verification)
   - classroom_id (FK to classrooms.id)
   - student_id (FK to students.id)

### API Endpoints:
- POST `/api/admin/parent-student-links` - Admin creates link
- DELETE `/api/admin/parent-student-links/:parentId/:studentId` - Admin removes link
- POST `/api/teacher/parent-student-links` - Teacher creates link (with classroom verification)
- DELETE `/api/teacher/parent-student-links/:parentId/:studentId` - Teacher removes link
- GET `/api/students/:id/parents` - Get parents of a student
- GET `/api/parents/:id/children` - Get children of a parent

### Components Created:
- `/client/src/components/admin/LinkParentStudentModal.js` - Admin linking interface
- `/client/src/components/teacher/LinkParentToStudentModal.js` - Teacher linking interface
- Both have corresponding CSS files

### Parent Dashboard:
- Shows "No Children Linked" message when parent has no linked children
- Provides instructions on how to get linked through teacher/admin

### Debug Scripts Created:
- `/scripts/fix-parent-linking-corrected.sql` - Creates tables and fixes permissions
- `/scripts/undo-rls-changes.sql` - Removes Row Level Security that was blocking inserts
- `/scripts/debug-parent-student-link.sql` - Helps debug linking issues
- `/scripts/check-student-21.sql` - Checks specific student existence

### Next Steps to Debug:
1. Check the API response error message in browser Network tab
2. Run debug-parent-student-link.sql to see if link already exists
3. Verify classroom_students table has entry for student 21 in classroom 30

## Student Messages System (Jan 2025)

### Fixed Student Messages Issue:
- **Problem**: Student messages page (/student/messages) was only accepting/showing one message instead of multiple
- **Root Cause**: Message endpoints were missing from Netlify function API
- **Fix**: Added complete message functionality to /netlify/functions/api.js
  - GET /api/messages/inbox - Returns all messages for authenticated user
  - PUT /api/messages/:id/read - Marks message as read
  - Properly handles JWT token authentication
  - Fetches sender names from appropriate user tables
  - Returns messages in chronological order (newest first)

### Message API Implementation:
- Uses Supabase database queries to fetch multiple messages
- Enriches message data with sender names (from teachers/students tables)
- Proper authentication and authorization checks
- Error handling for invalid tokens, missing messages, permission checks

## Challenge Quiz System (Jan 2025)

### Math Challenge Implementation:
- **New Challenge Mode**: Implemented difficulty-based quiz system in Math Challenge
- **Difficulty Tiers**: 5 levels (1-5) based on student's overall mastery:
  - Advanced (80%+ mastery): Difficulty 4-5 questions
  - Intermediate-Advanced (60-79%): Difficulty 3-4 questions  
  - Beginner-Intermediate (40-59%): Difficulty 2-3 questions
  - Starter-Beginner (<40%): Difficulty 1-2 questions

### Challenge Quiz Features:
- **Random KC Selection**: Questions from different Knowledge Components for variety
- **Independent Progress**: Challenge quiz progress doesn't affect regular KC mastery levels
- **Smart Question Selection**: Avoids recently answered questions (30-minute window)
- **Multi-KC Variety**: Ensures questions come from different KCs in each quiz session

### API Endpoints Added:
- **Frontend**: `/student/quiz?mode=challenge&practice_mode=true`
- **Backend**: `/api/students/:id/challenge-quiz` (both server and Netlify function)
- **Response Tracking**: Separate practice_mode flag prevents KC mastery interference

### Technical Implementation:
- **Server Route**: `client/server/routes/studentRoutes.js` - challenge-quiz endpoint
- **Netlify Function**: `netlify/functions/api.js` - challenge-quiz endpoint  
- **Frontend Logic**: `QuizView.js` - handles challenge mode separately from sequential mode
- **Mastery Dashboard**: Updated to use `mode=challenge` instead of `mode=random`

### Challenge Quiz Logic:
1. Fetches student's knowledge states to calculate overall mastery
2. Determines appropriate difficulty tier based on mastery level
3. Queries content_items table filtering by difficulty and question types
4. Groups questions by KC to ensure variety across different topics
5. Selects questions round-robin style from different KCs
6. Tracks responses as practice_mode to prevent KC mastery updates

## Memories
- Add to memory