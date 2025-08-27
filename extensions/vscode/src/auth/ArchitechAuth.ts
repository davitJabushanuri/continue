import { getControlPlaneEnvSync } from "core/control-plane/env";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";

import { API_URL } from "../../../../config";

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
  private static readonly AUTH_BASE_URL = API_URL;
  private static readonly TOKEN_KEY = "architech_token";
  private static readonly USER_KEY = "architech_user";

  // WorkOsAuthProvider compatibility
  private static readonly controlPlaneEnv = getControlPlaneEnvSync(true ? "production" : "none");
  private static readonly SESSIONS_SECRET_KEY = `${ArchitechAuthService.controlPlaneEnv.AUTH_TYPE}.sessions`;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Create a WorkOsAuthProvider-compatible session from ArchitechAuth data
   * This bridges the two authentication systems
   */
  private async createWorkOsSession(token: string, user: ArchitechUser): Promise<void> {
    try {
      const session = {
        id: uuidv4(),
        accessToken: token,
        account: {
          id: user.id,
          label: user.email,
        },
        scopes: [],
        refreshToken: "", // We don't have refresh tokens in ArchitechAuth
        expiresInMs: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        loginNeeded: false,
      };

      console.log("ArchitechAuthService: Creating WorkOs session for user:", user.email);
      
      // Store the session in WorkOsAuthProvider format
      const sessions = [session];
      const data = JSON.stringify(sessions, null, 2);
      await this.context.secrets.store(ArchitechAuthService.SESSIONS_SECRET_KEY, data);
      
      console.log("ArchitechAuthService: WorkOs session created successfully");
    } catch (error) {
      console.error("ArchitechAuthService: Failed to create WorkOs session:", error);
    }
  }

  /**
   * Authenticate user with email/password
   */
  async login(
    email: string,
    password: string,
    isSignup: boolean = false,
  ): Promise<AuthResponse> {
    try {
      console.log("ArchitechAuthService.login called:", { email, isSignup });

      const response = await fetch(
        `${ArchitechAuthService.AUTH_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            action: isSignup ? "signup" : "login",
          }),
        },
      );

      console.log(
        "HTTP response status:",
        response.status,
        response.statusText,
      );

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
          hasUser: !!data.content.user,
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
  async verifyToken(
    token: string,
  ): Promise<{ valid: boolean; user?: ArchitechUser }> {
    try {
      const response = await fetch(
        `${ArchitechAuthService.AUTH_BASE_URL}/auth/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        },
      );

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
    await this.context.secrets.store(
      ArchitechAuthService.USER_KEY,
      JSON.stringify(user),
    );

    // Create a compatible session for WorkOsAuthProvider
    await this.createWorkOsSession(token, user);
  }

  /**
   * Get stored authentication data
   */
  async getStoredAuthData(): Promise<{
    token: string;
    user: ArchitechUser;
  } | null> {
    try {
      const token = await this.context.secrets.get(
        ArchitechAuthService.TOKEN_KEY,
      );
      const userStr = await this.context.secrets.get(
        ArchitechAuthService.USER_KEY,
      );

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
