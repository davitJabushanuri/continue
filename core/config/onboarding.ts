import { ConfigYaml } from "@continuedev/config-yaml";

export const LOCAL_ONBOARDING_PROVIDER_TITLE = "Ollama";
export const LOCAL_ONBOARDING_FIM_MODEL = "qwen2.5-coder:1.5b-base";
export const LOCAL_ONBOARDING_FIM_TITLE = "Qwen2.5-Coder 1.5B";
export const LOCAL_ONBOARDING_CHAT_MODEL = "llama3.1:8b";
export const LOCAL_ONBOARDING_CHAT_TITLE = "Llama 3.1 8B";
export const LOCAL_ONBOARDING_EMBEDDINGS_MODEL = "nomic-embed-text:latest";
export const LOCAL_ONBOARDING_EMBEDDINGS_TITLE = "Nomic Embed";

const ANTHROPIC_MODEL_CONFIG = {
  slugs: ["anthropic/claude-3-7-sonnet", "anthropic/claude-4-sonnet"],
  apiKeyInputName: "ANTHROPIC_API_KEY",
};
const OPENAI_MODEL_CONFIG = {
  slugs: ["openai/gpt-4.1", "openai/o3", "openai/gpt-4.1-mini"],
  apiKeyInputName: "OPENAI_API_KEY",
};

// TODO: These need updating on the hub
const GEMINI_MODEL_CONFIG = {
  slugs: ["google/gemini-2.5-pro", "google/gemini-2.0-flash"],
  apiKeyInputName: "GEMINI_API_KEY",
};

function ensureBaseConfig(config: ConfigYaml): ConfigYaml {
  return {
    name: config.name || "Local Assistant",
    version: config.version || "1.0.0",
    schema: config.schema || "v1",
    models: config.models || [],
    context: config.context,
    data: config.data,
    mcpServers: config.mcpServers,
    rules: config.rules,
    prompts: config.prompts,
    docs: config.docs,
    metadata: config.metadata,
  };
}

export function setupBestConfig(config: ConfigYaml): ConfigYaml {
  const baseConfig = ensureBaseConfig(config);
  return {
    ...baseConfig,
    models: baseConfig.models,
  };
}

export function setupLocalConfig(config: ConfigYaml): ConfigYaml {
  const baseConfig = ensureBaseConfig(config);
  return {
    ...baseConfig,
    models: [
      {
        name: LOCAL_ONBOARDING_CHAT_TITLE,
        provider: "ollama",
        model: LOCAL_ONBOARDING_CHAT_MODEL,
        roles: ["chat", "edit", "apply"],
      },
      {
        name: LOCAL_ONBOARDING_FIM_TITLE,
        provider: "ollama",
        model: LOCAL_ONBOARDING_FIM_MODEL,
        roles: ["autocomplete"],
      },
      {
        name: LOCAL_ONBOARDING_EMBEDDINGS_TITLE,
        provider: "ollama",
        model: LOCAL_ONBOARDING_EMBEDDINGS_MODEL,
        roles: ["embed"],
      },
      ...(baseConfig.models ?? []),
    ],
  };
}

export function setupQuickstartConfig(config: ConfigYaml): ConfigYaml {
  return ensureBaseConfig(config);
}

export function setupArchitechConfig(config: ConfigYaml, modelInfo: string): ConfigYaml {
  const baseConfig = ensureBaseConfig(config);
  
  let modelData;
  try {
    modelData = JSON.parse(modelInfo);
  } catch (e) {
    console.error("Failed to parse model info:", e);
    return baseConfig;
  }

  const roles = ["chat", "edit", "apply", "summarize", "autocomplete", "embed", "rerank"] as ("chat" | "autocomplete" | "embed" | "rerank" | "edit" | "apply" | "summarize")[];

  const newModel = {
    name: modelData.name,
    provider: "openai" as const,
    model: modelData.model,
    apiBase: "http://192.168.100.22:5000/v1",
    apiKey: "dummy-key",
    contextLength: modelData.contextLength,
    roles: roles,
    capabilities: ["tool_use"] as ("tool_use" | "image_input")[],
  };

  const existingModels = baseConfig.models ?? [];
  const existingModel = existingModels.find(model => 
    ('name' in model && model.name === newModel.name) ||
    ('uses' in model && model.uses === newModel.name)
  );
  
  if (existingModel) {
    const updatedModels = existingModels.map(model => {
      if (('name' in model && model.name === newModel.name) ||
          ('uses' in model && model.uses === newModel.name)) {
        return newModel;
      }
      return model;
    });
    
    return {
      ...baseConfig,
      models: updatedModels,
    };
  }

  return {
    ...baseConfig,
    models: [...existingModels, newModel],
  };
}

export function setupProviderConfig(
  config: ConfigYaml,
  provider: string,
  apiKey: string,
): ConfigYaml {
  const baseConfig = ensureBaseConfig(config);
  let newModels;

  switch (provider) {
    case "openai":
      newModels = OPENAI_MODEL_CONFIG.slugs.map((slug) => ({
        uses: slug,
        with: {
          [OPENAI_MODEL_CONFIG.apiKeyInputName]: apiKey,
        },
      }));
      break;
    case "anthropic":
      newModels = ANTHROPIC_MODEL_CONFIG.slugs.map((slug) => ({
        uses: slug,
        with: {
          [ANTHROPIC_MODEL_CONFIG.apiKeyInputName]: apiKey,
        },
      }));
      break;
    case "gemini":
      newModels = GEMINI_MODEL_CONFIG.slugs.map((slug) => ({
        uses: slug,
        with: {
          [GEMINI_MODEL_CONFIG.apiKeyInputName]: apiKey,
        },
      }));
      break;
    case "architech":
      return setupArchitechConfig(baseConfig, apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return {
    ...baseConfig,
    models: [...(baseConfig.models ?? []), ...newModels],
  };
}
