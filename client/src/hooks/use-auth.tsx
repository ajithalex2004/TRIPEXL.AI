import { createContext, ReactNode, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: user, error, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error("Failed to fetch user");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });
  
  const logout = async () => {
    try {
      // Clear token from local storage
      localStorage.removeItem("token");
      
      // Invalidate the auth query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Optionally send a request to the server to invalidate the session
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
      
      // Force redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isLoading, 
      error: error || null,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}