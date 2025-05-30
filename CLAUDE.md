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

## KC Recommendation System Fix (Jan 2025)

### Fixed "Your Next Math Adventure" KC Display Issue:
- **Problem**: Student dashboard was showing random/default KCs instead of the correct next KC based on student progress and mastery
- **Root Cause**: Dashboard fallback logic was overriding the API recommendation when certain conditions weren't met
- **Investigation**: The `kid-friendly-next-activity` API was working correctly, but the frontend priority logic had flawed conditions

### Key Fixes Applied:
1. **Enhanced API Response Processing**:
   - Changed condition from `fetchedNextActivity.kc_id && !fetchedNextActivity.completed_sequence` to `fetchedNextActivity.type`
   - Now properly handles ALL API response scenarios including completion cases

2. **Completion Scenario Handling**:
   - Added proper handling for `completed_sequence` and `all_mastered` flags
   - Shows "Perfect Mastery! 🏆" with review options instead of random KCs
   - Prevents advanced students from seeing inappropriate recommendations

3. **Improved Priority Logic**:
   - API response is now the PRIMARY source of truth (as intended)
   - Only falls back to dashboard logic when API returns no recommendation
   - Respects sequential learning path determined by backend algorithm

4. **Enhanced Debug Logging**:
   - Added detailed console logs throughout the recommendation process
   - Tracks API responses, fallback triggers, and final decisions
   - Makes production debugging much easier

5. **Intelligent Button Actions & Text**:
   - Button text now matches the student's actual situation
   - "Review Topics" for completed students, "Let's Continue!" for ongoing learning
   - Actions properly route to quiz with correct KC ID or mastery dashboard for exploration

### Technical Details:
- **File Modified**: `/client/src/components/student/StudentDashboard.js`
- **API Endpoint**: `/api/students/:id/kid-friendly-next-activity` (both server and Netlify versions)
- **Algorithm**: Uses 95% mastery threshold to find first non-mastered KC in curriculum sequence
- **Flow**: Dashboard → API → Process Response → Display Recommendation → Navigate to Practice

### How It Works Now:
1. Dashboard calls kid-friendly-next-activity API on load
2. API analyzes student's knowledge_states to find next unmastered KC (< 95% mastery)
3. Dashboard respects API recommendation as primary source of truth
4. Displays correct KC name, description, and mastery level
5. Button navigates to targeted practice for that specific KC
6. Sequential progression maintained based on curriculum_code order

### Benefits:
- ✅ Shows correct next KC based on actual student progress
- ✅ Handles completion scenarios appropriately  
- ✅ Maintains curriculum sequence integrity
- ✅ Better debugging and monitoring capabilities
- ✅ More reliable and personalized user experience

## QuizView Theme Integration (Jan 2025)

### Added Theme Color Support to QuizView with Harmonized Backgrounds:
- **Problem**: QuizView had a fixed blue/purple gradient background that didn't match the student dashboard's theme color system
- **Goal**: Create visual consistency between dashboard and quiz experience with harmonized color schemes

### Key Features Implemented:

1. **Theme Synchronization System**:
   - QuizView now reads `student-color-theme` from localStorage (same as dashboard)
   - Automatically applies user's selected theme: orange, blue, green, peach, purple, teal
   - Seamless consistency between dashboard and quiz navigation

2. **Harmonized Background Colors**:
   - **Orange Theme**: Warm cream/peach gradient (`#fff9f5` to `#fcf1e0`)
   - **Blue Theme**: Soft sky blue gradient (`#f0f7ff` to `#e6ecff`) 
   - **Green Theme**: Gentle mint gradient (`#f0fdf8` to `#e6f6e4`)
   - **Peach Theme**: Delicate pink gradient (`#fef7f7` to `#feedee`)
   - **Purple Theme**: Subtle lavender gradient (`#faf5ff` to `#f0ebff`)
   - **Teal Theme**: Light aqua gradient (`#f0fdff` to `#e6f6ff`)

3. **Enhanced White Box Styling**:
   - **Subtle Inner Glow**: Radial gradients for depth and sophistication
   - **Enhanced Shadows**: Multi-layered box-shadows with better depth perception
   - **Rounded Corners**: Increased border-radius to 20px for modern glass-morphism effect
   - **Better Contrast**: Improved borders and backdrop blur for clarity

4. **Theme-Aware Interactive Elements**:
   - **Accent Bars**: Top borders on question containers match theme colors
   - **Buttons**: Submit, next, and hint buttons dynamically adapt to theme colors
   - **Consistent Theming**: All interactive elements follow theme guidelines

### Technical Implementation:
- **File Modified**: `/client/src/components/student/QuizView.js`
- **Styling Updated**: `/client/src/components/student/QuizView.css`
- **Theme State**: Added `colorTheme` state that syncs with localStorage on mount
- **CSS Classes**: Applied theme classes to main container: `enhanced-quiz ${colorTheme}`
- **Theme Variations**: Created 6 comprehensive CSS theme color variations

### Visual Design Philosophy:
- **Extremely Subtle**: Background colors are very light pastels to avoid overwhelming content
- **Glass Morphism**: White containers "float" beautifully on themed backgrounds
- **Accessibility**: Maintains excellent readability and contrast ratios
- **Smooth Transitions**: Gradient animations provide engaging, professional experience

### Benefits Achieved:
- ✅ **Visual Consistency**: Quiz experience matches dashboard theme choice
- ✅ **Personalization**: Students get their preferred color environment across all views
- ✅ **Reduced Eye Strain**: Soft, harmonized backgrounds are more comfortable
- ✅ **Modern Design**: Enhanced depth, shadows, and glass-morphism effects
- ✅ **Professional Appearance**: Cohesive brand experience throughout the application

The QuizView now provides a seamless, themed experience that perfectly complements the student dashboard while maintaining excellent usability and visual appeal.

## Memories
- Add to memory