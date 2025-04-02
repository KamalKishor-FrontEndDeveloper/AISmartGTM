import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type User = {
  id: number;
  fullName: string;
  email: string;
  credits: number;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  isAuthenticated: boolean;
  fetchUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The AuthProvider component
export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        return;
      }
      
      const data = await apiRequest("/api/user/profile");
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      localStorage.removeItem("authToken");
      setUser(null);
      throw error;
    }
  };
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          await fetchUserProfile();
        } catch (error) {
          // Invalid token or other error
          localStorage.removeItem("authToken");
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const data = await apiRequest("/api/auth/signup/step4", {
        method: "POST",
        body: JSON.stringify({
          ...userData,
          preferences: userData.preferences || ["contact_search", "email_enrichment", "ai_messaging"]
        })
      });
      
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    fetchUserProfile
  };

  // Use createElement instead of JSX syntax to avoid parsing issues
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    props.children
  );
}

// The useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
