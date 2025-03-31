import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  hostel: string;
  isVerified: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check for existing user session on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try to get user ID from localStorage for the header
        const userId = localStorage.getItem('userId');
        const headers: Record<string, string> = {};
        
        if (userId) {
          headers['user-id'] = userId;
        }

        const res = await fetch("/api/user", {
          credentials: "include",
          headers
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Ensure userId is stored in localStorage
          localStorage.setItem('userId', userData.id.toString());
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    // Store user ID in localStorage for auth headers
    localStorage.setItem('userId', userData.id.toString());
    setLoading(false);
  };

  const logout = async () => {
    try {
      // Call logout API if available
      // await apiRequest("POST", "/api/logout");

      // Remove the user from state and localStorage
      setUser(null);
      localStorage.removeItem('userId');
      navigate("/");
      
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
