import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // Using axios for consistency if other components use it

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken')); // Load token from storage initially
    const [loading, setLoading] = useState(true); // Add loading state for initial auth check

    // Setup Axios interceptor
    useEffect(() => {
        let isActive = true; // Flag to prevent state updates on unmounted component

        const initializeAuth = async () => {
            // Ensure loading is true at the start of initialization
            if (isActive) setLoading(true);

            if (token) {
                // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Handled by interceptor now
                localStorage.setItem('authToken', token);
                try {
                    // Handle both JWT tokens and our custom netlify tokens
                    let decodedPayload;
                    if (token.startsWith('netlify.')) {
                        // Custom netlify token format: netlify.{base64payload}.signature
                        const payloadBase64 = token.split('.')[1];
                        decodedPayload = JSON.parse(atob(payloadBase64));
                    } else {
                        // Standard JWT token
                        const payloadBase64 = token.split('.')[1];
                        decodedPayload = JSON.parse(atob(payloadBase64));
                    }
                    
                    // Create the basic user object
                    const baseUser = {
                        id: decodedPayload.id,
                        auth_id: decodedPayload.auth_id,
                        role: decodedPayload.role
                    };
                    
                    // Set user only if component is still active
                    if (isActive) {
                        setUser(baseUser);
                        
                        // If user is a teacher, fetch their classrooms
                        if (decodedPayload.role === 'teacher') {
                            try {
                                // Fetch classrooms for the teacher
                                const classroomsResponse = await axios.get(`/api/teachers/${decodedPayload.id}/classrooms`);
                                
                                if (isActive && classroomsResponse.data) {
                                    // Update user with classrooms data
                                    setUser(prevUser => ({
                                        ...prevUser,
                                        classrooms: classroomsResponse.data
                                    }));
                                    console.log('Teacher classrooms loaded:', classroomsResponse.data);
                                }
                            } catch (classroomsError) {
                                console.error("Failed to fetch teacher's classrooms:", classroomsError);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to decode token:", error);
                    // Clear invalid token and user state only if active
                    if (isActive) {
                        setToken(null); // This will trigger the effect again
                        setUser(null);
                        localStorage.removeItem('authToken');
                        // delete axios.defaults.headers.common['Authorization']; // Handled by interceptor now
                    }
                }
            } else {
                localStorage.removeItem('authToken');
                // delete axios.defaults.headers.common['Authorization']; // Handled by interceptor now
                // Clear user state only if active
                if (isActive) {
                    setUser(null);
                }
            }
            
            // Set loading false only if component is still active *after* potential state updates
            if (isActive) {
                setLoading(false);
            }
        };

        initializeAuth();

        // Cleanup function
        return () => {
            isActive = false;
        };
    }, [token]); // This effect still handles user state based on token presence/validity

    // Setup Axios interceptor to add token to requests
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                // Get the latest token directly from state or localStorage
                const currentToken = localStorage.getItem('authToken'); // Or use token state if preferred
                if (currentToken) {
                    config.headers['Authorization'] = `Bearer ${currentToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on component unmount
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
        };
    }, []); // Run this interceptor setup only once on mount

    const login = async (emailOrUsername, password, isStudent = false) => {
        // Determine if we're dealing with email or username
        const isUsername = isStudent || !emailOrUsername.includes('@');
        const loginData = isUsername 
            ? { username: emailOrUsername, password }
            : { email: emailOrUsername, password };
        // Development mode - enable mock authentication for easy testing and demos
        if (process.env.NODE_ENV !== 'production') {
            // Check for special development accounts
            if (emailOrUsername === 'admin@example.com' && password === 'admin123') {
                console.warn('⚠️ DEVELOPMENT MODE: Using mock admin authentication');
                const mockToken = `dev-token-admin-${Date.now()}`;
                const mockUser = { id: 999, auth_id: emailOrUsername, role: 'admin' };
                
                // Store in localStorage
                localStorage.setItem('authToken', mockToken);
                
                // Update auth state
                setUser(mockUser);
                setToken(mockToken);
                
                return { user: mockUser, role: 'admin', token: mockToken };
            }
            
            if (emailOrUsername === 'teacher@example.com' && password === 'teacher123') {
                console.warn('⚠️ DEVELOPMENT MODE: Using mock teacher authentication');
                const mockToken = `dev-token-teacher-${Date.now()}`;
                const mockUser = { 
                    id: 888, 
                    auth_id: emailOrUsername, 
                    role: 'teacher',
                    classrooms: [
                        { id: 1, name: 'Grade 3A', description: 'Mock classroom' },
                        { id: 2, name: 'Grade 4B', description: 'Mock classroom' }
                    ]
                };
                
                localStorage.setItem('authToken', mockToken);
                setUser(mockUser);
                setToken(mockToken);
                
                return { user: mockUser, role: 'teacher', token: mockToken };
            }
            
            if ((emailOrUsername === 'student@example.com' || emailOrUsername === 'student123') && password === 'student123') {
                console.warn('⚠️ DEVELOPMENT MODE: Using mock student authentication');
                const mockToken = `dev-token-student-${Date.now()}`;
                const mockUser = { 
                    id: 777, 
                    auth_id: emailOrUsername === 'student123' ? 'student@example.com' : emailOrUsername, 
                    username: emailOrUsername === 'student123' ? 'student123' : undefined,
                    role: 'student',
                    grade_level: 3,
                    name: 'Juan Dela Cruz'
                };
                
                localStorage.setItem('authToken', mockToken);
                setUser(mockUser);
                setToken(mockToken);
                
                return { user: mockUser, role: 'student', token: mockToken };
            }
            
            if (emailOrUsername === 'parent@example.com' && password === 'parent123') {
                console.warn('⚠️ DEVELOPMENT MODE: Using mock parent authentication');
                const mockToken = `dev-token-parent-${Date.now()}`;
                const mockUser = { 
                    id: 666, 
                    auth_id: emailOrUsername, 
                    role: 'parent',
                    students: [
                        { id: 101, name: 'Mock Child 1', grade: 3 },
                        { id: 102, name: 'Mock Child 2', grade: 4 }
                    ]
                };
                
                localStorage.setItem('authToken', mockToken);
                setUser(mockUser);
                setToken(mockToken);
                
                return { user: mockUser, role: 'parent', token: mockToken };
            }
        }
        
        // Normal authentication flow for production or non-mock logins
        try {
            const response = await axios.post('/api/auth/login', loginData);
            
            // Check if response exists and has data
            if (!response || !response.data) {
                console.error("Login error: Empty response or missing data");
                throw new Error('Login failed: Server returned an invalid response');
            }
            
            // Check if token exists
            if (!response.data.token) {
                console.error("Login error: No token in response", response.data);
                throw new Error('Login failed: Authentication token missing');
            }
            
            const token = response.data.token;
            const user = response.data.user || {}; // Provide empty object as fallback
            const role = response.data.role || 'student'; // Provide default role as fallback
            
            // Safely construct the user object with the role included
            const userWithRole = { 
                id: user.id || 0, 
                auth_id: user.auth_id || emailOrUsername, 
                username: user.username,
                role: role 
            };
            
            // Set token state first to enable authenticated requests
            setToken(token);
            
            // If user is a teacher, fetch their classrooms
            if (role === 'teacher' && user.id) {
                try {
                    // Fetch classrooms for the teacher
                    const classroomsResponse = await axios.get(`/api/teachers/${user.id}/classrooms`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (classroomsResponse && classroomsResponse.data) {
                        // Add classrooms to the user object
                        userWithRole.classrooms = classroomsResponse.data;
                        console.log('Teacher classrooms loaded during login:', classroomsResponse.data);
                    }
                } catch (classroomsError) {
                    console.error("Failed to fetch teacher's classrooms during login:", classroomsError);
                    // Continue without classroom data if fetch fails
                    userWithRole.classrooms = [];
                }
            }
            
            // Set user state now with all data including potentially classrooms
            setUser(userWithRole);
            
            // Return the complete user object with safe fallbacks
            return { 
                user: userWithRole, 
                role: role, 
                token: token 
            };
        } catch (error) {
            // Clear token/user state on login failure
            setToken(null);
            setUser(null);
            
            // Enhanced error logging
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Login error (server response):", {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Login error (no response):", error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Login error:", error.message || error);
            }
            
            // Create a standardized error object to return
            let errorMessage = 'Login failed';
            
            // Ensure we have a string message, not an object
            if (error.response?.data?.error) {
                errorMessage = typeof error.response.data.error === 'string' 
                    ? error.response.data.error 
                    : 'Server error occurred';
            } else if (error.message && typeof error.message === 'string') {
                errorMessage = error.message;
            }
            
            const errorObj = {
                message: errorMessage,
                code: error.response?.status || 500
            };
            
            throw errorObj; // Throw a standardized error object
        }
    };

    // Enhanced signup function to handle multi-step registration
    const signup = async (userData) => {
        try {
            // Determine endpoint based on role
            const role = userData.role || 'student'; // Default to student if role not provided
            const endpoint = `/api/auth/register/${role}`;

            const response = await axios.post(endpoint, userData);
            
            // Add more detailed user information to the response
            let userDetails = {};
            
            // Depending on the role, add role-specific fields
            if (role === 'student') {
                userDetails = {
                    student: response.data.student || {}
                };
            } else if (role === 'teacher') {
                userDetails = {
                    teacher: response.data.teacher || {}
                };
            } else if (role === 'parent') {
                userDetails = {
                    parent: response.data.parent || {}
                };
            }
            
            // Return combined response with user details for subsequent API calls
            return {
                ...response.data,
                ...userDetails
            };
        } catch (error) {
            console.error("Signup error in AuthContext:", error.response?.data?.error || error.message);
            throw error; // Re-throw error to be handled by the component
        }
    };


    const logout = () => {
        setToken(null); // This triggers the useEffect to clear headers, storage, and user state
    };

    // Value provided to context consumers
    const value = {
        user,
        token,
        loading, // Provide loading state
        login,
        signup, // Provide signup function
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = () => {
    return useContext(AuthContext);
};
