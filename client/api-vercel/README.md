# Lightweight API for Vercel Deployment

This is a lightweight version of the API specifically designed for Vercel deployment to overcome serverless function size limitations.

## Features

- Mock authentication system that simulates JWT-based auth
- Simplified route handlers for essential functionality
- Enhanced error handling and logging
- Test accounts for different user roles

## Test Accounts

You can use these accounts to log in:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@example.com   | admin123   |
| Teacher | teacher@example.com | teacher123 |
| Student | student@example.com | student123 |
| Parent  | parent@example.com  | parent123  |

## Available Endpoints

- **POST /api/auth/login** - Authenticate users
- **GET /api/health** - Check API health status
- **GET /api/debug** - View API diagnostic information
- **GET /api/teachers/:id/classrooms** - Get mock classrooms for teachers
- **GET /api/parents/:id/students** - Get mock students for parents
- **GET /api/students/:id/progress** - Get mock progress for students

## Limitations

This is a minimal implementation with mock data. For full functionality, deploy the application to a traditional hosting platform that doesn't have the serverless function size limitations of Vercel.

## Troubleshooting

If you encounter issues:

1. Check the Vercel logs for detailed error messages
2. Use the /api/debug endpoint to view API status
3. Make sure you're using one of the test accounts listed above
4. Ensure your request payload is valid JSON