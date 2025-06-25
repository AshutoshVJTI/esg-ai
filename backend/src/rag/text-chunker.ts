import { get_encoding } from 'tiktoken';
import natural from 'natural';

export interface TextChunk {
  content: string;
  startChar: number;
  endChar: number;
  chunkIndex: number;
  tokenCount: number;
  metadata?: Record<string, any>;
  pageNumber?: number;
}

export interface ChunkingOptions {
  maxTokens: number;
  overlapTokens: number;
  preserveSentences: boolean;
  preserveParagraphs: boolean;
  minChunkSize: number;
}

export class TextChunker {
  private encoding: any;
  private sentenceTokenizer: any;

  constructor() {
    this.encoding = get_encoding('cl100k_base'); // GPT-3.5/4 encoding
    this.sentenceTokenizer = new (natural as any).SentenceTokenizer();
  }

  /**
   * Split text into semantic chunks with configurable options
   */
  async chunkText(
    text: string, 
    options: Partial<ChunkingOptions> = {}
  ): Promise<TextChunk[]> {
    const config: ChunkingOptions = {
      maxTokens: 1000,
      overlapTokens: 200,
      preserveSentences: true,
      preserveParagraphs: true,
      minChunkSize: 100,
      ...options
    };

    // Clean and normalize text
    const cleanedText = this.cleanText(text);
    
    if (config.preserveParagraphs) {
      return this.chunkByParagraphs(cleanedText, config);
    } else if (config.preserveSentences) {
      return this.chunkBySentences(cleanedText, config);
    } else {
      return this.chunkByTokens(cleanedText, config);
    }
  }

  /**
   * Chunk text while preserving paragraph boundaries
   */
  private chunkByParagraphs(text: string, config: ChunkingOptions): TextChunk[] {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startChar = 0;
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const paragraphTokens = this.countTokens(paragraph);
      
      // If adding this paragraph would exceed max tokens, finalize current chunk
      if (currentTokens + paragraphTokens > config.maxTokens && currentChunk.length > 0) {
        if (currentTokens >= config.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.trim(),
            startChar,
            startChar + currentChunk.length,
            chunkIndex++,
            currentTokens
          ));
        }
        
        // Start new chunk with overlap
        const overlap = this.createOverlap(currentChunk, config.overlapTokens);
        currentChunk = overlap + '\n\n' + paragraph;
        currentTokens = this.countTokens(currentChunk);
        startChar = text.indexOf(paragraph, startChar);
      } else {
        // Add paragraph to current chunk
        if (currentChunk.length > 0) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
          startChar = text.indexOf(paragraph, startChar);
        }
        currentTokens = this.countTokens(currentChunk);
      }
      
      // If single paragraph is too large, split it by sentences
      if (paragraphTokens > config.maxTokens) {
        const sentenceChunks = this.chunkBySentences(paragraph, config);
        chunks.push(...sentenceChunks.map(chunk => ({
          ...chunk,
          chunkIndex: chunkIndex++,
          startChar: startChar + chunk.startChar,
          endChar: startChar + chunk.endChar
        })));
        currentChunk = '';
        currentTokens = 0;
      }
    }

    // Add final chunk if it exists
    if (currentChunk.trim().length > 0 && currentTokens >= config.minChunkSize) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        startChar,
        startChar + currentChunk.length,
        chunkIndex,
        currentTokens
      ));
    }

    return chunks;
  }

  /**
   * Chunk text while preserving sentence boundaries
   */
  private chunkBySentences(text: string, config: ChunkingOptions): TextChunk[] {
    const sentences = this.sentenceTokenizer.tokenize(text);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startChar = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const sentenceTokens = this.countTokens(sentence);
      
      // If adding this sentence would exceed max tokens, finalize current chunk
      if (currentTokens + sentenceTokens > config.maxTokens && currentChunk.length > 0) {
        if (currentTokens >= config.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.trim(),
            startChar,
            startChar + currentChunk.length,
            chunkIndex++,
            currentTokens
          ));
        }
        
        // Start new chunk with overlap
        const overlap = this.createOverlap(currentChunk, config.overlapTokens);
        currentChunk = overlap + ' ' + sentence;
        currentTokens = this.countTokens(currentChunk);
        startChar = text.indexOf(sentence, startChar);
      } else {
        // Add sentence to current chunk
        if (currentChunk.length > 0) {
          currentChunk += ' ' + sentence;
        } else {
          currentChunk = sentence;
          startChar = text.indexOf(sentence, startChar);
        }
        currentTokens = this.countTokens(currentChunk);
      }
    }

    // Add final chunk if it exists
    if (currentChunk.trim().length > 0 && currentTokens >= config.minChunkSize) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        startChar,
        startChar + currentChunk.length,
        chunkIndex,
        currentTokens
      ));
    }

    return chunks;
  }

  /**
   * Chunk text by token count without preserving boundaries
   */
  private chunkByTokens(text: string, config: ChunkingOptions): TextChunk[] {
    const tokens = this.encoding.encode(text);
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < tokens.length; i += (config.maxTokens - config.overlapTokens)) {
      const chunkTokens = tokens.slice(i, i + config.maxTokens);
      const chunkText = this.encoding.decode(chunkTokens);
      
      if (chunkText.trim().length >= config.minChunkSize) {
        chunks.push(this.createChunk(
          chunkText.trim(),
          i,
          i + chunkTokens.length,
          chunkIndex++,
          chunkTokens.length
        ));
      }
    }

    return chunks;
  }

  /**
   * Create overlap text from the end of the previous chunk
   */
  private createOverlap(text: string, overlapTokens: number): string {
    if (overlapTokens <= 0) return '';
    
    const tokens = this.encoding.encode(text);
    if (tokens.length <= overlapTokens) return text;
    
    const overlapTokenArray = tokens.slice(-overlapTokens);
    return this.encoding.decode(overlapTokenArray);
  }

  /**
   * Count tokens in text
   */
  private countTokens(text: string): number {
    return this.encoding.encode(text).length;
  }

  /**
   * Create a TextChunk object
   */
  private createChunk(
    content: string,
    startChar: number,
    endChar: number,
    chunkIndex: number,
    tokenCount: number,
    metadata?: Record<string, any>
  ): TextChunk {
    return {
      content: content.trim(),
      startChar,
      endChar,
      chunkIndex,
      tokenCount,
      metadata
    };
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .replace(/\s{2,}/g, ' ') // Reduce excessive spaces
      .replace(/[^\S\n]+/g, ' ') // Clean up other whitespace
      .trim();
  }

  /**
   * Extract page numbers from text if available
   */
  extractPageNumber(text: string, chunkStartChar: number): number | undefined {
    const pageRegex = /(?:Page|PAGE|p\.|P\.)\s*(\d+)/gi;
    const textBeforeChunk = text.substring(0, chunkStartChar);
    const matches = Array.from(textBeforeChunk.matchAll(pageRegex));
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return parseInt(lastMatch[1], 10);
    }
    
    return undefined;
  }

  /**
   * Create chunks with enhanced metadata including page numbers
   */
  async chunkWithMetadata(
    text: string,
    documentMetadata: Record<string, any>,
    options: Partial<ChunkingOptions> = {}
  ): Promise<TextChunk[]> {
    const chunks = await this.chunkText(text, options);
    
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...documentMetadata,
        ...chunk.metadata
      },
      pageNumber: this.extractPageNumber(text, chunk.startChar)
    }));
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.encoding) {
      this.encoding.free();
    }
  }
} 