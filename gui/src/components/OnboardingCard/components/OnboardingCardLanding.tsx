import { useArchitechAuth } from "../../../context/ArchitechAuth";
import { OnboardingLogin } from "./OnboardingLogin";

export function OnboardingCardLanding({
  onSelectConfigure,
  isDialog,
}: {
  onSelectConfigure: () => void;
  isDialog?: boolean;
}) {
  const { isAuthenticated, login } = useArchitechAuth();

  const handleLoginSuccess = (token: string, user: any) => {
    login(token, user);
    // After successful login, the onboarding flow is complete
    // The parent component will handle closing or navigation
  };

  // If already authenticated, onboarding is complete
  if (isAuthenticated) {
    return null; // Or you could return a completion message
  }

  // If not authenticated, show login form
  return (
    <div className="w-full px-4 py-6">
      <OnboardingLogin
        onLoginSuccess={handleLoginSuccess}
        onSkipLogin={() => {}} // Empty function - skip is not allowed
        isDialog={isDialog}
      />
    </div>
  );
}
