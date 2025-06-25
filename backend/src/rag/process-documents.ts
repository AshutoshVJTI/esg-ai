#!/usr/bin/env bun

import path from 'path';
import { DocumentLoader } from './document-loader.js';
import { TextChunker } from './text-chunker.js';
import { EmbeddingsGenerator } from './embeddings.js';
import { VectorStore } from './vector-store.js';
import { prisma } from '../lib/db.js';

import type { ExtractedContent } from './document-loader.js';
import type { TextChunk } from './text-chunker.js';
import type { VectorDocument } from './vector-store.js';

export interface ProcessingOptions {
  embeddings?: {
    model?: 'openai' | 'local';
    openaiApiKey?: string;
  };
  chunking?: {
    maxTokens?: number;
    overlapTokens?: number;
    preserveParagraphs?: boolean;
  };
  vectorStore?: {
    chromaUrl?: string;
    useChroma?: boolean;
  };
  batchSize?: number;
  skipExisting?: boolean;
}

export interface ProcessingStats {
  documentsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  errors: string[];
}

export class DocumentProcessor {
  private documentLoader: DocumentLoader;
  private textChunker: TextChunker;
  private embeddingsGenerator: EmbeddingsGenerator;
  private vectorStore: VectorStore;

  constructor(private options: ProcessingOptions = {}) {
    this.documentLoader = new DocumentLoader();
    this.textChunker = new TextChunker();
    this.embeddingsGenerator = new EmbeddingsGenerator({
      model: options.embeddings?.model || 'local',
      openaiApiKey: options.embeddings?.openaiApiKey,
      batchSize: options.batchSize || 10
    });
    this.vectorStore = new VectorStore(
      this.embeddingsGenerator,
      options.vectorStore?.chromaUrl
    );
  }

  /**
   * Process all documents in the ESG corpus
   */
  async processAllDocuments(): Promise<ProcessingStats> {
    const startTime = Date.now();
    const stats: ProcessingStats = {
      documentsProcessed: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: 0,
      errors: []
    };

    try {
      console.log('🚀 Starting ESG document processing pipeline...');
      
      // Initialize components
      await this.initialize();
      
      // Load all documents
      console.log('📄 Loading documents from ESG corpus...');
      const documents = await this.documentLoader.loadAllDocuments();
      console.log(`Found ${documents.length} documents to process`);

      // Process documents in batches
      const batchSize = this.options.batchSize || 5;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
        
        for (const doc of batch) {
          try {
            await this.processDocument(doc, stats);
            stats.documentsProcessed++;
          } catch (error) {
            const errorMsg = `Error processing ${doc.metadata.filename}: ${error}`;
            console.error(errorMsg);
            stats.errors.push(errorMsg);
          }
        }
        
        // Small delay between batches
        await this.delay(1000);
      }

      stats.processingTime = Date.now() - startTime;
      
      console.log('\n✅ Document processing completed!');
      console.log(`📊 Statistics:`);
      console.log(`  - Documents processed: ${stats.documentsProcessed}`);
      console.log(`  - Chunks created: ${stats.chunksCreated}`);
      console.log(`  - Embeddings generated: ${stats.embeddingsGenerated}`);
      console.log(`  - Processing time: ${(stats.processingTime / 1000).toFixed(2)}s`);
      console.log(`  - Errors: ${stats.errors.length}`);

      if (stats.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        stats.errors.forEach(error => console.log(`  - ${error}`));
      }

      return stats;

    } catch (error) {
      console.error('Fatal error in document processing:', error);
      stats.errors.push(`Fatal error: ${error}`);
      stats.processingTime = Date.now() - startTime;
      return stats;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize all components
   */
  private async initialize(): Promise<void> {
    console.log('🔧 Initializing components...');
    
    await this.embeddingsGenerator.initialize();
    await this.vectorStore.initialize();
    
    console.log('✅ Components initialized');
  }

  /**
   * Process a single document
   */
  private async processDocument(
    document: ExtractedContent,
    stats: ProcessingStats
  ): Promise<void> {
    console.log(`\n📄 Processing: ${document.metadata.filename}`);
    
    // Check if already processed
    if (this.options.skipExisting) {
      const existing = await prisma.document.findFirst({
        where: {
          filename: document.metadata.filename,
          processed: true
        }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping ${document.metadata.filename} (already processed)`);
        return;
      }
    }

    // Save document to database
    const documentId = await this.documentLoader.saveDocumentToDatabase(document);
    console.log(`💾 Saved document metadata (ID: ${documentId})`);

    // Chunk the document
    console.log('✂️  Chunking document...');
    const chunks = await this.textChunker.chunkWithMetadata(
      document.text,
      {
        documentId,
        filename: document.metadata.filename,
        region: document.metadata.region,
        organization: document.metadata.organization,
        documentType: document.metadata.documentType
      },
      this.options.chunking
    );
    
    console.log(`  Created ${chunks.length} chunks`);
    stats.chunksCreated += chunks.length;

    // Generate embeddings for chunks
    console.log('🔢 Generating embeddings...');
    const texts = chunks.map(chunk => chunk.content);
    const embeddingResults = await this.embeddingsGenerator.generateEmbeddings(texts);
    stats.embeddingsGenerated += embeddingResults.length;

    // Prepare vector documents
    const vectorDocuments: VectorDocument[] = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${chunk.chunkIndex}`,
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        tokenCount: chunk.tokenCount,
        pageNumber: chunk.pageNumber,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        chunkIndex: chunk.chunkIndex,
        embeddingModel: embeddingResults[index].model
      },
      embedding: embeddingResults[index].embedding
    }));

    // Store in vector database
    console.log('🧠 Storing vectors...');
    await this.vectorStore.addDocuments(vectorDocuments);

    // Mark document as processed
    await prisma.document.update({
      where: { id: documentId },
      data: { processed: true }
    });

    console.log(`✅ Completed processing ${document.metadata.filename}`);
  }

