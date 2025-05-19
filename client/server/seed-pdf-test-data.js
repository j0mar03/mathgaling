/**
 * Seed PDF Test Data
 * 
 * This script creates sample PDF upload records and associated knowledge components
 * and content items for testing the PDF content management and BKT algorithm.
 */

const { Sequelize } = require('sequelize');
const db = require('./models');
const path = require('path');
const fs = require('fs');

// Create the uploads directory if it doesn't exist
const createUploadsDir = () => {
  const uploadDir = path.join(__dirname, 'uploads/pdf');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory at ${uploadDir}`);
  }
};

// Create a sample PDF file
const createSamplePdf = () => {
  const examplesDir = path.join(__dirname, 'examples');
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
  }
  
  const samplePdfPath = path.join(examplesDir, 'sample.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    // Write a minimal PDF-like file
    fs.writeFileSync(samplePdfPath, '%PDF-1.5\nSample PDF for testing\n%%EOF');
    console.log(`Created sample PDF at ${samplePdfPath}`);
  }
  
  return samplePdfPath;
};

// Create a test PDF upload record
const createPdfUpload = async (teacherId, samplePdfPath) => {
  try {
    // Copy sample PDF to uploads directory
    const timestamp = Date.now();
    const filename = `${timestamp}-sample.pdf`;
    const uploadPath = path.join(__dirname, 'uploads/pdf', filename);
    fs.copyFileSync(samplePdfPath, uploadPath);
    
    // Create upload record
    const upload = await db.PdfUpload.create({
      filename: 'Mathematics Curriculum.pdf',
      filepath: uploadPath,
      teacher_id: teacherId,
      page_count: 12,
      status: 'processed',
      metadata: {
        extracted_kcs: 4,
        extracted_content_items: 10
      },
      processed_at: new Date()
    });
    
    console.log(`Created PDF upload record with ID: ${upload.id}`);
    return upload;
  } catch (error) {
    console.error('Error creating PDF upload:', error);
    throw error;
  }
};

// Create knowledge components related to the PDF
const createKnowledgeComponents = async (uploadId) => {
  try {
    const kcs = [
      {
        name: 'Addition and Subtraction',
        description: 'The process of adding or subtracting numbers is fundamental to mathematics.',
        curriculum_code: 'MATH-3-1',
        grade_level: 3,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          extraction_confidence: 0.92,
          bktParams: {
            pL0: 0.3,  // Initial mastery probability
            pT: 0.09,  // Probability of transitioning from unmastered to mastered
            pS: 0.1,   // Probability of slip (incorrect despite mastery)
            pG: 0.2    // Probability of guess (correct despite no mastery)
          }
        }
      },
      {
        name: 'Multiplication',
        description: 'Multiplication is repeated addition. For example, 5 × 3 means adding 5 three times: 5 + 5 + 5 = 15.',
        curriculum_code: 'MATH-3-2',
        grade_level: 3,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          extraction_confidence: 0.88,
          bktParams: {
            pL0: 0.25,
            pT: 0.08,
            pS: 0.12,
            pG: 0.18
          }
        }
      },
      {
        name: 'Division',
        description: 'Division is the process of splitting a number into equal parts.',
        curriculum_code: 'MATH-3-3',
        grade_level: 3,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          extraction_confidence: 0.85,
          bktParams: {
            pL0: 0.2,
            pT: 0.07,
            pS: 0.15,
            pG: 0.15
          }
        }
      },
      {
        name: 'Word Problems',
        description: 'Applying arithmetic operations to solve real-world scenarios described in text.',
        curriculum_code: 'MATH-3-4',
        grade_level: 3,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          extraction_confidence: 0.78,
          bktParams: {
            pL0: 0.18,
            pT: 0.06,
            pS: 0.2,
            pG: 0.12
          }
        }
      }
    ];
    
    const createdKCs = [];
    for (const kc of kcs) {
      const createdKC = await db.KnowledgeComponent.create(kc);
      createdKCs.push(createdKC);
    }
    
    console.log(`Created ${createdKCs.length} knowledge components`);
    return createdKCs;
  } catch (error) {
    console.error('Error creating knowledge components:', error);
    throw error;
  }
};

// Create content items related to the knowledge components
const createContentItems = async (teacherId, kcs, uploadId) => {
  try {
    const contentItems = [
      // Addition and Subtraction items
      {
        type: 'question',
        content: 'What is 35 + 17?',
        difficulty: 2,
        knowledge_component_id: kcs[0].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '52'
        }
      },
      {
        type: 'question',
        content: 'If you have 15 apples and give away 7, how many do you have left?',
        difficulty: 2,
        knowledge_component_id: kcs[0].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '8'
        }
      },
      {
        type: 'example',
        content: 'Addition example: 28 + 14 = 42',
        difficulty: 1,
        knowledge_component_id: kcs[0].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true
        }
      },
      
      // Multiplication items
      {
        type: 'question',
        content: 'Calculate 8 × 6.',
        difficulty: 3,
        knowledge_component_id: kcs[1].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '48'
        }
      },
      {
        type: 'example',
        content: 'Multiplication example: 7 × 4 = 28',
        difficulty: 2,
        knowledge_component_id: kcs[1].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true
        }
      },
      
      // Division items
      {
        type: 'question',
        content: 'If 24 cookies are shared equally among 8 children, how many cookies does each child get?',
        difficulty: 3,
        knowledge_component_id: kcs[2].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '3'
        }
      },
      {
        type: 'example',
        content: 'Division example: 63 ÷ 9 = 7',
        difficulty: 2,
        knowledge_component_id: kcs[2].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true
        }
      },
      
      // Word Problems items
      {
        type: 'question',
        content: 'Mary has 5 bags with 7 marbles in each bag. How many marbles does she have in total?',
        difficulty: 4,
        knowledge_component_id: kcs[3].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '35'
        }
      },
      {
        type: 'question',
        content: 'John bought 3 notebooks for $4 each and a pencil case for $5. How much did he spend in total?',
        difficulty: 4,
        knowledge_component_id: kcs[3].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true,
          answer: '$17'
        }
      },
      {
        type: 'explanation',
        content: 'To solve a word problem, first identify what operation is needed (addition, subtraction, multiplication, or division), then set up and solve the equation.',
        difficulty: 3,
        knowledge_component_id: kcs[3].id,
        teacher_id: teacherId,
        metadata: {
          source: 'pdf',
          pdf_id: uploadId,
          automatic: true
        }
      }
    ];
    
    const createdItems = [];
    for (const item of contentItems) {
      const createdItem = await db.ContentItem.create(item);
      createdItems.push(createdItem);
    }
    
    console.log(`Created ${createdItems.length} content items`);
    return createdItems;
  } catch (error) {
    console.error('Error creating content items:', error);
    throw error;
  }
};

// Create knowledge states for students
const createKnowledgeStates = async (studentIds, kcs) => {
  try {
    const states = [];
    
    for (const studentId of studentIds) {
      for (const kc of kcs) {
        // Randomize mastery levels for testing
        const mastery = Math.random() * 0.7 + 0.1; // Between 0.1 and 0.8
        
        const state = await db.KnowledgeState.create({
          student_id: studentId,
          knowledge_component_id: kc.id,
          p_mastery: mastery,
          last_update: new Date()
        });
        
        states.push(state);
      }
    }
    
    console.log(`Created ${states.length} knowledge states`);
    return states;
  } catch (error) {
    console.error('Error creating knowledge states:', error);
    throw error;
  }
};

// Main function to seed all test data
const seedPdfTestData = async () => {
  try {
    console.log('Starting PDF test data seeding...');
    
    // Create necessary directories
    createUploadsDir();
    const samplePdfPath = createSamplePdf();
    
    // Get first teacher from database (assuming teacher seeder has been run)
    const teacher = await db.Teacher.findOne();
    if (!teacher) {
      throw new Error('No teachers found in database. Please run teacher seeder first.');
    }
    
    // Get a sample of students (assuming student seeder has been run)
    const students = await db.Student.findAll({ limit: 5 });
    if (students.length === 0) {
      throw new Error('No students found in database. Please run student seeder first.');
    }
    const studentIds = students.map(student => student.id);
    
    // Create sample PDF data
    const upload = await createPdfUpload(teacher.id, samplePdfPath);
    const kcs = await createKnowledgeComponents(upload.id);
    const contentItems = await createContentItems(teacher.id, kcs, upload.id);
    const knowledgeStates = await createKnowledgeStates(studentIds, kcs);
    
    console.log('PDF test data seeding completed successfully!');
    
    // Summary of created data
    console.log('\nSummary:');
    console.log(`- 1 PDF upload record (ID: ${upload.id})`);
    console.log(`- ${kcs.length} knowledge components`);
    console.log(`- ${contentItems.length} content items`);
    console.log(`- ${knowledgeStates.length} knowledge states for ${studentIds.length} students`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding PDF test data:', error);
    process.exit(1);
  }
};

// Run the seeder
seedPdfTestData();
