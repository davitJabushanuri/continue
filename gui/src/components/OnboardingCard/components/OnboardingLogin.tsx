import { useContext, useState } from "react";
import { Button } from "../..";
import { IdeMessengerContext } from "../../../context/IdeMessenger";
import ArchitechLogo from "../../svg/ArchitechLogo";

interface LoginCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  company?: string;
}

interface OnboardingLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onSkipLogin: () => void;
  isDialog?: boolean;
}

export function OnboardingLogin({ onLoginSuccess, onSkipLogin, isDialog }: OnboardingLoginProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({ 
    email: "", 
    password: "",
    confirmPassword: "",
    company: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const ideMessenger = useContext(IdeMessengerContext);

  const validateForm = () => {
    if (!credentials.email || !credentials.password) {
      setError("Please fill in all required fields");
      return false;
    }

    if (isSignup) {
      if (!credentials.confirmPassword) {
        setError("Please fill in all required fields");
        return false;
      }
      
      if (credentials.password !== credentials.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }

      if (credentials.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = isSignup ? {
        email: credentials.email,
        password: credentials.password,
        company: credentials.company,
        isSignup,
      } : {
        email: credentials.email,
        password: credentials.password,
        isSignup,
      };

      const response = await ideMessenger.request("auth/login", payload);

      if (response.status === "success" && response.content) {
        console.log("Full auth response:", JSON.stringify(response, null, 2));
        console.log("Response content:", response.content);
        console.log("Content keys:", Object.keys(response.content));
        
        // Check if the inner content has an error status
        const content = response.content as any;
        if (content.status === "error") {
          setError(content.error || "Authentication failed");
          return;
        }
        
        // Handle double-nested structure: response.content.content contains token and user
        const authData = content.content || content;
        const { token, user } = authData;
        
        console.log("Extracted values:", { 
          token: token, 
          user: user,
          tokenType: typeof token,
          userType: typeof user
        });
        
        // Validate that we have valid token and user data
        if (!token || !user) {
          console.error("Invalid auth response:", { token: !!token, user: !!user, response });
          setError("Authentication failed - invalid response");
          return;
        }

        console.log("Login successful, calling onLoginSuccess with:", { 
          tokenExists: !!token, 
          userExists: !!user,
          userEmail: user?.email 
        });
        
        onLoginSuccess(token, user);
        ideMessenger.post("showToast", ["info", `Welcome ${user.name || user.email}!`]);
      } else {
        setError((response as any).error || "Authentication failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <ArchitechLogo height={60} />
        </div>
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {isSignup ? "Create Account" : "Sign In"}
        </h1>
        <p className="text-sm text-description">
          {isSignup 
            ? "Create your ArchiTech account to get started" 
            : "Sign in to your ArchiTech account"
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div className="grid">
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
              Company/Organization
            </label>
            <input
              id="company"
              type="text"
              value={credentials.company || ""}
              onChange={(e) => handleInputChange("company", e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your company or organization"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="grid">
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div className="grid">
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={isSignup ? "Create a password (min. 8 characters)" : "Enter your password"}
            disabled={isLoading}
          />
        </div>

        {isSignup && (
          <div className="grid">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={credentials.confirmPassword || ""}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{isSignup ? "Creating Account..." : "Signing In..."}</span>
            </div>
          ) : (
            isSignup ? "Create Account" : "Sign In"
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
            disabled={isLoading}
          >
            {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
        </div>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
} 