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
  
  // Auth signup/register endpoint - /api/auth/register/{role}
  if (path.includes('/auth/register') && httpMethod === 'POST') {
    try {
      const userData = JSON.parse(event.body);
      console.log('Signup attempt for:', userData.email);
      
      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
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
        
        if (role === 'admin') {
          const { data, error } = await supabase
            .from('admins')
            .insert([{
              auth_id: userData.email,
              name: userData.name || 'New Admin',
              email: userData.email
            }])
            .select()
            .single();
          
          if (error) throw error;
          dbResult = { admin: data };
        } else if (role === 'teacher') {
          const { data, error } = await supabase
            .from('teachers')
            .insert([{
              auth_id: userData.email,
              name: userData.name || 'New Teacher',
              email: userData.email,
              subject: userData.subject || 'Mathematics'
            }])
            .select()
            .single();
          
          if (error) throw error;
          dbResult = { teacher: data };
        } else if (role === 'student') {
          const { data, error } = await supabase
            .from('students')
            .insert([{
              auth_id: userData.email,
              name: userData.name || 'New Student',
              email: userData.email,
              grade_level: userData.grade_level || 3
            }])
            .select()
            .single();
          
          if (error) throw error;
          dbResult = { student: data };
        } else if (role === 'parent') {
          const { data, error } = await supabase
            .from('parents')
            .insert([{
              auth_id: userData.email,
              name: userData.name || 'New Parent',
              email: userData.email
            }])
            .select()
            .single();
          
          if (error) throw error;
          dbResult = { parent: data };
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
      console.log('Login attempt for:', email);
      
      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL || 'https://aiablmdmxtssbcvtpudw.supabase.co';
      const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJsbWRteHRzc2JjdnRwdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzYwMTIsImV4cCI6MjA2MzIxMjAxMn0.S8XpKejrnsmlGAvq8pAIgfHjxSqq5SVCBNEZhdQSXyw';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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
            // Check admin
            const { data: adminData } = await supabase
              .from('admins')
              .select('id, auth_id')
              .eq('auth_id', email)
              .single();
              
            if (adminData) {
              role = 'admin';
              userId = adminData.id;
            } else {
              // Check teacher
              const { data: teacherData } = await supabase
                .from('teachers')
                .select('id, auth_id')
                .eq('auth_id', email)
                .single();
                
              if (teacherData) {
                role = 'teacher';
                userId = teacherData.id;
              } else {
                // Check student
                const { data: studentData } = await supabase
                  .from('students')
                  .select('id, auth_id')
                  .eq('auth_id', email)
                  .single();
                  
                if (studentData) {
                  role = 'student';
                  userId = studentData.id;
                } else {
                  // Check parent
                  const { data: parentData } = await supabase
                    .from('parents')
                    .select('id, auth_id')
                    .eq('auth_id', email)
                    .single();
                    
                  if (parentData) {
                    role = 'parent';
                    userId = parentData.id;
                  }
                }
              }
            }
          } catch (profileError) {
            console.warn('Error fetching user profile:', profileError.message);
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              token: data.session?.access_token || 'netlify-supabase-token',
              user: { id: userId, auth_id: email },
              role
            })
          };
        }
      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError);
      }
      
      // Fallback to test accounts
      console.log('Using test account fallback');
      
      if (email === 'admin@example.com' && password === 'admin123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: 'netlify-admin-token',
            user: { id: 999, auth_id: email },
            role: 'admin'
          })
        };
      }
      
      if (email === 'teacher@example.com' && password === 'teacher123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: 'netlify-teacher-token',
            user: { id: 888, auth_id: email },
            role: 'teacher'
          })
        };
      }
      
      if (email === 'student@example.com' && password === 'student123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: 'netlify-student-token',
            user: { id: 777, auth_id: email },
            role: 'student'
          })
        };
      }
      
      if (email === 'parent@example.com' && password === 'parent123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: 'netlify-parent-token',
            user: { id: 666, auth_id: email },
            role: 'parent'
          })
        };
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Invalid credentials',
          message: 'Use test accounts: admin@example.com/admin123, teacher@example.com/teacher123, student@example.com/student123, parent@example.com/parent123'
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
  
  // Default response
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({
      error: 'Not found',
      path: path,
      method: httpMethod,
      availableEndpoints: ['/api/hello', '/api/auth/login']
    })
  };
};