  /**
   * Test the RAG pipeline with a sample query
   */
  async testQuery(query: string, topK: number = 5): Promise<void> {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    await this.vectorStore.initialize();
    
    const results = await this.vectorStore.search(query, {
      topK,
      minSimilarity: 0.5
    });

    console.log(`\n📊 Found ${results.length} relevant chunks:`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Similarity: ${result.similarity.toFixed(3)}`);
      console.log(`   Document: ${result.metadata.filename || result.metadata.document?.filename}`);
      console.log(`   Region: ${result.metadata.region || result.metadata.document?.region}`);
      if (result.metadata.organization || result.metadata.document?.organization) {
        console.log(`   Organization: ${result.metadata.organization || result.metadata.document?.organization}`);
      }
      console.log(`   Content preview: ${result.content.substring(0, 200)}...`);
    });
  }

  /**
   * Search for documents (public method for API)
   */
  async search(query: string, options: any = {}) {
    await this.vectorStore.initialize();
    return this.vectorStore.search(query, options);
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<any> {
    const vectorStats = await this.vectorStore.getStats();
    
    const documentStats = await prisma.document.groupBy({
      by: ['region', 'processed'],
      _count: {
        id: true
      }
    });

    const chunkStats = await prisma.documentChunk.aggregate({
      _count: {
        id: true
      },
      _avg: {
        tokenCount: true
      }
    });

    return {
      vector: vectorStats,
      documents: documentStats,
      chunks: chunkStats
    };
  }

  /**
   * Reset the entire RAG pipeline
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting RAG pipeline...');
    
    await this.vectorStore.initialize();
    await this.vectorStore.reset();
    
    await prisma.documentChunk.deleteMany({});
    await prisma.document.deleteMany({});
    
    console.log('✅ RAG pipeline reset completed');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.textChunker.dispose();
    this.embeddingsGenerator.dispose();
    this.vectorStore.dispose();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const processor = new DocumentProcessor({
    embeddings: {
      model: 'local', // Use local embeddings by default
      // openaiApiKey: process.env.OPENAI_API_KEY // Uncomment to use OpenAI
    },
    chunking: {
      maxTokens: 1000,
      overlapTokens: 200,
      preserveParagraphs: true
    },
    batchSize: 3, // Process fewer documents at once to avoid memory issues
    skipExisting: true
  });

  try {
    switch (command) {
      case 'process':
        await processor.processAllDocuments();
        break;
        
      case 'test':
        const query = args[1] || 'climate change disclosure requirements';
        await processor.testQuery(query);
        break;
        
      case 'stats':
        const stats = await processor.getStats();
        console.log('📊 RAG Pipeline Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        break;
        
      case 'reset':
        await processor.reset();
        break;
        
      default:
        console.log('Usage:');
        console.log('  bun run rag:process - Process all ESG documents');
        console.log('  bun run src/rag/process-documents.ts test [query] - Test search');
        console.log('  bun run src/rag/process-documents.ts stats - Show statistics');
        console.log('  bun run src/rag/process-documents.ts reset - Reset pipeline');
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
} 