import { pipeline, Pipeline } from '@xenova/transformers';

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface EmbeddingOptions {
  model?: 'openai' | 'local';
  openaiApiKey?: string;
  localModel?: string;
  batchSize?: number;
  maxRetries?: number;
}

export class EmbeddingsGenerator {
  private localPipeline: Pipeline | null = null;
  private readonly defaultLocalModel = 'Xenova/all-MiniLM-L6-v2';
  private readonly openaiModel = 'text-embedding-3-small';

  constructor(private options: EmbeddingOptions = {}) {
    this.options = {
      model: 'local',
      localModel: this.defaultLocalModel,
      batchSize: 10,
      maxRetries: 3,
      ...options
    };
  }

  /**
   * Initialize the embeddings generator
   */
  async initialize(): Promise<void> {
    if (this.options.model === 'local') {
      await this.initializeLocalModel();
    }
  }

  /**
   * Initialize local embeddings model
   */
  private async initializeLocalModel(): Promise<void> {
    try {
      console.log('Loading local embeddings model...');
      this.localPipeline = await pipeline(
        'feature-extraction',
        this.options.localModel || this.defaultLocalModel,
        { quantized: false }
      );
      console.log('Local embeddings model loaded successfully');
    } catch (error) {
      console.error('Error loading local embeddings model:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const cleanText = this.preprocessText(text);
    
    if (this.options.model === 'openai') {
      return this.generateOpenAIEmbedding(cleanText);
    } else {
      return this.generateLocalEmbedding(cleanText);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    const batchSize = this.options.batchSize || 10;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      
      if (this.options.model === 'openai') {
        const batchResults = await Promise.all(
          batch.map(text => this.generateOpenAIEmbedding(this.preprocessText(text)))
        );
        results.push(...batchResults);
      } else {
        const batchResults = await this.generateLocalEmbeddingsBatch(batch);
        results.push(...batchResults);
      }
      
      // Small delay to avoid overwhelming the API or system
      await this.delay(100);
    }

    return results;
  }

  /**
   * Generate embeddings using OpenAI API
   */
  private async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.options.openaiApiKey) {
      throw new Error('OpenAI API key is required for OpenAI embeddings');
    }

    let attempt = 0;
    const maxRetries = this.options.maxRetries || 3;

    while (attempt < maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.options.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.openaiModel,
            input: text,
            encoding_format: 'float'
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
          embedding: data.data[0].embedding,
          tokens: data.usage.total_tokens,
          model: this.openaiModel
        };
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`Failed to generate OpenAI embedding after ${maxRetries} attempts:`, error);
          throw error;
        }
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }

    throw new Error('Max retries exceeded for OpenAI embedding generation');
  }

  /**
   * Generate embeddings using local model
   */
  private async generateLocalEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.localPipeline) {
      await this.initializeLocalModel();
    }

    try {
      const result = await this.localPipeline!(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert tensor to array
      const embedding = Array.from(result.data);
      
      return {
        embedding,
        tokens: this.estimateTokens(text),
        model: this.options.localModel || this.defaultLocalModel
      };
    } catch (error) {
      console.error('Error generating local embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for a batch using local model
   */
  private async generateLocalEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.localPipeline) {
      await this.initializeLocalModel();
    }

    try {
      const preprocessedTexts = texts.map(text => this.preprocessText(text));
      const results = await this.localPipeline!(preprocessedTexts, {
        pooling: 'mean',
        normalize: true
      });

      // Handle both single and batch results
      const embeddings = Array.isArray(results) ? results : [results];
      
      return embeddings.map((result, index) => ({
        embedding: Array.from(result.data),
        tokens: this.estimateTokens(preprocessedTexts[index]),
        model: this.options.localModel || this.defaultLocalModel
      }));
    } catch (error) {
      console.error('Error generating local embeddings batch:', error);
      throw error;
    }
  }

  /**
   * Preprocess text for embedding generation
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 8192); // Limit to reasonable length
  }

  /**
   * Estimate token count for local models
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find most similar embeddings
   */
  static findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ embedding: number[]; metadata?: any }>,
    topK: number = 5
  ): Array<{ similarity: number; metadata?: any; index: number }> {
    const similarities = candidateEmbeddings.map((candidate, index) => ({
      similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
      metadata: candidate.metadata,
      index
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.localPipeline = null;
  }
} 