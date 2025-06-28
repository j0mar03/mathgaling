// Unified API handler for all routes
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🌐 API called:', event.httpMethod, event.path);
  console.log('🔍 Raw URL:', event.rawUrl);
  console.log('📊 Headers:', event.headers);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Get the actual path from the request
  let path = event.path;
  const { httpMethod, body } = event;
  
  // In Netlify, the path might be /.netlify/functions/api
  // We need to extract the actual API path from the rawUrl or headers
  if (event.headers && event.headers['x-original-path']) {
    path = event.headers['x-original-path'];
  } else if (event.rawUrl) {
    // Extract path from rawUrl
    const url = new URL(event.rawUrl);
    path = url.pathname;
  }
  
  // Log the request for debugging
  console.log('Netlify Function Request:', {
    path: path,
    originalPath: event.path,
    httpMethod: event.httpMethod,
    rawUrl: event.rawUrl,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters
  });
  
  // Debug endpoint to check KC content
  if (path.includes('/debug/kc') || (event.rawUrl && event.rawUrl.includes('/debug/kc'))) {
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    const kcId = queryParams.get('kc_id');
    
    const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: kcData } = await supabase
      .from('knowledge_components')
      .select('*')
      .eq('id', kcId)
      .single();
      
    const { data: allContent } = await supabase
      .from('content_items')
      .select('*')
      .eq('knowledge_component_id', kcId);
      
    const { data: quizContent } = await supabase
      .from('content_items')
      .select('*')
      .eq('knowledge_component_id', kcId)
      .eq('type', 'multiple_choice');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        kcId,
        kcData,
        totalContent: allContent?.length || 0,
        quizContent: quizContent?.length || 0,
        allContentTypes: allContent?.map(c => c.type) || [],
        sampleContent: allContent?.slice(0, 3) || []
      })
    };
  }
  
  // Early catch for students/kcs/sequence endpoint
  if (path.includes('students/kcs/sequence') || (event.rawUrl && event.rawUrl.includes('students/kcs/sequence'))) {
    console.log('[EARLY DEBUG] Caught sequence endpoint request');
    console.log('[EARLY DEBUG] Path:', path);
    console.log('[EARLY DEBUG] RawUrl:', event.rawUrl);
    
    // Handle the sequence endpoint immediately
    try {
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const kcId = queryParams.get('kc_id');
      const limit = parseInt(queryParams.get('limit')) || 8;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let query = supabase
        .from('content_items')
        .select(`
          id,
          content,
          type,
          knowledge_component_id,
          difficulty,
          metadata,
          options,
          correct_answer,
          explanation,
          knowledge_components (
            id,
            name,
            curriculum_code
          )
        `)
        .eq('type', 'multiple_choice');
        
      if (kcId) {
        query = query.eq('knowledge_component_id', kcId);
      }
      
      const { data: questions, error } = await query;
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch quiz sequence',
            message: error.message
          })
        };
      }
      
      if (!questions || questions.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: `No quiz questions found${kcId ? ` for knowledge component ${kcId}` : ''}`
          })
        };
      }
      
      // Format the response to match what the frontend expects
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        content: q.content,
        type: q.type,
        kcId: q.knowledge_component_id,
        difficulty: q.difficulty,
        metadata: q.metadata,
        curriculumCode: q.knowledge_components?.curriculum_code || null
      }));
      
      // Shuffle questions for variety
      const shuffled = formattedQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, limit);
      
      console.log('[EARLY DEBUG] Found', formattedQuestions.length, 'total questions');
      console.log('[EARLY DEBUG] Question IDs being returned:', selectedQuestions.map(q => q.id));
      console.log('[EARLY DEBUG] First question preview:', selectedQuestions[0] ? { id: selectedQuestions[0].id, content: selectedQuestions[0].content?.substring(0, 50) } : 'None');
      console.log('[EARLY DEBUG] Returning', selectedQuestions.length, 'selected questions');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(selectedQuestions)
      };
      
    } catch (error) {
      console.error('[EARLY DEBUG] Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/images - List available images (debug endpoint)
  if (path === '/api/images' && httpMethod === 'GET') {
    try {
      const fs = require('fs');
      const pathModule = require('path');
      
      const possibleDirs = [
        pathModule.join(process.cwd(), 'client', 'server', 'uploads', 'images'),
        pathModule.join(process.cwd(), 'uploads', 'images'),
        pathModule.join(__dirname, '..', '..', 'client', 'server', 'uploads', 'images'),
        pathModule.join('/opt/build/repo/client/server/uploads/images'),
        pathModule.join(process.cwd(), 'client', 'build', 'uploads', 'images'), // New build location
        pathModule.join('/opt/build/repo/client/build/uploads/images'), // Netlify build location
      ];
      
      let foundImages = [];
      let checkedPaths = [];
      
      for (const dir of possibleDirs) {
        checkedPaths.push({
          path: dir,
          exists: fs.existsSync(dir),
          isDirectory: fs.existsSync(dir) ? fs.statSync(dir).isDirectory() : false
        });
        
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
          const files = fs.readdirSync(dir);
          foundImages = files.filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));
          break;
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          checkedPaths,
          foundImages,
          totalImages: foundImages.length,
          sampleImages: foundImages.slice(0, 5)
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to list images',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/images/:filename - Serve uploaded images
  if (path.includes('/images/') && httpMethod === 'GET') {
    try {
      const filename = path.split('/images/')[1];
      const fs = require('fs');
      const pathModule = require('path');
      
      console.log('[DEBUG] Image request for filename:', filename);
      console.log('[DEBUG] Current working directory:', process.cwd());
      console.log('[DEBUG] Path being accessed:', path);
      
      // Try multiple possible image locations
      const possiblePaths = [
        pathModule.join(process.cwd(), 'client', 'server', 'uploads', 'images', filename),
        pathModule.join(process.cwd(), 'uploads', 'images', filename),
        pathModule.join(__dirname, '..', '..', 'client', 'server', 'uploads', 'images', filename),
        pathModule.join('/opt/build/repo/client/server/uploads/images', filename), // Netlify build path
        pathModule.join(process.cwd(), 'client', 'build', 'uploads', 'images', filename), // New build location
        pathModule.join('/opt/build/repo/client/build/uploads/images', filename), // Netlify build location
      ];
      
      console.log('[DEBUG] Checking possible image paths:', possiblePaths);
      
      let imagePath = null;
      let imageExists = false;
      
      for (const testPath of possiblePaths) {
        console.log('[DEBUG] Testing path:', testPath);
        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          imageExists = true;
          console.log('[DEBUG] Found image at:', testPath);
          break;
        }
      }
      
      // Check if file exists
      if (!imageExists) {
        console.log('[DEBUG] Image not found in any location');
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Image not found',
            filename: filename,
            searchedPaths: possiblePaths
          })
        };
      }
      
      // Read and serve the image
      const imageBuffer = fs.readFileSync(imagePath);
      const ext = pathModule.extname(filename).toLowerCase();
      
      let contentType = 'image/jpeg'; // default
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      if (ext === '.gif') contentType = 'image/gif';
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
        },
        body: imageBuffer.toString('base64'),
        isBase64Encoded: true
      };
      
    } catch (error) {
      console.error('Image serving error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to serve image',
          message: error.message
        })
      };
    }
  }
  
  // Test image endpoint - /api/test-image
  if (path.includes('/test-image')) {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html'
      },
      body: `
        <html>
          <body>
            <h3>Image Test</h3>
            <p>Testing if images are accessible:</p>
            <img src="/api/images/question-image-1746159641748-595628045.png" alt="Test Image 1" style="max-width: 200px;" onerror="this.style.display='none'; this.nextSibling.style.display='block';">
            <div style="display:none; color:red;">Image 1 failed to load</div>
            <br><br>
            <img src="/api/images/question-image-1746160685228-410158988.png" alt="Test Image 2" style="max-width: 200px;" onerror="this.style.display='none'; this.nextSibling.style.display='block';">
            <div style="display:none; color:red;">Image 2 failed to load</div>
            <br><br>
            <a href="/api/images">List all images</a>
          </body>
        </html>
      `
    };
  }
  
  // Hello endpoint - /api/hello
  if (path.includes('/hello') || path === '/api' || path === '/api/') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Hello from Netlify Functions!',
        method: httpMethod,
        path: path,
        timestamp: new Date().toISOString()
      })
    };
  }
  
  // Test endpoint to check Supabase connection - /api/test-supabase
  if (path.includes('/test-supabase')) {
    try {
      // Netlify + Supabase conventions
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test database connection
      const { data, error, count } = await supabase
        .from('students')
        .select('id, name, email', { count: 'exact' })
        .limit(3);
        
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Supabase connection test',
          config: {
            url: supabaseUrl,
            keyPrefix: supabaseKey.substring(0, 20) + '...',
            envUrl: process.env.DATABASE_URL ? 'from DATABASE_URL' : process.env.SUPABASE_URL ? 'from SUPABASE_URL' : 'from fallback',
            envKey: process.env.SUPABASE_SERVICE_API_KEY ? 'from SUPABASE_SERVICE_API_KEY' : process.env.SUPABASE_ANON_KEY ? 'from SUPABASE_ANON_KEY' : process.env.SUPABASE_KEY ? 'from SUPABASE_KEY' : 'from fallback',
            envVars: {
              DATABASE_URL: !!process.env.DATABASE_URL,
              SUPABASE_URL: !!process.env.SUPABASE_URL,
              SUPABASE_SERVICE_API_KEY: !!process.env.SUPABASE_SERVICE_API_KEY,
              SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
              SUPABASE_KEY: !!process.env.SUPABASE_KEY
            }
          },
          database: {
            error: error?.message || null,
            studentsCount: count,
            sampleStudents: data || []
          },
          timestamp: new Date().toISOString()
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Supabase test failed',
          message: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }
  
  // Auth signup/register endpoint - /api/auth/register/{role}
  if (path.includes('/auth/register') && httpMethod === 'POST') {
    try {
      const userData = JSON.parse(event.body);
      console.log('Signup attempt for:', userData.email || userData.username);
      
      // Initialize Supabase client
      // Netlify + Supabase conventions
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // For students with username, create a standardized email
      let signupEmail = userData.email;
      if (userData.username && !userData.email) {
        signupEmail = `${userData.username}@student.mathtagumpay.com`;
      }
      
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: userData.password
      });
      
      if (authError) {
        console.error('Supabase signup error:', authError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Signup failed',
            message: authError.message
          })
        };
      }
      
      // Determine role from path
      let role = 'student';
      if (path.includes('/register/admin')) role = 'admin';
      else if (path.includes('/register/teacher')) role = 'teacher';
      else if (path.includes('/register/parent')) role = 'parent';
      else if (path.includes('/register/student')) role = 'student';
      
      // Create database record based on role
      try {
        let dbResult;
        let tableName = role === 'admin' ? 'Admins' : `${role}s`;
        
        // Check if user already exists in the role table
        const { data: existingUser } = await supabase
          .from(tableName)
          .select('*')
          .eq('auth_id', signupEmail)
          .single();
          
        if (existingUser) {
          console.log('User already exists in database during signup:', existingUser);
          dbResult = { [role]: existingUser };
        } else {
          // Create new user record
          if (role === 'admin') {
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('Admins')
              .insert({
                auth_id: signupEmail,
                name: userData.name || 'New Admin',
                created_at: now,
                updated_at: now
              })
              .select()
              .single();
            
            if (error) throw error;
            dbResult = { admin: data };
          } else if (role === 'teacher') {
            const { data, error } = await supabase
              .from('teachers')
              .insert({
                auth_id: signupEmail,
                name: userData.name || 'New Teacher',
                subject: userData.subject || 'Mathematics'
              })
              .select()
              .single();
            
            if (error) throw error;
            dbResult = { teacher: data };
          } else if (role === 'student') {
            const { data, error } = await supabase
              .from('students')
              .insert({
                auth_id: signupEmail,
                name: userData.name || 'New Student',
                username: userData.username || null,
                password: userData.password || 'temp123',
                grade_level: parseInt(userData.grade_level) || 3
              })
              .select()
              .single();
            
            if (error) throw error;
            dbResult = { student: data };
          } else if (role === 'parent') {
            const { data, error } = await supabase
              .from('parents')
              .insert({
                auth_id: signupEmail,
                name: userData.name || 'New Parent'
              })
              .select()
              .single();
            
            if (error) throw error;
            dbResult = { parent: data };
          }
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Account created successfully',
            user: authData.user,
            ...dbResult
          })
        };
        
      } catch (dbError) {
        console.error('Database insert error:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database error',
            message: 'User created but database record failed: ' + dbError.message
          })
        };
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // Auth login endpoint - /api/auth/login
  if (path.includes('/auth/login') && httpMethod === 'POST') {
    try {
      const { email, password, username } = JSON.parse(event.body);
      console.log('🔐 Login attempt for:', email || username);
      
      // Initialize Supabase client with debugging
      // Netlify + Supabase conventions
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      console.log('🔧 Supabase config:', {
        url: supabaseUrl,
        keyPrefix: supabaseKey.substring(0, 20) + '...',
        envUrl: process.env.SUPABASE_URL ? 'from env' : 'from fallback',
        envKey: process.env.SUPABASE_KEY ? 'from env' : 'from fallback'
      });
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First, let's check if there are any users in Supabase Auth
      console.log('🔍 Checking Supabase connection...');
      
      // If username is provided (student login), convert to email format
      let loginEmail = email;
      if (username && !email) {
        // For students, create a standardized email from username
        loginEmail = `${username}@student.mathtagumpay.com`;
        console.log('🎓 Student login with username:', username, '-> email:', loginEmail);
      }
      
      // Try Supabase authentication first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password
        });
        
        if (error) {
          console.warn('Supabase auth failed:', error.message);
          console.warn('Error details:', error);
          console.log('🔄 Will continue to database authentication fallback');
          // Continue to test accounts
        } else if (data && data.user) {
          console.log('✅ Supabase login successful');
          
          let role = 'student';
          let userId = data.user.id;
          
          // Get user role from database
          try {
            console.log('🔍 Looking for user with email:', loginEmail);
            
            // Check admin
            const { data: adminData, error: adminError } = await supabase
              .from('Admins')
              .select('id, auth_id')
              .eq('auth_id', loginEmail)
              .limit(1);
              
            console.log('🔍 Admin query result:', { adminData, adminError });
              
            if (adminData && adminData.length > 0) {
              console.log('✅ Found admin user:', adminData[0]);
              role = 'admin';
              userId = adminData[0].id;
            } else {
              // Check teacher
              const { data: teacherData } = await supabase
                .from('teachers')
                .select('id, auth_id')
                .eq('auth_id', loginEmail)
                .limit(1);
                
              if (teacherData && teacherData.length > 0) {
                role = 'teacher';
                userId = teacherData[0].id;
              } else {
                // Check student
                const { data: studentData } = await supabase
                  .from('students')
                  .select('id, auth_id, username')
                  .eq('auth_id', loginEmail)
                  .limit(1);
                  
                if (studentData && studentData.length > 0) {
                  role = 'student';
                  userId = studentData[0].id;
                } else {
                  // Check parent
                  const { data: parentData } = await supabase
                    .from('parents')
                    .select('id, auth_id')
                    .eq('auth_id', loginEmail)
                    .limit(1);
                    
                  if (parentData && parentData.length > 0) {
                    role = 'parent';
                    userId = parentData[0].id;
                  }
                }
              }
            }
          } catch (profileError) {
            console.warn('Error fetching user profile:', profileError.message);
          }
          
          // Create a simple JWT-like token with user data
          const tokenPayload = {
            id: userId,
            auth_id: loginEmail,
            role: role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
          };
          
          // Simple base64 encoding (for development - in production use proper JWT signing)
          const token = `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`;
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: token,
              user: { id: userId, auth_id: loginEmail },
              role
            })
          };
        }
      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError);
      }
      
      // If Supabase auth failed, try to authenticate directly against database
      // This handles cases where users might exist in DB but not in Supabase Auth
      console.log('🔍 Attempting direct database authentication for:', loginEmail);
      console.log('🔍 Original username:', username);
      console.log('🔍 Original email:', email);
      
      // Check each user type table for the user
      let authenticatedUser = null;
      let userRole = null;
      
      // Check admin table
      const { data: adminData } = await supabase
        .from('Admins')
        .select('id, name, auth_id')
        .eq('auth_id', loginEmail)
        .limit(1);
        
      if (adminData && adminData.length > 0) {
        authenticatedUser = adminData[0];
        userRole = 'admin';
      } else {
        // Check teacher table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id, name, auth_id, subject')
          .eq('auth_id', loginEmail)
          .limit(1);
          
        if (teacherData && teacherData.length > 0) {
          authenticatedUser = teacherData[0];
          userRole = 'teacher';
        } else {
          // Check student table - use standard auth_id format
          console.log('🎓 Searching for student by auth_id:', loginEmail);
          let { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, name, auth_id, grade_level, username')
            .eq('auth_id', loginEmail)
            .limit(1);
          
          console.log('🎓 Student search result:', { studentData, studentError });
          
          // If not found by standard auth_id but we have a username, try finding and fixing broken records
          if ((!studentData || studentData.length === 0) && username) {
            console.log('🎓 Student not found with standard format, checking for broken records...');
            
            // Look for student with plain username as auth_id (broken record)
            const { data: brokenStudent, error: brokenError } = await supabase
              .from('students')
              .select('id, name, auth_id, grade_level, username')
              .eq('auth_id', username)
              .limit(1);
            
            if (brokenStudent && brokenStudent.length > 0) {
              console.log('🔧 Found broken student record, fixing auth_id format...');
              
              // Fix the broken auth_id format in database
              const { error: updateError } = await supabase
                .from('students')
                .update({ auth_id: loginEmail })
                .eq('id', brokenStudent[0].id);
              
              if (updateError) {
                console.error('❌ Failed to fix student auth_id:', updateError);
              } else {
                console.log('✅ Fixed student auth_id format');
                // Now use the fixed record
                studentData = [{
                  ...brokenStudent[0],
                  auth_id: loginEmail
                }];
              }
            }
          }
            
          if (studentData && studentData.length > 0) {
            authenticatedUser = studentData[0];
            userRole = 'student';
          } else {
            // Check parent table
            const { data: parentData } = await supabase
              .from('parents')
              .select('id, name, auth_id')
              .eq('auth_id', loginEmail)
              .limit(1);
              
            if (parentData && parentData.length > 0) {
              authenticatedUser = parentData[0];
              userRole = 'parent';
              
              // Check if parent has any linked children
              const { data: parentChildren } = await supabase
                .from('parent_students')
                .select('student_id')
                .eq('parent_id', parentData[0].id);
              
              authenticatedUser.hasChildren = parentChildren && parentChildren.length > 0;
              authenticatedUser.childrenCount = parentChildren ? parentChildren.length : 0;
            }
          }
        }
      }
      
      // If user found in database, verify password and create a token
      if (authenticatedUser && userRole) {
        console.log('✅ User found in database:', userRole);
        
        // Verify password against database for CSV-uploaded users
        try {
          const bcrypt = require('bcryptjs');
          
          // Get the stored password hash from the database
          let storedPasswordHash = null;
          
          if (userRole === 'student') {
            const { data: studentWithPassword } = await supabase
              .from('students')
              .select('password')
              .eq('id', authenticatedUser.id)
              .single();
            storedPasswordHash = studentWithPassword?.password;
          } else if (userRole === 'teacher') {
            const { data: teacherWithPassword } = await supabase
              .from('teachers')
              .select('password')
              .eq('id', authenticatedUser.id)
              .single();
            storedPasswordHash = teacherWithPassword?.password;
          } else if (userRole === 'admin') {
            const { data: adminWithPassword } = await supabase
              .from('Admins')
              .select('password')
              .eq('id', authenticatedUser.id)
              .single();
            storedPasswordHash = adminWithPassword?.password;
          }
          
          // Verify password if hash exists
          if (storedPasswordHash) {
            const isPasswordValid = await bcrypt.compare(password, storedPasswordHash);
            if (!isPasswordValid) {
              console.log('❌ Password verification failed for database user');
              return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                  error: 'Invalid login credentials',
                  message: 'Incorrect password'
                })
              };
            }
            console.log('✅ Password verified for database user');
          } else {
            console.log('⚠️ No password hash found for user, allowing login');
          }
        } catch (passwordError) {
          console.error('Error verifying password:', passwordError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Authentication error',
              message: 'Failed to verify password'
            })
          };
        }
        
        // Create a simple JWT-like token with user data
        const tokenPayload = {
          id: authenticatedUser.id,
          auth_id: authenticatedUser.auth_id || loginEmail,
          role: userRole,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        };
        
        // Simple base64 encoding (for development - in production use proper JWT signing)
        const token = `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: token,
            user: { 
              id: authenticatedUser.id, 
              auth_id: authenticatedUser.auth_id || loginEmail,
              username: authenticatedUser.username,
              hasChildren: authenticatedUser.hasChildren || null,
              childrenCount: authenticatedUser.childrenCount || 0
            },
            role: userRole
          })
        };
      }
      
      // Fallback to test accounts only in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using test account fallback (development mode)');
        
        if (email === 'admin@example.com' && password === 'admin123') {
          const tokenPayload = {
            id: 999,
            auth_id: email,
            role: 'admin',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          };
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`,
              user: { id: 999, auth_id: email },
              role: 'admin'
            })
          };
        }
        
        if (email === 'teacher@example.com' && password === 'teacher123') {
          const tokenPayload = {
            id: 888,
            auth_id: email,
            role: 'teacher',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          };
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`,
              user: { id: 888, auth_id: email },
              role: 'teacher'
            })
          };
        }
        
        if ((email === 'student@example.com' || username === 'student123') && password === 'student123') {
          const tokenPayload = {
            id: 777,
            auth_id: email,
            role: 'student',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          };
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`,
              user: { id: 777, auth_id: email },
              role: 'student'
            })
          };
        }
        
        if (email === 'parent@example.com' && password === 'parent123') {
          const tokenPayload = {
            id: 666,
            auth_id: email,
            role: 'parent',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          };
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: `netlify.${btoa(JSON.stringify(tokenPayload))}.signature`,
              user: { id: 666, auth_id: email },
              role: 'parent'
            })
          };
        }
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Invalid credentials',
          message: 'Please check your email and password'
        })
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // Admin endpoints - /api/admin/*
  
  // POST /api/admin/users - Create new user (but not csv-upload or bulk-delete)
  if (path.includes('/admin/users') && !path.includes('csv-upload') && !path.includes('csv-template') && !path.includes('bulk-delete') && httpMethod === 'POST') {
    try {
      const userData = JSON.parse(event.body);
      console.log('Admin creating user:', userData.email, userData.role);
      console.log('Full userData:', userData);
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid email format',
            message: 'Please provide a valid email address'
          })
        };
      }
      
      // Check for test domains that might be blocked
      if (userData.email.includes('@example.com')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid email domain',
            message: 'Please use a real email domain (not example.com)'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create Supabase Auth user (required for login to work)
      const role = userData.role || 'student';
      let tableName = role === 'admin' ? 'Admins' : `${role}s`;
      
      console.log('Creating Supabase Auth user...');
      
      // Try creating Supabase Auth user with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });
      
      console.log('Supabase auth result:', { authData, authError });
      
      if (authError) {
        console.error('Auth creation failed:', authError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Auth creation failed',
            message: authError.message,
            details: 'Check Supabase Auth settings - email confirmation might be required'
          })
        };
      }
      
      // Create database record
      // Make sure grade_level is a number, not a string
      const dbRecord = {
        auth_id: userData.email,
        name: userData.name,
        password: userData.password || 'temp123', // Add password field
        ...(role === 'student' && { 
          grade_level: parseInt(userData.grade_level) || 3,
          username: userData.username || null  // Add username field for students
        }),
        ...(role === 'teacher' && { subject: userData.subject_taught || userData.subject || 'Mathematics' })
      };
      
      console.log('Creating DB record:', { tableName, dbRecord });
      
      // First check if user already exists with this auth_id
      const { data: existingUser } = await supabase
        .from(tableName)
        .select('*')
        .eq('auth_id', userData.email)
        .single();
        
      if (existingUser) {
        console.log('User already exists in database:', existingUser);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'User already exists',
            user: { ...existingUser, role }
          })
        };
      }
      
      // Try to insert without ID first (let Supabase handle auto-increment)
      let { data: insertData, error: dbError } = await supabase
        .from(tableName)
        .insert([dbRecord])
        .select();
      
      // If we get a duplicate key error, try with a calculated ID
      if (dbError && dbError.code === '23505') {
        console.log('Auto-increment failed, calculating next ID manually');
        
        // Get the max ID
        const { data: maxIdData } = await supabase
          .from(tableName)
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        
        const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
        console.log('Using calculated ID:', nextId);
        
        // Retry with explicit ID
        const recordWithId = { ...dbRecord, id: nextId };
        const retryResult = await supabase
          .from(tableName)
          .insert([recordWithId])
          .select();
          
        insertData = retryResult.data;
        dbError = retryResult.error;
      }
        
      const dbData = insertData && insertData.length > 0 ? insertData[0] : null;
      
      if (dbError) {
        console.error('DB insert error:', dbError);
        console.error('Failed DB record:', dbRecord);
        console.error('Table name:', tableName);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database error',
            message: dbError.message,
            details: dbError
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'User created successfully',
          user: { ...dbData, role }
        })
      };
      
    } catch (error) {
      console.error('Create user error:', error);
      console.error('Error stack:', error.stack);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message,
          stack: error.stack
        })
      };
    }
  }
  
  // GET /api/admin/users - List all users
  if (path.includes('/admin/users') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all users from all tables
      const [adminsRes, teachersRes, studentsRes, parentsRes] = await Promise.all([
        supabase.from('Admins').select('id, name, auth_id').limit(50),
        supabase.from('teachers').select('id, name, auth_id, subject').limit(50),
        supabase.from('students').select('id, name, auth_id, grade_level').limit(50),
        supabase.from('parents').select('id, name, auth_id').limit(50)
      ]);
      
      // Combine and format users
      const allUsers = [
        ...(adminsRes.data || []).map(u => ({ ...u, role: 'admin' })),
        ...(teachersRes.data || []).map(u => ({ ...u, role: 'teacher' })),
        ...(studentsRes.data || []).map(u => ({ ...u, role: 'student' })),
        ...(parentsRes.data || []).map(u => ({ ...u, role: 'parent' }))
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allUsers)
      };
      
    } catch (error) {
      console.error('Admin users fetch error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to fetch users',
          message: error.message
        })
      };
    }
  }
  
  // PUT /api/admin/users/:role/:id - Update user
  if (path.includes('/admin/users/') && httpMethod === 'PUT') {
    try {
      const pathParts = path.split('/');
      const role = pathParts[pathParts.length - 2];
      const userId = pathParts[pathParts.length - 1];
      const updateData = JSON.parse(event.body);
      
      console.log('Updating user:', { role, userId, updateData });
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Determine table name
      let tableName = role === 'admin' ? 'Admins' : `${role}s`;
      
      // Update user in database
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update user',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'User updated successfully',
          user: data
        })
      };
      
    } catch (error) {
      console.error('Update user error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // DELETE /api/admin/users/:role/:id - Delete user
  if (path.includes('/admin/users/') && httpMethod === 'DELETE') {
    try {
      const pathParts = path.split('/');
      const role = pathParts[pathParts.length - 2];
      const userId = pathParts[pathParts.length - 1];
      
      console.log('Deleting user:', { role, userId });
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Determine table name
      let tableName = role === 'admin' ? 'Admins' : `${role}s`;
      
      // Get user's auth_id before deletion for Supabase Auth cleanup
      const { data: userData } = await supabase
        .from(tableName)
        .select('auth_id')
        .eq('id', userId)
        .single();
      
      // Delete from database table
      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', userId);
      
      if (dbError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to delete user from database',
            message: dbError.message
          })
        };
      }
      
      // Optionally delete from Supabase Auth (commented out for safety)
      // if (userData?.auth_id) {
      //   try {
      //     await supabase.auth.admin.deleteUser(userData.auth_id);
      //   } catch (authError) {
      //     console.warn('Could not delete from Supabase Auth:', authError);
      //   }
      // }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully`
        })
      };
      
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // POST /api/admin/knowledge-components - Create knowledge component
  if (path.includes('/admin/knowledge-components') && httpMethod === 'POST') {
    try {
      const kcData = JSON.parse(event.body);
      console.log('Creating KC:', kcData);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .insert([{
          name: kcData.name,
          description: kcData.description || '',
          curriculum_code: kcData.curriculum_code || null,
          grade_level: kcData.grade_level || 3,
          metadata: kcData.metadata || {
            bktParams: {
              pL0: 0.3,
              pT: 0.09,
              pS: 0.1,
              pG: 0.2
            }
          },
          status: 'approved',
          suggestion_source: 'manual'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('KC creation error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create knowledge component',
            message: error.message,
            details: error
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Knowledge component created successfully',
          knowledgeComponent: data
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // PUT /api/admin/knowledge-components/:id - Update knowledge component
  if (path.includes('/admin/knowledge-components/') && httpMethod === 'PUT') {
    try {
      const kcId = path.split('/').pop();
      const kcData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .update({
          name: kcData.name,
          description: kcData.description,
          curriculum_code: kcData.curriculum_code,
          grade_level: kcData.grade_level,
          metadata: kcData.metadata
        })
        .eq('id', kcId)
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update knowledge component',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Knowledge component updated successfully',
          knowledgeComponent: data
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // DELETE /api/admin/knowledge-components/:id - Delete knowledge component
  if (path.includes('/admin/knowledge-components/') && httpMethod === 'DELETE') {
    try {
      const kcId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('knowledge_components')
        .delete()
        .eq('id', kcId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to delete knowledge component',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Knowledge component deleted successfully'
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/admin/knowledge-components/:id - Get individual knowledge component
  if (path.includes('/admin/knowledge-components/') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Extract KC ID from path
      const kcId = path.split('/admin/knowledge-components/')[1];
      
      if (!kcId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'KC ID is required'
          })
        };
      }
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('id', parseInt(kcId))
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge component',
            message: error.message
          })
        };
      }
      
      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Knowledge component not found'
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/admin/knowledge-components - List knowledge components
  if (path.includes('/admin/knowledge-components') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .order('id');
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge components',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/knowledge-components - List all knowledge components (general endpoint)
  if (path === '/api/knowledge-components' && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .order('curriculum_code', { ascending: true });
      
      if (error) {
        console.error('Error fetching knowledge components:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge components',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      console.error('Error in knowledge components endpoint:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }

  // GET /api/admin/users/csv-template - Download CSV template
  if (path === '/api/admin/users/csv-template' && httpMethod === 'GET') {
    try {
      // Create CSV template with simplified headers as requested
      const csvTemplate = `name,grade_level,username,password
Sample Student,3,student1,password123
Sample Student 2,4,student2,password123
Sample Student 3,3,student3,password123`;

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="user_import_template.csv"'
        },
        body: csvTemplate
      };
    } catch (error) {
      console.error('Error generating CSV template:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to generate template',
          message: error.message
        })
      };
    }
  }

  // POST /api/admin/users/csv-upload - Upload CSV users
  if (path === '/api/admin/users/csv-upload' && httpMethod === 'POST') {
    try {
      console.log('[CSV Upload] Request received');
      console.log('[CSV Upload] Content-Type:', event.headers['content-type'] || event.headers['Content-Type']);
      console.log('[CSV Upload] Body type:', typeof event.body);
      console.log('[CSV Upload] Is base64:', event.isBase64Encoded);
      console.log('[CSV Upload] Body preview:', event.body ? event.body.substring(0, 100) : 'null');
      
      const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
      let csvContent = '';
      
      if (contentType.includes('application/json')) {
        // Handle JSON content (expected from our updated frontend)
        try {
          const requestData = JSON.parse(event.body);
          csvContent = requestData.csvContent;
          console.log('[CSV Upload] Parsed JSON successfully, CSV content length:', csvContent ? csvContent.length : 0);
        } catch (parseError) {
          console.error('[CSV Upload] JSON parse error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
      } else if (contentType.includes('multipart/form-data')) {
        // Handle multipart form data (fallback for other environments)
        console.log('[CSV Upload] Handling multipart form data');
        
        // Extract boundary from Content-Type
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid multipart boundary' })
          };
        }

        // Parse the multipart data
        const body = event.isBase64Encoded ? 
          Buffer.from(event.body, 'base64').toString() : 
          event.body;

        // Extract CSV content from multipart body
        const parts = body.split('--' + boundary);
        
        for (const part of parts) {
          if (part.includes('filename=') && part.includes('.csv')) {
            const contentStart = part.indexOf('\r\n\r\n') + 4;
            csvContent = part.substring(contentStart).trim();
            // Remove any trailing boundary markers
            csvContent = csvContent.replace(/--.*$/, '').trim();
            break;
          }
        }
        
        console.log('[CSV Upload] Extracted CSV from multipart, length:', csvContent.length);
      } else {
        // Try to parse as direct CSV content
        console.log('[CSV Upload] Treating as direct CSV content');
        csvContent = event.body;
      }

      if (!csvContent || typeof csvContent !== 'string' || csvContent.length === 0) {
        console.error('[CSV Upload] No valid CSV content found');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'CSV content is required' })
        };
      }

      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'CSV file must contain header and at least one data row' })
        };
      }

      // Function to parse CSV line correctly handling quoted fields
      const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"' && (i === 0 || line[i-1] === ',')) {
            inQuotes = true;
          } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
            inQuotes = false;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      };

      const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);

      // Validate required headers
      const requiredHeaders = ['name', 'grade_level', 'username', 'password'];
      const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
      
      if (missingHeaders.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `Missing required CSV headers: ${missingHeaders.join(', ')}. Expected: name, grade_level, username, password` 
          })
        };
      }

      // Initialize Supabase
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const successfulUsers = [];
      const errors = [];
      
      // Load bcrypt once outside the loop
      const bcrypt = require('bcryptjs');

      try {
        console.log(`[CSV Upload] Processing ${dataLines.length} rows`);
        
        // Process rows in smaller batches to avoid timeouts
        const BATCH_SIZE = 5; // Process 5 rows at a time
        const totalRows = dataLines.length;
        
        for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
          const batch = dataLines.slice(batchStart, batchEnd);
          
          console.log(`[CSV Upload] Processing batch ${Math.floor(batchStart/BATCH_SIZE) + 1}/${Math.ceil(totalRows/BATCH_SIZE)} (rows ${batchStart + 1}-${batchEnd})`);
          
          // Process batch rows in parallel for better performance
          const batchPromises = batch.map(async (line, batchIndex) => {
            const i = batchStart + batchIndex;
            try {
              const values = parseCSVLine(line);
              const rowData = {};
              
              // Map values to headers
              header.forEach((h, index) => {
                rowData[h] = values[index] || '';
              });

              const { name, grade_level, username, password } = rowData;

              // Basic validation
              if (!name || !grade_level || !username || !password) {
                return {
                  success: false,
                  row: i + 2,
                  email: username || 'unknown',
                  error: 'Missing required field (name, grade_level, username, or password)'
                };
              }

              // Validate grade_level is numeric
              const gradeNum = parseInt(grade_level);
              if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
                return {
                  success: false,
                  row: i + 2,
                  email: username,
                  error: `Invalid grade_level: ${grade_level}. Must be a number between 1-12.`
                };
              }

              // Check if student already exists (check both possible auth_id formats)
              const studentAuthId = `${username.trim()}@student.mathtagumpay.com`;
              const { data: existingStudent } = await supabase
                .from('students')
                .select('id, auth_id')
                .or(`auth_id.eq.${username},auth_id.eq.${studentAuthId}`)
                .single();

              if (existingStudent) {
                return {
                  success: false,
                  row: i + 2,
                  email: username,
                  error: 'Student with this username already exists'
                };
              }

              // Hash password
              const hashedPassword = await bcrypt.hash(password, 10);

              // Create student with proper auth_id format (matching authentication logic)
              const { data: newStudent, error: createError } = await supabase
                .from('students')
                .insert({
                  name: name.trim(),
                  auth_id: studentAuthId,
                  password: hashedPassword,
                  grade_level: gradeNum
                })
                .select()
                .single();

              if (createError) {
                console.error(`[CSV Upload] Error creating student on row ${i + 2}:`, createError);
                return {
                  success: false,
                  row: i + 2,
                  email: username,
                  error: `Creation failed: ${createError.message}`
                };
              }

              // Create learning path for the new student
              try {
                await supabase
                  .from('learning_paths')
                  .insert({
                    student_id: newStudent.id,
                    is_active: true,
                    current_position: 0
                  });
              } catch (pathError) {
                console.warn(`[CSV Upload] Warning: Failed to create learning path for student ${username}:`, pathError);
                // Don't fail the whole operation for learning path errors
              }

              console.log(`[CSV Upload] Successfully created student: ${username}`);
              
              return {
                success: true,
                student: {
                  id: newStudent.id,
                  name: newStudent.name,
                  auth_id: newStudent.auth_id,
                  grade_level: newStudent.grade_level,
                  role: 'student'
                }
              };

            } catch (err) {
              console.error(`[CSV Upload] Error processing student row ${i + 2}:`, err);
              const { username } = rowData || {};
              return {
                success: false,
                row: i + 2,
                email: username || 'Unknown',
                error: `Processing failed: ${err.message}`
              };
            }
          });

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          
          // Process batch results
          batchResults.forEach(result => {
            if (result.success) {
              successfulUsers.push(result.student);
            } else {
              errors.push({
                row: result.row,
                email: result.email,
                error: result.error
              });
            }
          });
          
          // Add small delay between batches to prevent overwhelming the database
          if (batchEnd < totalRows) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`[CSV Upload] Completed processing. Created: ${successfulUsers.length}, Errors: ${errors.length}`);

      } catch (mainError) {
        console.error('[CSV Upload] Main processing error:', mainError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'CSV processing failed',
            message: mainError.message
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `${successfulUsers.length} students created successfully. ${errors.length} rows failed.`,
          created: successfulUsers,
          errors: errors
        })
      };

    } catch (error) {
      console.error('Error processing CSV upload:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to process CSV file',
          message: error.message
        })
      };
    }
  }

  // POST /api/admin/users/bulk-delete - Bulk delete users
  if ((path === '/api/admin/users/bulk-delete' || path.includes('/api/admin/users/bulk-delete')) && httpMethod === 'POST') {
    try {
      console.log('[Bulk Delete] Request received');
      
      const requestData = JSON.parse(event.body);
      const { users } = requestData;
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Users array is required and must not be empty.' })
        };
      }

      console.log(`[Bulk Delete] Processing ${users.length} users for deletion`);

      // Initialize Supabase
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const results = {
        successful: [],
        failed: []
      };

      // Process deletions one by one to handle individual errors
      for (const userInfo of users) {
        const { id, role } = userInfo;
        const userId = parseInt(id, 10);

        try {
          if (isNaN(userId)) {
            results.failed.push({
              id,
              role,
              error: 'Invalid User ID provided.'
            });
            continue;
          }

          const validRoles = ['student', 'teacher', 'parent', 'admin'];
          if (!validRoles.includes(role)) {
            results.failed.push({
              id: userId,
              role,
              error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`
            });
            continue;
          }

          const tableName = role === 'admin' ? 'Admins' : `${role}s`;

          // Check if user exists
          const { data: user, error: fetchError } = await supabase
            .from(tableName)
            .select('id, name')
            .eq('id', userId)
            .single();

          if (fetchError || !user) {
            results.failed.push({
              id: userId,
              role,
              error: `${role.charAt(0).toUpperCase() + role.slice(1)} not found.`
            });
            continue;
          }

          // Handle related data deletion based on role
          if (role === 'student') {
            // Delete related records first (Supabase should handle cascading)
            await supabase.from('knowledge_states').delete().eq('student_id', userId);
            await supabase.from('responses').delete().eq('student_id', userId);
            await supabase.from('learning_paths').delete().eq('student_id', userId);
            await supabase.from('classroom_students').delete().eq('student_id', userId);
            await supabase.from('parent_students').delete().eq('student_id', userId);
            await supabase.from('engagement_metrics').delete().eq('student_id', userId);
          } else if (role === 'parent') {
            // Delete parent-student associations
            await supabase.from('parent_students').delete().eq('parent_id', userId);
          }

          // Delete the user
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', userId);

          if (deleteError) {
            console.error(`[Bulk Delete] Error deleting ${role} ${userId}:`, deleteError);
            results.failed.push({
              id: userId,
              role,
              error: deleteError.message || `Failed to delete ${role}.`
            });
          } else {
            results.successful.push({
              id: userId,
              role,
              name: user.name
            });
            console.log(`[Bulk Delete] Successfully deleted ${role} ${userId} (${user.name})`);
          }

        } catch (error) {
          console.error(`[Bulk Delete] Error processing ${role} ${userId}:`, error);
          results.failed.push({
            id: userId,
            role,
            error: error.message || `Failed to delete ${role}.`
          });
        }
      }

      console.log(`[Bulk Delete] Completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Bulk delete completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
          results
        })
      };

    } catch (error) {
      console.error('[Bulk Delete] Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to complete bulk delete operation.',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/admin/content-items - List content items with filtering
  if (path.includes('/admin/content-items') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get query parameters
      const queryParams = event.queryStringParameters || {};
      const page = parseInt(queryParams.page) || 1;
      const limit = parseInt(queryParams.limit) || 10;
      const kcId = queryParams.kcId;
      const type = queryParams.type;
      const difficulty = queryParams.difficulty;
      const search = queryParams.search;
      const showAll = queryParams.showAll === 'true';
      
      console.log('[Admin Content Items] Query params:', {
        page, limit, kcId, type, difficulty, search, showAll
      });
      
      // Build query
      let query = supabase
        .from('content_items')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            grade_level,
            description,
            curriculum_code
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (kcId) {
        console.log('[Admin Content Items] Filtering by KC ID:', kcId, 'Type:', typeof kcId);
        query = query.eq('knowledge_component_id', parseInt(kcId));
      }
      
      if (type) {
        query = query.eq('type', type);
      }
      
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      
      if (search) {
        query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
      }
      
      // Apply pagination unless showing all
      if (!showAll) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      }
      
      query = query.order('id', { ascending: false });
      
      const { data, error, count } = await query;
      
      console.log('[Admin Content Items] Query results:', {
        totalItems: count,
        returnedItems: data?.length || 0,
        error: error?.message
      });
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch content items',
            message: error.message
          })
        };
      }
      
      const totalPages = showAll ? 1 : Math.ceil((count || 0) / limit);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          contentItems: data || [],
          total: count || 0,
          totalPages: totalPages,
          currentPage: page,
          limit: showAll ? count : limit
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // POST /api/admin/content-items - Create content item
  if (path.includes('/admin/content-items') && httpMethod === 'POST') {
    try {
      console.log('Raw event body:', event.body);
      console.log('Event body type:', typeof event.body);
      
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'No request body provided'
          })
        };
      }
      
      const contentData = JSON.parse(event.body);
      console.log('Creating content item:', contentData);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .insert([{
          type: contentData.type || 'quiz',
          content: contentData.content || contentData.question || '',
          knowledge_component_id: contentData.knowledge_component_id || contentData.kcId,
          difficulty_level: contentData.difficulty_level || contentData.difficulty || 'medium',
          language: contentData.language || 'English',
          status: 'approved',
          suggestion_source: 'manual',
          options: contentData.options || null,
          correct_answer: contentData.correct_answer || contentData.correctAnswer || ''
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Content item creation error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create content item',
            message: error.message,
            details: error
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Content item created successfully',
          contentItem: data
        })
      };
      
    } catch (error) {
      console.error('Content item creation error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // Student endpoints
  
  // GET /api/students - Get all students
  if (path === '/api/students' && httpMethod === 'GET') {
    try {
      console.log('[Netlify] Fetching all students');
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch all students
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching students:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch students',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(students || [])
      };
      
    } catch (error) {
      console.error('Error in GET /api/students:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/kcs/sequence - Get sequence of quiz questions for KC
  // This endpoint MUST come before the generic /api/students/:id endpoints
  if ((path.includes('/students/kcs/sequence') || path.includes('kcs/sequence')) && httpMethod === 'GET') {
    console.log('[DEBUG] Handling /students/kcs/sequence request');
    console.log('[DEBUG] Full path:', path);
    console.log('[DEBUG] Query params:', event.queryStringParameters);
    try {
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const kcId = queryParams.get('kc_id');
      const limit = parseInt(queryParams.get('limit')) || 8;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let query = supabase
        .from('content_items')
        .select(`
          id,
          content,
          type,
          knowledge_component_id,
          difficulty,
          metadata,
          options,
          correct_answer,
          explanation,
          knowledge_components (
            id,
            name,
            curriculum_code
          )
        `)
        .eq('type', 'multiple_choice');
        
      if (kcId) {
        query = query.eq('knowledge_component_id', kcId);
      }
      
      const { data: questions, error } = await query;
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch quiz sequence',
            message: error.message
          })
        };
      }
      
      if (!questions || questions.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: `No quiz questions found${kcId ? ` for knowledge component ${kcId}` : ''}`
          })
        };
      }
      
      // Format the response to match what the frontend expects
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        content: q.content,
        type: q.type,
        kcId: q.knowledge_component_id,
        difficulty: q.difficulty,
        metadata: q.metadata,
        curriculumCode: q.knowledge_components?.curriculum_code || null
      }));
      
      // Shuffle questions for variety if getting from specific KC
      if (kcId && formattedQuestions.length > limit) {
        const shuffled = formattedQuestions.sort(() => Math.random() - 0.5);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(shuffled.slice(0, limit))
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(formattedQuestions)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id - Get student details
  if (path.match(/\/api\/students\/\d+$/) && httpMethod === 'GET') {
    try {
      const studentId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }

  // PUT /api/students/:id - Update student profile
  if (path.match(/\/api\/students\/\d+$/) && httpMethod === 'PUT') {
    try {
      const studentId = path.split('/').pop();
      const updateData = JSON.parse(body);
      
      // Remove sensitive fields that shouldn't be updated
      const { id, auth_id, password, createdAt, updatedAt, ...allowedData } = updateData;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('students')
        .update(allowedData)
        .eq('id', studentId)
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Failed to update student',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }

  // PUT /api/students/:id/password - Change student password
  if (path.match(/\/api\/students\/\d+\/password$/) && httpMethod === 'PUT') {
    try {
      const bcrypt = require('bcryptjs');
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      // Extract and verify auth token
      const authHeader = event.headers.authorization || event.headers.Authorization;
      console.log(`[Netlify] Student password change - Auth header: ${authHeader ? 'Present' : 'Missing'}`);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log(`[Netlify] Student password change - No valid auth header found`);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log(`[Netlify] Student password change - Token: ${token.substring(0, 20)}...`);
      let authenticatedUserId = null;
      let authenticatedUserRole = null;
      
      // Decode JWT token to get user info
      try {
        // Check if this is a development mock token
        if (token.startsWith('dev-token-')) {
          // Parse development token format: dev-token-{role}-{timestamp}
          const tokenParts = token.split('-');
          if (tokenParts.length >= 3) {
            authenticatedUserRole = tokenParts[2]; // student, teacher, admin, parent
            // For development tokens, we'll use the studentId from the URL as the authenticated user ID
            // since the token doesn't contain the actual user ID
            authenticatedUserId = parseInt(studentId);
            console.log(`[Netlify] Development token detected - Role: ${authenticatedUserRole}, User ID: ${authenticatedUserId}`);
          } else {
            throw new Error('Invalid development token format');
          }
        } else if (token.startsWith('netlify.')) {
          // Parse Netlify token format: netlify.{base64payload}.signature
          const tokenParts = token.split('.');
          if (tokenParts.length >= 2) {
            const payloadBase64 = tokenParts[1];
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            authenticatedUserId = payload.id;
            authenticatedUserRole = payload.role;
            console.log(`[Netlify] Netlify token decoded - User ID: ${authenticatedUserId}, Role: ${authenticatedUserRole}`);
          } else {
            throw new Error('Invalid Netlify token format');
          }
        } else {
          // Try to decode as standard JWT token
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
          authenticatedUserId = payload.id;
          authenticatedUserRole = payload.role;
          console.log(`[Netlify] JWT token decoded - User ID: ${authenticatedUserId}, Role: ${authenticatedUserRole}`);
        }
        
        // Verify this is actually a student
        if (authenticatedUserRole !== 'student') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Only students can change student passwords' })
          };
        }
        
        // Ensure the authenticated user is updating their own password
        if (parseInt(studentId) !== authenticatedUserId) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden: You can only change your own password.' })
          };
        }
      } catch (decodeError) {
        console.error('[Netlify] JWT decode error:', decodeError);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid authorization token' })
        };
      }
      
      const { currentPassword, newPassword } = JSON.parse(body);
      
      if (!currentPassword || !newPassword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Current password and new password are required.'
          })
        };
      }
      
      if (newPassword.length < 6) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'New password must be at least 6 characters long.'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student with current password
      const { data: student, error: getError } = await supabase
        .from('students')
        .select('password')
        .eq('id', studentId)
        .single();
      
      if (getError || !student) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found'
          })
        };
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isCurrentPasswordValid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Current password is incorrect.'
          })
        };
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: hashedNewPassword })
        .eq('id', studentId);
      
      if (updateError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update password',
            message: updateError.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Password changed successfully.'
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/dashboard - Get student dashboard data
  if (path.includes('/dashboard') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Getting dashboard data for student ${studentId}`);
      
      // Get student info
      const { data: student } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
        
      if (!student) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Student not found' })
        };
      }
      
      // Get all KCs for student's grade with mastery data
      const { data: gradeKCs } = await supabase
        .from('knowledge_components')
        .select(`
          *,
          knowledge_states!left (
            p_mastery,
            student_id
          )
        `)
        .eq('grade_level', student.grade_level)
        .eq('knowledge_states.student_id', studentId)
        .order('curriculum_code');
        
      // Process KCs into modules
      const modules = [];
      const moduleMap = new Map();
      
      gradeKCs?.forEach(kc => {
        // Determine module based on curriculum code
        let moduleName = 'Module 1';
        let moduleId = 'module-1';
        
        if (kc.curriculum_code) {
          // Extract quarter from curriculum code (e.g., G3-NS-01 -> Quarter 1)
          const match = kc.curriculum_code.match(/^G\d+-([A-Z]+)-(\d+)/);
          if (match) {
            const area = match[1];
            const num = parseInt(match[2]);
            
            // Group by ranges (adjust as needed)
            if (num <= 10) {
              moduleId = 'module-1';
              moduleName = 'Module 1: Number Sense Basics';
            } else if (num <= 20) {
              moduleId = 'module-2';
              moduleName = 'Module 2: Operations';
            } else if (num <= 30) {
              moduleId = 'module-3';
              moduleName = 'Module 3: Advanced Operations';
            } else {
              moduleId = 'module-4';
              moduleName = 'Module 4: Problem Solving';
            }
          }
        }
        
        // Get or create module
        if (!moduleMap.has(moduleId)) {
          moduleMap.set(moduleId, {
            id: moduleId,
            name: moduleName,
            knowledgeComponents: []
          });
        }
        
        // Add KC to module with mastery data
        const module = moduleMap.get(moduleId);
        module.knowledgeComponents.push({
          id: kc.id,
          name: kc.name,
          description: kc.description,
          curriculum_code: kc.curriculum_code,
          mastery: kc.knowledge_states?.[0]?.p_mastery || 0,
          difficulty: kc.difficulty || 3
        });
      });
      
      // Convert map to array
      moduleMap.forEach(module => {
        modules.push(module);
      });
      
      // Sort modules by ID
      modules.sort((a, b) => a.id.localeCompare(b.id));
      
      // Get recent activity
      const { data: recentResponses } = await supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          modules,
          recentActivity: recentResponses || [],
          recommendations: [],
          badges: []
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/kcs/:id - Get knowledge component details
  if (path.match(/\/api\/kcs\/\d+$/) && httpMethod === 'GET') {
    try {
      const kcId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('id', kcId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Knowledge component not found',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/kcs/:kcId/mastery - Get student's mastery level for specific KC
  if (path.includes('/students/') && path.includes('/kcs/') && path.includes('/mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const kcId = pathParts[pathParts.indexOf('kcs') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get knowledge state for this student and KC
      const { data: knowledgeState, error: ksError } = await supabase
        .from('knowledge_states')
        .select(`
          p_mastery,
          p_transit,
          p_guess,
          p_slip,
          knowledge_components (
            id,
            name,
            curriculum_code,
            description
          )
        `)
        .eq('student_id', studentId)
        .eq('knowledge_component_id', kcId)
        .single();
      
      if (ksError && ksError.code !== 'PGRST116') { // PGRST116 = no rows found
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch mastery data',
            message: ksError.message
          })
        };
      }
      
      // If no knowledge state exists, return default values
      const masteryData = knowledgeState || {
        p_mastery: 0.3, // Default starting mastery
        p_transit: 0.1,
        p_guess: 0.2,
        p_slip: 0.1,
        knowledge_components: null
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          studentId: parseInt(studentId),
          kcId: parseInt(kcId),
          mastery: masteryData.p_mastery,
          masteryPercentage: Math.round(masteryData.p_mastery * 100),
          knowledgeComponent: masteryData.knowledge_components,
          bktParams: {
            p_mastery: masteryData.p_mastery,
            p_transit: masteryData.p_transit,
            p_guess: masteryData.p_guess,
            p_slip: masteryData.p_slip
          }
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/kid-friendly-next-activity - Get next activity
  if (path.includes('/kid-friendly-next-activity') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const currentKcCode = queryParams.get('current_kc_curriculum_code');
      
      console.log(`[Netlify] Kid-friendly next activity for student ${studentId}, current KC: ${currentKcCode}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student's grade level
      const { data: student } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
        
      if (!student) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Student not found' })
        };
      }
      
      // Get all KCs for the student's grade level with mastery data
      const { data: gradeKCs } = await supabase
        .from('knowledge_components')
        .select(`
          *,
          knowledge_states!left (
            p_mastery,
            student_id
          )
        `)
        .eq('grade_level', student.grade_level)
        .eq('knowledge_states.student_id', studentId)
        .order('curriculum_code');
        
      if (!gradeKCs || gradeKCs.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            type: 'quiz',
            kc_id: null,
            message: 'No more topics available',
            completed_sequence: true
          })
        };
      }
      
      // Find current KC index
      let nextKC = null;
      
      // STEP 1: First try to get the most recent quiz KC from responses
      try {
        console.log('[Netlify] Checking for most recent quiz KC from responses...');
        
        // Query the most recent response for this student
        const { data: recentResponses } = await supabase
          .from('responses')
          .select(`
            *,
            content_item:content_item_id (
              knowledge_component_id
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentResponses && recentResponses.length > 0 && recentResponses[0].content_item?.knowledge_component_id) {
          const recentKcId = recentResponses[0].content_item.knowledge_component_id;
          const recentKC = gradeKCs.find(kc => kc.id === recentKcId);
          
          if (recentKC) {
            console.log(`[Netlify] Found recent KC from quiz: ${recentKC.name} (${recentKC.curriculum_code})`);
            
            // Check if this KC is mastered
            const mastery = recentKC.knowledge_states?.[0]?.p_mastery || 0;
            console.log(`[Netlify] Current mastery for KC ${recentKC.curriculum_code} is ${mastery * 100}%`);
            
            const masteryThreshold = 0.95; // 95% mastery threshold
            
            if (mastery < masteryThreshold) {
              // Continue with this KC since it's not mastered yet
              nextKC = recentKC;
              console.log(`[Netlify] Using recent quiz KC as next activity: ${nextKC.name} (mastery: ${mastery})`);
            } else {
              // KC is mastered, find the next one in sequence
              const recentIndex = gradeKCs.findIndex(kc => kc.id === recentKC.id);
              console.log(`[Netlify] KC index: ${recentIndex}, total KCs: ${gradeKCs.length}`);
              
              if (recentIndex >= 0 && recentIndex < gradeKCs.length - 1) {
                // Get next KC in sequence
                nextKC = gradeKCs[recentIndex + 1];
                
                // Check if the next KC already has some mastery
                const nextKcMastery = nextKC.knowledge_states?.[0]?.p_mastery || 0;
                console.log(`[Netlify] KC ${recentKC.curriculum_code} mastered at ${mastery * 100}%. Next KC ${nextKC.curriculum_code} has mastery of ${nextKcMastery * 100}%`);
                
                // If next KC is also mastered, continue searching
                if (nextKcMastery >= masteryThreshold) {
                  console.log(`[Netlify] Next KC ${nextKC.curriculum_code} is also mastered, continuing search...`);
                  nextKC = null; // Reset so we'll continue searching
                  
                  // Search for the first non-mastered KC after the recent one
                  for (let i = recentIndex + 1; i < gradeKCs.length; i++) {
                    const candidateKc = gradeKCs[i];
                    const candidateMastery = candidateKc.knowledge_states?.[0]?.p_mastery || 0;
                    
                    if (candidateMastery < masteryThreshold) {
                      nextKC = candidateKc;
                      console.log(`[Netlify] Found next unmastered KC: ${nextKC.curriculum_code}`);
                      break;
                    }
                  }
                } else {
                  console.log(`[Netlify] Using next KC in sequence: ${nextKC.curriculum_code}`);
                }
              } else if (recentIndex === gradeKCs.length - 1) {
                console.log(`[Netlify] Student has mastered the last KC in sequence: ${recentKC.curriculum_code}`);
                return {
                  statusCode: 200,
                  headers,
                  body: JSON.stringify({
                    type: 'quiz',
                    kc_id: null,
                    message: 'Congratulations! You completed all topics!',
                    completed_sequence: true,
                    all_mastered: true
                  })
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('[Netlify] Error finding recent KC from responses:', error);
        // Continue with other methods if this fails
      }
      
      // STEP 2: If no KC from recent responses, try using current_kc_curriculum_code
      if (!nextKC && currentKcCode) {
        const currentIndex = gradeKCs.findIndex(kc => kc.curriculum_code === currentKcCode);
        console.log(`[Netlify] Current KC index: ${currentIndex} out of ${gradeKCs.length}`);
        
        if (currentIndex >= 0 && currentIndex < gradeKCs.length - 1) {
          nextKC = gradeKCs[currentIndex + 1];
        } else if (currentIndex === gradeKCs.length - 1) {
          // Last KC in sequence
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              type: 'quiz',
              kc_id: null,
              message: 'Congratulations! You completed all topics!',
              completed_sequence: true,
              all_mastered: true
            })
          };
        }
      } 
      
      // STEP 3: If still no KC, find first non-mastered KC
      if (!nextKC) {
        // No current KC provided or found - find where student left off
        console.log('[Netlify] Finding first non-mastered KC...');
        
        // Find first non-mastered KC (mastery < 0.95)
        for (const kc of gradeKCs) {
          const mastery = kc.knowledge_states?.[0]?.p_mastery || 0;
          console.log(`[Netlify] KC ${kc.curriculum_code}: ${kc.name}, mastery: ${mastery}`);
          
          if (mastery < 0.95) {
            nextKC = kc;
            console.log(`[Netlify] Found non-mastered KC where student should continue: ${kc.name}`);
            break;
          }
        }
        
        // If all KCs are mastered, return completion message
        if (!nextKC) {
          console.log('[Netlify] All KCs are mastered!');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              type: 'quiz',
              kc_id: null,
              message: 'Congratulations! You have mastered all topics!',
              completed_sequence: true,
              all_mastered: true
            })
          };
        }
      }
      
      if (nextKC) {
        console.log(`[Netlify] Next KC: ${nextKC.name} (${nextKC.curriculum_code})`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            type: 'quiz',
            kc_id: nextKC.id,
            kc_name: nextKC.name,
            curriculum_code: nextKC.curriculum_code,
            message: `Ready for ${nextKC.name}?`
          })
        };
      }
      
      // Default response
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: 'quiz',
          kc_id: null,
          message: 'No next topic found'
        })
      };
      
    } catch (error) {
      console.error('[Netlify] Kid-friendly next activity error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/progress - Get student progress
  if (path.includes('/progress') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student grade level
      const { data: studentData } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
      
      const gradeLevel = studentData?.grade_level || 3;
      
      // Get total knowledge components for this grade level
      const { data: totalKCs, error: kcError } = await supabase
        .from('knowledge_components')
        .select('id')
        .eq('grade_level', gradeLevel);
      
      if (kcError) {
        console.error('Error fetching KCs for progress:', kcError);
      }
      
      const totalTopics = totalKCs?.length || 7; // Default to 7 if error
      
      // Get student's knowledge states to calculate completed topics
      const { data: knowledgeStates, error: ksError } = await supabase
        .from('knowledge_states')
        .select('knowledge_component_id, p_mastery')
        .eq('student_id', studentId);
      
      if (ksError) {
        console.error('Error fetching knowledge states:', ksError);
      }
      
      // Count topics with mastery >= 0.8 as completed
      const topicsCompleted = knowledgeStates?.filter(ks => ks.p_mastery >= 0.8).length || 0;
      
      // Calculate learning streak (consecutive days with activity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get quiz responses from last 30 days
      const { data: recentResponses, error: responseError } = await supabase
        .from('responses')
        .select('created_at')
        .eq('student_id', studentId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });
      
      // Get engagement metrics from last 30 days (student login/dashboard activity)
      const { data: recentEngagement, error: engagementError } = await supabase
        .from('engagement_metrics')
        .select('created_at')
        .eq('student_id', studentId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });
      
      // Calculate consecutive day streak
      let streak = 0;
      const today = new Date();
      
      // Create a helper function to get date as YYYY-MM-DD string
      const getDateString = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      const todayStr = getDateString(today);
      
      // Get unique days with activity from BOTH responses and engagement metrics
      const uniqueDays = new Set();
      
      // Add quiz response dates
      recentResponses?.forEach(response => {
        const date = new Date(response.created_at);
        const dateStr = getDateString(date);
        uniqueDays.add(dateStr);
      });
      
      // Add engagement metrics dates (login/dashboard activity)
      recentEngagement?.forEach(engagement => {
        const date = new Date(engagement.created_at);
        const dateStr = getDateString(date);
        uniqueDays.add(dateStr);
      });
      
      const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));
      
      // Check if there's activity today or yesterday (to handle timezone differences)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      
      let currentDate = new Date(today);
      let startFromToday = sortedDays.includes(todayStr);
      
      // If no activity today, check if there was activity yesterday
      if (!startFromToday && sortedDays.includes(yesterdayStr)) {
        currentDate = yesterday;
        startFromToday = true;
      }
      
      // Count consecutive days backwards from the starting date
      if (startFromToday) {
        for (let i = 0; i < 30; i++) { // Check up to 30 days back
          const checkDateStr = getDateString(currentDate);
          if (sortedDays.includes(checkDateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break; // Streak is broken
          }
        }
      }
      
      // Debug logging for streak calculation
      console.log('[Progress API] Streak calculation debug:', {
        studentId: studentId,
        totalResponseDays: recentResponses?.length || 0,
        totalEngagementDays: recentEngagement?.length || 0,
        uniqueActivityDays: sortedDays.length,
        sortedDays: sortedDays.slice(0, 7), // Show first 7 days
        todayStr: todayStr,
        yesterdayStr: yesterdayStr,
        startFromToday: startFromToday,
        calculatedStreak: streak
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalTopics,
          topicsCompleted,
          streak,
          // Legacy fields for backward compatibility
          totalQuizzes: totalTopics,
          correctAnswers: topicsCompleted,
          knowledgeComponents: knowledgeStates || []
        })
      };
      
    } catch (error) {
      console.error('Progress endpoint error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/grade-knowledge-components - Get grade KCs
  if (path.includes('/grade-knowledge-components') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student grade level
      const { data: studentData } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
      
      const gradeLevel = studentData?.grade_level || 3;
      
      // Get knowledge components for grade
      const { data: kcs, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('grade_level', gradeLevel)
        .order('id');
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge components',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(kcs || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/messages/inbox - Get messages for authenticated user
  if (path.includes('/messages/inbox') && httpMethod === 'GET') {
    try {
      // Get user info from Authorization header
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      let userId = null;
      let userRole = null;
      
      // Decode JWT token to get user info
      try {
        // Simple JWT decode without verification (for development)
        // In production, this should use proper JWT verification with secret
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
        userId = payload.id;
        userRole = payload.role;
        
        console.log(`[Netlify] Decoded token - User ID: ${userId}, Role: ${userRole}`);
      } catch (decodeError) {
        console.error('[Netlify] JWT decode error:', decodeError);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid authorization token' })
        };
      }
      
      // For now, only support student message inboxes
      if (userRole !== 'student') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Only students can access message inbox currently' })
        };
      }
      
      const studentId = userId;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Fetching messages for student ${studentId}`);
      
      // Fetch messages for the student
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          from_user_id,
          from_user_type,
          to_user_id,
          to_user_type,
          message,
          read,
          sent_at,
          createdAt
        `)
        .eq('to_user_id', studentId)
        .eq('to_user_type', 'student')
        .order('sent_at', { ascending: false });
        
      if (messagesError) {
        console.error('[Netlify] Error fetching messages:', messagesError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch messages',
            message: messagesError.message
          })
        };
      }
      
      // Add from_name to messages (for display purposes)
      const enrichedMessages = (messages || []).map(msg => ({
        ...msg,
        from_name: msg.from_user_type === 'teacher' ? 'Your Teacher' : 
                   msg.from_user_type === 'admin' ? 'Administrator' : 'System'
      }));
      
      console.log(`[Netlify] Found ${enrichedMessages.length} messages for student ${studentId}`);
      
      // Return array directly (not wrapped in object)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(enrichedMessages)
      };
      
    } catch (error) {
      console.error('[Netlify] Messages inbox error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // PUT /api/messages/:id/read - Mark message as read
  if (path.includes('/messages/') && path.includes('/read') && httpMethod === 'PUT') {
    try {
      const messageId = path.split('/')[3]; // Extract message ID from path
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Marking message ${messageId} as read`);
      
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          read: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();
        
      if (error) {
        console.error('[Netlify] Error marking message as read:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to mark message as read',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Message marked as read',
          data: data
        })
      };
      
    } catch (error) {
      console.error('[Netlify] Mark message as read error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // POST /api/students/:id/engagement - Track engagement
  if (path.includes('/engagement') && httpMethod === 'POST') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const engagementData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Insert engagement metrics data
      const { data, error } = await supabase
        .from('engagement_metrics')
        .insert([{
          student_id: parseInt(studentId),
          session_id: engagementData.sessionId || Date.now().toString(),
          time_on_task: engagementData.timeOnTask || 60,
          help_requests: engagementData.helpRequests || 0,
          disengagement_indicators: engagementData.disengagementIndicators || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error inserting engagement metrics:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database error',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Engagement tracked successfully',
          data: data
        })
      };
      
    } catch (error) {
      console.error('Engagement endpoint error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/kcs/:id - Get knowledge component details
  if (path.match(/\/api\/kcs\/\d+$/) && httpMethod === 'GET') {
    try {
      const kcId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('id', kcId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Knowledge component not found',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/kcs/:id/question - Get a question for a specific KC
  if (path.includes('/kcs/') && path.includes('/question') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const kcId = pathParts[pathParts.indexOf('kcs') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get a random question for this KC
      const { data: questions, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('knowledge_component_id', kcId)
        .eq('type', 'multiple_choice');
      
      if (error || !questions || questions.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'No questions found for this knowledge component'
          })
        };
      }
      
      // Return a random question
      const randomIndex = Math.floor(Math.random() * questions.length);
      const question = questions[randomIndex];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(question)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/content - Get content items (with optional KC filter)
  if (path === '/api/content' && httpMethod === 'GET') {
    try {
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const kcId = queryParams.get('kc_id');
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('type', 'multiple_choice');
        
      if (kcId) {
        query = query.eq('knowledge_component_id', kcId);
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch content items',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/content/:id - Get content item by ID
  if (path.match(/\/api\/content\/\d+$/) && httpMethod === 'GET') {
    try {
      const contentId = path.split('/').pop();
      console.log('[API] Loading content for ID:', contentId);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            curriculum_code,
            description
          )
        `)
        .eq('id', contentId)
        .single();
      
      console.log('[API] Content query result:', { data: !!data, error });
      console.log('[API] Content data preview:', data ? { id: data.id, type: data.type, content: data.content?.substring(0, 50) } : null);
      
      if (error) {
        console.error('[API] Content query error:', error);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Content not found',
            message: error.message,
            contentId: contentId
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/recommended-content - Get recommended content for student
  if (path.includes('/recommended-content') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const kcId = queryParams.get('kc_id');
      const limit = parseInt(queryParams.get('limit')) || 5;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get content items - if kcId provided, filter by it
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('type', 'multiple_choice')
        .limit(limit);
        
      if (kcId) {
        query = query.eq('knowledge_component_id', kcId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch recommended content',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/challenge-quiz - Get challenge quiz questions based on difficulty and student mastery
  if (path.includes('/challenge-quiz') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const limit = parseInt(queryParams.get('limit')) || 8;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student's knowledge states to determine difficulty levels
      const { data: knowledgeStates, error: statesError } = await supabase
        .from('knowledge_states')
        .select('p_mastery')
        .eq('student_id', studentId);
        
      if (statesError) {
        console.warn('Could not fetch knowledge states:', statesError);
      }
      
      // Calculate overall mastery to determine challenge difficulty
      const totalMastery = (knowledgeStates || []).reduce((sum, state) => sum + (state.p_mastery || 0), 0);
      const averageMastery = knowledgeStates && knowledgeStates.length > 0 ? totalMastery / knowledgeStates.length : 0;
      
      // Determine difficulty tier based on student's overall mastery
      let targetDifficulty;
      if (averageMastery >= 0.8) {
        targetDifficulty = [4, 5]; // Advanced - highest difficulty
      } else if (averageMastery >= 0.6) {
        targetDifficulty = [3, 4]; // Intermediate-Advanced
      } else if (averageMastery >= 0.4) {
        targetDifficulty = [2, 3]; // Beginner-Intermediate
      } else {
        targetDifficulty = [1, 2]; // Starter-Beginner
      }
      
      console.log(`[challenge-quiz] Student ${studentId} average mastery: ${(averageMastery * 100).toFixed(1)}%, Target difficulty: ${targetDifficulty.join(',')}`);
      
      // Get recently answered content items to avoid repetition
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentAnswers } = await supabase
        .from('responses')
        .select('content_item_id')
        .eq('student_id', studentId)
        .gt('created_at', thirtyMinutesAgo)
        .limit(10);
      
      const answeredItemIds = (recentAnswers || []).map(r => r.content_item_id);
      
      // Build query for challenge questions
      let query = supabase
        .from('content_items')
        .select(`
          *,
          knowledge_components!inner(id, name, curriculum_code)
        `)
        .in('type', ['multiple_choice', 'question', 'fill_in_blank', 'computation', 'word_problem'])
        .in('difficulty', targetDifficulty);
      
      // Exclude recently answered questions
      if (answeredItemIds.length > 0) {
        query = query.not('id', 'in', `(${answeredItemIds.join(',')})`);
      }
      
      const { data: contentItems, error } = await query
        .limit(limit * 3); // Get more than needed for variety
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch challenge quiz',
            message: error.message
          })
        };
      }
      
      if (!contentItems || contentItems.length === 0) {
        console.warn(`[challenge-quiz] No challenge questions found for difficulty levels ${targetDifficulty.join(',')}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }
      
      // Group questions by KC to ensure variety
      const questionsByKC = {};
      contentItems.forEach(item => {
        const kcId = item.knowledge_component_id;
        if (!questionsByKC[kcId]) {
          questionsByKC[kcId] = [];
        }
        questionsByKC[kcId].push(item);
      });
      
      // Select questions from different KCs to create variety
      const selectedQuestions = [];
      const kcIds = Object.keys(questionsByKC);
      let kcIndex = 0;
      
      while (selectedQuestions.length < limit && selectedQuestions.length < contentItems.length) {
        const currentKcId = kcIds[kcIndex % kcIds.length];
        const kcQuestions = questionsByKC[currentKcId];
        
        if (kcQuestions.length > 0) {
          const question = kcQuestions.shift(); // Take and remove first question
          selectedQuestions.push(question);
        }
        
        kcIndex++;
        
        // If we've cycled through all KCs and some have no more questions, remove them
        if (kcIndex % kcIds.length === 0) {
          for (let i = kcIds.length - 1; i >= 0; i--) {
            if (questionsByKC[kcIds[i]].length === 0) {
              kcIds.splice(i, 1);
            }
          }
          if (kcIds.length === 0) break;
        }
      }
      
      console.log(`[challenge-quiz] Selected ${selectedQuestions.length} questions from ${Object.keys(questionsByKC).length} different KCs`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(selectedQuestions)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  
  // GET /api/students/:id/responses - Get student's responses
  if (path.includes('/students/') && path.includes('/responses') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const kcId = queryParams.get('kc_id');
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let query = supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId);
        
      if (kcId) {
        // Join with content_items to filter by KC
        query = supabase
          .from('responses')
          .select(`
            *,
            content_items!inner (
              knowledge_component_id
            )
          `)
          .eq('student_id', studentId)
          .eq('content_items.knowledge_component_id', kcId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch responses',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // POST /api/students/:id/responses - Submit student response
  if (path.includes('/students/') && path.includes('/responses') && httpMethod === 'POST') {
    console.log(`[Netlify] 🎯 QUIZ RESPONSE SUBMISSION STARTED`);
    console.log(`[Netlify] Request path: ${path}`);
    console.log(`[Netlify] Full event body:`, event.body);
    console.log(`[Netlify] Headers:`, JSON.stringify(event.headers, null, 2));
    
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      console.log(`[Netlify] 👤 Student ID extracted: ${studentId}`);
      const responseData = JSON.parse(event.body);
      
      console.log(`[Netlify] 📝 Parsed response data for student ${studentId}:`, responseData);
      console.log(`[Netlify] 🔍 Practice mode check: ${responseData.practice_mode}`);
      console.log(`[Netlify] 🎯 Content item ID: ${responseData.content_item_id || responseData.contentItemId}`);
      console.log(`[Netlify] ✅ Answer correct: ${responseData.correct}`);
      console.log(`[Netlify] ⏱️ Time spent: ${responseData.time_spent}`);
      
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Validate content_item_id exists
      const contentItemId = responseData.content_item_id || responseData.contentItemId;
      if (!contentItemId) {
        console.error('[Netlify] ❌ Missing content_item_id in request');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing content_item_id',
            message: 'content_item_id is required'
          })
        };
      }
      
      // Verify content item exists
      const { data: contentItem, error: contentCheckError } = await supabase
        .from('content_items')
        .select('id, knowledge_component_id')
        .eq('id', contentItemId)
        .single();
        
      if (contentCheckError || !contentItem) {
        console.error('[Netlify] ❌ Content item not found:', contentItemId);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid content_item_id',
            message: `Content item ${contentItemId} not found`,
            debug: { contentCheckError }
          })
        };
      }
      
      console.log(`[Netlify] ✅ Content item ${contentItemId} verified, belongs to KC ${contentItem.knowledge_component_id}`);
      
      // Create response record
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          student_id: parseInt(studentId),
          content_item_id: parseInt(contentItemId),
          answer: responseData.answer,
          correct: responseData.correct || responseData.isCorrect,
          time_spent: responseData.time_spent || responseData.timeSpent || null,
          interaction_data: responseData.interaction_data || responseData.interactionData || null
        })
        .select()
        .single();
      
      if (responseError) {
        console.error('[Netlify] ❌ Response insert error:', responseError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to save response',
            message: responseError.message
          })
        };
      }
      
      console.log(`[Netlify] ✅ Response saved successfully with ID: ${response.id}`);
      console.log(`[Netlify] 🎯 REACHED KC MASTERY UPDATE SECTION`);
      
      // Update KC mastery only if NOT practice mode
      const practiceMode = responseData.practice_mode || false;
      let newMastery = null;
      
      console.log(`[Netlify] 🔍 Practice mode check: ${practiceMode}`);
      console.log(`[Netlify] 🔍 Will process KC update: ${!practiceMode}`);
      
      if (!practiceMode) {
        console.log(`[Netlify] 🚀 STARTING KC MASTERY UPDATE PROCESS`);
        
        // Get KC ID from content item (since frontend doesn't send it directly)
        const contentItemId = responseData.content_item_id || responseData.contentItemId;
        console.log(`[Netlify] Looking up KC for content item: ${contentItemId}`);
        
        const { data: contentItem, error: contentError } = await supabase
          .from('content_items')
          .select('knowledge_component_id, knowledge_components(id, name, curriculum_code)')
          .eq('id', contentItemId)
          .single();
          
        if (contentError || !contentItem?.knowledge_component_id) {
          console.error('[Netlify] Content item KC lookup failed:', contentError);
        } else {
          const kcId = contentItem.knowledge_component_id;
          const kcName = contentItem.knowledge_components?.name || 'Unknown KC';
          console.log(`[Netlify] Content item ${contentItemId} belongs to KC ${kcId} (${kcName})`);
          
          // Get or create knowledge state
          const { data: existingState } = await supabase
            .from('knowledge_states')
            .select('*')
            .eq('student_id', studentId)
            .eq('knowledge_component_id', kcId)
            .single();
            
          const isCorrect = responseData.correct || responseData.isCorrect;
          const currentMastery = existingState?.p_mastery || 0.3;
          
          // Improved BKT-style mastery calculation
          if (isCorrect) {
            // Correct answer: increase mastery more significantly
            newMastery = Math.min(currentMastery + (0.15 * (1 - currentMastery)), 1.0);
          } else {
            // Incorrect answer: decrease mastery but not as drastically
            newMastery = Math.max(currentMastery - (0.1 * currentMastery), 0.1);
          }
          
          console.log(`[Netlify] KC ${kcId} mastery update: ${(currentMastery * 100).toFixed(1)}% → ${(newMastery * 100).toFixed(1)}%`);
          
          if (existingState) {
            // Update existing state
            const { error: updateError } = await supabase
              .from('knowledge_states')
              .update({
                p_mastery: newMastery,
                updatedAt: new Date().toISOString()
              })
              .eq('student_id', studentId)
              .eq('knowledge_component_id', kcId);
              
            if (updateError) {
              console.error('[Netlify] KC mastery UPDATE failed:', updateError);
              // Don't throw error, but log it
            } else {
              console.log(`[Netlify] ✅ KC mastery UPDATED successfully for KC ${kcId}`);
            }
          } else {
            // Create new knowledge state
            const { error: insertError } = await supabase
              .from('knowledge_states')
              .insert({
                student_id: parseInt(studentId),
                knowledge_component_id: kcId,
                p_mastery: newMastery,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              
            if (insertError) {
              console.error('[Netlify] KC mastery INSERT failed:', insertError);
              // Don't throw error, but log it
            } else {
              console.log(`[Netlify] ✅ KC mastery CREATED successfully for KC ${kcId}`);
            }
          }
        }
      } else {
        console.log('[Netlify] Practice mode - skipping KC mastery update');
      }
      
      console.log(`[Netlify] 🏁 PREPARING FINAL RESPONSE - newMastery: ${newMastery}`);
      
      const finalResponse = {
        message: practiceMode ? 'Practice response recorded' : 'Response processed successfully',
        responseId: response.id,
        correct: responseData.correct || responseData.isCorrect,
        newMastery: practiceMode ? null : newMastery,
        knowledgeState: practiceMode ? null : { p_mastery: newMastery },
        practice_mode: practiceMode || false
      };
      
      console.log(`[Netlify] 🎉 RESPONSE SUBMISSION COMPLETE - Sending back:`, finalResponse);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(finalResponse)
      };
      
    } catch (error) {
      console.error('Submit response error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/struggling-kcs - Get KCs student is struggling with
  if (path.includes('/struggling-kcs') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Getting struggling KCs for student ${studentId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student's knowledge states
      const { data: knowledgeStates, error: statesError } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            curriculum_code,
            description
          )
        `)
        .eq('student_id', studentId)
        .lt('p_mastery', 0.5);
        
      if (statesError) {
        console.error('[Netlify] Failed to fetch knowledge states:', statesError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch struggling KCs',
            message: statesError.message
          })
        };
      }
      
      // Sort KCs by mastery level
      const strugglingKCs = (knowledgeStates || [])
        .sort((a, b) => a.p_mastery - b.p_mastery)
        .map(state => state.knowledge_components);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(strugglingKCs)
      };
      
    } catch (error) {
      console.error('Get struggling KCs error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/password - Get student password
  if (path.includes('/students/') && path.includes('/password') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Getting password for student ${studentId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student's password
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('password')
        .eq('id', studentId)
        .single();
        
      if (studentError) {
        console.error('[Netlify] Failed to fetch student:', studentError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch student',
            message: studentError.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ password: student.password })
      };
      
    } catch (error) {
      console.error('Get student password error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // PUT /api/students/:id/password - Change student password
  if (path.includes('/students/') && path.includes('/password') && httpMethod === 'PUT') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Changing password for student ${studentId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student's current password
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('password')
        .eq('id', studentId)
        .single();
        
      if (studentError) {
        console.error('[Netlify] Failed to fetch student:', studentError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch student',
            message: studentError.message
          })
        };
      }
      
      // Verify current password
      const requestBody = JSON.parse(event.body);
      const currentPassword = requestBody.currentPassword;
      const newPassword = requestBody.newPassword;
      
      if (currentPassword !== student.password) {
        console.error('[Netlify] Invalid current password');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid current password'
          })
        };
      }
      
      // Update password
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: newPassword })
        .eq('id', studentId);
        
      if (updateError) {
        console.error('[Netlify] Failed to update password:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update password',
            message: updateError.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Password changed successfully' })
      };
      
    } catch (error) {
      console.error('Change student password error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/teachers/:id/password - Get teacher password
  if (path.includes('/teachers/') && path.includes('/password') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      
      console.log(`[Netlify] Getting password for teacher ${teacherId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get teacher's password
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('password')
        .eq('id', teacherId)
        .single();
        
      if (teacherError) {
        console.error('[Netlify] Failed to fetch teacher:', teacherError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch teacher',
            message: teacherError.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ password: teacher.password })
      };
      
    } catch (error) {
      console.error('Get teacher password error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // PUT /api/teachers/:id/password - Change teacher password
  if (path.includes('/teachers/') && path.includes('/password') && httpMethod === 'PUT') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      
      console.log(`[Netlify] Changing password for teacher ${teacherId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get teacher's current password
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('password')
        .eq('id', teacherId)
        .single();
        
      if (teacherError) {
        console.error('[Netlify] Failed to fetch teacher:', teacherError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch teacher',
            message: teacherError.message
          })
        };
      }
      
      // Verify current password
      const requestBody = JSON.parse(event.body);
      const currentPassword = requestBody.currentPassword;
      const newPassword = requestBody.newPassword;
      
      if (currentPassword !== teacher.password) {
        console.error('[Netlify] Invalid current password');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid current password'
          })
        };
      }
      
      // Update password
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ password: newPassword })
        .eq('id', teacherId);
        
      if (updateError) {
        console.error('[Netlify] Failed to update password:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update password',
            message: updateError.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Password changed successfully' })
      };
      
    } catch (error) {
      console.error('Change teacher password error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message
        })
      };
    }
  }
  
  // Default response
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({
      error: 'Not found',
      path: path,
      method: httpMethod,
      rawUrl: event.rawUrl,
      queryStringParameters: event.queryStringParameters,
      availableEndpoints: [
        '/api/hello', 
        '/api/auth/login', 
        '/api/admin/users', 
        '/api/students/:id', 
        '/api/students/kcs/sequence',
        '/api/students/:id/kcs/:kcId/mastery',
        '/api/kcs/:id',
        '/api/content/:id',
        '/api/teachers/:id', 
        '/api/parents/:id', 
        '/api/classrooms/:id',
        '/api/messages/inbox',
        '/api/messages/:id/read',
        '/api/sounds/:filename',
        '/api/sounds-debug'
      ]
    })
  };
}
