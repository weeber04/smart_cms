import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  userId: number;
  role: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001/api';
axios.defaults.withCredentials = true;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Login function
const login = async (email: string, password: string): Promise<void> => {
  setIsLoading(true);
  try {
    console.log('Attempting login for:', email);
    
    const response = await axios.post('/auth/login', { email, password }, {
      timeout: 10000,
      validateStatus: (status) => {
        return status >= 200 && status < 500;
      }
    });
    
    if (response.status === 401) {
      const errorData = response.data;
      const errorMessage = errorData?.error || 'Invalid email or password';
      throw new Error(errorMessage);
    }
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }
    
    const { userId, role, name, email: userEmail, token: authToken } = response.data;
    
    // Save to state
    const userData: User = { userId, role, name, email: userEmail };
    setUser(userData);
    setToken(authToken);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    
    // Set axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('✅ Login successful for:', userEmail);
    
  } catch (error: any) {
    console.error('🔥 Login failed in AuthContext:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    // Re-throw a NEW error object to ensure it propagates correctly
    throw new Error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear everything
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log('👋 User logged out');
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    console.log('Token refresh called');
    return false;
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          await axios.get('/auth/check');
          console.log('✅ User authenticated from localStorage');
        }
      } catch (error) {
        console.log('❌ Auto-login failed, clearing storage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Axios response interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Skip 401 handling for login endpoint entirely
        const isLoginEndpoint = originalRequest.url?.includes('/auth/login');
        
        if (isLoginEndpoint) {
          console.log('Login endpoint 401 - skipping auto logout');
          return Promise.reject(error);
        }
        
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - logging out (non-login endpoint)');
          logout();
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};