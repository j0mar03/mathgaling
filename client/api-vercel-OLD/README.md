# Hybrid API for Vercel Deployment

This is a lightweight/hybrid version of the API specifically designed for Vercel deployment to overcome serverless function size limitations. It attempts to connect to Supabase for real data but falls back to mock data if needed.

## Features

- Hybrid authentication with Supabase fallback
- Real JWT-based authentication
- Simplified route handlers for essential functionality
- Enhanced error handling and logging
- Test accounts for different user roles

## Required Environment Variables

In your Vercel project settings, you need to set these environment variables:

| Variable       | Description                       | Example                                   |
|----------------|-----------------------------------|-------------------------------------------|
| SUPABASE_URL   | URL of your Supabase project      | https://yourproject.supabase.co           |
| SUPABASE_KEY   | Supabase service key (anon key)   | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| JWT_SECRET     | Secret for JWT token signing      | your-secret-key-for-production            |
| DATABASE_URL   | PostgreSQL connection string      | postgres://user:password@host:port/dbname |

## Test Accounts (Fallback)

If Supabase authentication fails, you can use these test accounts:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@example.com   | admin123   |
| Teacher | teacher@example.com | teacher123 |
| Student | student@example.com | student123 |
| Parent  | parent@example.com  | parent123  |

## Available Endpoints

- **POST /api/auth/login** - Authenticate users (Supabase or fallback)
- **GET /api/health** - Check API health status
- **GET /api/debug** - View API diagnostic information
- **GET /api/teachers/:id/classrooms** - Get classrooms for teachers
- **GET /api/parents/:id/students** - Get students for parents
- **GET /api/students/:id/progress** - Get progress for students

## Setting Up in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add the required environment variables listed above
5. Deploy the project

## Troubleshooting

If you encounter issues:

1. Check the Vercel logs for detailed error messages
2. Use the `/api/debug` endpoint to view API status and connection information
3. Ensure your environment variables are correctly set in Vercel
4. If Supabase connection fails, the API will fall back to using test accounts
5. Make sure your Supabase tables have the correct structure (admins, teachers, students, parents)