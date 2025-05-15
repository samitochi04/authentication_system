import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

// API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Types
interface User {
  id: number;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Configure axios to include credentials
axios.defaults.withCredentials = true;

// Setup axios interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try refreshing the token
        const response = await axios.post(`${API_URL}/auth/refresh-token`);

        // If successful, update the authorization header
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.data.accessToken}`;

          // Retry the original request
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear auth state
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing user on load
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user, accessToken } = response.data;

      // Save to state and localStorage
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);

      // Set the authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Unable to connect to server");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        fullName,
      });

      const { user, accessToken } = response.data;

      // Save to state and localStorage
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);

      // Set the authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Registration failed");
      } else {
        setError("Unable to connect to server");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear everything regardless of API response
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      delete axios.defaults.headers.common["Authorization"];
      setLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};