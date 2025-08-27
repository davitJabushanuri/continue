import { useState } from "react";
import { useArchitechAuth } from "../../../context/ArchitechAuth";
import { OnboardingLogin } from "./OnboardingLogin";
import { OnboardingModelSelection } from "./OnboardingModelSelection";

export function OnboardingCardLanding({
  onSelectConfigure,
  isDialog,
}: {
  onSelectConfigure: () => void;
  isDialog?: boolean;
}) {
  const { isAuthenticated, login } = useArchitechAuth();
  const [showModelSelection, setShowModelSelection] = useState(false);

  const handleLoginSuccess = (token: string, user: any) => {
    login(token, user);
    setShowModelSelection(true);
  };

  // If already authenticated, show model selection
  if (isAuthenticated && showModelSelection) {
    return (
      <div className="w-full px-4 py-6">
        <OnboardingModelSelection isDialog={isDialog} />
      </div>
    );
  }

  // If authenticated but haven't shown model selection yet, show it
  if (isAuthenticated) {
    return (
      <div className="w-full px-4 py-6">
        <OnboardingModelSelection isDialog={isDialog} />
      </div>
    );
  }

  // If not authenticated, always show login form (no skip option)
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
