import { ESGRAGProcessor } from './processor-final.js';
import { LLMIntegration } from './llm-integration.js';
import type { LLMConfig, LLMResponse } from './llm-integration.js';
import type { SearchResult } from './vector-store-working.js';
import { ESGPromptStrategy } from './prompt-strategy.js';
import type { PromptContext } from './prompt-strategy.js';

export interface RAGConfig {
  llm: LLMConfig;
  retrieval: {
    topK?: number;
    minSimilarity?: number;
    enableReranking?: boolean;
  };
  generation: {
    includeSourceCitations?: boolean;
    maxContextTokens?: number;
    responseFormat?: 'standard' | 'structured' | 'bullet-points';
    promptTemplate?: 'esg-compliance' | 'legal-audit' | 'technical-implementation' | 'quick-reference';
    enableGuardrails?: boolean;
  };
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    filename: string;
    region?: string;
    organization?: string;
    similarity: number;
    snippet: string;
    pageNumber?: number;
  }>;
  metadata: {
    retrievedChunks: number;
    llmModel: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    processingTimeMs: number;
  };
}

export class ESGRAGChain {
  private processor: ESGRAGProcessor;
  private llm: LLMIntegration;
  private promptStrategy: ESGPromptStrategy;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = {
      llm: config.llm,
      retrieval: {
        topK: 5,
        minSimilarity: 0.3,
        enableReranking: false,
        ...config.retrieval
      },
      generation: {
        includeSourceCitations: true,
        maxContextTokens: 3000,
        responseFormat: 'standard',
        promptTemplate: 'esg-compliance',
        enableGuardrails: true,
        ...config.generation
      }
    };

    this.processor = new ESGRAGProcessor();
    this.llm = new LLMIntegration(this.config.llm);
    this.promptStrategy = new ESGPromptStrategy();
  }

  /**
   * Main RAG pipeline: Query -> Retrieve -> Generate
   */
  async query(question: string, filters?: Record<string, any>): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔍 RAG Query: "${question}"`);

      // Step 1: Retrieve relevant documents
      const retrievedChunks = await this.retrieveDocuments(question, filters);
      console.log(`📄 Retrieved ${retrievedChunks.length} chunks`);

      if (retrievedChunks.length === 0) {
        return this.createEmptyResponse(question, startTime);
      }

      // Step 2: Generate response with context
      const llmResponse = await this.generateAnswer(question, retrievedChunks);
      console.log(`🧠 Generated response (${llmResponse.usage?.totalTokens || 0} tokens)`);

      // Step 3: Format final response
      return {
        answer: llmResponse.content,
        sources: this.formatSources(retrievedChunks),
        metadata: {
          retrievedChunks: retrievedChunks.length,
          llmModel: llmResponse.model,
          usage: llmResponse.usage,
          processingTimeMs: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error(`RAG query failed: ${error}`);
    }
  }

  /**
   * Retrieve relevant documents from vector store
   */
  private async retrieveDocuments(
    question: string, 
    filters?: Record<string, any>
  ): Promise<SearchResult[]> {
    const searchOptions = {
      topK: this.config.retrieval.topK,
      minSimilarity: this.config.retrieval.minSimilarity,
      filter: filters
    };

    const results = await this.processor.search(question, searchOptions);
    
    // Optional: Re-rank results for better relevance
    if (this.config.retrieval.enableReranking) {
      return this.rerankResults(question, results);
    }

    return results;
  }

  /**
   * Generate answer using LLM with retrieved context and advanced prompt strategy
   */
  private async generateAnswer(
    question: string,
    retrievedChunks: SearchResult[]
  ): Promise<LLMResponse> {
    // Prepare context for prompt strategy
    const promptContext: PromptContext = {
      question,
      retrievedChunks: retrievedChunks.map(chunk => ({
        content: chunk.content,
        metadata: {
          filename: chunk.metadata.filename || 'Unknown',
          region: chunk.metadata.region,
          organization: chunk.metadata.organization,
          pageNumber: chunk.metadata.pageNumber,
          section: chunk.metadata.section
        }
      }))
    };

    // Generate prompt using the strategy
    const templateId = this.config.generation.promptTemplate || 'esg-compliance';
    const promptData = this.promptStrategy.generatePrompt(templateId, promptContext);

    // Generate LLM response
    const llmResponse = await this.llm.generateResponse(promptData.userPrompt, promptData.systemPrompt);

    // Apply guardrails if enabled
    if (this.config.generation.enableGuardrails) {
      llmResponse.content = this.promptStrategy.applyGuardrails(llmResponse.content, promptContext);
      
      // Validate response quality
      const validation = this.promptStrategy.validateResponse(llmResponse.content, templateId);
      if (!validation.isValid) {
        console.warn('Response validation issues:', validation.violations);
      }
    }

    return llmResponse;
  }

  /**
   * Build system prompt for ESG compliance assistant
   */
  private buildSystemPrompt(): string {
    return `You are an expert ESG (Environmental, Social, Governance) compliance assistant specializing in regulatory frameworks like ESRS, TCFD, GRI, SASB, and other sustainability standards.

