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