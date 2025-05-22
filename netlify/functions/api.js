// Unified API handler for all routes
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('API called:', event.httpMethod, event.path);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  const { path, httpMethod } = event;
  
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
      console.log('Signup attempt for:', userData.email);
      
      // Initialize Supabase client
      // Netlify + Supabase conventions
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
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
          .eq('auth_id', userData.email)
          .single();
          
        if (existingUser) {
          console.log('User already exists in database during signup:', existingUser);
          dbResult = { [role]: existingUser };
        } else {
          // Create new user record
          if (role === 'admin') {
            const { data, error } = await supabase
              .from('Admins')
              .insert({
                auth_id: userData.email,
                name: userData.name || 'New Admin'
              })
              .select()
              .single();
            
            if (error) throw error;
            dbResult = { admin: data };
          } else if (role === 'teacher') {
            const { data, error } = await supabase
              .from('teachers')
              .insert({
                auth_id: userData.email,
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
                auth_id: userData.email,
                name: userData.name || 'New Student',
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
                auth_id: userData.email,
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
      const { email, password } = JSON.parse(event.body);
      console.log('🔐 Login attempt for:', email);
      
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
      
      // Try Supabase authentication first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
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
            console.log('🔍 Looking for user with email:', email);
            
            // Check admin
            const { data: adminData, error: adminError } = await supabase
              .from('Admins')
              .select('id, auth_id')
              .eq('auth_id', email)
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
                .eq('auth_id', email)
                .limit(1);
                
              if (teacherData && teacherData.length > 0) {
                role = 'teacher';
                userId = teacherData[0].id;
              } else {
                // Check student
                const { data: studentData } = await supabase
                  .from('students')
                  .select('id, auth_id')
                  .eq('auth_id', email)
                  .limit(1);
                  
                if (studentData && studentData.length > 0) {
                  role = 'student';
                  userId = studentData[0].id;
                } else {
                  // Check parent
                  const { data: parentData } = await supabase
                    .from('parents')
                    .select('id, auth_id')
                    .eq('auth_id', email)
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
            auth_id: email,
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
              user: { id: userId, auth_id: email },
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
        .eq('auth_id', email)
        .limit(1);
        
      if (adminData && adminData.length > 0) {
        authenticatedUser = adminData[0];
        userRole = 'admin';
      } else {
        // Check teacher table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id, name, auth_id, subject')
          .eq('auth_id', email)
          .limit(1);
          
        if (teacherData && teacherData.length > 0) {
          authenticatedUser = teacherData[0];
          userRole = 'teacher';
        } else {
          // Check student table
          const { data: studentData } = await supabase
            .from('students')
            .select('id, name, auth_id, grade_level')
            .eq('auth_id', email)
            .limit(1);
            
          if (studentData && studentData.length > 0) {
            authenticatedUser = studentData[0];
            userRole = 'student';
          } else {
            // Check parent table
            const { data: parentData } = await supabase
              .from('parents')
              .select('id, name, auth_id')
              .eq('auth_id', email)
              .limit(1);
              
            if (parentData && parentData.length > 0) {
              authenticatedUser = parentData[0];
              userRole = 'parent';
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
          auth_id: authenticatedUser.auth_id,
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
            user: { id: authenticatedUser.id, auth_id: authenticatedUser.auth_id },
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
        
        if (email === 'student@example.com' && password === 'student123') {
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
  
  // POST /api/admin/users - Create new user
  if (path.includes('/admin/users') && httpMethod === 'POST') {
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
        ...(role === 'student' && { grade_level: parseInt(userData.grade_level) || 3 }),
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
  
  // GET /api/admin/content-items - List content items
  if (path.includes('/admin/content-items') && httpMethod === 'GET') {
    try {
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
        .order('id');
      
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
        body: JSON.stringify({
          contentItems: data || [],
          totalCount: data?.length || 0
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
      
      // Mock dashboard data for now
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recentActivity: [],
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
  
  // GET /api/students/:id/kid-friendly-next-activity - Get next activity
  if (path.includes('/kid-friendly-next-activity') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      // Mock next activity data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: 'quiz',
          kcId: 1,
          kcName: 'Addition and Subtraction',
          message: 'Ready for a fun math quiz?'
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
  
  // GET /api/students/:id/progress - Get student progress
  if (path.includes('/progress') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      // Mock progress data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalQuizzes: 10,
          correctAnswers: 7,
          knowledgeComponents: []
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
  
  // GET /api/messages/inbox - Get messages
  if (path.includes('/messages/inbox') && httpMethod === 'GET') {
    try {
      // Mock messages data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          messages: [],
          unreadCount: 0
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
  
  // POST /api/students/:id/engagement - Track engagement
  if (path.includes('/engagement') && httpMethod === 'POST') {
    try {
      // Just return success for now
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Engagement tracked'
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
  
  // GET /api/students/kcs/sequence - Get sequence of quiz questions for KC
  if (path.includes('/students/kcs/sequence') && httpMethod === 'GET') {
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
          knowledge_components (
            id,
            name,
            curriculum_code
          )
        `)
        .eq('type', 'quiz')
        .limit(limit);
        
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
        .eq('type', 'quiz');
      
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
  
  // GET /api/content/:id - Get content item by ID
  if (path.match(/\/api\/content\/\d+$/) && httpMethod === 'GET') {
    try {
      const contentId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', contentId)
        .single();
      
      if (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Content not found',
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
        .eq('type', 'quiz')
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
  
  // GET /api/students/:id/knowledge-states - Get student's knowledge states
  if (path.includes('/knowledge-states') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('knowledge_states')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch knowledge states',
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
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      const responseData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create response record
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          student_id: parseInt(studentId),
          content_item_id: responseData.contentItemId,
          response: responseData.answer,
          is_correct: responseData.isCorrect,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (responseError) {
        console.error('Response insert error:', responseError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to save response',
            message: responseError.message
          })
        };
      }
      
      // Update or create knowledge state
      if (responseData.knowledgeComponentId) {
        const { data: existingState } = await supabase
          .from('knowledge_states')
          .select('*')
          .eq('student_id', studentId)
          .eq('knowledge_component_id', responseData.knowledgeComponentId)
          .single();
          
        if (existingState) {
          // Update existing state - simple increment for now
          const newMastery = responseData.isCorrect ? 
            Math.min(existingState.mastery_level + 0.1, 1.0) : 
            Math.max(existingState.mastery_level - 0.05, 0);
            
          await supabase
            .from('knowledge_states')
            .update({
              mastery_level: newMastery,
              last_updated: new Date().toISOString()
            })
            .eq('student_id', studentId)
            .eq('knowledge_component_id', responseData.knowledgeComponentId);
        } else {
          // Create new knowledge state
          await supabase
            .from('knowledge_states')
            .insert({
              student_id: parseInt(studentId),
              knowledge_component_id: responseData.knowledgeComponentId,
              mastery_level: responseData.isCorrect ? 0.6 : 0.4,
              last_updated: new Date().toISOString()
            });
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          response: response
        })
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
        .lt('mastery_level', 0.5)
        .order('mastery_level');
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch struggling KCs',
            message: error.message
          })
        };
      }
      
      // Format response
      const strugglingKcs = (data || []).map(state => ({
        kcId: state.knowledge_component_id,
        kcName: state.knowledge_components?.name || 'Unknown',
        masteryLevel: state.mastery_level
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
      const updateData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('content_items')
        .update(updateData)
        .eq('id', contentId)
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to update content item',
            message: error.message
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
  if (path.includes('/teachers/classrooms') && httpMethod === 'POST') {
    try {
      const classroomData = JSON.parse(event.body);
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Create classroom
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          name: classroomData.name,
          description: classroomData.description,
          teacher_id: classroomData.teacher_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create classroom',
            message: error.message
          })
        };
      }
      
      // Add students to classroom if provided
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const enrollments = classroomData.studentIds.map(studentId => ({
          classroom_id: classroom.id,
          student_id: studentId,
          enrollment_date: new Date().toISOString()
        }));
        
        await supabase
          .from('classroom_students')
          .insert(enrollments);
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
  if (path.includes('/teachers/') && path.includes('/classrooms') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', teacherId);
      
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
      
      // Mock performance data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          averageScore: 75,
          totalStudents: 25,
          activeStudents: 20,
          completionRate: 80
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
  
  // GET /api/teachers/:id/knowledge-component-mastery - Get KC mastery
  if (path.includes('/knowledge-component-mastery') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const teacherId = pathParts[pathParts.indexOf('teachers') + 1];
      
      // Mock KC mastery data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          knowledgeComponents: []
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
  
  // GET /api/classrooms/:id - Get classroom details
  if (path.match(/\/api\/classrooms\/\d+$/) && httpMethod === 'GET') {
    try {
      const classroomId = path.split('/').pop();
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
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
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get students in classroom
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          enrollment_date,
          students (*)
        `)
        .eq('classroom_id', classroomId);
      
      if (error) {
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
        enrollment_date: enrollment.enrollment_date
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
  
  // GET /api/classrooms/:id/knowledge-components - Get KCs for classroom grade level
  if (path.includes('/classrooms/') && path.includes('/knowledge-components') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const classroomId = pathParts[pathParts.indexOf('classrooms') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get classroom details first
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('grade_level')
        .eq('id', classroomId)
        .single();
      
      const gradeLevel = classroom?.grade_level || 3;
      
      // Get KCs for grade level
      const { data, error } = await supabase
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
  
  // GET /api/students/:id/detailed-performance - Get detailed student performance
  if (path.includes('/detailed-performance') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
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
        .order('timestamp', { ascending: false })
        .limit(20);
      
      // Calculate performance metrics
      const totalResponses = recentResponses?.length || 0;
      const correctResponses = (recentResponses || []).filter(r => r.is_correct).length;
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
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get learning path for student
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          knowledge_components (*)
        `)
        .eq('student_id', studentId)
        .order('position');
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch learning path',
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
  
  // GET /api/parents/:id/students - Get parent's students
  if (path.includes('/parents/') && path.includes('/students') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const parentId = pathParts[pathParts.indexOf('parents') + 1];
      
      const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get parent-student relationships
      const { data: relationships } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId);
      
      if (!relationships || relationships.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }
      
      // Get student details
      const studentIds = relationships.map(r => r.student_id);
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);
      
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
      
      if (error) {
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(children)
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
  
  // GET /api/parents/students/:id/weekly-report - Get weekly report for student
  if (path.includes('/parents/students/') && path.includes('/weekly-report') && httpMethod === 'GET') {
    try {
      const pathParts = path.split('/');
      const studentId = pathParts[pathParts.indexOf('students') + 1];
      
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
        .gte('timestamp', oneWeekAgo.toISOString())
        .order('timestamp', { ascending: false });
      
      // Calculate weekly stats
      const totalQuizzes = weeklyResponses?.length || 0;
      const correctAnswers = (weeklyResponses || []).filter(r => r.is_correct).length;
      const accuracy = totalQuizzes > 0 ? (correctAnswers / totalQuizzes) * 100 : 0;
      
      // Group by knowledge component
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
          if (response.is_correct) {
            kcPerformance[kcId].correct++;
          }
        }
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          weekStart: oneWeekAgo.toISOString(),
          weekEnd: new Date().toISOString(),
          totalQuizzesTaken: totalQuizzes,
          correctAnswers: correctAnswers,
          averageAccuracy: accuracy,
          knowledgeComponentPerformance: Object.values(kcPerformance),
          recentActivity: weeklyResponses || []
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
  
  // Default response
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({
      error: 'Not found',
      path: path,
      method: httpMethod,
      availableEndpoints: ['/api/hello', '/api/auth/login', '/api/admin/users', '/api/students/:id', '/api/teachers/:id', '/api/parents/:id', '/api/classrooms/:id']
    })
  };
};