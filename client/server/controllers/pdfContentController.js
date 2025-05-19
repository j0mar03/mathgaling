/**
 * PDF Content Controller
 * 
 * Handles PDF curriculum document processing and related content management
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const multer = require('multer');
const { processPdfCurriculum } = require('../utils/pdfProcessor'); // Import the actual processor
// Set up file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pdf');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Removed simulated processing functions (processPdf, extractKnowledgeComponents, extractContentItems)
// We will now use the imported processPdfCurriculum from ../utils/pdfProcessor.js

// Controller methods
const pdfContentController = {
  // Upload and process PDF
  uploadAndProcessPdf: async (req, res) => {
    try {
      console.log("PDF upload request received");
      
      // Handle file upload using multer
      const uploadSingle = util.promisify(upload.single('curriculum'));
      
      try {
        await uploadSingle(req, res);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(400).json({ error: `File upload error: ${uploadError.message}` });
      }
      
      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log("File uploaded successfully:", req.file.originalname);
      
      const db = req.app.get('db');
      let uploadRecord; // Define uploadRecord here to be accessible later

      // Determine teacher ID (same logic as before)
      let teacherId = null;
      if (req.user) {
        if (req.user.role === 'teacher') {
          teacherId = req.user.id;
        } else if (req.user.role === 'admin') {
          const firstTeacher = await db.Teacher.findOne();
          teacherId = firstTeacher ? firstTeacher.id : 99901; // Consider a more robust admin handling?
        }
      } else {
        teacherId = 99901; // Fallback for testing/unauthenticated?
      }
      console.log("Using teacher ID for upload:", teacherId);

      // 1. Create initial PdfUpload record
      try {
        uploadRecord = await db.PdfUpload.create({
          filename: req.file.originalname,
          filepath: req.file.path, // Store the path provided by multer
          teacher_id: teacherId,
          status: 'processing', // Initial status
          review_status: 'pending', // Initial review status
          metadata: {} // Initialize metadata
        });
        console.log("Initial upload record created with ID:", uploadRecord.id);
      } catch (dbError) {
        console.error('Database error creating initial upload record:', dbError);
        // Clean up uploaded file if DB record creation fails?
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting orphaned upload file:", err);
        });
        return res.status(500).json({ error: `Database error: ${dbError.message}` });
      }

      // 2. Trigger asynchronous processing using the actual processor
      // We don't wait for it here; respond immediately to the client
      processPdfCurriculum(req.file.path, uploadRecord)
        .then(result => {
          console.log(`PDF processing completed for upload ID ${uploadRecord.id}. Suggestions created: KCs=${result.kcCount}, Items=${result.itemCount}`);
          // Update status on success
          return uploadRecord.update({
            status: 'processed',
            processed_at: new Date(),
            metadata: { // Store counts in metadata
              suggestion_kc_count: result.kcCount,
              suggestion_item_count: result.itemCount
            }
          });
        })
        .catch(processingError => {
          // Error is already logged within processPdfCurriculum
          // Status is also updated to 'error' within the function
          console.error(`Background PDF processing failed for upload ID ${uploadRecord.id}.`);
          // No need to update status here again, it's handled internally
        });

      // 3. Respond to client immediately after upload is accepted
      res.status(202).json({ // 202 Accepted: Request accepted, processing initiated
        message: 'PDF uploaded successfully and processing initiated.',
        upload_id: uploadRecord.id,
        filename: uploadRecord.filename
      });

    } catch (error) {
      console.error('Error uploading and processing PDF:', error);
      res.status(500).json({ error: `Failed to upload and process PDF: ${error.message}` });
    }
  },
  
  // Create knowledge components from extracted data
  createKnowledgeComponents: async (req, res) => {
    try {
      const { upload_id, knowledge_components } = req.body;
      
      if (!upload_id || !knowledge_components || !Array.isArray(knowledge_components)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
      
      const db = req.app.get('db');
      
      // Get the upload record
      const upload = await db.PdfUpload.findByPk(upload_id);
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      // Create the knowledge components
      const createdKCs = [];
      for (const kc of knowledge_components) {
        const createdKC = await db.KnowledgeComponent.create({
          name: kc.name,
          description: kc.description,
          grade_level: 3, // Default to grade 3 for extracted components
          metadata: {
            source: 'pdf',
            pdf_id: upload_id,
            extraction_confidence: kc.score,
            bktParams: {
              pL0: 0.3, // Initial mastery probability
              pT: 0.09, // Probability of transitioning from unmastered to mastered
              pS: 0.1,  // Probability of slip (incorrect despite mastery)
              pG: 0.2   // Probability of guess (correct despite no mastery)
            }
          }
        });
        
        createdKCs.push(createdKC);
      }
      
      // Update the upload record
      await upload.update({
        metadata: {
          ...upload.metadata,
          created_kcs: createdKCs.length
        }
      });
      
      res.status(200).json({
        upload_id,
        knowledge_components: createdKCs
      });
    } catch (error) {
      console.error('Error creating knowledge components:', error);
      res.status(500).json({ error: 'Failed to create knowledge components' });
    }
  },
  
  // Create content items from extracted data
  createContentItems: async (req, res) => {
    try {
      const { upload_id, content_items } = req.body;
      
      if (!upload_id || !content_items || !Array.isArray(content_items)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
      
      const db = req.app.get('db');
      
      // Get the upload record
      const upload = await db.PdfUpload.findByPk(upload_id);
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      // Create the content items
      const createdItems = [];
      for (const item of content_items) {
        // Skip items without a knowledge component ID
        if (!item.knowledge_component_id) continue;
        
        // For admin or teacher uploads, use the teacher ID from the upload record
        const teacherId = upload.teacher_id;
        
        const createdItem = await db.ContentItem.create({
          type: item.type,
          content: item.content,
          difficulty: item.difficulty,
          metadata: JSON.stringify({
            source: 'pdf',
            pdf_id: upload_id,
            automatic: true
          }),
          knowledge_component_id: item.knowledge_component_id,
          teacher_id: teacherId
        });
        
        createdItems.push(createdItem);
      }
      
      // Update the upload record
      await upload.update({
        metadata: {
          ...upload.metadata,
          created_content_items: createdItems.length
        }
      });
      
      res.status(200).json({
        upload_id,
        content_items: createdItems
      });
    } catch (error) {
      console.error('Error creating content items:', error);
      res.status(500).json({ error: 'Failed to create content items' });
    }
  },
  
  // List PDF uploads for the teacher
  listPdfUploads: async (req, res) => {
    try {
      const db = req.app.get('db');
      
      // For teachers, only show their own uploads
      const uploads = await db.PdfUpload.findAll({
        where: { teacher_id: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      
      res.status(200).json(uploads);
    } catch (error) {
      console.error('Error listing PDF uploads:', error);
      res.status(500).json({ error: 'Failed to list PDF uploads' });
    }
  },
  
  // Get detailed information about a specific PDF upload
  getPdfUploadDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const db = req.app.get('db');
      
      // For teachers, ensure they only access their own uploads
      const upload = await db.PdfUpload.findOne({
        where: { 
          id,
          teacher_id: req.user.id
        }
      });
      
      if (!upload) {
        return res.status(404).json({ error: 'PDF upload not found' });
      }
      
      // Get related knowledge components and content items
      const kcs = await db.KnowledgeComponent.findAll({
        where: {
          metadata: {
            source: 'pdf',
            pdf_id: upload.id
          }
        }
      });
      
      const contentItems = await db.ContentItem.findAll({
        where: {
          metadata: {
            source: 'pdf',
            pdf_id: upload.id
          }
        }
      });
      
      res.status(200).json({
        upload,
        knowledge_components: kcs,
        content_items: contentItems
      });
    } catch (error) {
      console.error('Error getting PDF upload details:', error);
      res.status(500).json({ error: 'Failed to get PDF upload details' });
    }
  },

  // List PDF uploads awaiting review
  listPendingReviews: async (req, res) => {
    try {
      const db = req.app.get('db');
      const whereClause = { review_status: 'pending' };

      // Filter by teacher if the user is a teacher
      if (req.user && req.user.role === 'teacher') {
        whereClause.teacher_id = req.user.id;
      }
      // Admins can see all pending reviews (no additional filter needed)
      else if (!req.user || req.user.role !== 'admin') {
         // If not admin or teacher (or no user), return empty or error?
         // For now, let's assume only teachers/admins access this.
         // If accessed by others, they'll get an empty list if not admin.
         // Or we could add stricter role checks in middleware.
         console.warn(`User role ${req.user?.role} attempting to list pending reviews.`);
         // If strict, return: return res.status(403).json({ error: 'Permission denied' });
      }

      const pendingUploads = await db.PdfUpload.findAll({
        where: whereClause,
        include: [{ // Include uploader info
          model: db.Teacher,
          as: 'uploader',
          attributes: ['id', 'name'] // Correct attribute based on Teacher model
        }],
        order: [['createdAt', 'DESC']] // Show newest first
      });

      res.status(200).json(pendingUploads);

    } catch (error) {
      console.error('Error listing pending PDF reviews:', error);
      res.status(500).json({ error: 'Failed to list pending PDF reviews' });
    }
  },

  // Get details for a specific PDF review
  getReviewDetails: async (req, res) => {
    try {
      const { pdfId } = req.params;
      const db = req.app.get('db');

      // 1. Find the PdfUpload record
      const upload = await db.PdfUpload.findByPk(pdfId, {
        include: [{ // Include uploader info
          model: db.Teacher,
          as: 'uploader',
          attributes: ['id', 'name'] // Correct attribute based on Teacher model
        }]
      });

      if (!upload) {
        return res.status(404).json({ error: 'PDF upload not found' });
      }

      // 2. Check permissions (Teacher can only see their own, Admin can see all)
      if (req.user && req.user.role === 'teacher' && upload.teacher_id !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied to view this upload' });
      }
      // Add similar check if other roles should be restricted

      // 3. Find associated pending Knowledge Components
      const pendingKCs = await db.KnowledgeComponent.findAll({
        where: {
          pdf_upload_id: pdfId,
          status: 'pending_review'
        },
        order: [['source_page', 'ASC'], ['id', 'ASC']] // Order for easier review
      });

      // 4. Find associated pending Content Items
      const pendingItems = await db.ContentItem.findAll({
        where: {
          pdf_upload_id: pdfId,
          status: 'pending_review'
        },
        // Include associated KC info if needed during review (though linking happens on approve)
        // include: [{ model: db.KnowledgeComponent }],
        order: [['id', 'ASC']] // Order for easier review
      });

      // 5. Return the details
      res.status(200).json({
        uploadDetails: upload,
        pendingKnowledgeComponents: pendingKCs,
        pendingContentItems: pendingItems
      });

    } catch (error) {
      console.error(`Error getting PDF review details for ID ${req.params.pdfId}:`, error);
      res.status(500).json({ error: 'Failed to get PDF review details' });
    }
  },

  // Update and approve a suggested Content Item
  updateApproveContentItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const db = req.app.get('db');
      // Extract allowed fields from body to prevent mass assignment vulnerabilities
      const {
        content,
        type,
        difficulty,
        options,
        correct_answer,
        explanation,
        knowledge_component_id // Allow linking KC during approval
      } = req.body;

      // Find the item
      const item = await db.ContentItem.findByPk(itemId, {
        include: [{ // Include PdfUpload to check permissions
          model: db.PdfUpload,
          as: 'sourcePdf',
          attributes: ['teacher_id']
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Content item suggestion not found' });
      }

      // Permission check (Teacher can only approve items from their uploads, Admin can approve any)
      if (req.user && req.user.role === 'teacher' && item.sourcePdf?.teacher_id !== req.user.id) {
         return res.status(403).json({ error: 'Permission denied to modify this item' });
      }
      // Add check for other roles if necessary

      // Validate knowledge_component_id if provided
      if (knowledge_component_id) {
        const kcExists = await db.KnowledgeComponent.findByPk(knowledge_component_id);
        if (!kcExists) {
          return res.status(400).json({ error: `Knowledge Component with ID ${knowledge_component_id} not found.` });
        }
        // Optional: Check if the KC is also approved or belongs to the same PDF?
      }

      // Update the item
      const updatedItem = await item.update({
        content,
        type,
        difficulty,
        options, // Assumes frontend sends valid JSON or null
        correct_answer,
        explanation,
        knowledge_component_id, // Link the KC
        status: 'approved' // Mark as approved
      });

      res.status(200).json(updatedItem);

    } catch (error) {
      console.error(`Error updating/approving content item ID ${req.params.itemId}:`, error);
      res.status(500).json({ error: 'Failed to update content item' });
    }
  },

  // Update and approve a suggested Knowledge Component
  updateApproveKnowledgeComponent: async (req, res) => {
    try {
      const { kcId } = req.params;
      const db = req.app.get('db');
      // Extract allowed fields from body
      const {
        name,
        description,
        grade_level,
        curriculum_code,
        metadata // Allow updating metadata if needed
      } = req.body;

      // Find the KC
      const kc = await db.KnowledgeComponent.findByPk(kcId, {
        include: [{ // Include PdfUpload to check permissions
          model: db.PdfUpload,
          as: 'sourcePdf',
          attributes: ['teacher_id']
        }]
      });

      if (!kc) {
        return res.status(404).json({ error: 'Knowledge component suggestion not found' });
      }

      // Permission check (Teacher can only approve KCs from their uploads, Admin can approve any)
      if (req.user && req.user.role === 'teacher' && kc.sourcePdf?.teacher_id !== req.user.id) {
         return res.status(403).json({ error: 'Permission denied to modify this knowledge component' });
      }
      // Add check for other roles if necessary

      // Update the KC
      const updatedKC = await kc.update({
        name,
        description,
        grade_level, // Consider if grade_level should be editable here
        curriculum_code, // Consider if curriculum_code should be editable here
        metadata: metadata || kc.metadata, // Merge or replace metadata as needed
        status: 'approved' // Mark as approved
      });

      res.status(200).json(updatedKC);

    } catch (error) {
      console.error(`Error updating/approving knowledge component ID ${req.params.kcId}:`, error);
      res.status(500).json({ error: 'Failed to update knowledge component' });
    }
  },

  // Reject (delete) a suggested Content Item
  rejectDeleteContentItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const db = req.app.get('db');

      // Find the item
      const item = await db.ContentItem.findByPk(itemId, {
        include: [{ // Include PdfUpload to check permissions
          model: db.PdfUpload,
          as: 'sourcePdf',
          attributes: ['teacher_id']
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Content item suggestion not found' });
      }

      // Permission check
      if (req.user && req.user.role === 'teacher' && item.sourcePdf?.teacher_id !== req.user.id) {
         return res.status(403).json({ error: 'Permission denied to delete this item' });
      }
      // Add check for other roles if necessary

      // Ensure it's a pending suggestion before deleting
      if (item.status !== 'pending_review') {
        return res.status(400).json({ error: 'Cannot delete an item that is not pending review.' });
      }

      // Delete the item suggestion
      await item.destroy();

      res.status(204).send(); // 204 No Content on successful deletion

    } catch (error) {
      console.error(`Error deleting content item suggestion ID ${req.params.itemId}:`, error);
      res.status(500).json({ error: 'Failed to delete content item suggestion' });
    }
  },

  // Reject (delete) a suggested Knowledge Component
  rejectDeleteKnowledgeComponent: async (req, res) => {
    try {
      const { kcId } = req.params;
      const db = req.app.get('db');

      // Find the KC
      const kc = await db.KnowledgeComponent.findByPk(kcId, {
        include: [{ // Include PdfUpload to check permissions
          model: db.PdfUpload,
          as: 'sourcePdf',
          attributes: ['teacher_id']
        }]
      });

      if (!kc) {
        return res.status(404).json({ error: 'Knowledge component suggestion not found' });
      }

      // Permission check
      if (req.user && req.user.role === 'teacher' && kc.sourcePdf?.teacher_id !== req.user.id) {
         return res.status(403).json({ error: 'Permission denied to delete this knowledge component' });
      }
      // Add check for other roles if necessary

      // Ensure it's a pending suggestion before deleting
      if (kc.status !== 'pending_review') {
        return res.status(400).json({ error: 'Cannot delete a knowledge component that is not pending review.' });
      }

      // Delete the KC suggestion
      // Note: Consider if deleting a KC should cascade or affect linked pending ContentItems.
      // For now, we just delete the KC suggestion itself.
      await kc.destroy();

      res.status(204).send(); // 204 No Content on successful deletion

    } catch (error) {
      console.error(`Error deleting knowledge component suggestion ID ${req.params.kcId}:`, error);
      res.status(500).json({ error: 'Failed to delete knowledge component suggestion' });
    }
  },

  // Create a new Content Item manually during review
  createManualContentItem: async (req, res) => {
    try {
      const db = req.app.get('db');
      // Extract required and optional fields from body
      const {
        content,
        type,
        difficulty,
        options,
        correct_answer,
        explanation,
        knowledge_component_id,
        pdf_upload_id // Need the PDF context for permission checks and linking
      } = req.body;

      // Basic validation
      if (!content || !type || !pdf_upload_id) {
        return res.status(400).json({ error: 'Missing required fields (content, type, pdf_upload_id)' });
      }
      if (knowledge_component_id === undefined) { // Allow null, but require it to be present or null
         return res.status(400).json({ error: 'Missing required field: knowledge_component_id (can be null)' });
      }


      // Find the associated PDF Upload for permission check
      const upload = await db.PdfUpload.findByPk(pdf_upload_id);
      if (!upload) {
        return res.status(404).json({ error: `PDF Upload with ID ${pdf_upload_id} not found.` });
      }

      // Permission check (Teacher can only add items to their uploads, Admin can add to any)
      let creatorTeacherId = null;
      if (req.user && req.user.role === 'teacher') {
        if (upload.teacher_id !== req.user.id) {
          return res.status(403).json({ error: 'Permission denied to add content item to this PDF upload' });
        }
        creatorTeacherId = req.user.id;
      } else if (req.user && req.user.role === 'admin') {
        // Admin can create, associate with the PDF's original uploader? Or a generic admin ID?
        // Let's associate with the PDF's uploader for consistency.
        creatorTeacherId = upload.teacher_id;
      } else {
         return res.status(403).json({ error: 'Permission denied' }); // Or handle unauthenticated case
      }
      // Add check for other roles if necessary


      // Validate knowledge_component_id if provided (and not null)
      if (knowledge_component_id !== null) {
        const kcExists = await db.KnowledgeComponent.findByPk(knowledge_component_id);
        if (!kcExists) {
          return res.status(400).json({ error: `Knowledge Component with ID ${knowledge_component_id} not found.` });
        }
        // Optional: Check if KC is approved? Or belongs to same PDF?
      }

      // Create the new item
      const newItem = await db.ContentItem.create({
        content,
        type,
        difficulty: difficulty || 1, // Default difficulty if not provided
        options,
        correct_answer,
        explanation,
        knowledge_component_id,
        pdf_upload_id, // Link to the PDF being reviewed
        teacher_id: creatorTeacherId, // Set the creator
        status: 'approved', // Manually created items are approved by default
        suggestion_source: 'manual' // Mark as manually created
      });

      res.status(201).json(newItem); // 201 Created

    } catch (error) {
      console.error('Error creating manual content item:', error);
      res.status(500).json({ error: 'Failed to create manual content item' });
    }
  },

  // Create a new Knowledge Component manually during review
  createManualKnowledgeComponent: async (req, res) => {
    try {
      const db = req.app.get('db');
      // Extract required and optional fields from body
      const {
        name,
        description,
        grade_level,
        curriculum_code,
        metadata,
        pdf_upload_id, // Need the PDF context for permission checks and linking
        source_page // Optional page number
      } = req.body;

      // Basic validation
      if (!name || !pdf_upload_id) {
        return res.status(400).json({ error: 'Missing required fields (name, pdf_upload_id)' });
      }

      // Find the associated PDF Upload for permission check
      const upload = await db.PdfUpload.findByPk(pdf_upload_id);
      if (!upload) {
        return res.status(404).json({ error: `PDF Upload with ID ${pdf_upload_id} not found.` });
      }

      // Permission check (Teacher can only add KCs to their uploads, Admin can add to any)
      if (req.user && req.user.role === 'teacher') {
        if (upload.teacher_id !== req.user.id) {
          return res.status(403).json({ error: 'Permission denied to add knowledge component to this PDF upload' });
        }
      } else if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'teacher')) {
         // Only allow teachers and admins
         return res.status(403).json({ error: 'Permission denied' });
      }
      // Add check for other roles if necessary

      // Create the new KC
      const newKC = await db.KnowledgeComponent.create({
        name,
        description,
        grade_level, // Consider default if not provided?
        curriculum_code,
        metadata, // Use provided metadata or default?
        pdf_upload_id, // Link to the PDF being reviewed
        source_page,
        status: 'approved', // Manually created KCs are approved by default
        suggestion_source: 'manual' // Mark as manually created
      });

      res.status(201).json(newKC); // 201 Created

    } catch (error) {
      // Handle potential unique constraint errors (e.g., curriculum_code)
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'A knowledge component with this curriculum code already exists.' });
      }
      console.error('Error creating manual knowledge component:', error);
      res.status(500).json({ error: 'Failed to create manual knowledge component' });
    }
  },

  // Mark the review process for a PDF as complete
  markReviewComplete: async (req, res) => {
    try {
      const { pdfId } = req.params;
      const db = req.app.get('db');

      // Find the PDF Upload
      const upload = await db.PdfUpload.findByPk(pdfId);

      if (!upload) {
        return res.status(404).json({ error: 'PDF upload not found' });
      }

      // Permission check (Teacher can only complete their uploads, Admin can complete any)
      if (req.user && req.user.role === 'teacher' && upload.teacher_id !== req.user.id) {
         return res.status(403).json({ error: 'Permission denied to complete review for this PDF upload' });
      }
      // Add check for other roles if necessary

      // Optional: Automatically reject any remaining pending suggestions for this PDF?
      // This prevents orphaned suggestions. Set to true to enable.
      const autoRejectPending = true;

      if (autoRejectPending) {
        const updatePromises = [
          db.ContentItem.update(
            { status: 'rejected' },
            { where: { pdf_upload_id: pdfId, status: 'pending_review' } }
          ),
          db.KnowledgeComponent.update(
            { status: 'rejected' },
            { where: { pdf_upload_id: pdfId, status: 'pending_review' } }
          )
        ];
        await Promise.all(updatePromises);
        console.log(`Auto-rejected remaining pending suggestions for PDF Upload ID ${pdfId}.`);
      }

      // Update the review status
      await upload.update({ review_status: 'completed' });

      res.status(200).json({ message: `Review marked as complete for PDF Upload ID ${pdfId}` });

    } catch (error) {
      console.error(`Error marking review complete for PDF ID ${req.params.pdfId}:`, error);
      res.status(500).json({ error: 'Failed to mark review as complete' });
    }
  }
};
module.exports = pdfContentController;
