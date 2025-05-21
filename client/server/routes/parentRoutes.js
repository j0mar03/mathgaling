'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Parent, Student, ParentStudent } = db;
const authMiddleware = require('../middleware/authMiddleware');

// Create routes even if middleware is disabled for testing
const optionalAuth = (req, res, next) => {
  try {
    authMiddleware.verifyToken(req, res, next);
  } catch (err) {
    // Proceed anyway for testing purposes
    console.warn('Auth token verification failed, but proceeding:', err);
    next();
  }
};

// Get parent profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // Don't send password
    });
    
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    res.json(parent);
  } catch (err) {
    console.error('Error fetching parent:', err);
    res.status(500).json({ error: 'Failed to fetch parent profile' });
  }
});

// Get parent's children
router.get('/:id/children', optionalAuth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id, {
      include: [{
        model: Student,
        attributes: { exclude: ['password'] }, // Exclude password hash
        through: { attributes: [] } // Don't include junction table fields
      }]
    });
    
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    res.json(parent.Students || []);
  } catch (err) {
    console.error('Error fetching parent\'s children:', err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// Link parent to students
router.post('/:id/link-students', optionalAuth, async (req, res) => {
  const { studentIds } = req.body;
  const parentId = parseInt(req.params.id);
  
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Student IDs are required' });
  }
  
  try {
    // Verify parent exists
    const parent = await Parent.findByPk(parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    // Verify students exist
    const students = await Student.findAll({
      where: { id: studentIds }
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'One or more students not found' });
    }
    
    // Create parent-student links
    const links = studentIds.map(studentId => ({
      parent_id: parentId,
      student_id: studentId
    }));
    
    await ParentStudent.bulkCreate(links, {
      ignoreDuplicates: true // In case links already exist
    });
    
    res.json({
      message: 'Students linked to parent successfully',
      links: links
    });
  } catch (err) {
    console.error('Error linking students to parent:', err);
    res.status(500).json({ error: 'Failed to link students to parent' });
  }
});

// Get weekly report for a student
router.get('/students/:id/weekly-report', optionalAuth, async (req, res) => {
  try {
    // This would normally query knowledge states and aggregate them into a report
    // For now, we'll return mock data
    res.json({
      weeklyProgress: {
        averageMastery: 0.65,
        weeklyChange: 0.08,
        activeDays: 5,
        subjectAreas: {
          'Mathematics': 0.72,
          'English': 0.58,
          'Science': 0.65
        }
      }
    });
  } catch (err) {
    console.error('Error fetching weekly report:', err);
    res.status(500).json({ error: 'Failed to fetch weekly report' });
  }
});

// Get messages for parent
router.get('/:id/messages', optionalAuth, async (req, res) => {
  // Mock data for messages
  const messages = [
    {
      id: 1,
      sender_name: 'Ms. Johnson',
      sender_role: 'Teacher',
      subject: 'Weekly Progress Update',
      content: 'Just wanted to let you know that your child has been making excellent progress in mathematics this week.',
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: false
    },
    {
      id: 2,
      sender_name: 'Principal Williams',
      sender_role: 'Admin',
      subject: 'Upcoming Parent-Teacher Conference',
      content: 'This is a reminder about our parent-teacher conference scheduled for next Friday.',
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      read: true
    }
  ];

  res.json(messages);
});

module.exports = router;
