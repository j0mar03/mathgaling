/**
 * Admin Content Controller
 * 
 * Handles administrative operations for content items (quiz questions)
 */

const fs = require('fs');
const path = require('path');
const db = require('../models');
const { ContentItem, KnowledgeComponent, Teacher } = db;
const { Op } = db.Sequelize;

// List all content items with filtering options
exports.listContentItems = async (req, res) => {
  try {
    // Extract filter parameters from query
    const { 
      type, 
      kcId, 
      difficulty, 
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    // Build where conditions based on filters
    const whereConditions = {};
    
    // Filter by type if provided
    if (type) {
      whereConditions.type = type;
    }
    
    // Filter by knowledge component if provided
    if (kcId) {
      whereConditions.knowledge_component_id = parseInt(kcId, 10);
    }
    
    // Filter by difficulty if provided
    if (difficulty) {
      whereConditions.difficulty = parseInt(difficulty, 10);
    }
    
    // Search in content if provided
    if (search) {
      whereConditions[Op.or] = [
        { content: { [Op.iLike]: `%${search}%` } },
        { '$KnowledgeComponent.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Fetch content items with associations
    const { count, rows: contentItems } = await ContentItem.findAndCountAll({
      where: whereConditions,
      include: [
        { 
          model: KnowledgeComponent,
          attributes: ['id', 'name', 'grade_level']
        },
        {
          model: Teacher,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Return paginated results
    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      contentItems
    });
  } catch (error) {
    console.error("Error listing content items:", error);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
};

// Get a specific content item by ID
exports.getContentItem = async (req, res) => {
  try {
    const { id } = req.params;
    const contentId = parseInt(id, 10);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ error: 'Invalid Content Item ID provided.' });
    }
    
    // Fetch the content item with associations
    const contentItem = await ContentItem.findByPk(contentId, {
      include: [
        { 
          model: KnowledgeComponent,
          attributes: ['id', 'name', 'grade_level']
        },
        {
          model: Teacher,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found.' });
    }
    
    res.json(contentItem);
  } catch (error) {
    console.error(`Error fetching content item:`, error);
    res.status(500).json({ error: 'Failed to fetch content item' });
  }
};

// Create a new content item
exports.createContentItem = async (req, res) => {
  try {
    // Extract data from request body
    const { 
      knowledge_component_id,
      type,
      content,
      difficulty,
      language = 'English',
      options,
      correct_answer,
      explanation,
      hint
    } = req.body;
    
    // Basic validation
    if (!knowledge_component_id || !type || !content) {
      return res.status(400).json({ 
        error: 'Knowledge Component ID, Type, and Content are required.' 
      });
    }
    
    // Parse options if provided as string
    let parsedOptions = options;
    if (typeof options === 'string' && options.trim() !== '') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (err) {
        return res.status(400).json({ error: 'Options must be valid JSON.' });
      }
    }
    
    // Prepare metadata with hint and image if provided
    const metadata = {};
    
    // Add hint to metadata if provided
    if (hint) {
      metadata.hint = hint;
    }
    
    // Add image URL to metadata if file was uploaded
    if (req.file) {
      // Generate relative URL for the image
      const imageUrl = `/uploads/images/${req.file.filename}`;
      metadata.imageUrl = imageUrl;
    }
    
    // Create the content item
    const contentItem = await ContentItem.create({
      knowledge_component_id: parseInt(knowledge_component_id, 10),
      type,
      content,
      difficulty: difficulty ? parseInt(difficulty, 10) : null,
      language,
      options: parsedOptions,
      correct_answer,
      explanation,
      metadata,
      status: 'approved', // Admin-created content is automatically approved
      suggestion_source: 'manual',
      teacher_id: req.user?.role === 'teacher' ? req.user.id : null // Set teacher_id if user is a teacher
    });
    
    // Fetch the created item with associations
    const createdItem = await ContentItem.findByPk(contentItem.id, {
      include: [
        { 
          model: KnowledgeComponent,
          attributes: ['id', 'name', 'grade_level']
        }
      ]
    });
    
    res.status(201).json(createdItem);
  } catch (error) {
    console.error("Error creating content item:", error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file after failed content item creation:", err);
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create content item.' });
  }
};

// Update an existing content item
exports.updateContentItem = async (req, res) => {
  try {
    const { id } = req.params;
    const contentId = parseInt(id, 10);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ error: 'Invalid Content Item ID provided.' });
    }
    
    // Extract data from request body
    const { 
      knowledge_component_id,
      type,
      content,
      difficulty,
      language,
      options,
      correct_answer,
      explanation,
      hint,
      removeImage
    } = req.body;
    
    // Find the content item
    const contentItem = await ContentItem.findByPk(contentId);
    
    if (!contentItem) {
      // Clean up uploaded file if there was one
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file after content item not found:", err);
        });
      }
      return res.status(404).json({ error: 'Content item not found.' });
    }
    
    // Parse options if provided as string
    let parsedOptions = options;
    if (typeof options === 'string' && options.trim() !== '') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (err) {
        return res.status(400).json({ error: 'Options must be valid JSON.' });
      }
    }
    
    // Prepare update data
    const updateData = {
      type,
      content,
      difficulty: difficulty ? parseInt(difficulty, 10) : null,
      language,
      options: parsedOptions,
      correct_answer,
      explanation
    };
    
    // Only update knowledge_component_id if provided
    if (knowledge_component_id) {
      updateData.knowledge_component_id = parseInt(knowledge_component_id, 10);
    }
    
    // Handle metadata updates (hint and image)
    const metadata = { ...contentItem.metadata } || {};
    
    // Update hint if provided
    if (hint !== undefined) {
      metadata.hint = hint || null; // Set to null if empty string
    }
    
    // Handle image updates
    if (removeImage === 'true' || removeImage === true) {
      // Remove the image if requested
      if (metadata.imageUrl) {
        const imagePath = path.join(__dirname, '..', 'public', metadata.imageUrl);
        fs.unlink(imagePath, (err) => {
          if (err && !err.code === 'ENOENT') {
            console.error("Error deleting image file:", err);
          }
        });
        delete metadata.imageUrl;
      }
    } else if (req.file) {
      // Replace with new image if uploaded
      if (metadata.imageUrl) {
        // Delete old image if it exists
        const oldImagePath = path.join(__dirname, '..', 'public', metadata.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err && !err.code === 'ENOENT') {
            console.error("Error deleting old image file:", err);
          }
        });
      }
      
      // Add new image URL
      const imageUrl = `/uploads/images/${req.file.filename}`;
      metadata.imageUrl = imageUrl;
    }
    
    // Update metadata
    updateData.metadata = metadata;
    
    // Update the content item
    await contentItem.update(updateData);
    
    // Fetch the updated item with associations
    const updatedItem = await ContentItem.findByPk(contentId, {
      include: [
        { 
          model: KnowledgeComponent,
          attributes: ['id', 'name', 'grade_level']
        },
        {
          model: Teacher,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error(`Error updating content item:`, error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file after failed content item update:", err);
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update content item.' });
  }
};

// Delete a content item
exports.deleteContentItem = async (req, res) => {
  try {
    const { id } = req.params;
    const contentId = parseInt(id, 10);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ error: 'Invalid Content Item ID provided.' });
    }
    
    // Find the content item
    const contentItem = await ContentItem.findByPk(contentId);
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content item not found.' });
    }
    
    // Delete associated image if exists
    if (contentItem.metadata && contentItem.metadata.imageUrl) {
      const imagePath = path.join(__dirname, '..', 'public', contentItem.metadata.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err && !err.code === 'ENOENT') {
          console.error("Error deleting image file:", err);
        }
      });
    }
    
    // Delete the content item
    await contentItem.destroy();
    
    res.json({ message: 'Content item deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting content item:`, error);
    res.status(500).json({ error: 'Failed to delete content item.' });
  }
};

