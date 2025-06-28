/**
 * Admin Controller
 *
 * Handles administrative operations like user management.
 */
const bcrypt = require('bcrypt'); // Need bcrypt for hashing password
const db = require('../models');
const { Student, Teacher, Parent, Admin, KnowledgeComponent } = db; // Import models, including Admin and KnowledgeComponent
const SALT_ROUNDS = 10; // Consistent salt rounds
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// List all users (Students, Teachers, Parents)
exports.listUsers = async (req, res) => {
    try {
        // Fetch all users from different tables in parallel
        const [students, teachers, parents] = await Promise.all([
            Student.findAll({
                attributes: ['id', 'name', 'auth_id', 'grade_level', 'createdAt', 'updatedAt'], // Exclude password
                order: [['name', 'ASC']]
            }),
            Teacher.findAll({
                attributes: ['id', 'name', 'auth_id', 'createdAt', 'updatedAt'], // Removed subject_taught, Exclude password
                order: [['name', 'ASC']]
            }),
            Parent.findAll({
                attributes: ['id', 'name', 'auth_id', 'createdAt', 'updatedAt'], // Removed phone_number, Exclude password
                order: [['name', 'ASC']]
            })
        ]);

        // Combine and format the results, adding a 'role' field
        const allUsers = [
            ...students.map(u => ({ ...u.toJSON(), role: 'student' })),
            ...teachers.map(u => ({ ...u.toJSON(), role: 'teacher' })),
            ...parents.map(u => ({ ...u.toJSON(), role: 'parent' }))
        ];

        // Sort combined list by name (optional)
        allUsers.sort((a, b) => a.name.localeCompare(b.name));

        res.json(allUsers);

    } catch (error) {
        console.error("Error listing users:", error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Create a new user (Student, Teacher, Parent, or Admin)
exports.createUser = async (req, res) => {
    const { role, name, email, password, ...otherData } = req.body; // email is used as auth_id

    // Basic validation
    if (!role || !name || !email || !password) {
        return res.status(400).json({ error: 'Role, name, email, and password are required.' });
    }

    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        // Check if user already exists with this email/auth_id across relevant tables
        let existingUser = await Student.findOne({ where: { auth_id: email } }) ||
                           await Teacher.findOne({ where: { auth_id: email } }) ||
                           await Parent.findOne({ where: { auth_id: email } }) ||
                           await Admin.findOne({ where: { auth_id: email } });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email (auth_id) already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        let newUser;
        const userData = {
            name,
            auth_id: email,
            password: hashedPassword,
            ...otherData // Include role-specific fields like grade_level, subject_taught etc.
        };

        // Create user based on role
        switch (role) {
            case 'student':
                newUser = await Student.create(userData);
                break;
            case 'teacher':
                // Ensure only relevant fields for teacher are passed if needed
                newUser = await Teacher.create(userData);
                break;
            case 'parent':
                 // Ensure only relevant fields for parent are passed if needed
                newUser = await Parent.create(userData);
                break;
            case 'admin':
                 // Ensure only relevant fields for admin are passed if needed
                newUser = await Admin.create(userData);
                break;
            default:
                // This case should not be reached due to validation above
                return res.status(400).json({ error: 'Invalid role specified.' });
        }

        // Don't send password back
        const createdUserData = newUser.toJSON();
        delete createdUserData.password;

        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`, user: createdUserData });

    } catch (error) {
        console.error(`Error creating ${role}:`, error);
        // Handle potential validation errors from Sequelize model definitions
        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: `Failed to create ${role}.` });
    }
};

// Update an existing user (Student, Teacher, Parent, or Admin)
exports.updateUser = async (req, res) => {
    const { role, id } = req.params; // Get role and id from URL parameters
    const userId = parseInt(id, 10);

    // Prevent updating sensitive fields directly via this admin endpoint
    const { password, auth_id, role: bodyRole, id: bodyId, createdAt, updatedAt, ...updateData } = req.body;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid User ID provided.' });
    }

    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified in URL. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        let model;
        switch (role) {
            case 'student': model = Student; break;
            case 'teacher': model = Teacher; break;
            case 'parent': model = Parent; break;
            case 'admin': model = Admin; break;
            default: return res.status(400).json({ error: 'Invalid role.' }); // Should be caught earlier
        }

        // Check if user exists
        const userExists = await model.findByPk(userId);
        if (!userExists) {
            return res.status(404).json({ error: `${role.charAt(0).toUpperCase() + role.slice(1)} not found.` });
        }

        // Perform the update
        const [affectedRows] = await model.update(updateData, {
            where: { id: userId }
        });

        if (affectedRows > 0) {
            const updatedUser = await model.findByPk(userId);
            // Exclude password before sending back
            const userData = updatedUser.toJSON();
            delete userData.password;
            res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} updated successfully`, user: userData });
        } else {
            // If user exists but no rows affected, likely no changes needed or data was same
             const currentUser = await model.findByPk(userId);
             const userData = currentUser.toJSON();
             delete userData.password;
            res.json({ message: 'No changes detected.', user: userData });
        }

    } catch (error) {
        console.error(`Error updating ${role} ID ${userId}:`, error);
         // Handle potential validation errors from Sequelize model definitions
        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: `Failed to update ${role}.` });
    }
};

