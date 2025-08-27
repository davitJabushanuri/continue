import { LLMOptions } from "../../index.js";

import OpenAI from "./OpenAI.js";

class TextGenWebUI extends OpenAI {
  static providerName = "text-gen-webui";
  static defaultOptions: Partial<LLMOptions> = {
    apiBase: "http://192.168.100.22:5000/v1/",
  };
}

export default TextGenWebUI;
