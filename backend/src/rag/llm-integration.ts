import OpenAI from 'openai';

export interface LLMConfig {
  provider: 'openai' | 'local';
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMIntegration {
  private openaiClient?: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.2, // Low temperature for factual compliance answers
      maxTokens: 1000,
      model: config.provider === 'openai' ? 'gpt-4-turbo' : 'local-model',
      ...config
    };

    if (this.config.provider === 'openai') {
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is required for OpenAI provider');
      }
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey
      });
    }
  }

  /**
   * Generate response using the configured LLM
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (this.config.provider === 'openai') {
      return this.generateOpenAIResponse(prompt, systemPrompt);
    } else {
      return this.generateLocalResponse(prompt, systemPrompt);
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: this.config.model!,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response content from OpenAI');
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  /**
   * Generate response using local model (placeholder for future implementation)
   */
  private async generateLocalResponse(
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    // Placeholder for local model integration
    // This could integrate with Ollama, transformers.js, or other local models
    const mockResponse = `Based on the provided ESG compliance documents, I would need to analyze the specific requirements. However, this is a local model placeholder response for the query: "${prompt.substring(0, 100)}..."`;
    
    return {
      content: mockResponse,
      usage: {
        promptTokens: 0,
        completionTokens: mockResponse.length / 4, // Rough token estimate
        totalTokens: mockResponse.length / 4
      },
      model: 'local-placeholder'
    };
  }

  /**
   * Test the LLM connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse(
        'Test connection. Respond with "Connection successful".',
        'You are a helpful assistant. Respond concisely.'
      );
      return response.content.toLowerCase().includes('connection successful') || 
             response.content.toLowerCase().includes('successful');
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }

  /**
   * Get configuration info
   */
  getConfig(): Omit<LLMConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }
} 