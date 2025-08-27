import { API_URL } from "../../../config/index.js";
import { LLMOptions } from "../../index.js";

import OpenAI from "./OpenAI.js";

class TextGenWebUI extends OpenAI {
  static providerName = "text-gen-webui";
  static defaultOptions: Partial<LLMOptions> = {
    apiBase: API_URL,
  };
}

export default TextGenWebUI;
