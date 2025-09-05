import {
  createSystemPrompt,
  defaultOutOfScopeMessage,
} from "../prompts/systemPrompt";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = "http://localhost:11434", model = "llama3") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateResponse(
    prompt: string,
    context?: string,
    outOfScopeMessage?: string
  ): Promise<string> {
    const outOfScopeResponse = outOfScopeMessage || defaultOutOfScopeMessage;

    const systemPrompt = context
      ? createSystemPrompt(context, outOfScopeResponse, prompt)
      : prompt;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error("Error calling Ollama:", error);
      throw new Error("Failed to generate response from LLM");
    }
  }

  async generateConversationResponse(
    prompt: string,
    context: string,
    conversationHistory: ConversationMessage[] = [],
    outOfScopeMessage?: string
  ): Promise<string> {
    const outOfScopeResponse = outOfScopeMessage || defaultOutOfScopeMessage;

    const systemPrompt = this.createConversationPrompt(
      context,
      conversationHistory,
      prompt,
      outOfScopeResponse
    );

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error("Error calling Ollama:", error);
      throw new Error("Failed to generate response from LLM");
    }
  }

  private createConversationPrompt(
    context: string,
    conversationHistory: ConversationMessage[],
    currentPrompt: string,
    outOfScopeResponse: string
  ): string {
    let prompt = `You are a helpful assistant that answers questions based on the provided company policy document context.

Your job is to extract and provide information from the context below to answer the user's question.

STRICT INSTRUCTIONS:
1. READ the context carefully and extract relevant information to answer the question
2. If the context contains information that answers the question, provide a direct answer using that information
3. DO NOT say you cannot answer if the information is present in the context
4. For questions about vacation, benefits, policies, work arrangements - these should be answered using the context
5. Only respond with "${outOfScopeResponse}" if the question is about completely unrelated topics (restaurants, weather, sports, etc.)
6. Use the conversation history to understand context and references (like "that policy", "tell me more", "what about X")
7. If the user refers to something mentioned earlier in the conversation, use that context

Context from Company Policy Manual:
${context}`;

    // Add conversation history if it exists
    if (conversationHistory.length > 0) {
      prompt += `\n\nPrevious Conversation:`;
      conversationHistory.forEach((msg, index) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        prompt += `\n${role}: ${msg.content}`;
      });
    }

    prompt += `\n\nCurrent User Question: ${currentPrompt}

Instructions: Look through the context and conversation history above to provide a helpful answer. Be direct and specific, and use conversation context to understand references.`;

    return prompt;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings API error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      return data.embedding;
    } catch (error) {
      console.error("Error getting embeddings from Ollama:", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = (await response.json()) as any;
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }
}
