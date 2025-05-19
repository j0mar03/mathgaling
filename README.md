# ITS-KIDS Learning Management System

A comprehensive learning management system designed for students, teachers, and parents.

## Features

- Student dashboard for accessing learning content and assignments
- Teacher dashboard for creating classrooms, managing students, and content
- Parent dashboard for monitoring student progress
- User authentication and role-based access control
- Content management for educational resources

## Technology Stack

- **Frontend**: React, React Router, Context API for state management
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL

## Deployment Instructions for Render.com

### Prerequisites

- A Render.com account
- Git repository with the application code

### Deploying the Application

#### Using Render Blueprints (Recommended)

1. Fork or clone this repository to your GitHub account
2. In your Render dashboard, click on "New" and select "Blueprint"
3. Connect your GitHub account and select the repository
4. Render will automatically detect the `render.yaml` configuration and set up the services
5. Review the configurations and click "Apply"
6. Render will deploy the database, backend, and frontend services

#### Manual Deployment

##### Database

1. In your Render dashboard, click on "New" and select "PostgreSQL"
2. Configure the database:
   - Name: `its-kids-db`
   - Database: `its_kids`
   - User: (Render will generate this)
   - Region: (Choose the region closest to your users)
   - Plan: Select a plan based on your needs
3. Click "Create Database"
4. Save the connection string for use in the server configuration

##### Backend Server

1. In your Render dashboard, click on "New" and select "Web Service"
2. Connect your repository
3. Configure the service:
   - Name: `its-kids-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Select a plan based on your needs
4. Add the following environment variables:
   - `DATABASE_URL`: The connection string from your database
   - `JWT_SECRET`: A random secure string for JWT token generation
   - `NODE_ENV`: `production`
   - `PORT`: `8080`
   - `CORS_ORIGIN`: The URL of your frontend service (e.g., `https://its-kids-client.onrender.com`)
5. Click "Create Web Service"

##### Frontend Client

1. In your Render dashboard, click on "New" and select "Static Site"
2. Connect your repository
3. Configure the service:
   - Name: `its-kids-client`
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
4. Add the following environment variables:
   - `REACT_APP_API_URL`: The URL of your backend service (e.g., `https://its-kids-server.onrender.com`)
5. Click "Create Static Site"

### Post-Deployment

1. Once all services are deployed, check the backend health endpoint: `https://its-kids-server.onrender.com/api/health`
2. If you encounter any issues, check the service logs in the Render dashboard

## Local Development Setup

1. Clone the repository:
```
git clone <repository-url>
cd ITS-KIDS
```

2. Install server dependencies:
```
cd server
npm install
```

3. Install client dependencies:
```
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=5001
```

5. Start the server:
```
cd ../server
npm start
```

6. In a separate terminal, start the client:
```
cd ../client
npm start
```

7. Open your browser to `http://localhost:3000` to access the application

## License

[MIT License](LICENSE)