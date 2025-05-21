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
                    const payloadBase64 = token.split('.')[1];
                    const decodedPayload = JSON.parse(atob(payloadBase64));
                    
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

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            if (response.data && response.data.token) {
                const { token, user, role } = response.data; // Destructure response
                // Construct the user object with the role included
                const userWithRole = { id: user.id, auth_id: user.auth_id, role: role };
                
                // Set token state first to enable authenticated requests
                setToken(token);
                
                // If user is a teacher, fetch their classrooms
                if (role === 'teacher') {
                    try {
                        // Fetch classrooms for the teacher
                        const classroomsResponse = await axios.get(`/api/teachers/${user.id}/classrooms`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        if (classroomsResponse.data) {
                            // Add classrooms to the user object
                            userWithRole.classrooms = classroomsResponse.data;
                            console.log('Teacher classrooms loaded during login:', classroomsResponse.data);
                        }
                    } catch (classroomsError) {
                        console.error("Failed to fetch teacher's classrooms during login:", classroomsError);
                    }
                }
                
                // Set user state now with all data including potentially classrooms
                setUser(userWithRole);
                
                // Return the complete user object
                return { 
                    user: userWithRole, 
                    role: role, 
                    token: token 
                };
            } else {
                throw new Error('Login failed: No token received');
            }
        } catch (error) {
            console.error("Login error in AuthContext:", error.response?.data?.error || error.message);
            // Clear token/user state on login failure
            setToken(null);
            setUser(null);
            throw error; // Re-throw error to be caught by the component
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
