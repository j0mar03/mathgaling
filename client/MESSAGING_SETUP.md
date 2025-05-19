# Messaging System Setup

This document provides instructions for setting up the teacher-student messaging system.

## Overview

The messaging system allows teachers to send messages to students from the student detail view. It consists of:

1. Database tables for messages and notifications
2. API endpoints for sending and retrieving messages
3. UI components for composing and displaying messages

## Setup Instructions

### 1. Run the Setup Script

The simplest way to set up the messaging system is to run the provided setup script:

```bash
cd client
node setup-messaging.js
```

This script will:
- Check database connection
- Run migrations to create the necessary tables
- Seed the database with demo messages and notifications

### 2. Manual Setup (Alternative)

If you prefer to run the steps manually:

#### Run Migrations

```bash
cd client
npx sequelize-cli db:migrate
```

#### Run Seeders

```bash
cd client
npx sequelize-cli db:seed --seed 20250515000001-demo-messages.js 20250515000002-demo-notifications.js
```

## Troubleshooting

### Message Sending Error

If you encounter a "Failed to send message" error:

1. Check the server logs for more details
2. Make sure the database tables `messages` and `notifications` have been created
3. Ensure the teacher user is properly authenticated in the current session

### Database Table Issues

If you encounter errors related to missing tables:

```bash
cd client
npx sequelize-cli db:migrate:status
```

If the migrations for messages and notifications are not showing as completed, run:

```bash
cd client
npx sequelize-cli db:migrate
```

## Usage

Once set up, the messaging feature is available in the Teacher Dashboard:

1. Navigate to the Teacher Dashboard
2. Click on a student to view their details
3. Click the "Contact Student" button
4. Enter a message and click "Send Message"

## Additional Information

The messaging system is designed to be extended in future updates with:

- Message inbox for students
- Message history for teachers
- Notification badges
- File attachments

For any issues, please contact the development team. 