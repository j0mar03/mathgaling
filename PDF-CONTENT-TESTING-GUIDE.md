# PDF Content Management & BKT Algorithm Testing Guide

This guide provides step-by-step instructions for testing the new PDF content management system and BKT algorithm implementation in the ITS-KIDS platform.

## Setup Instructions

Before testing, ensure you have:

1. Run database migrations to create the new pdf_uploads table:
   ```bash
   cd client/server
   npm run migrate
   ```

2. Installed required dependencies:
   ```bash
   cd client/server
   npm install
   ```

3. Have a sample PDF curriculum document ready for testing. Ideally, this should be a PDF with:
   - Clear headings/sections that can be identified as knowledge components
   - Questions or examples that can be extracted as content items
   - Multiple pages (to test pagination)

## Testing PDF Content Management as Admin

The admin interface provides comprehensive tools for managing PDF curriculum content across the entire system.

### Step 1: Access the Admin Dashboard

1. Start the application:
   ```bash
   cd client/server
   npm run dev
   ```

2. In a separate terminal, start the client:
   ```bash
   cd client
   npm start
   ```

3. Navigate to the admin login page and log in using the admin credentials:
   - Username: `admin@example.com`
   - Password: `adminpassword`
   
4. Once logged in, access the PDF content management section from the admin dashboard.

### Step 2: Upload and Process a PDF

1. Click the "Upload New PDF" button on the admin PDF management page.
2. Select your sample PDF curriculum file.
3. Click "Upload & Process" and wait for the processing to complete.
4. You should see the extracted knowledge components. Verify that:
   - The headings/sections from your PDF are correctly identified
   - Each knowledge component has an appropriate name and description
   - The confidence scores (if available) make sense

### Step 3: Create Knowledge Components

1. Review the extracted knowledge components and select the ones you want to create.
2. Click "Create Knowledge Components" to proceed.
3. Wait for the creation process to complete.
4. You should now see the extracted content items. Verify that:
   - Questions and examples are correctly identified
   - Content is appropriately associated with knowledge components
   - The content types (question, example, etc.) are accurate

### Step 4: Create Content Items

1. Review the extracted content items and select those you want to create.
2. Click "Create Content Items" to proceed.
3. After creation completes, you'll see a success page.
4. Click "View All Uploads" to return to the upload list.

### Step 5: Manage Uploads

1. In the upload list, verify that your new upload appears with the correct status.
2. Click "View" to see detailed information about your upload:
   - Verify the upload details (filename, status, uploader, etc.)
   - Check the created knowledge components
   - Check the created content items
3. Test the delete functionality by clicking "Delete" on an upload (be cautious, as this will remove all associated data).

## Testing PDF Content Management as Teacher

Teachers have similar capabilities but can only manage their own uploads.

1. Log out of the admin account and log in as a teacher:
   - Username: `teacher1@example.com`
   - Password: `teacherpassword`

2. Navigate to the curriculum management section and access the PDF upload feature.

3. Repeat steps 2-4 from the admin testing section to upload and process a PDF.

4. Verify that teachers can only see and manage their own uploads.

## Testing the BKT Algorithm

The BKT algorithm with fuzzy logic can be tested through the API or through the student interface.

### Option 1: Testing via API

1. Ensure you have Postman or a similar API testing tool installed.

2. Set up the following API test sequence:

   a. Process a student response:
   ```
   POST /api/bkt/process-response
   {
     "studentId": 99901,
     "contentItemId": 99901,
     "correct": true,
     "timeSpent": 10
   }
   ```
   
   b. Get the student's knowledge state:
   ```
   GET /api/bkt/knowledge-state?studentId=99901&kcId=99901
   ```
   
   c. Get a content recommendation:
   ```
   GET /api/bkt/recommend?studentId=99901&kcId=99901
   ```

3. Execute these API calls and verify:
   - The knowledge state updates appropriately after processing responses
   - Correct answers increase mastery and incorrect answers decrease it
   - Fast correct answers increase mastery more than slow correct answers
   - Content recommendations consider the current knowledge state

### Option 2: Testing via Student Interface

1. Log in as a student:
   - Username: `student1@example.com`
   - Password: `studentpassword`

2. Navigate to a learning activity that uses content from your uploaded PDF.

3. Answer several questions, alternating between:
   - Correct answers (fast)
   - Correct answers (slow - wait before submitting)
   - Incorrect answers

4. After each response, check if:
   - The student's knowledge state is updated
   - The difficulty of subsequent questions adjusts based on performance
   - The system appears to correctly model the student's knowledge

## Troubleshooting

If you encounter issues during testing:

1. **PDF Processing Fails**:
   - Check the server logs for detailed error messages
   - Ensure the PDF is not corrupt or password-protected
   - Try with a simpler PDF with clear formatting

2. **BKT Algorithm Issues**:
   - Check the knowledge state in the database directly
   - Verify that response records are being created
   - Make sure the content items are correctly linked to knowledge components

3. **API Errors**:
   - Verify the request format matches the expected schema
   - Check authentication (you need to be logged in with appropriate permissions)
   - Look for validation errors in the response

## Sample PDF Resources

For testing purposes, here are some sample curriculum PDFs that work well with the system:

1. **Math Curriculum PDF**: Contains clear sections for arithmetic operations, with examples and questions
   - [Sample Math Curriculum](https://example.com/math_curriculum.pdf)

2. **Reading Comprehension PDF**: Contains passages followed by questions
   - [Sample Reading Curriculum](https://example.com/reading_curriculum.pdf)

These sample files are structured in a way that our PDF processor can effectively identify knowledge components and content items.