Your role is to provide accurate, actionable guidance based ONLY on the provided context from official ESG documents and regulations.

Guidelines:
1. ONLY use information from the provided context - never add external knowledge
2. If the context doesn't contain enough information, clearly state this limitation
3. Provide specific regulatory references when available
4. Structure responses clearly with key requirements highlighted
5. Use professional, compliance-focused language
6. Include relevant standard codes, section numbers, or document references when citing sources

If asked about requirements not covered in the context, respond with: "Based on the provided documents, I don't have sufficient information to answer this specific question. Please consult the complete regulatory documentation or seek legal counsel for comprehensive guidance."`;
  }

  /**
   * Build user prompt with question and context
   */
  private buildUserPrompt(question: string, retrievedChunks: SearchResult[]): string {
    const contextSections = retrievedChunks.map((chunk, index) => {
      const source = `[Source ${index + 1}: ${chunk.metadata.filename}${chunk.metadata.pageNumber ? `, Page ${chunk.metadata.pageNumber}` : ''}${chunk.metadata.region ? ` (${chunk.metadata.region})` : ''}]`;
      return `${source}\n${chunk.content}\n`;
    }).join('\n---\n\n');

    let prompt = `Context from ESG compliance documents:\n\n${contextSections}\n\n---\n\nQuestion: ${question}\n\n`;

    if (this.config.generation.responseFormat === 'structured') {
      prompt += `Please provide a structured response with:
1. **Direct Answer**: Clear, concise response to the question
2. **Key Requirements**: Bullet points of main compliance requirements
3. **Regulatory References**: Specific standards, sections, or document citations
4. **Implementation Notes**: Practical guidance for compliance`;
    } else if (this.config.generation.responseFormat === 'bullet-points') {
      prompt += `Please respond in bullet-point format with key requirements and references.`;
    }

    if (this.config.generation.includeSourceCitations) {
      prompt += `\n\nInclude source references in your response using the format [Source X] where appropriate.`;
    }

    return prompt;
  }

  /**
   * Simple re-ranking based on keyword matching (placeholder for advanced re-ranking)
   */
  private rerankResults(question: string, results: SearchResult[]): SearchResult[] {
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    
    return results.map(result => {
      const contentLower = result.content.toLowerCase();
      const keywordMatches = keywords.filter(keyword => contentLower.includes(keyword)).length;
      const boostedSimilarity = result.similarity + (keywordMatches * 0.01); // Small boost for keyword matches
      
      return {
        ...result,
        similarity: Math.min(boostedSimilarity, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Format sources for response
   */
  private formatSources(retrievedChunks: SearchResult[]): RAGResponse['sources'] {
    return retrievedChunks.map((chunk, index) => ({
      id: chunk.id,
      filename: chunk.metadata.filename || 'Unknown',
      region: chunk.metadata.region,
      organization: chunk.metadata.organization,
      similarity: Math.round(chunk.similarity * 1000) / 1000,
      snippet: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
      pageNumber: chunk.metadata.pageNumber
    }));
  }

  /**
   * Create empty response when no documents found
   */
  private createEmptyResponse(question: string, startTime: number): RAGResponse {
    return {
      answer: "I couldn't find relevant information in the ESG document corpus to answer your question. This might be because:\n\n1. The question is outside the scope of the loaded documents\n2. The specific topic hasn't been processed yet\n3. Different keywords might yield better results\n\nPlease try rephrasing your question or ensure the relevant ESG documents have been processed into the knowledge base.",
      sources: [],
      metadata: {
        retrievedChunks: 0,
        llmModel: this.llm.getConfig().model || 'unknown',
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Test the complete RAG pipeline
   */
  async testPipeline(): Promise<boolean> {
    try {
      console.log('🧪 Testing RAG pipeline...');
      
      // Test LLM connection
      const llmConnected = await this.llm.testConnection();
      if (!llmConnected) {
        console.error('❌ LLM connection failed');
        return false;
      }
      console.log('✅ LLM connection successful');

      // Test with a simple query
      const testResponse = await this.query('What are the key ESG disclosure requirements?');
      
      if (testResponse.answer && testResponse.answer.length > 0) {
        console.log('✅ RAG pipeline test successful');
        console.log(`📊 Retrieved ${testResponse.metadata.retrievedChunks} chunks`);
        console.log(`⏱️  Processed in ${testResponse.metadata.processingTimeMs}ms`);
        return true;
      } else {
        console.error('❌ RAG pipeline returned empty response');
        return false;
      }
    } catch (error) {
      console.error('❌ RAG pipeline test failed:', error);
      return false;
    }
  }

  /**
   * Get configuration details
   */
  getConfig(): Omit<RAGConfig, 'llm'> & { llm: Omit<LLMConfig, 'apiKey'> } {
    return {
      llm: this.llm.getConfig(),
      retrieval: this.config.retrieval,
      generation: this.config.generation
    };
  }
} 