// Delete a user (Student, Teacher, Parent, or Admin)
exports.deleteUser = async (req, res) => {
    const { role, id } = req.params; // Get role and id from URL parameters
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid User ID provided.' });
    }

    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified in URL. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        let model;
        switch (role) {
            case 'student': model = Student; break;
            case 'teacher': model = Teacher; break;
            case 'parent': model = Parent; break;
            case 'admin': model = Admin; break;
            default: return res.status(400).json({ error: 'Invalid role.' });
        }

        // Check if user exists
        const user = await model.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: `${role.charAt(0).toUpperCase() + role.slice(1)} not found.` });
        }

        // Handle related data differently based on role
        if (role === 'student') {
            // Using transaction to ensure atomicity
            const transaction = await db.sequelize.transaction();
            
            try {
                // Delete related records first
                await db.KnowledgeState.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                await db.Response.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                await db.LearningPath.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                await db.ClassroomStudent.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                await db.ParentStudent.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                await db.EngagementMetric.destroy({
                    where: { student_id: userId },
                    transaction
                });
                
                // Delete the student
                await Student.destroy({
                    where: { id: userId },
                    transaction
                });
                
                // Commit the transaction
                await transaction.commit();
                
            } catch (error) {
                // Rollback in case of error
                await transaction.rollback();
                throw error;
            }
        } else if (role === 'teacher') {
            // For teachers, we might want to handle their classrooms differently
            // For now, just delete the teacher
            await Teacher.destroy({
                where: { id: userId }
            });
        } else if (role === 'parent') {
            // Delete parent-student associations before deleting parent
            await db.ParentStudent.destroy({
                where: { parent_id: userId }
            });
            
            await Parent.destroy({
                where: { id: userId }
            });
        } else {
            // Admin - just delete directly
            await Admin.destroy({
                where: { id: userId }
            });
        }

        res.status(200).json({ 
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully.`,
            deletedId: userId
        });

    } catch (error) {
        console.error(`Error deleting ${role} ID ${userId}:`, error);
        // Handle foreign key constraint errors
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: `Cannot delete ${role} because it is referenced by other data. Please remove those references first.` 
            });
        }
        res.status(500).json({ error: `Failed to delete ${role}.` });
    }
};

// --- Knowledge Component Management (Admin Only) ---

// List all Knowledge Components (Admin view - potentially more details)
exports.listKnowledgeComponents = async (req, res) => {
    try {
        // Add filtering/pagination options later if needed (e.g., via query params)
        const knowledgeComponents = await KnowledgeComponent.findAll({
            order: [['name', 'ASC']] // Example ordering
        });
        res.json(knowledgeComponents);
    } catch (error) {
        console.error("Error listing knowledge components:", error);
        res.status(500).json({ error: 'Failed to fetch knowledge components' });
    }
};

// Create a new Knowledge Component
exports.createKnowledgeComponent = async (req, res) => {
    // Extract expected fields from request body
    // Prerequisites handling removed for now, as it requires M2M association management
    const { name, description, curriculum_code, grade_level } = req.body;

    // Basic validation (add more as needed)
    if (!name || grade_level === undefined || grade_level === null) {
        return res.status(400).json({ error: 'Name and grade_level are required for Knowledge Component.' });
    }

    try {
        const newKc = await KnowledgeComponent.create({
            name,
            description,
            curriculum_code,
            grade_level,
            status: 'approved', // Default to approved for admin creation
            suggestion_source: 'manual' // Default to manual for admin creation
            // prerequisites handling would be done separately via associations if re-added
        });
        res.status(201).json(newKc);
    } catch (error) {
        console.error("Error creating knowledge component:", error);
        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Failed to create knowledge component.' });
    }
};

// Update an existing Knowledge Component
exports.updateKnowledgeComponent = async (req, res) => {
    const { id } = req.params;
    const kcId = parseInt(id, 10);

    // Exclude fields that shouldn't be updated directly or are immutable
    // Also remove prerequisites from direct updateData, as it needs association handling
    const { id: bodyId, createdAt, updatedAt, prerequisites, ...updateData } = req.body;

    if (isNaN(kcId)) {
        return res.status(400).json({ error: 'Invalid Knowledge Component ID provided.' });
    }

    // Ensure required fields are not being unset if they are mandatory in the model
    if (updateData.name === '') {
        return res.status(400).json({ error: 'Knowledge Component name cannot be empty.' });
    }
     if (updateData.grade_level === undefined || updateData.grade_level === null) {
        // If grade_level is optional in model, this check might be removed or adjusted
        return res.status(400).json({ error: 'Knowledge Component grade_level cannot be empty.' });
    }

    try {
        const kc = await KnowledgeComponent.findByPk(kcId);
        if (!kc) {
            return res.status(404).json({ error: 'Knowledge Component not found.' });
        }

        const [affectedRows] = await KnowledgeComponent.update(updateData, {
            where: { id: kcId }
        });

        if (affectedRows > 0) {
            const updatedKc = await KnowledgeComponent.findByPk(kcId);
            res.json({ message: 'Knowledge Component updated successfully', knowledgeComponent: updatedKc });
        } else {
            res.json({ message: 'No changes detected.', knowledgeComponent: kc });
        }

    } catch (error) {
        console.error(`Error updating Knowledge Component ID ${kcId}:`, error);
        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Failed to update knowledge component.' });
    }
};

// Delete a Knowledge Component
exports.deleteKnowledgeComponent = async (req, res) => {
    const { id } = req.params;
    const kcId = parseInt(id, 10);

    if (isNaN(kcId)) {
        return res.status(400).json({ error: 'Invalid Knowledge Component ID provided.' });
    }

    try {
        const kc = await KnowledgeComponent.findByPk(kcId);
        if (!kc) {
            return res.status(404).json({ error: 'Knowledge Component not found.' });
        }

        // TODO: Consider implications of deleting a KC.
        // - What happens to associated ContentItems? (Set KC ID to null? Delete them? Prevent deletion if CIs exist?)
        // - What happens to associated KnowledgeStates?
        // Need to define deletion strategy (e.g., using Sequelize hooks or manual checks).
        // For now, performing a direct delete. Add checks/constraints as needed.

        await KnowledgeComponent.destroy({
            where: { id: kcId }
        });

        res.status(200).json({ message: 'Knowledge Component deleted successfully.' }); // Use 200 or 204

    } catch (error) {
        console.error(`Error deleting Knowledge Component ID ${kcId}:`, error);
        // Handle potential foreign key constraint errors if deletion is blocked
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ error: 'Cannot delete Knowledge Component because it is associated with other data (e.g., Content Items, Knowledge States).' });
        }
        res.status(500).json({ error: 'Failed to delete knowledge component.' });
    }
};

// Delete multiple Knowledge Components
exports.deleteMultipleKnowledgeComponents = async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty Knowledge Component IDs provided.' });
    }
    
    try {
        // Verify all KCs exist
        const kcs = await KnowledgeComponent.findAll({
            where: { id: ids }
        });
        
        if (kcs.length !== ids.length) {
            return res.status(404).json({ error: 'One or more Knowledge Components not found.' });
        }
        
        // Delete the KCs
        await KnowledgeComponent.destroy({
            where: { id: ids }
        });
        
        res.status(200).json({ 
            message: `${ids.length} Knowledge Components deleted successfully.`,
            deletedIds: ids
        });
        
    } catch (error) {
        console.error(`Error deleting multiple Knowledge Components:`, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: 'Cannot delete some Knowledge Components because they are associated with other data.' 
            });
        }
        res.status(500).json({ error: 'Failed to delete knowledge components.' });
    }
};

// Get a single Knowledge Component by ID
exports.getKnowledgeComponent = async (req, res) => {
    const { id } = req.params;
    const kcId = parseInt(id, 10);

    if (isNaN(kcId)) {
        return res.status(400).json({ error: 'Invalid Knowledge Component ID provided.' });
    }

    try {
        const kc = await db.KnowledgeComponent.findByPk(kcId, {
            include: [
                {
                    model: db.ContentItem,
                    attributes: ['id', 'type', 'content', 'difficulty', 'options']
                }
            ]
        });

        if (!kc) {
            return res.status(404).json({ error: 'Knowledge Component not found.' });
        }

        res.json(kc);
    } catch (error) {
        console.error(`Error fetching Knowledge Component ID ${kcId}:`, error);
        res.status(500).json({ error: 'Failed to fetch knowledge component.' });
    }
};

// CSV Template Download
exports.getCSVTemplate = async (req, res) => {
    try {
        // Create a CSV template file
        const tempDir = path.join(__dirname, '../uploads/csv/templates');
        
        // Ensure directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, 'user_import_template.csv');
        
        // Create the CSV writer with simplified headers
        const csvWriter = createObjectCsvWriter({
            path: tempFilePath,
            header: [
                { id: 'name', title: 'Name' },
                { id: 'grade_level', title: 'Grade Level' },
                { id: 'username', title: 'Username' },
                { id: 'password', title: 'Password' }
            ]
        });
        
        // Add sample data for students only (simplified format)
        const sampleData = [
            {
                name: 'Sample Student 1',
                grade_level: '3',
                username: 'student1',
                password: 'password123'
            },
            {
                name: 'Sample Student 2',
                grade_level: '4',
                username: 'student2',
                password: 'password123'
            },
            {
                name: 'Sample Student 3',
                grade_level: '3',
                username: 'student3',
                password: 'password123'
            }
        ];
        
        // Write the data to the CSV file
        await csvWriter.writeRecords(sampleData);
        
        // Send the file as a download
        res.download(tempFilePath, 'user_import_template.csv', (err) => {
            if (err) {
                console.error('Error sending template file:', err);
                // Don't try to send another response if headers have already been sent
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to generate template' });
                }
            }
        });
    } catch (error) {
        console.error('Error generating CSV template:', error);
        res.status(500).json({ error: 'Failed to generate template' });
    }
};

// CSV Users Upload
exports.uploadCSVUsers = async (req, res) => {
    try {
        let csvContent = null;
        let filePath = null;
        
        // Check if this is a file upload (multer) or JSON content
        if (req.file) {
            // File upload via multer
            filePath = req.file.path;
        } else if (req.body && req.body.csvContent) {
            // JSON content (for Netlify/Vercel)
            csvContent = req.body.csvContent;
        } else {
            return res.status(400).json({ error: 'No file uploaded or CSV content provided' });
        }
        
        const results = [];
        const errors = [];
        const successfulUsers = [];
        
        // Process CSV content
        const processCSV = async (content) => {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV file must contain header and at least one data row');
            }
            
            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const dataLines = lines.slice(1);
            
            // Validate required headers for the simplified format
            const requiredHeaders = ['name', 'grade_level', 'username', 'password'];
            const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
            
            if (missingHeaders.length > 0) {
                throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}. Expected: name, grade_level, username, password`);
            }
            
            // Process each data row
            for (let i = 0; i < dataLines.length; i++) {
                const values = dataLines[i].split(',').map(v => v.trim());
                const rowData = {};
                
                // Map values to headers
                header.forEach((h, index) => {
                    rowData[h] = values[index] || '';
                });
                
                const { name, grade_level, username, password } = rowData;
                
                try {
                    // Basic validation
                    if (!name || !grade_level || !username || !password) {
                        errors.push({
                            row: i + 2, // +2 because we start from index 0 and skip header
                            email: username,
                            error: 'Missing required field (name, grade_level, username, or password)'
                        });
                        continue;
                    }
                    
                    // Check if user already exists
                    const existingUser = await findUserByEmail(username);
                    if (existingUser) {
                        errors.push({
                            row: i + 2,
                            email: username,
                            error: 'User with this username already exists'
                        });
                        continue;
                    }
                    
                    // Hash password
                    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
                    
                    // Create student (simplified format only supports students)
                    const userData = {
                        name: name,
                        auth_id: username,
                        password: hashedPassword,
                        grade_level: grade_level
                    };
                    
                    const newUser = await Student.create(userData);
                    
                    // Create a learning path for the new student
                    await db.LearningPath.create({
                        student_id: newUser.id,
                        is_active: true,
                        current_position: 0
                    });
                    
                    // Add to successful users
                    const userInfo = newUser.toJSON();
                    delete userInfo.password;
                    successfulUsers.push({
                        ...userInfo,
                        role: 'student'
                    });
                    
                } catch (err) {
                    errors.push({
                        row: i + 2,
                        email: username || 'Unknown',
                        error: `Creation failed: ${err.message}`
                    });
                }
            }
        };
        
        if (csvContent) {
            // Process JSON content directly
            await processCSV(csvContent);
        } else if (filePath) {
            // Process file upload using csv-parser
            await new Promise((resolve, reject) => {
                const parser = fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', async (data) => {
                        results.push(data);
                    })
                    .on('end', async () => {
                        try {
                            // Convert parsed data back to CSV format for processing
                            const header = Object.keys(results[0] || {});
                            const csvLines = [header.join(',')];
                            
                            for (const row of results) {
                                const values = header.map(h => row[h] || '');
                                csvLines.push(values.join(','));
                            }
                            
                            await processCSV(csvLines.join('\n'));
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', reject);
            });
        }
        
        // Clean up the uploaded file if it exists
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        // Return the results
        res.status(200).json({
            success: true,
            message: `${successfulUsers.length} users created successfully. ${errors.length} users failed.`,
            created: successfulUsers,
            errors: errors
        });
            
    } catch (error) {
        console.error('Error processing CSV:', error);
        
        // Clean up the uploaded file if it exists
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        res.status(500).json({ error: error.message || 'Failed to process CSV file' });
    }
};

