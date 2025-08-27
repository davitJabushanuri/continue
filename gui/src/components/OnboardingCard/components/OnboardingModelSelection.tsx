import { OnboardingModes } from "core/protocol/core";
import { useState } from "react";
import { Button } from "../..";
import { useSubmitOnboarding } from "../hooks/useSubmitOnboarding";

interface ModelOption {
  id: string;
  name: string;
  description: string;
  model: string;
  contextLength: number;
  parameters: string;
}

const PREBUILT_MODELS: ModelOption[] = [
  {
    id: "qwen-max",
    name: "Qwen-Max",
    description: "Most capable model - best for complex reasoning",
    model: "qwen-max",
    contextLength: 32000,
    parameters: "Max",
  },
  {
    id: "qwen-3-coder",
    name: "Qwen-3-Coder",
    description: "Specialized for coding tasks - optimized for development",
    model: "qwen-3-coder",
    contextLength: 32000,
    parameters: "3B",
  },
];

interface OnboardingModelSelectionProps {
  isDialog?: boolean;
}

export function OnboardingModelSelection({ isDialog }: OnboardingModelSelectionProps) {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(PREBUILT_MODELS[0]);
  const { submitOnboarding } = useSubmitOnboarding(OnboardingModes.API_KEY, isDialog);

  const handleSubmit = () => {
    submitOnboarding("architech", JSON.stringify(selectedModel));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Choose Your Model</h2>
        <p className="text-sm text-description">Select a Qwen model to get started</p>
      </div>

      <div className="space-y-2 mb-6">
        {PREBUILT_MODELS.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedModel?.id === model.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-border hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => setSelectedModel(model)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm text-foreground">{model.name}</h3>
                  <span className="text-xs bg-input text-foreground px-1.5 py-0.5 rounded">
                    {model.parameters}
                  </span>
                </div>
                <p className="text-xs text-description">
                  {model.description}
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedModel?.id === model.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-border"
                }`}
              >
                {selectedModel?.id === model.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} className="w-full">
        Start Messaging with {selectedModel.name}
      </Button>
    </div>
  );
} 