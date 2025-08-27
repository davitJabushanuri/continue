import React, { createContext, useContext, useEffect, useState } from "react";
import { IdeMessengerContext } from "./IdeMessenger";

interface User {
  id: string;
  email: string;
  name?: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
}

interface ArchitechAuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const ArchitechAuthContext = createContext<ArchitechAuthContextType | undefined>(undefined);

export const ArchitechAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ideMessenger = useContext(IdeMessengerContext);

  useEffect(() => {
    const loadStoredAuth = async () => {
      console.log("ArchitechAuth: Loading stored auth...");
      try {
        const result = await ideMessenger.request("auth/getStoredToken", {});
        console.log("ArchitechAuth: getStoredToken result:", result);
        
        if (result.status === "success" && result.content) {
          console.log("ArchitechAuth: Raw result.content:", JSON.stringify(result.content, null, 2));
          
          // The content has a nested structure: { status: "success", content: { token, user } }
          const nestedContent = result.content as unknown as { 
            status: string; 
            content: { token: string; user: User } 
          };
          
          if (nestedContent.content && nestedContent.content.token && nestedContent.content.user) {
            console.log("ArchitechAuth: Setting token and user:", { 
              tokenExists: !!nestedContent.content.token, 
              userExists: !!nestedContent.content.user,
              userEmail: nestedContent.content.user.email 
            });
            setToken(nestedContent.content.token);
            setUser(nestedContent.content.user);
          } else {
            console.log("ArchitechAuth: Missing token or user in nested content");
          }
        } else {
          console.log("ArchitechAuth: No stored auth found or error:", result);
        }
      } catch (error) {
        console.error("ArchitechAuth: Failed to load stored auth:", error);
      } finally {
        console.log("ArchitechAuth: Setting isLoading to false");
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, [ideMessenger]);

  const login = (newToken: string, newUser: User) => {
    if (!newToken || !newUser) {
      console.error("ArchitechAuth.login called with invalid data:", { 
        tokenExists: !!newToken, 
        userExists: !!newUser,
        newUser 
      });
      return;
    }

    console.log("ArchitechAuth.login called with valid data:", {
      tokenExists: !!newToken,
      userExists: !!newUser,
      userEmail: newUser?.email
    });

    setToken(newToken);
    setUser(newUser);
    
    ideMessenger.post("auth/storeToken", { token: newToken, user: newUser });
  };

  const logout = () => {
    console.log("ArchitechAuth: Logging out");
    setToken(null);
    setUser(null);
    
    ideMessenger.post("auth/clearToken", {});
  };

  const contextValue = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    isLoading,
  };

  console.log("ArchitechAuth: Provider render:", contextValue);

  return (
    <ArchitechAuthContext.Provider value={contextValue}>
      {children}
    </ArchitechAuthContext.Provider>
  );
};

export const useArchitechAuth = (): ArchitechAuthContextType => {
  const context = useContext(ArchitechAuthContext);
  if (!context) {
    throw new Error("useArchitechAuth must be used within an ArchitechAuthProvider");
  }
  return context;
}; 