// Bulk delete users (Admin only)
exports.bulkDeleteUsers = async (req, res) => {
    const { users } = req.body; // Array of { id, role } objects
    
    if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ error: 'Users array is required and must not be empty.' });
    }
    
    const results = {
        successful: [],
        failed: []
    };
    
    try {
        // Process deletions in parallel for better performance
        const deletePromises = users.map(async (userInfo) => {
            const { id, role } = userInfo;
            const userId = parseInt(id, 10);
            
            if (isNaN(userId)) {
                return {
                    success: false,
                    id,
                    role,
                    error: 'Invalid User ID provided.'
                };
            }
            
            const validRoles = ['student', 'teacher', 'parent', 'admin'];
            if (!validRoles.includes(role)) {
                return {
                    success: false,
                    id: userId,
                    role,
                    error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`
                };
            }
            
            try {
                let model;
                switch (role) {
                    case 'student': model = Student; break;
                    case 'teacher': model = Teacher; break;
                    case 'parent': model = Parent; break;
                    case 'admin': model = Admin; break;
                }
                
                // Check if user exists
                const user = await model.findByPk(userId);
                if (!user) {
                    return {
                        success: false,
                        id: userId,
                        role,
                        error: `${role.charAt(0).toUpperCase() + role.slice(1)} not found.`
                    };
                }
                
                // Handle related data deletion based on role
                if (role === 'student') {
                    const transaction = await db.sequelize.transaction();
                    
                    try {
                        // Delete related records first
                        await db.KnowledgeState.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        await db.Response.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        await db.LearningPath.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        await db.ClassroomStudent.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        await db.ParentStudent.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        await db.EngagementMetric.destroy({
                            where: { student_id: userId },
                            transaction
                        });
                        
                        // Delete the student
                        await Student.destroy({
                            where: { id: userId },
                            transaction
                        });
                        
                        await transaction.commit();
                        
                    } catch (error) {
                        await transaction.rollback();
                        throw error;
                    }
                } else if (role === 'parent') {
                    // Delete parent-student associations before deleting parent
                    await db.ParentStudent.destroy({
                        where: { parent_id: userId }
                    });
                    
                    await Parent.destroy({
                        where: { id: userId }
                    });
                } else {
                    // Teacher or Admin - direct delete
                    await model.destroy({
                        where: { id: userId }
                    });
                }
                
                return {
                    success: true,
                    id: userId,
                    role,
                    name: user.name
                };
                
            } catch (error) {
                console.error(`Error deleting ${role} ID ${userId}:`, error);
                return {
                    success: false,
                    id: userId,
                    role,
                    error: error.message || `Failed to delete ${role}.`
                };
            }
        });
        
        const deleteResults = await Promise.all(deletePromises);
        
        // Categorize results
        deleteResults.forEach(result => {
            if (result.success) {
                results.successful.push(result);
            } else {
                results.failed.push(result);
            }
        });
        
        res.status(200).json({
            message: `Bulk delete completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
            results
        });
        
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ 
            error: 'Failed to complete bulk delete operation.',
            message: error.message 
        });
    }
};

// Helper function to find user by email across models
const findUserByEmail = async (email) => {
    let user = await Student.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'student' };

    user = await Teacher.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'teacher' };

    user = await Parent.findOne({ where: { auth_id: email } });
    if (user) return { user, role: 'parent' };

    user = await Admin.findOne({ where: { auth_id: email } }); 
    if (user) return { user, role: 'admin' };

    return null;
};