// Delete multiple content items
exports.deleteMultipleContentItems = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty Content Item IDs provided.' });
    }
    
    // Find all content items to delete
    const contentItems = await ContentItem.findAll({
      where: { id: ids }
    });
    
    if (contentItems.length === 0) {
      return res.status(404).json({ error: 'No content items found with the provided IDs.' });
    }
    
    // Delete associated images
    for (const item of contentItems) {
      if (item.metadata && item.metadata.imageUrl) {
        const imagePath = path.join(__dirname, '..', 'public', item.metadata.imageUrl);
        fs.unlink(imagePath, (err) => {
          if (err && !err.code === 'ENOENT') {
            console.error(`Error deleting image file for content item ${item.id}:`, err);
          }
        });
      }
    }
    
    // Delete the content items
    await ContentItem.destroy({
      where: { id: ids }
    });
    
    res.json({ 
      message: `${contentItems.length} content items deleted successfully.`,
      deletedIds: contentItems.map(item => item.id)
    });
  } catch (error) {
    console.error(`Error deleting multiple content items:`, error);
    res.status(500).json({ error: 'Failed to delete content items.' });
  }
};

// Create multiple content items (bulk)
exports.createBulkContentItems = async (req, res) => {
  const { knowledge_component_id, questions: questionsJson } = req.body;
  let createdItems = [];
  let uploadedFilePaths = req.files ? req.files.map(f => f.path) : [];

  try {
    if (!knowledge_component_id || !questionsJson) {
      return res.status(400).json({ error: 'Knowledge Component ID and Questions data are required.' });
    }

    let questions;
    try {
      questions = JSON.parse(questionsJson);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Questions data must be a non-empty array.');
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid questions JSON format.' });
    }

    const kcId = parseInt(knowledge_component_id, 10);
    if (isNaN(kcId)) {
      return res.status(400).json({ error: 'Invalid Knowledge Component ID.' });
    }

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      
      const {
        type,
        content,
        difficulty,
        language = 'English',
        options,
        correct_answer,
        explanation,
        hint
      } = questionData;

      if (!type || !content) {
        return res.status(400).json({ 
          error: `Type and Content are required for question ${i + 1}.` 
        });
      }

      let parsedOptions = options;
      if (type === 'multiple_choice' && typeof options === 'string' && options.trim() !== '') {
        try {
          parsedOptions = JSON.parse(options);
        } catch (err) {
          return res.status(400).json({ error: `Options for question ${i + 1} must be valid JSON.` });
        }
      } else if (type !== 'multiple_choice') {
        parsedOptions = null; // Or handle as per model definition for non-MCQ
      }


      const metadata = {};
      if (hint) {
        metadata.hint = hint;
      }

      // Find the corresponding image file for this question
      // req.files is an array of files from upload.any()
      // The frontend sends files with fieldname like 'image_0', 'image_1', ...
      const imageFileForQuestion = req.files.find(file => file.fieldname === `image_${i}`);
      if (imageFileForQuestion) {
        metadata.imageUrl = `/uploads/images/${imageFileForQuestion.filename}`;
      }
      
      const contentItem = await ContentItem.create({
        knowledge_component_id: kcId,
        type,
        content,
        difficulty: difficulty ? parseInt(difficulty, 10) : null,
        language,
        options: parsedOptions,
        correct_answer,
        explanation,
        metadata,
        status: 'approved',
        suggestion_source: 'manual',
        teacher_id: req.user?.role === 'teacher' ? req.user.id : null
      });
      createdItems.push(contentItem);
    }

    // Fetch created items with associations for the response
    const detailedCreatedItems = await ContentItem.findAll({
      where: {
        id: createdItems.map(item => item.id)
      },
      include: [{ model: KnowledgeComponent, attributes: ['id', 'name', 'grade_level'] }]
    });

    res.status(201).json({ 
      message: `${createdItems.length} content items created successfully.`,
      createdItems: detailedCreatedItems 
    });

  } catch (error) {
    console.error("Error creating bulk content items:", error);

    // Clean up all uploaded files if there was an error during processing
    uploadedFilePaths.forEach(filePath => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file after failed bulk content item creation:", err);
      });
    });
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create content items in bulk.' });
  }
};
