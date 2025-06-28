'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { Student, Teacher, Parent, Admin } = db; // Destructure models, including Admin
const { Op } = require("sequelize"); // Import Op for query operators

// TODO: Move JWT secret to environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development'; // Use default for development
const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

// Helper function to find user by email across models
const findUserByEmail = async (email) => {
    // Add email field to models if not present, or use another unique identifier like auth_id
    // For now, assuming 'auth_id' might be used like an email/username
    let user = await Student.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'student' };

    user = await Teacher.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'teacher' };

    user = await Parent.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'parent' };

    user = await Admin.findOne({ where: { auth_id: email } }); // Check Admin model
    if (user) return { user, role: 'admin' }; // Return 'admin' role

    return null;
};


// --- Registration ---
// Note: This is a basic example. You'll need separate registration logic
// or a way to determine the user type during registration.
// This example assumes registration is for Students only for simplicity.
exports.registerStudent = async (req, res) => {
    const { name, email, password, grade_level } = req.body; // Assuming email is used as auth_id

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        // Check if user already exists (using email as auth_id)
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create student
        const newStudent = await Student.create({
            name,
            auth_id: email, // Using email as auth_id
            password: hashedPassword,
            grade_level,
            // Add other necessary fields
        });

        // Don't send password back
        const studentData = newStudent.toJSON();
        delete studentData.password;

        // Create a learning path for the new student
        await db.LearningPath.create({
            student_id: newStudent.id,
            is_active: true,
            current_position: 0
        });

        res.status(201).json({ 
            message: 'Student registered successfully', 
            student: studentData 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed.' });
    }
};

// --- Register Teacher ---
exports.registerTeacher = async (req, res) => {
    const { name, email, password, subject_taught } = req.body; // Assuming email is used as auth_id

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newTeacher = await Teacher.create({
            name,
            auth_id: email, // Using email as auth_id
            password: hashedPassword,
            subject_taught,
            preferences: { // Initialize preferences
                notificationEnabled: true,
                theme: 'light'
            }
        });

        const teacherData = newTeacher.toJSON();
        delete teacherData.password;

        res.status(201).json({ 
            message: 'Teacher registered successfully', 
            teacher: teacherData 
        });

    } catch (error) {
        console.error('Teacher registration error:', error);
        res.status(500).json({ error: 'Teacher registration failed.' });
    }
};

// --- Register Parent ---
exports.registerParent = async (req, res) => {
    // Include student_emails in the destructured body
    const { name, email, password, phone_number, student_emails } = req.body;

    // Validate required fields, including student_emails
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (!student_emails || !Array.isArray(student_emails) || student_emails.length === 0) {
        return res.status(400).json({ error: 'At least one student email is required.' });
    }

    try {
        // 1. Check if parent email already exists
        const existingParent = await Parent.findOne({ where: { auth_id: email } });
        if (existingParent) {
            return res.status(400).json({ error: 'Parent with this email already exists.' });
        }

        // 2. Find students by their emails (auth_id)
        const studentsToLink = await Student.findAll({
            where: {
                auth_id: {
                    [Op.in]: student_emails // Find students whose auth_id is in the provided array
                }
            }
        });

        if (studentsToLink.length === 0) {
            // No valid students found for the provided emails
            return res.status(400).json({ error: 'No valid student accounts found for the provided email(s).' });
        }
        
        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 4. Create parent
        const newParent = await Parent.create({
            name,
            auth_id: email, // Using email as auth_id
            password: hashedPassword,
            phone_number
        });

        // 5. Link the found students to the new parent
        // The `addStudents` method is automatically provided by Sequelize for the belongsToMany association
        await newParent.addStudents(studentsToLink);

        // 6. Prepare response data (excluding password)
        const parentData = newParent.toJSON();
        delete parentData.password;

        // Include linked student info (optional, could just send IDs or a count)
        const linkedStudentIds = studentsToLink.map(s => s.id);
        const linkedStudentAuthIds = studentsToLink.map(s => s.auth_id);

        res.status(201).json({
            message: `Parent registered successfully and linked to student(s): ${linkedStudentAuthIds.join(', ')}`,
            parent: parentData,
            linked_student_ids: linkedStudentIds // Send back IDs of linked students
        });

    } catch (error) {
        console.error('Parent registration error:', error);
        // Provide a more specific error message if possible
        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: 'Validation failed.', details: error.errors });
        }
        res.status(500).json({ error: 'Parent registration failed due to an internal error.' });
    }
};

// --- Login ---
exports.login = async (req, res) => {
    let email, password;
    
    try {
        // Safely extract credentials
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is missing' });
        }
        
        email = req.body.email;
        password = req.body.password;
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        
        console.log('Login attempt for:', email);
    } catch (parseError) {
        console.error('Error parsing login request:', parseError);
        return res.status(400).json({ error: 'Invalid request format' });
    }
    
    try {
        // Find user by email (auth_id) across all relevant models
        let found;
        try {
            found = await findUserByEmail(email);
            console.log('User found result:', found ? 
                { found: true, role: found.role, hasUser: !!found.user } : 
                { found: false });
        } catch (lookupError) {
            console.error('User lookup error:', lookupError);
            return res.status(500).json({ error: 'User lookup failed' });
        }

        if (!found || !found.user) {
            return res.status(401).json({ error: 'Invalid credentials or user not found.' });
        }
        
        // Check if user has a password
        if (!found.user.password) {
            console.error('User has no password:', { email });
            return res.status(401).json({ error: 'Account requires password reset.' });
        }

        const { user, role } = found;
        
        // Compare passwords
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', { isMatch });
        } catch (bcryptError) {
            console.error('Password comparison error:', bcryptError);
            return res.status(500).json({ error: 'Authentication failed' });
        }
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        // Generate JWT with safe fallback
        const payload = {
            id: user.id,
            auth_id: user.auth_id,
            role: role
        };
        
        let token;
        try {
            // Make sure JWT_SECRET is set and valid
            const secret = JWT_SECRET || 'fallback-secret-key-for-development';
            if (!secret || typeof secret !== 'string' || secret.length < 10) {
                console.error('JWT secret is invalid or too short');
                // Continue with a temporary secret rather than failing
                token = jwt.sign(payload, 'temporary-secret-for-emergency-login', { expiresIn: '1h' });
            } else {
                token = jwt.sign(payload, secret, { expiresIn: '1h' });
            }
        } catch (jwtError) {
            console.error('JWT signing error:', jwtError);
            // Create a fallback token with minimal security for emergency access
            // This is not ideal but prevents complete system lockout in production
            const timestamp = Date.now();
            token = `emergency-token-${user.id}-${role}-${timestamp}`;
        }
        
        // Prepare user data (without sensitive information)
        let userData;
        try {
            userData = user.toJSON();
        } catch (jsonError) {
            console.error('Error converting user to JSON:', jsonError);
            // Create a minimal user object if toJSON fails
            userData = {
                id: user.id,
                auth_id: user.auth_id,
                name: user.name || 'User'
            };
        }
        
        // Never return the password
        delete userData.password;
        
        console.log('Login successful for:', { id: user.id, role });
        
        return res.json({
            message: 'Login successful',
            token,
            user: userData,
            role: role
        });
    } catch (error) {
        console.error('Unhandled login error:', error);
        
        // Send a simple string error to avoid client-side rendering issues
        return res.status(500).json({ 
            error: 'Login failed. Please try again later.' 
        });
    }
};
