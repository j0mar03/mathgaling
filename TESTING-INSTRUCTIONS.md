# PDF Content Management and BKT Algorithm Testing Guide

This guide provides step-by-step instructions for testing the PDF content management system and BKT algorithm implementation in your ITS-KIDS platform.

## Prerequisites

1. Make sure your database is migrated:
   ```bash
   cd client/server
   npm run migrate
   ```

2. Make sure the following packages are installed:
   ```bash
   cd client/server
   npm install multer
   ```

## Step 1: Generate Test Data

The easiest way to test the PDF content management system is to use the seed script that generates test data without requiring actual PDF uploads:

```bash
cd client/server
node seed-pdf-test-data.js
```

This script will:
1. Create necessary directories
2. Generate a sample PDF file
3. Create PDF upload records in the database
4. Create knowledge components extracted from the PDF
5. Create content items linked to the knowledge components
6. Create knowledge states for students

## Step 2: Start the Server and Client

Start the server:
```bash
cd client/server
npm run dev
```

Start the client in a separate terminal:
```bash
cd client
npm start
```

## Step 3: Test the Admin Interface

1. Log in as an admin:
   - Username: admin@example.com
   - Password: adminpassword

2. Navigate to the PDF Curriculum Management tab in the Admin Dashboard

3. You should see the test PDF upload record that was created by the seed script

4. You can also try uploading a new PDF:
   - Click the "Upload New PDF" button
   - Select any PDF file from your computer (or use the sample.pdf in client/server/examples)
   - Click "Upload"
   - You should see the extraction results with knowledge components and content items

5. Test the knowledge component management:
   - Select knowledge components you want to include
   - Click "Create Selected Knowledge Components"
   - You should see a confirmation message

6. Test the content item management:
   - Assign knowledge components to content items using the dropdown menus
   - Click "Create Selected Content Items"
   - You should see a confirmation message

## Step 4: Test the Teacher Interface

1. Log in as a teacher:
   - Username: teacher1@example.com
   - Password: teacherpassword

2. Navigate to the Content Management section

3. You should see the PDF uploads associated with this teacher

4. You can try uploading a new PDF following the same steps as in the admin interface

## Step 5: Test the BKT Algorithm

To test the BKT algorithm, you'll need to use the API endpoints:

1. Process a student response:
   ```bash
   curl -X POST http://localhost:5002/api/bkt/process-response \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"studentId": 99901, "contentItemId": YOUR_CONTENT_ITEM_ID, "correct": true, "timeSpent": 30}'
   ```

2. Get a student's knowledge state:
   ```bash
   curl http://localhost:5002/api/bkt/knowledge-state?studentId=99901&kcId=YOUR_KC_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. Get a content recommendation:
   ```bash
   curl http://localhost:5002/api/bkt/recommend?studentId=99901&kcId=YOUR_KC_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

Replace `YOUR_TOKEN` with a valid JWT token and `YOUR_CONTENT_ITEM_ID`/`YOUR_KC_ID` with actual IDs from your database.

## Troubleshooting

1. **Login Issues**: If you encounter login errors, check the browser console for specific error messages. Make sure the auth routes are properly registered in the server.

2. **PDF Upload Errors**: 
   - Make sure the upload directory exists (client/server/uploads/pdf)
   - Check if multer is properly installed
   - Verify that the PDF file isn't too large (default limit is 1MB)
   - Check the server logs for specific error messages

3. **BKT Algorithm Errors**:
   - Ensure the student and knowledge component IDs exist in the database
   - Check that knowledge states have been created for the student
   - Verify the JWT token has the correct role (student or teacher)

4. **Database Access Issues**:
   - Make sure all route handlers have access to the database models
   - Check the middleware to ensure it properly sets `req.app.set('db', db)`

If you encounter any specific errors, check the server logs for detailed information.

## Testing with the Seed Data

The seed script creates:
- 1 PDF upload record
- 4 knowledge components (Addition and Subtraction, Multiplication, Division, Word Problems)
- 10 content items (questions, examples, explanations)
- Knowledge states for 5 students

You can use these IDs in your testing. For example, in the BKT API endpoints, you can use the knowledge component IDs and content item IDs created by the seed script.

The BKT algorithm is configured with the following parameters:
- pL0 (initial mastery): 0.3 for Addition and Subtraction, lower for more complex topics
- pT (transition): 0.09 for Addition and Subtraction, lower for more complex topics
- pS (slip): 0.1 for Addition and Subtraction, higher for more complex topics
- pG (guess): 0.2 for Addition and Subtraction, lower for more complex topics

These parameters affect how quickly a student's mastery level changes based on their responses.
