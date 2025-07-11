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
      console.log('Attempting direct database authentication');
      
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
          // Check student table - try both auth_id and username
          let { data: studentData } = await supabase
            .from('students')
            .select('id, name, auth_id, grade_level, username')
            .eq('auth_id', loginEmail)
            .limit(1);
          
          // If not found by auth_id and we have a username, try username directly
          if ((!studentData || studentData.length === 0) && username) {
            const { data: studentByUsername } = await supabase
              .from('students')
              .select('id, name, auth_id, grade_level, username')
              .eq('username', username)
              .limit(1);
            
            if (studentByUsername && studentByUsername.length > 0) {
              studentData = studentByUsername;
              // Update loginEmail to match the actual auth_id
              loginEmail = studentByUsername[0].auth_id;
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
      
      // If user found in database, create a token for them
      if (authenticatedUser && userRole) {
        console.log('✅ User found in database:', userRole);
        
        // For now, accept any password for users in DB (since we can't verify without Supabase Auth)
        // In production, you should implement proper password verification
        
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
  
  // POST /api/admin/users - Create new user (but not csv-upload)
  if (path.includes('/admin/users') && !path.includes('csv-upload') && !path.includes('csv-template') && httpMethod === 'POST') {
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

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
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

          // Check if student already exists
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id, auth_id')
            .eq('auth_id', username)
            .single();

          if (existingStudent) {
            errors.push({
              row: i + 2,
              email: username,
              error: 'Student with this username already exists'
            });
            continue;
          }

          // Hash password (simple approach for demonstration)
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(password, 10);

          // Create student
          const { data: newStudent, error: createError } = await supabase
            .from('students')
            .insert({
              name: name,
              auth_id: username,
              password: hashedPassword,
              grade_level: grade_level
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating student:', createError);
            errors.push({
              row: i + 2,
              email: username,
              error: `Creation failed: ${createError.message}`
            });
            continue;
          }

          // Create learning path for the new student
          await supabase
            .from('learning_paths')
            .insert({
              student_id: newStudent.id,
              is_active: true,
              current_position: 0
            });

          successfulUsers.push({
            id: newStudent.id,
            name: newStudent.name,
            auth_id: newStudent.auth_id,
            grade_level: newStudent.grade_level,
            role: 'student'
          });

        } catch (err) {
          console.error('Error processing student row:', err);
          errors.push({
            row: i + 2,
            email: username || 'Unknown',
            error: `Processing failed: ${err.message}`
          });
        }
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
  
  // GET /api/students/:id/dashboard - Get student dashboard data
  if (path.includes('/dashboard') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
  
  // GET /api/students/:id/kcs/:kcId/mastery - Get student's mastery level for specific KC
  if (path.includes('/students/') && path.includes('/kcs/') && path.includes('/mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const kcId = pathParts[pathParts.indexOf('kcs') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
  
  // GET /api/students/:id/deped-modules - Get DepEd modules for student's grade
  if (path.includes('/deped-modules') && httpMethod === 'GET') {
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
      
      // Get quarters and modules for grade
      const { data: modules, error } = await supabase
        .from('deped_module_overview')
        .select('*')
        .eq('grade_level', gradeLevel)
        .order('quarter_number, order_index');
      
      if (error) {
        console.error('DepEd modules fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch DepEd modules',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(modules || [])
      };
      
    } catch (error) {
      console.error('DepEd modules endpoint error:', error);
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
  
  // GET /api/students/:id/module-progress - Get student's progress on DepEd modules
  if (path.includes('/module-progress') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Use the stored function to get comprehensive progress
      const { data: progress, error } = await supabase
        .rpc('get_student_module_progress', { 
          student_id_param: parseInt(studentId) 
        });
      
      if (error) {
        console.error('Module progress fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch module progress',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(progress || [])
      };
      
    } catch (error) {
      console.error('Module progress endpoint error:', error);
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
  
  // POST /api/students/:id/module-progress - Update student's module progress
  if (path.includes('/module-progress') && httpMethod === 'POST') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const requestBody = JSON.parse(body || '{}');
      const { module_id, completion_percentage, questions_answered, questions_correct } = requestBody;
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Update or insert module progress
      const updateData = {
        student_id: parseInt(studentId),
        module_id: parseInt(module_id),
        completion_percentage: parseFloat(completion_percentage) || 0,
        questions_answered: parseInt(questions_answered) || 0,
        questions_correct: parseInt(questions_correct) || 0,
        last_activity_at: new Date().toISOString()
      };
      
      // Mark as completed if 100%
      if (updateData.completion_percentage >= 100) {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { data: progress, error } = await supabase
        .from('student_module_progress')
        .upsert(updateData, { 
          onConflict: 'student_id,module_id',
          returning: 'minimal'
        });
      
      if (error) {
        console.error('Module progress update error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update module progress',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Module progress updated successfully'
        })
      };
      
    } catch (error) {
      console.error('Module progress update endpoint error:', error);
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
  
  // GET /api/deped-modules/:id/content - Get content items for a specific module
  if (path.includes('/deped-modules/') && path.includes('/content') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const moduleIndex = pathParts.indexOf('deped-modules');
      const moduleId = pathParts[moduleIndex + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get content items mapped to this module
      const { data: content, error } = await supabase
        .from('module_content_mapping')
        .select(`
          content_item_id,
          content_items (
            id,
            knowledge_component_id,
            type,
            difficulty,
            content,
            correct_answer,
            image_path,
            created_at
          )
        `)
        .eq('module_id', moduleId);
      
      if (error) {
        console.error('Module content fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch module content',
            message: error.message
          })
        };
      }
      
      // Extract the content items from the joined data
      const contentItems = content?.map(item => item.content_items).filter(Boolean) || [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contentItems)
      };
      
    } catch (error) {
      console.error('Module content endpoint error:', error);
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
  
  // NOTE: This endpoint has been moved before the generic student endpoints
  // to prevent path matching conflicts
  /*
  // GET /api/students/kcs/sequence - Get sequence of quiz questions for KC
  if ((path.includes('/students/kcs/sequence') || path.includes('kcs/sequence')) && httpMethod === 'GET') {
    console.log('[DEBUG] Handling /students/kcs/sequence request');
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
  */
  
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get knowledge states with low mastery
      const { data, error } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            description
          )
        `)
        .eq('student_id', studentId)
        .lt('p_mastery', 0.5)
        .order('p_mastery');
      
      if (error) {
        console.error('[Netlify] Struggling KCs fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch struggling KCs',
            message: error.message
          })
        };
      }
      
      console.log(`[Netlify] Found ${data?.length || 0} struggling KCs for student ${studentId}`);
      
      // Format response
      const strugglingKcs = (data || []).map(state => ({
        id: state.knowledge_component_id,
        name: state.knowledge_components?.name || 'Unknown',
        current_mastery: state.p_mastery || 0
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(strugglingKcs)
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
  
  // GET /api/admin/content-items/:id - Get single content item
  if (path.match(/\/api\/admin\/content-items\/\d+$/) && httpMethod === 'GET') {
    try {
      const contentId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            grade_level,
            description
          )
        `)
        .eq('id', contentId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Content item not found',
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
  
  // PUT /api/admin/content-items/:id - Update content item
  if (path.match(/\/api\/admin\/content-items\/\d+$/) && httpMethod === 'PUT') {
    try {
      const contentId = path.split('/').pop();
      
      let updateData;
      try {
        updateData = JSON.parse(event.body);
      } catch (parseError) {
        console.error('Failed to parse request body as JSON:', parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid JSON in request body',
            message: parseError.message
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Prepare the update data, ensuring options is properly formatted
      const cleanUpdateData = { ...updateData };
      
      // Handle options field - ensure it's properly formatted JSON
      if (cleanUpdateData.options && typeof cleanUpdateData.options === 'string') {
        try {
          cleanUpdateData.options = JSON.parse(cleanUpdateData.options);
        } catch (err) {
          console.error('Failed to parse options as JSON:', err);
          // If it fails to parse, treat it as a string array split by newlines or commas
          cleanUpdateData.options = cleanUpdateData.options.split(/[,\n]/).map(opt => opt.trim()).filter(opt => opt);
        }
      }
      
      console.log('Updating content item:', contentId, 'with data:', cleanUpdateData);
      
      const { data, error } = await supabase
        .from('content_items')
        .update(cleanUpdateData)
        .eq('id', contentId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update content item',
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
          message: 'Content item updated successfully',
          contentItem: data
        })
      };
      
    } catch (error) {
      console.error('PUT content-items error:', error);
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
  
  // DELETE /api/admin/content-items/:id - Delete content item
  if (path.match(/\/api\/admin\/content-items\/\d+$/) && httpMethod === 'DELETE') {
    try {
      const contentId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to delete content item',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Content item deleted successfully'
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
  
  // Teacher endpoints
  
  // GET /api/teachers/eligible-students - Get students not in any classroom
  if (path.includes('/teachers/eligible-students') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all students
      const { data: allStudents } = await supabase
        .from('students')
        .select('*');
      
      // Get students already in classrooms
      const { data: enrolledStudents } = await supabase
        .from('classroom_students')
        .select('student_id');
      
      const enrolledIds = (enrolledStudents || []).map(e => e.student_id);
      
      // Filter out enrolled students
      const eligibleStudents = (allStudents || []).filter(
        student => !enrolledIds.includes(student.id)
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(eligibleStudents)
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
  
  // POST /api/teachers/classrooms - Create classroom
  if (path === '/api/teachers/classrooms' && httpMethod === 'POST') {
    try {
      const classroomData = JSON.parse(event.body);
      console.log('[Netlify] Creating classroom with data:', classroomData);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create classroom
      let { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          name: classroomData.name,
          description: classroomData.description,
          teacher_id: classroomData.teacher_id,
          createdAt: new Date().toISOString()
        })
        .select()
        .single();
      
      // Handle duplicate key error by retrying (common issue with Supabase sequences)
      // This happens when the auto-increment sequence gets out of sync with actual data
      if (error && error.code === '23505') {
        console.log('[Netlify] Duplicate key error, retrying classroom creation...');
        
        // Add a small delay and retry - sometimes helps with sequence issues
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const retryResult = await supabase
          .from('classrooms')
          .insert({
            name: classroomData.name,
            description: classroomData.description,
            teacher_id: classroomData.teacher_id,
            createdAt: new Date().toISOString()
          })
          .select()
          .single();
          
        classroom = retryResult.data;
        error = retryResult.error;
        
        // If still failing, try to get the max ID and increment manually
        if (error && error.code === '23505') {
          console.log('[Netlify] Still getting duplicate key, trying manual ID approach...');
          
          // Get the current max ID
          const { data: maxResult } = await supabase
            .from('classrooms')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
            
          const nextId = maxResult && maxResult.length > 0 ? maxResult[0].id + 1 : 1;
          
          const manualResult = await supabase
            .from('classrooms')
            .insert({
              id: nextId,
              name: classroomData.name,
              description: classroomData.description,
              teacher_id: classroomData.teacher_id,
              createdAt: new Date().toISOString()
            })
            .select()
            .single();
            
          classroom = manualResult.data;
          error = manualResult.error;
        }
      }
      
      if (error) {
        console.error('[Netlify] Classroom creation failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create classroom',
            message: error.message
          })
        };
      }
      
      console.log('[Netlify] Classroom created successfully:', classroom);
      
      // Add students to classroom if provided
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const enrollments = classroomData.studentIds.map(studentId => ({
          classroom_id: classroom.id,
          student_id: studentId,
          joined_at: new Date().toISOString()
        }));
        
        console.log('[Netlify] Adding students to classroom:', enrollments);
        const { error: enrollmentError } = await supabase
          .from('classroom_students')
          .insert(enrollments);
          
        if (enrollmentError) {
          console.error('[Netlify] Failed to enroll students:', enrollmentError);
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          classroom: classroom
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
  
  // GET /api/teachers/:id - Get teacher details
  if (path.match(/\/api\/teachers\/\d+$/) && httpMethod === 'GET') {
    try {
      const teacherId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Teacher not found',
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
  
  // GET /api/teachers/:id/classrooms - Get teacher's classrooms
  if (path.match(/\/teachers\/\d+\/classrooms$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      console.log(`[Netlify] GET /api/teachers/${teacherId}/classrooms - Starting request`);
      console.log(`[Netlify] Full path: ${path}, Method: ${httpMethod}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, description, teacher_id, createdAt, updatedAt')
        .eq('teacher_id', teacherId);
      
      console.log(`[Netlify] Supabase query result:`, { data, error, teacherId });
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch classrooms',
            message: error.message
          })
        };
      }
      
      console.log(`[Netlify] Successfully returning ${(data || []).length} classrooms for teacher ${teacherId}`);
      
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
  
  // GET /api/classrooms/:id/performance - Get classroom performance
  if (path.includes('/classrooms/') && path.includes('/performance') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const classroomId = pathParts[pathParts.indexOf('classrooms') + 1];
      console.log('[Netlify] Fetching performance for classroom:', classroomId);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get students in classroom with their performance data
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          joined_at,
          students (
            id,
            name,
            auth_id,
            grade_level
          )
        `)
        .eq('classroom_id', classroomId);
        
      if (enrollmentError) {
        console.error('Error fetching classroom students:', enrollmentError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch classroom students',
            message: enrollmentError.message
          })
        };
      }
      
      // Get real performance data for each student
      const performanceData = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          const studentId = enrollment.student_id;
          
          // Get student's knowledge states for mastery calculation
          const { data: knowledgeStates } = await supabase
            .from('knowledge_states')
            .select('p_mastery')
            .eq('student_id', studentId);
          
          // Calculate average mastery across all KCs
          let mathMastery = 0;
          if (knowledgeStates && knowledgeStates.length > 0) {
            const totalMastery = knowledgeStates.reduce((sum, ks) => sum + (ks.p_mastery || 0), 0);
            mathMastery = totalMastery / knowledgeStates.length;
          }
          
          // Get recent responses for activity data
          const { data: recentResponses } = await supabase
            .from('responses')
            .select('created_at, correct, time_spent')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(50);
          
          // Get engagement metrics for session activity tracking
          const { data: engagementMetrics } = await supabase
            .from('engagement_metrics')
            .select('created_at, session_id, time_on_task')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(10);
          
          // Calculate performance metrics
          let questionsAnswered = 0;
          let correctAnswers = 0;
          let totalTimeSpent = 0;
          let lastActive = null;
          let lastQuizActivity = null;
          let lastSessionActivity = null;
          
          // Process quiz responses
          if (recentResponses && recentResponses.length > 0) {
            questionsAnswered = recentResponses.length;
            correctAnswers = recentResponses.filter(r => r.correct).length;
            totalTimeSpent = recentResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0);
            lastQuizActivity = recentResponses[0].created_at;
          }
          
          // Process engagement metrics (session activity)
          if (engagementMetrics && engagementMetrics.length > 0) {
            lastSessionActivity = engagementMetrics[0].created_at;
          }
          
          // Determine most recent activity (quiz or session)
          if (lastQuizActivity && lastSessionActivity) {
            lastActive = new Date(lastQuizActivity) > new Date(lastSessionActivity) ? 
              lastQuizActivity : lastSessionActivity;
          } else if (lastQuizActivity) {
            lastActive = lastQuizActivity;
          } else if (lastSessionActivity) {
            lastActive = lastSessionActivity;
          }
          
          const averageScore = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
          
          // Determine intervention need based on actual data
          const needsIntervention = mathMastery < 0.4 || (questionsAnswered > 10 && averageScore < 60);
          const priority = mathMastery < 0.3 ? 'high' : mathMastery < 0.5 ? 'medium' : 'low';
          
          return {
            student: enrollment.students,
            performance: {
              mathMastery: mathMastery,
              averageMastery: mathMastery, // For backwards compatibility
              averageScore: averageScore,
              questionsAnswered: questionsAnswered,
              timeSpent: totalTimeSpent,
              lastActive: lastActive || null,
              lastQuizActivity: lastQuizActivity || null,
              lastSessionActivity: lastSessionActivity || null,
              activityType: lastActive ? (lastActive === lastQuizActivity ? 'quiz' : 'session') : null
            },
            intervention: {
              needed: needsIntervention,
              priority: priority,
              reason: needsIntervention ? 
                (mathMastery < 0.4 ? 'Low mastery level' : 'Low quiz performance') : 
                'On track'
            }
          };
        })
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(performanceData)
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
  
  // GET /api/teachers/:id/knowledge-component-mastery - Get KC mastery
  if (path.includes('/knowledge-component-mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all knowledge components with student mastery data
      const { data: knowledgeComponents, error: kcError } = await supabase
        .from('knowledge_components')
        .select('*')
        .order('id');
      
      if (kcError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge components',
            message: kcError.message
          })
        };
      }
      
      // Get teacher's students through classrooms
      const { data: classrooms, error: classroomError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', teacherId);
      
      if (classroomError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch classrooms',
            message: classroomError.message
          })
        };
      }
      
      const classroomIds = classrooms.map(c => c.id);
      
      // Get students in teacher's classrooms
      const { data: classroomStudents, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id')
        .in('classroom_id', classroomIds);
      
      if (studentsError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch students',
            message: studentsError.message
          })
        };
      }
      
      const studentIds = [...new Set(classroomStudents.map(cs => cs.student_id))];
      
      // Get knowledge states for these students
      const { data: knowledgeStates, error: ksError } = await supabase
        .from('knowledge_states')
        .select('*')
        .in('student_id', studentIds);
      
      if (ksError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge states',
            message: ksError.message
          })
        };
      }
      
      // Calculate mastery for each KC
      const kcWithMastery = knowledgeComponents.map(kc => {
        const states = knowledgeStates.filter(ks => ks.knowledge_component_id === kc.id);
        const totalStudents = studentIds.length;
        const studentsWithData = states.length;
        const averageMastery = states.length > 0 
          ? states.reduce((sum, state) => sum + (state.p_mastery || 0), 0) / states.length 
          : 0;
        
        // Count content items for this KC
        const totalContentItems = 10; // Default estimate
        
        return {
          ...kc,
          totalStudents,
          studentsWithData,
          averageMastery,
          totalContentItems,
          difficulty: kc.difficulty || 3
        };
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(kcWithMastery)
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
  
  // GET /api/classrooms/:id - Get classroom details
  if (path.match(/\/api\/classrooms\/\d+$/) && httpMethod === 'GET') {
    try {
      const classroomId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, description, teacher_id, createdAt, updatedAt')
        .eq('id', classroomId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Classroom not found',
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
  
  // GET /api/classrooms/:id/students - Get classroom students
  if (path.includes('/classrooms/') && path.includes('/students') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const classroomId = pathParts[pathParts.indexOf('classrooms') + 1];
      console.log('[Netlify] Fetching students for classroom:', classroomId);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get students in classroom
      console.log('[Netlify] Querying classroom_students for classroom:', classroomId);
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          joined_at,
          students (*)
        `)
        .eq('classroom_id', classroomId);
      
      console.log('[Netlify] Classroom students query result:', { 
        classroomId, 
        error: error ? error.message : null, 
        dataCount: data ? data.length : 0 
      });
      
      if (error) {
        console.error('[Netlify] Failed to fetch classroom students:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch classroom students',
            message: error.message
          })
        };
      }
      
      // Format response to return student objects
      const students = (data || []).map(enrollment => ({
        ...enrollment.students,
        enrollmentDate: enrollment.joined_at
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(students)
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
  
  // POST /api/classrooms/:id/students - Add students to classroom
  if (path.includes('/classrooms/') && path.includes('/students') && httpMethod === 'POST') {
    try {
      const pathParts = path.split('/');
      const classroomId = pathParts[pathParts.indexOf('classrooms') + 1];
      const { studentIds } = JSON.parse(event.body || '{}');
      
      console.log('[Netlify] Adding students to classroom:', { classroomId, studentIds });
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid request',
            message: 'studentIds array is required'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create enrollment records
      const enrollments = studentIds.map(studentId => ({
        classroom_id: parseInt(classroomId),
        student_id: parseInt(studentId),
        joined_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('classroom_students')
        .insert(enrollments);
        
      if (error) {
        console.error('[Netlify] Failed to add students to classroom:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to add students',
            message: error.message
          })
        };
      }
      
      console.log('[Netlify] Successfully added students to classroom');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully added ${studentIds.length} students to classroom`
        })
      };
      
    } catch (error) {
      console.error('[Netlify] Error adding students to classroom:', error);
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
  
  // DELETE /api/classrooms/:id/students/:studentId - Remove student from classroom
  if (path.includes('/classrooms/') && path.includes('/students/') && httpMethod === 'DELETE') {
    try {
      const pathParts = path.split('/');
      const classroomIndex = pathParts.indexOf('classrooms');
      const studentsIndex = pathParts.indexOf('students');
      
      if (classroomIndex === -1 || studentsIndex === -1 || studentsIndex !== classroomIndex + 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid request',
            message: 'Invalid URL format. Expected: /classrooms/:id/students/:studentId'
          })
        };
      }
      
      const classroomId = pathParts[classroomIndex + 1];
      const studentId = pathParts[studentsIndex + 1];
      
      console.log('[Netlify] Removing student from classroom:', { classroomId, studentId });
      
      if (!classroomId || !studentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid request',
            message: 'Classroom ID and student ID are required'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First, check if the classroom exists
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('id', classroomId)
        .single();
        
      if (classroomError || !classroom) {
        console.error('[Netlify] Classroom not found:', classroomError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Classroom not found',
            message: 'The specified classroom does not exist'
          })
        };
      }
      
      // Check if the student exists
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', studentId)
        .single();
        
      if (studentError || !student) {
        console.error('[Netlify] Student not found:', studentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: 'The specified student does not exist'
          })
        };
      }
      
      // Check if the student is actually in the classroom
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('classroom_students')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .single();
        
      if (enrollmentError || !enrollment) {
        console.error('[Netlify] Student not enrolled in classroom:', enrollmentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not enrolled',
            message: 'The student is not enrolled in this classroom'
          })
        };
      }
      
      // Remove the student from the classroom
      const { error: deleteError } = await supabase
        .from('classroom_students')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId);
        
      if (deleteError) {
        console.error('[Netlify] Failed to remove student from classroom:', deleteError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to remove student',
            message: deleteError.message
          })
        };
      }
      
      console.log('[Netlify] Successfully removed student from classroom');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully removed ${student.name} from ${classroom.name}`
        })
      };
      
    } catch (error) {
      console.error('[Netlify] Error removing student from classroom:', error);
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
  
  // GET /api/classrooms/:id/knowledge-components - Get KCs with real-time performance data
  if (path.includes('/classrooms/') && path.includes('/knowledge-components') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const classroomId = pathParts[pathParts.indexOf('classrooms') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get students in the classroom
      const { data: classroomStudents, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          students (
            id,
            grade_level
          )
        `)
        .eq('classroom_id', classroomId);
      
      if (studentsError) {
        console.error('Error fetching classroom students:', studentsError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch classroom students',
            message: studentsError.message
          })
        };
      }
      
      if (!classroomStudents || classroomStudents.length === 0) {
        // No students in classroom, return empty KCs
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }
      
      // Determine grade level from students (use most common grade or default to 3)
      const gradeLevels = classroomStudents.map(cs => cs.students?.grade_level).filter(Boolean);
      const gradeLevel = gradeLevels.length > 0 ? Math.max(...gradeLevels) : 3;
      const studentIds = classroomStudents.map(cs => cs.student_id);
      
      // Get KCs for grade level
      const { data: knowledgeComponents, error: kcError } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('grade_level', gradeLevel)
        .order('curriculum_code');
      
      if (kcError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge components',
            message: kcError.message
          })
        };
      }
      
      if (!knowledgeComponents || knowledgeComponents.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }
      
      // Get knowledge states for all students and all KCs
      const kcIds = knowledgeComponents.map(kc => kc.id);
      const { data: knowledgeStates, error: statesError } = await supabase
        .from('knowledge_states')
        .select('student_id, knowledge_component_id, p_mastery')
        .in('student_id', studentIds)
        .in('knowledge_component_id', kcIds);
      
      if (statesError) {
        console.error('Error fetching knowledge states:', statesError);
        // Continue without states data
      }
      
      // Calculate performance data for each KC
      const enrichedKCs = knowledgeComponents.map(kc => {
        const kcStates = (knowledgeStates || []).filter(ks => ks.knowledge_component_id === kc.id);
        const totalStudents = studentIds.length;
        
        if (kcStates.length === 0) {
          return {
            ...kc,
            averageMastery: 0,
            totalStudents,
            studentsWithData: 0,
            masteryLevels: {
              veryLow: totalStudents,  // All students at very low if no data
              low: 0,
              medium: 0,
              high: 0,
              veryHigh: 0
            }
          };
        }
        
        // Calculate average mastery
        const masteryValues = kcStates.map(ks => ks.p_mastery || 0);
        const averageMastery = masteryValues.reduce((sum, val) => sum + val, 0) / masteryValues.length;
        
        // Calculate mastery distribution
        const masteryLevels = {
          veryLow: 0,   // 0-0.2
          low: 0,       // 0.2-0.4
          medium: 0,    // 0.4-0.6
          high: 0,      // 0.6-0.8
          veryHigh: 0   // 0.8-1.0
        };
        
        masteryValues.forEach(mastery => {
          if (mastery < 0.2) masteryLevels.veryLow++;
          else if (mastery < 0.4) masteryLevels.low++;
          else if (mastery < 0.6) masteryLevels.medium++;
          else if (mastery < 0.8) masteryLevels.high++;
          else masteryLevels.veryHigh++;
        });
        
        // Students without data are counted as very low
        const studentsWithoutData = totalStudents - kcStates.length;
        masteryLevels.veryLow += studentsWithoutData;
        
        return {
          ...kc,
          averageMastery,
          totalStudents,
          studentsWithData: kcStates.length,
          masteryLevels
        };
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(enrichedKCs)
      };
      
    } catch (error) {
      console.error('Server error in classroom KC endpoint:', error);
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
  
  
  // GET /api/students/:id/grade-knowledge-components - Get knowledge components for student's grade
  if (path.includes('/grade-knowledge-components') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      if (!studentId || isNaN(parseInt(studentId))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid Student ID' })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First get the student's grade level
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
      
      if (studentError || !student) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Student not found' })
        };
      }
      
      // Get knowledge components for this grade level
      const { data: knowledgeComponents, error: kcError } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('grade_level', student.grade_level)
        .order('curriculum_code', { ascending: true })
        .order('name', { ascending: true });
      
      if (kcError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch knowledge components', details: kcError.message })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(knowledgeComponents || [])
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch knowledge components', message: error.message })
      };
    }
  }
  
  // GET /api/students/:id/detailed-performance or /api/students/me/detailed-performance
  if (path.includes('/detailed-performance') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      let studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Detailed performance endpoint - studentId from path: "${studentId}"`);
      
      // Handle /api/students/me/detailed-performance - extract ID from token
      if (studentId === 'me') {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'No valid authorization token provided' })
          };
        }
        
        try {
          const token = authHeader.split(' ')[1];
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          studentId = payload.id;
          console.log(`[Netlify] Extracted student ID ${studentId} from /me/ token`);
        } catch (tokenError) {
          console.error('[Netlify] Token parsing error:', tokenError);
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid authorization token' })
          };
        }
      }
      
      // Validate final studentId (whether from path or token)
      if (!studentId || isNaN(parseInt(studentId))) {
        console.error(`[Netlify] Invalid studentId for detailed-performance: "${studentId}"`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid Student ID',
            received: studentId,
            expected: 'numeric value'
          })
        };
      }
      
      console.log(`[Netlify] Getting detailed performance for student ${studentId}`);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student details
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      // Get knowledge states with KC details
      const { data: knowledgeStates } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (*)
        `)
        .eq('student_id', studentId);
      
      // Get recent responses
      const { data: recentResponses } = await supabase
        .from('responses')
        .select(`
          *,
          content_items (
            content,
            knowledge_component_id
          )
        `)
        .eq('student_id', studentId)
        .order('createdAt', { ascending: false })
        .limit(20);
      
      // Calculate performance metrics
      const totalResponses = recentResponses?.length || 0;
      const correctResponses = (recentResponses || []).filter(r => r.correct).length;
      const averageAccuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          student: student,
          performance: {
            averageAccuracy: averageAccuracy,
            totalQuizzesTaken: totalResponses,
            correctAnswers: correctResponses,
            knowledgeStates: knowledgeStates || [],
            recentActivity: recentResponses || []
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
  
  // POST /api/students/:id/assign-practice - Assign practice to student
  if (path.includes('/assign-practice') && httpMethod === 'POST') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const assignmentData = JSON.parse(event.body);
      
      // For now, just return success
      // In a full implementation, this would create assignment records
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Practice assigned successfully'
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
  
  // GET /api/students/:id/learning-path - Get student's learning path
  if (path.includes('/learning-path') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Learning path endpoint - studentId from path: "${studentId}"`);
      
      if (!studentId || isNaN(parseInt(studentId))) {
        console.error(`[Netlify] Invalid studentId for learning-path: "${studentId}"`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid Student ID',
            received: studentId,
            expected: 'numeric value'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get learning path for student with knowledge components
      const { data: learningPath, error: lpError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('student_id', studentId)
        .single();
      
      if (lpError) {
        console.log(`[Netlify] No learning path found for student ${studentId}, creating default path`);
        
        // If no learning path exists, create a basic one with the student's sequence data
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('grade_level')
          .eq('id', studentId)
          .single();
          
        if (studentError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              error: 'Student not found',
              message: studentError.message
            })
          };
        }
        
        // Get knowledge components for the student's grade level
        const { data: gradeKCs, error: kcError } = await supabase
          .from('knowledge_components')
          .select('*')
          .eq('grade_level', student.grade_level || 3)
          .order('curriculum_code');
          
        if (kcError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Failed to fetch knowledge components',
              message: kcError.message
            })
          };
        }
        
        // Create a simple learning path sequence
        const sequence = gradeKCs.map((kc, index) => ({
          knowledge_component_id: kc.id,
          name: kc.name,
          curriculum_code: kc.curriculum_code,
          position: index + 1,
          status: 'pending',
          mastery: 0
        }));
        
        const data = {
          id: null,
          student_id: parseInt(studentId),
          sequence: sequence,
          status: 'active'
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      }
      
      // If learning path exists, process it
      if (learningPath && learningPath.sequence) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(learningPath)
        };
      }
      
      // If learning path exists but has no sequence, return it as-is
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(learningPath || { sequence: [] })
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
  
  // Parent endpoints
  
  // GET /api/parents/:id - Get parent details
  if (path.match(/\/api\/parents\/\d+$/) && httpMethod === 'GET') {
    try {
      const parentId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .eq('id', parentId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Parent not found',
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
  
  // GET /api/students/:id/detailed-performance - Get detailed student performance
  if (path.match(/\/students\/\d+\/detailed-performance$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log('[Student Performance] Fetching detailed performance for student:', studentId);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student knowledge states for mastery calculation
      const { data: knowledgeStates, error: ksError } = await supabase
        .from('knowledge_states')
        .select('*')
        .eq('student_id', studentId);
      
      if (ksError) {
        console.error('[Student Performance] Error fetching knowledge states:', ksError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge states',
            message: ksError.message
          })
        };
      }
      
      // Get recent responses for activity analysis
      const { data: recentResponses, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId)
        .order('createdAt', { ascending: false })
        .limit(100);
      
      if (responsesError) {
        console.error('[Student Performance] Error fetching responses:', responsesError);
      }
      
      // Calculate performance metrics
      const totalKCs = knowledgeStates.length;
      const averageMastery = totalKCs > 0 ? 
        knowledgeStates.reduce((sum, ks) => sum + (ks.p_mastery || 0), 0) / totalKCs : 0;
      
      const totalResponses = recentResponses ? recentResponses.length : 0;
      const correctResponses = recentResponses ? 
        recentResponses.filter(r => r.correct).length : 0;
      const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
      
      const performanceData = {
        averageMastery: averageMastery,
        totalKnowledgeComponents: totalKCs,
        masteredKCs: knowledgeStates.filter(ks => (ks.p_mastery || 0) >= 0.8).length,
        accuracy: accuracy,
        totalQuestions: totalResponses,
        correctAnswers: correctResponses,
        recentResponses: recentResponses || []
      };
      
      console.log('[Student Performance] Performance data calculated:', performanceData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(performanceData)
      };
      
    } catch (error) {
      console.error('[Student Performance] Unexpected error:', error);
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
  
  // GET /api/parents/students/:id/weekly-report - Get weekly report for student
  if (path.match(/\/parents\/students\/\d+\/weekly-report$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Weekly report endpoint (v1) - studentId from path: "${studentId}"`);
      
      if (!studentId || isNaN(parseInt(studentId))) {
        console.error(`[Netlify] Invalid studentId for weekly-report (v1): "${studentId}"`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid Student ID',
            received: studentId,
            expected: 'numeric value'
          })
        };
      }
      
      console.log('[Weekly Report] Generating weekly report for student:', studentId);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Calculate date range for this week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of this week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);
      
      // Get responses from this week
      const { data: weeklyResponses, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId)
        .gte('createdAt', weekStart.toISOString())
        .lte('createdAt', weekEnd.toISOString())
        .order('createdAt', { ascending: false });
      
      if (responsesError) {
        console.error('[Weekly Report] Error fetching weekly responses:', responsesError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch weekly responses',
            message: responsesError.message
          })
        };
      }
      
      // Get student's current knowledge states to calculate mastery
      const { data: knowledgeStates } = await supabase
        .from('knowledge_states')
        .select('p_mastery')
        .eq('student_id', studentId);
      
      // Calculate overall mastery
      const averageMastery = knowledgeStates && knowledgeStates.length > 0 
        ? knowledgeStates.reduce((sum, ks) => sum + (ks.p_mastery || 0), 0) / knowledgeStates.length 
        : 0;
      
      // Calculate weekly metrics
      const totalQuestions = weeklyResponses ? weeklyResponses.length : 0;
      const correctAnswers = weeklyResponses ? 
        weeklyResponses.filter(r => r.correct).length : 0;
      const incorrectAnswers = totalQuestions - correctAnswers;
      const correctRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) : 0;
      
      // Calculate time spent
      const totalTimeSpent = weeklyResponses ? 
        weeklyResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0) : 0;
      
      // Create daily activity array format for charts
      const dailyActivity = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayResponses = (weeklyResponses || []).filter(r => {
          const responseDate = new Date(r.createdAt);
          return responseDate.toDateString() === date.toDateString();
        });
        
        dailyActivity.push({
          date: dateStr,
          timeSpent: dayResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0),
          questionsAnswered: dayResponses.length
        });
      }
      
      // Calculate active days
      const activeDays = dailyActivity.filter(day => day.questionsAnswered > 0).length;
      
      // Calculate weekly change (simplified calculation for now)
      const previousWeekMastery = Math.max(0.2, averageMastery - 0.05); // Mock previous week data
      const weeklyChange = averageMastery - previousWeekMastery;

      const weeklyReport = {
        weeklyProgress: {
          averageMastery: averageMastery,
          weeklyChange: weeklyChange,
          totalTimeSpent: totalTimeSpent,
          correctRate: correctRate,
          totalQuestionsAnswered: totalQuestions,
          activeDays: activeDays,
          dailyActivity: dailyActivity
        },
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        partiallyCorrectAnswers: 0, // For compatibility
        accuracy: correctRate * 100,
        totalTimeSpent,
        activeDays,
        recommendations: [] // Placeholder for future recommendations
      };
      
      console.log('[Weekly Report] Report generated:', weeklyReport);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(weeklyReport)
      };
      
    } catch (error) {
      console.error('[Weekly Report] Unexpected error:', error);
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
  
  // GET /api/parents/:id/students - Get parent's students
  if (path.includes('/parents/') && path.includes('/students') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const parentId = pathParts[pathParts.indexOf('parents') + 1];
      
      console.log('Parent ID:', parentId);
      console.log('Full path:', path);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get parent-student relationships
      const { data: relationships, error: relationError } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId);
      
      console.log('Relationships:', relationships);
      console.log('Relation error:', relationError);
      
      if (relationError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch parent-student relationships',
            message: relationError.message
          })
        };
      }
      
      if (!relationships || relationships.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }
      
      // Get student details
      const studentIds = relationships.map(r => r.student_id);
      console.log('Student IDs:', studentIds);
      
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);
      
      console.log('Students:', students);
      console.log('Students error:', error);
      
      if (error) {
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
      console.error('Parent students endpoint error:', error);
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
  
  // PUT /api/parents/:id - Update parent details
  if (path.match(/\/api\/parents\/\d+$/) && httpMethod === 'PUT') {
    try {
      const parentId = path.split('/').pop();
      const updateData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('parents')
        .update(updateData)
        .eq('id', parentId)
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update parent',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          parent: data
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
  
  // GET /api/parents/:id/children - Get parent's children (alias for students)
  if (path.includes('/parents/') && path.includes('/children') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const parentId = pathParts[pathParts.indexOf('parents') + 1];
      
      console.log('Children endpoint - Parent ID:', parentId);
      console.log('Children endpoint - Full path:', path);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get parent-student relationships with student details
      const { data, error } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          students (*)
        `)
        .eq('parent_id', parentId);
      
      console.log('Children endpoint - Query data:', data);
      console.log('Children endpoint - Query error:', error);
      
      if (error) {
        console.error('Children endpoint - Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch children',
            message: error.message
          })
        };
      }
      
      // Extract student objects
      const children = (data || []).map(rel => rel.students);
      console.log('Children endpoint - Extracted children:', children);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(children)
      };
      
    } catch (error) {
      console.error('Children endpoint - Exception:', error);
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
  
  // GET /api/parents/students/:id/weekly-report - Get weekly report for student
  if (path.includes('/parents/students/') && path.includes('/weekly-report') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Weekly report endpoint - studentId from path: "${studentId}"`);
      
      if (!studentId || isNaN(parseInt(studentId))) {
        console.error(`[Netlify] Invalid studentId for weekly-report: "${studentId}"`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid Student ID',
            received: studentId,
            expected: 'numeric value'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get responses from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: weeklyResponses } = await supabase
        .from('responses')
        .select(`
          *,
          content_items (
            knowledge_component_id,
            knowledge_components (
              name,
              description
            )
          )
        `)
        .eq('student_id', studentId)
        .gte('createdAt', oneWeekAgo.toISOString())
        .order('createdAt', { ascending: false });
      
      // Get student's current knowledge states to calculate mastery
      const { data: knowledgeStates } = await supabase
        .from('knowledge_states')
        .select('p_mastery')
        .eq('student_id', studentId);
      
      // Calculate overall mastery
      const averageMastery = knowledgeStates && knowledgeStates.length > 0 
        ? knowledgeStates.reduce((sum, ks) => sum + (ks.p_mastery || 0), 0) / knowledgeStates.length 
        : 0;
      
      // Calculate weekly stats
      const totalQuizzes = weeklyResponses?.length || 0;
      const correctAnswers = (weeklyResponses || []).filter(r => r.correct || r.is_correct).length;
      const incorrectAnswers = totalQuizzes - correctAnswers;
      const correctRate = totalQuizzes > 0 ? (correctAnswers / totalQuizzes) : 0;
      
      // Calculate time spent (sum of time_spent values)
      const totalTimeSpent = (weeklyResponses || []).reduce((sum, r) => sum + (r.time_spent || 0), 0);
      
      // Calculate daily activity
      const dailyActivity = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayResponses = (weeklyResponses || []).filter(r => {
          const responseDate = new Date(r.createdAt || r.created_at);
          return responseDate.toDateString() === date.toDateString();
        });
        
        dailyActivity.push({
          date: dateStr,
          timeSpent: dayResponses.reduce((sum, r) => sum + (r.time_spent || 0), 0),
          questionsAnswered: dayResponses.length
        });
      }
      
      // Calculate active days
      const activeDays = dailyActivity.filter(day => day.questionsAnswered > 0).length;
      
      // Group by knowledge component for detailed breakdown
      const kcPerformance = {};
      (weeklyResponses || []).forEach(response => {
        const kcId = response.content_items?.knowledge_component_id;
        const kcName = response.content_items?.knowledge_components?.name || 'Unknown';
        
        if (kcId) {
          if (!kcPerformance[kcId]) {
            kcPerformance[kcId] = {
              name: kcName,
              total: 0,
              correct: 0
            };
          }
          kcPerformance[kcId].total++;
          if (response.correct || response.is_correct) {
            kcPerformance[kcId].correct++;
          }
        }
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          weeklyProgress: {
            averageMastery: averageMastery,
            weeklyChange: averageMastery > 0.3 ? 0.05 : 0.02, // Mock weekly improvement
            totalTimeSpent: totalTimeSpent,
            correctRate: correctRate,
            totalQuestionsAnswered: totalQuizzes,
            activeDays: activeDays,
            dailyActivity: dailyActivity
          },
          weekStart: oneWeekAgo.toISOString(),
          weekEnd: new Date().toISOString(),
          totalQuizzesTaken: totalQuizzes,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          partiallyCorrectAnswers: 0, // For compatibility
          averageAccuracy: correctRate * 100,
          knowledgeComponentPerformance: Object.values(kcPerformance),
          recentActivity: weeklyResponses || [],
          recommendations: [] // Placeholder for future recommendations
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
  
  // GET /api/students/:id/historical-mastery - Get historical mastery data
  if (path.includes('/historical-mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      // For now, return mock historical data
      // In a full implementation, this would track mastery changes over time
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          historicalData: [
            {
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              averageMastery: 0.3
            },
            {
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              averageMastery: 0.45
            },
            {
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              averageMastery: 0.6
            },
            {
              date: new Date().toISOString(),
              averageMastery: 0.75
            }
          ]
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
  
  // GET /api/debug/tables - Check what tables exist
  if (path.includes('/debug/tables') && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check if tables exist and have data
      const results = {};
      
      // Check students table
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .limit(5);
      results.students = { data: students || [], error: studentsError };
      
      // Check responses table
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .limit(5);
      results.responses = { data: responses || [], error: responsesError };
      
      // Check knowledge_states table
      const { data: kcStates, error: kcStatesError } = await supabase
        .from('knowledge_states')
        .select('*')
        .limit(5);
      results.knowledge_states = { data: kcStates || [], error: kcStatesError };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          tables: results,
          timestamp: new Date().toISOString()
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // GET /api/debug/mastery/:studentId - Simple mastery check
  if (path.includes('/debug/mastery/') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('mastery') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get KC states for this student
      const { data: kcStates } = await supabase
        .from('knowledge_states')
        .select('*, knowledge_components(name, curriculum_code)')
        .eq('student_id', studentId);
        
      // Get recent responses
      const { data: responses } = await supabase
        .from('responses')
        .select('*, content_items(knowledge_component_id)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          student_id: studentId,
          kc_states: kcStates || [],
          recent_responses: responses || [],
          summary: {
            total_kc_states: kcStates?.length || 0,
            recent_responses_count: responses?.length || 0,
            average_mastery: kcStates?.length ? 
              (kcStates.reduce((sum, kc) => sum + (kc.p_mastery || 0), 0) / kcStates.length).toFixed(3) : 'N/A'
          }
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // GET /api/debug/student/:id/mastery - Debug student mastery levels
  if (path.includes('/debug/student/') && path.includes('/mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('student') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Debug] Getting all KC mastery for student ${studentId}`);
      
      // Get all knowledge states with KC details
      const { data: knowledgeStates, error } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            curriculum_code
          )
        `)
        .eq('student_id', studentId)
        .order('knowledge_component_id');
      
      // Get recent responses
      const { data: recentResponses } = await supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          studentId: studentId,
          knowledgeStates: knowledgeStates || [],
          recentResponses: recentResponses || [],
          timestamp: new Date().toISOString()
        })
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Debug endpoint error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/students/:id/knowledge-states - Get student's knowledge states
  if (path.includes('/students/') && path.includes('/knowledge-states') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      console.log(`[Netlify] Knowledge states endpoint - studentId from path: "${studentId}"`);
      
      if (!studentId || isNaN(parseInt(studentId))) {
        console.error(`[Netlify] Invalid studentId for knowledge-states: "${studentId}"`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid Student ID',
            received: studentId,
            expected: 'numeric value'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Getting knowledge states for student ${studentId}`);
      
      // Get all knowledge states for the student with KC details
      const { data, error } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            description,
            curriculum_code,
            grade_level
          )
        `)
        .eq('student_id', studentId)
        .order('knowledge_component_id');
        
      console.log(`[Netlify] Knowledge states query result - Count: ${data?.length || 0}, Error: ${error?.message || 'none'}`);
      if (data && data.length > 0) {
        console.log(`[Netlify] Sample knowledge state:`, JSON.stringify(data[0], null, 2));
      }
      
      if (error) {
        console.error('[Netlify] Knowledge states fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge states',
            message: error.message
          })
        };
      }
      
      console.log(`[Netlify] Found ${data?.length || 0} knowledge states for student ${studentId}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || [])
      };
      
    } catch (error) {
      console.error('[Netlify] Knowledge states endpoint error:', error);
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
  
  // GET /api/students/:id/grade-knowledge-components - Get all KCs for student's grade
  if (path.includes('/students/') && path.includes('/grade-knowledge-components') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Getting grade KCs for student ${studentId}`);
      
      // First get student's grade level
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('grade_level')
        .eq('id', studentId)
        .single();
        
      if (studentError || !student) {
        console.error('[Netlify] Student lookup error:', studentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: studentError?.message || 'Student not found'
          })
        };
      }
      
      // Get all KCs for the student's grade level with their current mastery
      const { data: gradeKCs, error: kcError } = await supabase
        .from('knowledge_components')
        .select(`
          id,
          name,
          description,
          curriculum_code,
          grade_level,
          knowledge_states!left (
            p_mastery,
            student_id
          )
        `)
        .eq('grade_level', student.grade_level)
        .eq('knowledge_states.student_id', studentId)
        .order('curriculum_code');
        
      if (kcError) {
        console.error('[Netlify] Grade KCs fetch error:', kcError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch grade knowledge components',
            message: kcError.message
          })
        };
      }
      
      // Transform the data to include current mastery
      const transformedKCs = gradeKCs.map(kc => ({
        ...kc,
        current_mastery: kc.knowledge_states?.[0]?.p_mastery || 0
      }));
      
      console.log(`[Netlify] Found ${transformedKCs?.length || 0} KCs for grade ${student.grade_level}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedKCs || [])
      };
      
    } catch (error) {
      console.error('[Netlify] Grade KCs endpoint error:', error);
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
  
  // POST /api/students/:id/contact - Send message to student
  if (path.includes('/students/') && path.includes('/contact') && httpMethod === 'POST') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      // Extract and verify auth token
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      let teacherId = null;
      let teacherRole = null;
      
      // Decode JWT token to get teacher info
      try {
        // Simple JWT decode without verification (for development)
        // In production, this should use proper JWT verification with secret
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
        teacherId = payload.id;
        teacherRole = payload.role;
        
        console.log(`[Netlify] Decoded token - Teacher ID: ${teacherId}, Role: ${teacherRole}`);
        
        // Verify this is actually a teacher
        if (teacherRole !== 'teacher') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Only teachers can send messages to students' })
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
      
      const requestData = JSON.parse(event.body);
      const { message, studentName } = requestData;
      
      if (!message || !message.trim()) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Message is required'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Teacher ${teacherId} sending message to student ${studentId}:`, message);
      
      // Verify teacher exists
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('id', teacherId)
        .single();
        
      if (teacherError || !teacher) {
        console.error('[Netlify] Teacher lookup error:', teacherError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Teacher not found',
            message: teacherError?.message || 'Teacher not found'
          })
        };
      }
      
      // Verify student exists
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, auth_id')
        .eq('id', studentId)
        .single();
        
      if (studentError || !student) {
        console.error('[Netlify] Student lookup error:', studentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: studentError?.message || 'Student not found'
          })
        };
      }
      
      const { data: messageRecord, error: messageError } = await supabase
        .from('messages')
        .insert({
          from_user_id: teacherId,
          from_user_type: 'teacher',
          to_user_id: studentId,
          to_user_type: 'student',
          message: message,
          read: false,
          sent_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
        
      if (messageError) {
        console.error('[Netlify] Message creation error:', messageError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to send message',
            message: messageError.message
          })
        };
      }
      
      // Create notification for the student
      try {
        const now = new Date().toISOString();
        
        // Check if notification already exists for this message
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('reference_id', messageRecord.id)
          .eq('user_id', studentId)
          .eq('type', 'message')
          .single();
          
        if (existingNotification) {
          console.log('[Netlify] Notification already exists for message:', messageRecord.id);
        } else {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: studentId,
              user_type: 'student',
              type: 'message',
              title: 'New message from your teacher',
              message: `You have received a new message from your teacher.`,
              read: false,
              reference_id: messageRecord.id,
              createdAt: now,
              updatedAt: now
            });
            
          if (notificationError) {
            console.warn('[Netlify] Notification creation failed (non-critical):', notificationError);
          } else {
            console.log('[Netlify] Notification created successfully for user:', studentId);
          }
        }
      } catch (err) {
        console.warn('[Netlify] Notification creation failed (non-critical):', err);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
          messageId: messageRecord.id,
          sentTo: student.name
        })
      };
      
    } catch (error) {
      console.error('[Netlify] Contact student error:', error);
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
  
  // Debug endpoint for progress data
  if (path.includes('/debug/progress') && httpMethod === 'GET') {
    try {
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const studentId = queryParams.get('student_id');
      
      if (!studentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'student_id is required' })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get student info
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
        
      // Get knowledge states
      const { data: knowledgeStates } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          knowledge_components (
            id,
            name,
            curriculum_code
          )
        `)
        .eq('student_id', studentId);
        
      // Get all KCs for student's grade
      const { data: gradeKCs } = await supabase
        .from('knowledge_components')
        .select('*')
        .eq('grade_level', student?.grade_level || 3);
        
      // Get recent responses
      const { data: responses } = await supabase
        .from('responses')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      // Calculate combined data like the frontend does
      const combinedKCs = gradeKCs?.map(kc => {
        const state = knowledgeStates?.find(ks => ks.knowledge_component_id === kc.id);
        return {
          ...kc,
          p_mastery: state ? state.p_mastery : 0,
          started: !!state,
          state_details: state
        };
      }) || [];
      
      const overallMastery = combinedKCs.reduce((sum, kc) => sum + (kc.p_mastery || 0), 0) / (combinedKCs.length || 1);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          student,
          knowledge_states_count: knowledgeStates?.length || 0,
          grade_kcs_count: gradeKCs?.length || 0,
          responses_count: responses?.length || 0,
          overall_mastery: (overallMastery * 100).toFixed(1) + '%',
          combined_kcs_sample: combinedKCs.slice(0, 5),
          knowledge_states_sample: knowledgeStates?.slice(0, 5),
          debug: {
            first_state: knowledgeStates?.[0],
            first_grade_kc: gradeKCs?.[0],
            matching_example: combinedKCs.find(kc => kc.started)
          }
        }, null, 2)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Debug endpoint error',
          message: error.message
        })
      };
    }
  }
  
  // Debug endpoint for mastery updates
  if (path.includes('/debug/mastery') && httpMethod === 'GET') {
    try {
      const queryParams = new URLSearchParams(event.queryStringParameters || {});
      const studentId = queryParams.get('student_id');
      const kcId = queryParams.get('kc_id');
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let debugInfo = {
        timestamp: new Date().toISOString(),
        studentId,
        kcId,
        checks: {}
      };
      
      // Check if student exists
      if (studentId) {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, name, email, grade_level')
          .eq('id', studentId)
          .single();
          
        debugInfo.checks.studentExists = !!student;
        debugInfo.checks.studentError = studentError?.message;
        debugInfo.student = student;
      }
      
      // Check knowledge state
      if (studentId && kcId) {
        const { data: knowledgeState, error: ksError } = await supabase
          .from('knowledge_states')
          .select('*')
          .eq('student_id', studentId)
          .eq('knowledge_component_id', kcId)
          .single();
          
        debugInfo.checks.knowledgeStateExists = !!knowledgeState;
        debugInfo.checks.knowledgeStateError = ksError?.message;
        debugInfo.knowledgeState = knowledgeState;
      }
      
      // Check recent responses
      if (studentId) {
        const { data: recentResponses, error: respError } = await supabase
          .from('responses')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        debugInfo.recentResponses = recentResponses;
        debugInfo.checks.responsesError = respError?.message;
      }
      
      // Check all knowledge states for student
      if (studentId) {
        const { data: allStates, error: allStatesError } = await supabase
          .from('knowledge_states')
          .select(`
            *,
            knowledge_components (
              id,
              name,
              curriculum_code
            )
          `)
          .eq('student_id', studentId)
          .order('updatedAt', { ascending: false });
          
        debugInfo.allKnowledgeStates = allStates;
        debugInfo.checks.allStatesError = allStatesError?.message;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(debugInfo, null, 2)
      };
      
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Debug endpoint error',
          message: error.message
        })
      };
    }
  }
  
  // GET /api/teachers/knowledge-components/:id - Get specific knowledge component for teacher
  if (path.match(/\/teachers\/knowledge-components\/\d+$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const kcId = pathParts[pathParts.length - 1];
      
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
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge component',
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
  
  // GET /api/teachers/knowledge-components/:id/classroom-performance - Get KC classroom performance
  if (path.match(/\/teachers\/knowledge-components\/\d+\/classroom-performance$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const kcId = pathParts[pathParts.indexOf('knowledge-components') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log(`[Netlify] Fetching classroom performance for KC ${kcId}`);
      
      // Get all students who have knowledge states for this KC
      const { data: knowledgeStates, error: ksError } = await supabase
        .from('knowledge_states')
        .select(`
          *,
          students!inner (
            id,
            name,
            grade_level
          )
        `)
        .eq('knowledge_component_id', kcId);
        
      if (ksError) {
        console.error('[Netlify] Error fetching knowledge states:', ksError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge states',
            message: ksError.message
          })
        };
      }
      
      // Get responses for this KC to calculate correct rates
      const { data: responses, error: respError } = await supabase
        .from('responses')
        .select(`
          *,
          content_items!inner (
            knowledge_component_id
          )
        `)
        .eq('content_items.knowledge_component_id', kcId);
        
      if (respError) {
        console.error('[Netlify] Error fetching responses:', respError);
      }
      
      // Calculate performance metrics
      const studentPerformanceMap = {};
      
      // Initialize with knowledge states
      (knowledgeStates || []).forEach(state => {
        if (!studentPerformanceMap[state.student_id]) {
          studentPerformanceMap[state.student_id] = {
            student_id: state.student_id,
            student_name: state.students?.name || 'Unknown Student',
            mastery: state.p_mastery || 0,
            totalResponses: 0,
            correctResponses: 0,
            correctRate: 0,
            averageTime: 0,
            totalTime: 0
          };
        }
      });
      
      // Calculate response metrics
      (responses || []).forEach(response => {
        if (studentPerformanceMap[response.student_id]) {
          studentPerformanceMap[response.student_id].totalResponses++;
          if (response.is_correct) {
            studentPerformanceMap[response.student_id].correctResponses++;
          }
          studentPerformanceMap[response.student_id].totalTime += (response.time_spent || 0);
        }
      });
      
      // Calculate final metrics
      const studentPerformance = Object.values(studentPerformanceMap).map(student => {
        if (student.totalResponses > 0) {
          student.correctRate = student.correctResponses / student.totalResponses;
          student.averageTime = student.totalTime / student.totalResponses;
        }
        return student;
      });
      
      // Calculate mastery distribution
      const masteryDistribution = {
        veryLow: 0,   // 0-0.2
        low: 0,       // 0.2-0.4
        medium: 0,    // 0.4-0.6
        high: 0,      // 0.6-0.8
        veryHigh: 0   // 0.8-1.0
      };
      
      let totalMastery = 0;
      studentPerformance.forEach(student => {
        totalMastery += student.mastery;
        
        if (student.mastery < 0.2) masteryDistribution.veryLow++;
        else if (student.mastery < 0.4) masteryDistribution.low++;
        else if (student.mastery < 0.6) masteryDistribution.medium++;
        else if (student.mastery < 0.8) masteryDistribution.high++;
        else masteryDistribution.veryHigh++;
      });
      
      const averageMastery = studentPerformance.length > 0 ? totalMastery / studentPerformance.length : 0;
      
      console.log(`[Netlify] Found ${studentPerformance.length} students for KC ${kcId}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          averageMastery,
          totalStudents: studentPerformance.length,
          masteryDistribution,
          studentPerformance
        })
      };
      
    } catch (error) {
      console.error('[Netlify] KC classroom performance error:', error);
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
  
  // GET /api/teachers/knowledge-components/:id/content-items - Get KC content items
  if (path.match(/\/teachers\/knowledge-components\/\d+\/content-items$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const kcId = pathParts[pathParts.indexOf('knowledge-components') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('knowledge_component_id', kcId)
        .order('createdAt', { ascending: false });
      
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
  
  // GET /api/teachers/content-items - Get content items created by teacher
  if (path === '/api/teachers/content-items' && httpMethod === 'GET') {
    try {
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // For now, return empty array since we don't have teacher_id in content_items
      // In production, you'd filter by teacher_id
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
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
  
  // POST /api/admin/parent-student-links - Link a parent to a student
  if (path === '/api/admin/parent-student-links' && httpMethod === 'POST') {
    try {
      if (!body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing request body',
            message: 'Request body is required for this endpoint'
          })
        };
      }
      
      const { parent_id, student_id } = JSON.parse(body);
      
      console.log('[Admin Link] Received request:', { parent_id, student_id });
      
      if (!parent_id || !student_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing required fields',
            message: 'Both parent_id and student_id are required'
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First, verify that both parent and student exist
      console.log('[Admin Link] Verifying parent and student exist...');
      
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, name, auth_id')
        .eq('id', parent_id)
        .single();
      
      if (parentError || !parent) {
        console.log('[Admin Link] Parent not found:', parentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Parent not found',
            message: `Parent with ID ${parent_id} does not exist`,
            debug: parentError?.message
          })
        };
      }
      
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, auth_id, grade_level')
        .eq('id', student_id)
        .single();
      
      if (studentError || !student) {
        console.log('[Admin Link] Student not found:', studentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: `Student with ID ${student_id} does not exist`,
            debug: studentError?.message
          })
        };
      }
      
      console.log('[Admin Link] Found parent:', parent.name, 'and student:', student.name);
      
      // Check if the parent_students table exists
      console.log('[Admin Link] Ensuring parent_students table exists...');
      
      const { error: tableCheckError } = await supabase
        .from('parent_students')
        .select('*')
        .limit(1);
      
      if (tableCheckError && (tableCheckError.message.includes('does not exist') || tableCheckError.code === 'PGRST116')) {
        console.log('[Admin Link] parent_students table missing. Please run the setup script in Supabase.');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database setup required',
            message: 'The parent_students table does not exist. Please run the database setup script.',
            instructions: 'Run the SQL script in /scripts/fix-parent-linking-corrected.sql in your Supabase dashboard.',
            debug: tableCheckError.message
          })
        };
      }
      
      // Check if link already exists
      console.log('[Admin Link] Checking for existing link...');
      const { data: existingLink, error: linkCheckError } = await supabase
        .from('parent_students')
        .select('*')
        .eq('parent_id', parent_id)
        .eq('student_id', student_id)
        .maybeSingle();
      
      if (linkCheckError) {
        console.log('[Admin Link] Error checking existing link:', linkCheckError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database error',
            message: 'Failed to check existing link',
            debug: linkCheckError.message
          })
        };
      }
      
      if (existingLink) {
        console.log('[Admin Link] Link already exists');
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Link already exists',
            message: `${parent.name} is already linked to ${student.name}`
          })
        };
      }
      
      // Create the link
      console.log('[Admin Link] Creating new link...');
      const { data, error } = await supabase
        .from('parent_students')
        .insert({
          parent_id: parseInt(parent_id),
          student_id: parseInt(student_id)
        })
        .select();
      
      if (error) {
        console.log('[Admin Link] Insert failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create link',
            message: error.message,
            details: {
              code: error.code,
              hint: error.hint,
              parent_id: parseInt(parent_id),
              student_id: parseInt(student_id)
            }
          })
        };
      }
      
      console.log('[Admin Link] Link created successfully:', data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully linked ${parent.name} to ${student.name}`,
          data: {
            parent: { id: parent.id, name: parent.name },
            student: { id: student.id, name: student.name },
            link: data?.[0] || { parent_id: parseInt(parent_id), student_id: parseInt(student_id) }
          }
        })
      };
      
    } catch (error) {
      console.log('[Admin Link] Unexpected error:', error);
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
  
  // DELETE /api/admin/parent-student-links/:parentId/:studentId - Unlink a parent from a student
  if (path.match(/\/admin\/parent-student-links\/\d+\/\d+$/) && httpMethod === 'DELETE') {
    try {
      const pathParts = path.split('/');
      const parentId = pathParts[pathParts.length - 2];
      const studentId = pathParts[pathParts.length - 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('parent_students')
        .delete()
        .eq('parent_id', parentId)
        .eq('student_id', studentId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to remove link',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Parent-student link removed successfully'
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
  
  // GET /api/students/:id/parents - Get parents linked to a student
  if (path.match(/\/students\/\d+\/parents$/) && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get parent-student relationships with parent details
      const { data, error } = await supabase
        .from('parent_students')
        .select(`
          parent_id,
          parents (*)
        `)
        .eq('student_id', studentId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch parents',
            message: error.message
          })
        };
      }
      
      // Extract parent objects
      const parents = (data || []).map(rel => rel.parents);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(parents)
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
  
  // POST /api/teacher/parent-student-links - Teacher links a parent to a student
  if (path === '/api/teacher/parent-student-links' && httpMethod === 'POST') {
    console.log('[Teacher Link] Endpoint hit - starting processing');
    console.log('[Teacher Link] Request path:', path);
    console.log('[Teacher Link] Request method:', httpMethod);
    console.log('[Teacher Link] Request body:', body);
    
    try {
      if (!body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing request body',
            message: 'Request body is required for this endpoint'
          })
        };
      }
      
      const { parent_id, student_id, classroom_id } = JSON.parse(body);
      
      console.log('[Teacher Link] Received request:', { parent_id, student_id, classroom_id });
      
      if (!parent_id || !student_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing required fields',
            message: 'Both parent_id and student_id are required',
            received: { parent_id, student_id, classroom_id }
          })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First, verify that both parent and student exist
      console.log('[Teacher Link] Verifying parent and student exist...');
      
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, name, auth_id')
        .eq('id', parent_id)
        .single();
      
      if (parentError || !parent) {
        console.log('[Teacher Link] Parent not found:', parentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Parent not found',
            message: `Parent with ID ${parent_id} does not exist`,
            debug: parentError?.message
          })
        };
      }
      
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, auth_id, grade_level')
        .eq('id', student_id)
        .single();
      
      if (studentError || !student) {
        console.log('[Teacher Link] Student not found:', studentError);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Student not found',
            message: `Student with ID ${student_id} does not exist`,
            debug: studentError?.message
          })
        };
      }
      
      console.log('[Teacher Link] Found parent:', parent.name, 'and student:', student.name);
      
      // Verify teacher has access to this student (through classroom)
      if (classroom_id) {
        console.log('[Teacher Link] Verifying classroom access...');
        const { data: classroomStudent, error: classroomError } = await supabase
          .from('classroom_students')
          .select('*')
          .eq('classroom_id', classroom_id)
          .eq('student_id', student_id)
          .single();
        
        if (classroomError || !classroomStudent) {
          console.log('[Teacher Link] Classroom verification failed:', classroomError);
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              error: 'Access denied',
              message: `Student ${student.name} is not in classroom ${classroom_id}`,
              debug: classroomError?.message
            })
          };
        }
        console.log('[Teacher Link] Classroom access verified');
      }
      
      // Check if the parent_students table exists
      console.log('[Teacher Link] Ensuring parent_students table exists...');
      
      // Try to query the table structure first
      const { error: tableCheckError } = await supabase
        .from('parent_students')
        .select('*')
        .limit(1);
      
      if (tableCheckError && (tableCheckError.message.includes('does not exist') || tableCheckError.code === 'PGRST116')) {
        console.log('[Teacher Link] parent_students table missing. Please run the setup script in Supabase.');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database setup required',
            message: 'The parent_students table does not exist. Please contact your administrator to run the database setup script.',
            instructions: 'Run the SQL script in /scripts/fix-parent-linking-corrected.sql in your Supabase dashboard.',
            debug: tableCheckError.message
          })
        };
      }
      
      // Check if link already exists
      console.log('[Teacher Link] Checking for existing link...');
      const { data: existingLink, error: linkCheckError } = await supabase
        .from('parent_students')
        .select('*')
        .eq('parent_id', parent_id)
        .eq('student_id', student_id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no row found
      
      if (linkCheckError) {
        console.log('[Teacher Link] Error checking existing link:', linkCheckError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database error',
            message: 'Failed to check existing link',
            debug: linkCheckError.message
          })
        };
      }
      
      if (existingLink) {
        console.log('[Teacher Link] Link already exists');
        return {
          statusCode: 409, // Conflict status code
          headers,
          body: JSON.stringify({
            error: 'Link already exists',
            message: `${parent.name} is already linked to ${student.name}`
          })
        };
      }
      
      // Create the link
      console.log('[Teacher Link] Creating new link...');
      const { data, error } = await supabase
        .from('parent_students')
        .insert({
          parent_id: parseInt(parent_id),
          student_id: parseInt(student_id)
        })
        .select(); // Return the inserted data
      
      if (error) {
        console.log('[Teacher Link] Insert failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create link',
            message: error.message,
            details: {
              code: error.code,
              hint: error.hint,
              parent_id: parseInt(parent_id),
              student_id: parseInt(student_id)
            }
          })
        };
      }
      
      console.log('[Teacher Link] Link created successfully:', data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully linked ${parent.name} to ${student.name}`,
          data: {
            parent: { id: parent.id, name: parent.name },
            student: { id: student.id, name: student.name },
            link: data?.[0] || { parent_id: parseInt(parent_id), student_id: parseInt(student_id) }
          }
        })
      };
      
    } catch (error) {
      console.error('[Teacher Link] Unexpected error:', error);
      console.error('[Teacher Link] Error stack:', error.stack);
      console.error('[Teacher Link] Error name:', error.name);
      console.error('[Teacher Link] Error code:', error.code);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server error',
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
          timestamp: new Date().toISOString()
        })
      };
    }
  }
  
  // DELETE /api/teacher/parent-student-links/:parentId/:studentId - Teacher unlinks a parent from a student
  if (path.match(/\/teacher\/parent-student-links\/\d+\/\d+$/) && httpMethod === 'DELETE') {
    try {
      const pathParts = path.split('/');
      const parentId = pathParts[pathParts.length - 2];
      const studentId = pathParts[pathParts.length - 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('parent_students')
        .delete()
        .eq('parent_id', parentId)
        .eq('student_id', studentId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to remove link',
            message: error.message
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Parent-student link removed successfully'
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
  
  // GET /api/messages/inbox - Get current user's inbox messages
  if (path.includes('/messages/inbox') && httpMethod === 'GET') {
    try {
      // Extract user info from Authorization header
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }
      
      const token = authHeader.substring(7);
      let userId, userType;
      
      try {
        // Simple token decode - in production, you'd verify the JWT signature
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id;
        userType = payload.role;
      } catch (err) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid token' })
        };
      }
      
      if (!userId || !userType) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Find all messages where this user is the recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('to_user_id', userId)
        .eq('to_user_type', userType)
        .order('sent_at', { ascending: false }); // Most recent first
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch messages',
            message: error.message
          })
        };
      }
      
      // Fetch sender names to display
      const enrichedMessages = await Promise.all((messages || []).map(async (message) => {
        let fromName = 'Unknown';
        
        // Fetch sender name based on from_user_type
        if (message.from_user_type === 'teacher') {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('name')
            .eq('id', message.from_user_id)
            .single();
          if (teacher) {
            fromName = teacher.name;
          }
        } else if (message.from_user_type === 'student') {
          const { data: student } = await supabase
            .from('students')
            .select('name')
            .eq('id', message.from_user_id)
            .single();
          if (student) {
            fromName = student.name;
          }
        }
        
        return {
          ...message,
          from_name: fromName
        };
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(enrichedMessages)
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
  
  // PUT /api/messages/:id/read - Mark a message as read
  if (path.match(/\/messages\/\d+\/read$/) && httpMethod === 'PUT') {
    try {
      // Extract user info from Authorization header
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }
      
      const token = authHeader.substring(7);
      let userId, userType;
      
      try {
        // Simple token decode - in production, you'd verify the JWT signature
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id;
        userType = payload.role;
      } catch (err) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid token' })
        };
      }
      
      const pathParts = path.split('/');
      const messageId = parseInt(pathParts[pathParts.indexOf('messages') + 1], 10);
      
      if (isNaN(messageId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid Message ID' })
        };
      }
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Find the message first
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (fetchError || !message) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Message not found' })
        };
      }
      
      // Check if the current user is the recipient of this message
      if (message.to_user_id !== userId || message.to_user_type !== userType) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ 
            error: 'You do not have permission to mark this message as read' 
          })
        };
      }
      
      // Update the message as read
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (updateError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to mark message as read',
            message: updateError.message
          })
        };
      }
      
      // Note: Notification updates removed to avoid schema cache issues
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Message marked as read'
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
  
  // GET /api/sounds-debug - Debug endpoint for sound system
  if (path === '/api/sounds-debug' && httpMethod === 'GET') {
    try {
      const fs = require('fs');
      const pathModule = require('path');
      
      // Get environment info
      const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        workingDir: process.cwd(),
        functionDir: __dirname,
        dirContents: {},
        netlifyBuildId: process.env.NETLIFY_BUILD_ID || 'not available',
        netlifyDeployId: process.env.DEPLOY_ID || 'not available',
        netlifyContext: process.env.CONTEXT || 'development'
      };
      
      // Check key directories
      const dirsToCheck = [
        '.',
        './client',
        './client/build',
        './client/build/sounds',
        './client/public',
        './client/public/sounds',
        '/opt/build/repo/client/build/sounds',
        pathModule.join(__dirname, '..', '..', 'client', 'build', 'sounds')
      ];
      
      for (const dir of dirsToCheck) {
        try {
          if (fs.existsSync(dir)) {
            envInfo.dirContents[dir] = fs.readdirSync(dir);
          } else {
            envInfo.dirContents[dir] = `Directory does not exist`;
          }
        } catch (err) {
          envInfo.dirContents[dir] = `Error reading directory: ${err.message}`;
        }
      }
      
      // Check for sound files
      const soundFiles = ['correct-answer.mp3', 'correct-chime.mp3', 'celebration.mp3', 'celebration-kids.mp3'];
      const soundStatus = {};
      
      for (const soundFile of soundFiles) {
        const possiblePaths = [
          pathModule.join(process.cwd(), 'client', 'public', 'sounds', soundFile),
          pathModule.join(process.cwd(), 'client', 'build', 'sounds', soundFile),
          pathModule.join('/opt/build/repo/client/build/sounds', soundFile),
          pathModule.join(__dirname, '..', '..', 'client', 'public', 'sounds', soundFile),
          pathModule.join(__dirname, '..', '..', 'client', 'build', 'sounds', soundFile),
        ];
        
        soundStatus[soundFile] = {
          found: false,
          foundAt: null,
          checkedPaths: possiblePaths
        };
        
        for (const path of possiblePaths) {
          try {
            if (fs.existsSync(path)) {
              soundStatus[soundFile].found = true;
              soundStatus[soundFile].foundAt = path;
              const stats = fs.statSync(path);
              soundStatus[soundFile].fileSize = stats.size;
              break;
            }
          } catch (err) {
            // Skip errors
          }
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Sound system debug information',
          environment: envInfo,
          soundFiles: soundStatus,
          serverTime: new Date().toISOString()
        }, null, 2)
      };
    } catch (error) {
      console.error('[ERROR] Error in sound debug endpoint:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Error generating sound debug information',
          message: error.message,
          stack: error.stack
        })
      };
    }
  }
  
  // GET /api/sounds/:filename - Serve sound files
  if (path.includes('/api/sounds/') && httpMethod === 'GET') {
    try {
      const filename = path.split('/api/sounds/')[1];
      const fs = require('fs');
      const pathModule = require('path');
      
      console.log('[DEBUG] Sound file request for filename:', filename);
      console.log('[DEBUG] Current working directory:', process.cwd());
      console.log('[DEBUG] Path being accessed:', path);
      console.log('[DEBUG] Environment variables:', JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY,
        NETLIFY_DEV: process.env.NETLIFY_DEV,
        NETLIFY_LOCAL: process.env.NETLIFY_LOCAL
      }));
      
      // Try multiple possible sound file locations
      const possiblePaths = [
        pathModule.join(process.cwd(), 'client', 'public', 'sounds', filename),
        pathModule.join(process.cwd(), 'client', 'build', 'sounds', filename),
        pathModule.join('/opt/build/repo/client/build/sounds', filename), // Netlify build location
        pathModule.join('/opt/build/repo/client/public/sounds', filename), // Additional Netlify build location
        pathModule.join(__dirname, '..', '..', 'client', 'public', 'sounds', filename),
        pathModule.join(__dirname, '..', '..', 'client', 'build', 'sounds', filename),
        pathModule.join('/var/task/client/build/sounds', filename), // Lambda deployment path
        pathModule.join('/var/task/client/public/sounds', filename), // Lambda deployment path
      ];
      
      console.log('[DEBUG] Checking possible sound file paths:', possiblePaths);
      
      // Check if the sound files directory exists
      console.log('[DEBUG] Directory content check:');
      for (const baseDir of [
        pathModule.join(process.cwd(), 'client', 'public'),
        pathModule.join(process.cwd(), 'client', 'build'),
        pathModule.join('/opt/build/repo/client/build'),
        pathModule.join('/opt/build/repo/client/public'),
        pathModule.join(__dirname, '..', '..', 'client', 'public'),
        pathModule.join(__dirname, '..', '..', 'client', 'build')
      ]) {
        try {
          const soundsDir = pathModule.join(baseDir, 'sounds');
          if (fs.existsSync(soundsDir)) {
            console.log(`[DEBUG] Directory exists: ${soundsDir}`);
            console.log(`[DEBUG] Contents: ${fs.readdirSync(soundsDir).join(', ')}`);
          } else {
            console.log(`[DEBUG] Directory does not exist: ${soundsDir}`);
            // Check if base dir exists
            if (fs.existsSync(baseDir)) {
              console.log(`[DEBUG] Base directory exists: ${baseDir}`);
              console.log(`[DEBUG] Base dir contents: ${fs.readdirSync(baseDir).join(', ')}`);
            } else {
              console.log(`[DEBUG] Base directory does not exist: ${baseDir}`);
            }
          }
        } catch (dirError) {
          console.log(`[DEBUG] Error checking directory ${baseDir}/sounds:`, dirError.message);
        }
      }
      
      let soundPath = null;
      let soundExists = false;
      
      for (const testPath of possiblePaths) {
        console.log('[DEBUG] Testing path:', testPath);
        try {
          if (fs.existsSync(testPath)) {
            soundPath = testPath;
            soundExists = true;
            console.log('[DEBUG] Found sound file at:', testPath);
            
            // Get file stats
            const stats = fs.statSync(testPath);
            console.log('[DEBUG] File stats:', {
              size: stats.size + ' bytes',
              isFile: stats.isFile(),
              created: stats.birthtime,
              modified: stats.mtime
            });
            
            break;
          }
        } catch (pathError) {
          console.log(`[DEBUG] Error checking path ${testPath}:`, pathError.message);
        }
      }
      
      // Check if file exists
      if (!soundExists) {
        console.log('[DEBUG] Sound file not found in any location');
        
        // Check if we can find any sound files to help diagnose the issue
        let availableSoundFiles = [];
        try {
          const soundDirs = [
            pathModule.join(process.cwd(), 'client', 'public', 'sounds'),
            pathModule.join(process.cwd(), 'client', 'build', 'sounds'),
            pathModule.join('/opt/build/repo/client/build/sounds'),
            pathModule.join(__dirname, '..', '..', 'client', 'public', 'sounds'),
            pathModule.join(__dirname, '..', '..', 'client', 'build', 'sounds'),
          ];
          
          for (const dir of soundDirs) {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              if (files.length > 0) {
                availableSoundFiles.push({ directory: dir, files });
              }
            }
          }
        } catch (err) {
          console.error('[DEBUG] Error finding available sound files:', err);
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Sound file not found',
            filename: filename,
            searchedPaths: possiblePaths,
            availableSoundFiles,
            environment: {
              NODE_ENV: process.env.NODE_ENV,
              NETLIFY: process.env.NETLIFY,
              cwd: process.cwd(),
              dirname: __dirname
            }
          })
        };
      }
      
      // Read and return the file
      const fileData = fs.readFileSync(soundPath);
      
      // Determine correct content type based on extension
      let contentType = 'audio/mpeg'; // Default for MP3
      if (filename.endsWith('.wav')) {
        contentType = 'audio/wav';
      } else if (filename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      }
      
      console.log('[DEBUG] Serving sound file with content-type:', contentType, 'size:', fileData.length, 'bytes');
      
      // Return the sound file with proper headers
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': contentType,
          'Content-Length': fileData.length,
          'Cache-Control': 'public, max-age=86400' // Cache for 1 day
        },
        body: fileData.toString('base64'),
        isBase64Encoded: true
      };
    } catch (error) {
      console.error('[ERROR] Error serving sound file:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Error serving sound file',
          message: error.message,
          stack: error.stack,
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            NETLIFY: process.env.NETLIFY,
            cwd: process.cwd(),
            dirname: __dirname
          }
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
};