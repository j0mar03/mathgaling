'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Get the current user's inbox (messages received)
router.get('/inbox', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Get user ID and role from the auth token (set by middleware)
    const userId = req.user.id;
    const userType = req.user.role; // 'student', 'teacher', etc.
    
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find all messages where this user is the recipient
    const messages = await db.Message.findAll({
      where: {
        to_user_id: userId,
        to_user_type: userType
      },
      order: [['sent_at', 'DESC']] // Most recent first
    });
    
    // Fetch sender names to display
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const messageJson = message.toJSON();
      
      let fromName = 'Unknown';
      
      // Fetch sender name based on from_user_type
      if (message.from_user_type === 'teacher') {
        const teacher = await db.Teacher.findByPk(message.from_user_id);
        if (teacher) {
          fromName = teacher.name;
        }
      } else if (message.from_user_type === 'student') {
        const student = await db.Student.findByPk(message.from_user_id);
        if (student) {
          fromName = student.name;
        }
      }
      
      return {
        ...messageJson,
        from_name: fromName
      };
    }));
    
    res.json(enrichedMessages);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark a message as read
router.put('/:id/read', authMiddleware.verifyToken, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userType = req.user.role;
    
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid Message ID' });
    }
    
    // Find the message
    const message = await db.Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if the current user is the recipient of this message
    if (message.to_user_id !== userId || message.to_user_type !== userType) {
      return res.status(403).json({ 
        error: 'You do not have permission to mark this message as read' 
      });
    }
    
    // Update the message as read
    message.read = true;
    await message.save();
    
    // Also update any notifications related to this message
    await db.Notification.update(
      { read: true },
      { 
        where: { 
          user_id: userId,
          user_type: userType,
          type: 'message',
          reference_id: messageId
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get outbox (sent messages)
router.get('/outbox', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role; // 'student', 'teacher', etc.
    
    // Find all messages sent by this user
    const messages = await db.Message.findAll({
      where: {
        from_user_id: userId,
        from_user_type: userType
      },
      order: [['sent_at', 'DESC']] // Most recent first
    });
    
    // Fetch recipient names
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const messageJson = message.toJSON();
      
      let toName = 'Unknown';
      
      // Fetch recipient name based on to_user_type
      if (message.to_user_type === 'teacher') {
        const teacher = await db.Teacher.findByPk(message.to_user_id);
        if (teacher) {
          toName = teacher.name;
        }
      } else if (message.to_user_type === 'student') {
        const student = await db.Student.findByPk(message.to_user_id);
        if (student) {
          toName = student.name;
        }
      }
      
      return {
        ...messageJson,
        to_name: toName
      };
    }));
    
    res.json(enrichedMessages);
  } catch (error) {
    console.error('Error fetching outbox messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

module.exports = router; 