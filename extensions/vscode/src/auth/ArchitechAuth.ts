import * as vscode from "vscode";

export interface ArchitechUser {
  id: string;
  email: string;
  name?: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
}

export interface AuthResponse {
  status: "success" | "error";
  content?: {
    token: string;
    user: ArchitechUser;
  };
  error?: string;
}

export class ArchitechAuthService {
  private static readonly AUTH_BASE_URL = "http://192.168.100.22:5000";
  private static readonly TOKEN_KEY = "architech_token";
  private static readonly USER_KEY = "architech_user";

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Authenticate user with email/password
   */
  async login(email: string, password: string, isSignup: boolean = false): Promise<AuthResponse> {
    try {
      console.log("ArchitechAuthService.login called:", { email, isSignup });
      
      const response = await fetch(`${ArchitechAuthService.AUTH_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          action: isSignup ? "signup" : "login",
        }),
      });

      console.log("HTTP response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("HTTP error response:", errorData);
        return {
          status: "error",
          error: errorData.error || `HTTP error! status: ${response.status}`,
        };
      }

      const data = await response.json();
      console.log("HTTP response data:", JSON.stringify(data, null, 2));
      
      // If successful, store the token and user data
      if (data.status === "success" && data.content) {
        console.log("Attempting to store auth data:", { 
          hasToken: !!data.content.token, 
          hasUser: !!data.content.user 
        });
        await this.storeAuthData(data.content.token, data.content.user);
      }

      return data;
    } catch (error) {
      console.error("ArchitechAuthService.login error:", error);
      return {
        status: "error",
        error: (error as Error).message || "Network error occurred",
      };
    }
  }

  /**
   * Verify stored token is still valid
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: ArchitechUser }> {
    try {
      const response = await fetch(`${ArchitechAuthService.AUTH_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      if (data.status === "success" && data.content?.user) {
        return { valid: true, user: data.content.user };
      }

      return { valid: false };
    } catch (error) {
      console.error("Token verification failed:", error);
      return { valid: false };
    }
  }

  /**
   * Store authentication data securely
   */
  async storeAuthData(token: string, user: ArchitechUser): Promise<void> {
    await this.context.secrets.store(ArchitechAuthService.TOKEN_KEY, token);
    await this.context.secrets.store(ArchitechAuthService.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get stored authentication data
   */
  async getStoredAuthData(): Promise<{ token: string; user: ArchitechUser } | null> {
    try {
      const token = await this.context.secrets.get(ArchitechAuthService.TOKEN_KEY);
      const userStr = await this.context.secrets.get(ArchitechAuthService.USER_KEY);

      if (!token || !userStr) {
        return null;
      }

      const user = JSON.parse(userStr) as ArchitechUser;
      
      // Verify token is still valid
      const verification = await this.verifyToken(token);
      if (!verification.valid) {
        // Token expired, clear stored data
        await this.clearAuthData();
        return null;
      }

      return { token, user: verification.user || user };
    } catch (error) {
      console.error("Failed to retrieve stored auth data:", error);
      await this.clearAuthData(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear stored authentication data
   */
  async clearAuthData(): Promise<void> {
    await this.context.secrets.delete(ArchitechAuthService.TOKEN_KEY);
    await this.context.secrets.delete(ArchitechAuthService.USER_KEY);
  }

  /**
   * Get current authentication token for API calls
   */
  async getAuthToken(): Promise<string | null> {
    const authData = await this.getStoredAuthData();
    return authData?.token || null;
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const authData = await this.getStoredAuthData();
    return !!authData;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<ArchitechUser | null> {
    const authData = await this.getStoredAuthData();
    return authData?.user || null;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.clearAuthData();
  }
} 