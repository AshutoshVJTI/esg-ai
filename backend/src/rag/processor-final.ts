#!/usr/bin/env bun

import { DocumentLoader } from './document-loader.js';
import { TextChunker } from './text-chunker.js';
import { EmbeddingsGenerator } from './embeddings.js';
import { VectorStoreWorking } from './vector-store-working.js';

import type { ExtractedContent } from './document-loader.js';
import type { VectorDocument } from './vector-store-working.js';

export interface ProcessingStats {
  documentsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  errors: string[];
}

class ESGRAGProcessor {
  private documentLoader: DocumentLoader;
  private textChunker: TextChunker;
  private embeddingsGenerator: EmbeddingsGenerator;
  private vectorStore: VectorStoreWorking;

  constructor() {
    this.documentLoader = new DocumentLoader();
    this.textChunker = new TextChunker();
    this.embeddingsGenerator = new EmbeddingsGenerator({
      model: 'local',
      batchSize: 5
    });
    this.vectorStore = new VectorStoreWorking(this.embeddingsGenerator);
  }

  /**
   * Process all ESG documents
   */
  async processDocuments(): Promise<ProcessingStats> {
    const startTime = Date.now();
    const stats: ProcessingStats = {
      documentsProcessed: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: 0,
      errors: []
    };

    try {
      console.log('🚀 Starting ESG RAG Pipeline...');
      
      await this.initialize();
      
      const documents = await this.documentLoader.loadAllDocuments();
      console.log(`📄 Found ${documents.length} documents`);

      for (const doc of documents) {
        try {
          await this.processDocument(doc, stats);
        } catch (error) {
          const errorMsg = `Error processing ${doc.metadata.filename}: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }

      stats.processingTime = Date.now() - startTime;
      this.logStats(stats);
      return stats;

    } catch (error) {
      console.error('💥 Fatal error:', error);
      stats.errors.push(`Fatal error: ${error}`);
      stats.processingTime = Date.now() - startTime;
      return stats;
    }
  }

  /**
   * Initialize components
   */
  private async initialize(): Promise<void> {
    console.log('🔧 Initializing...');
    await this.embeddingsGenerator.initialize();
    await this.vectorStore.initialize();
    console.log('✅ Ready!');
  }

  /**
   * Process a single document
   */
  private async processDocument(document: ExtractedContent, stats: ProcessingStats): Promise<void> {
    console.log(`\n📄 Processing: ${document.metadata.filename}`);
    
    if (!document.text || document.text.length < 50) {
      console.log('⚠️  Document too short, skipping...');
      return;
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Chunk the document
    console.log('✂️  Chunking...');
    const chunks = await this.textChunker.chunkWithMetadata(
      document.text,
      {
        documentId,
        filename: document.metadata.filename,
        region: document.metadata.region,
        organization: document.metadata.organization,
        documentType: document.metadata.documentType
      },
      {
        maxTokens: 600,
        overlapTokens: 100,
        preserveParagraphs: true
      }
    );
    
    if (chunks.length === 0) {
      console.log('⚠️  No chunks created, skipping...');
      return;
    }

    console.log(`  📝 Created ${chunks.length} chunks`);
    stats.chunksCreated += chunks.length;

    // Generate embeddings
    console.log('🔢 Generating embeddings...');
    const texts = chunks.map(chunk => chunk.content);
    
    try {
      const embeddingResults = await this.embeddingsGenerator.generateEmbeddings(texts);
      
      if (embeddingResults.length !== chunks.length) {
        console.log(`⚠️  Embedding count mismatch: ${embeddingResults.length} vs ${chunks.length}`);
      }

      stats.embeddingsGenerated += embeddingResults.length;

      // Prepare vector documents
      const vectorDocuments: VectorDocument[] = [];
      
      for (let i = 0; i < Math.min(chunks.length, embeddingResults.length); i++) {
        const chunk = chunks[i];
        const embeddingResult = embeddingResults[i];
        
        if (embeddingResult && embeddingResult.embedding && embeddingResult.embedding.length > 0) {
          vectorDocuments.push({
            id: `${documentId}_chunk_${chunk.chunkIndex}`,
            content: chunk.content,
            metadata: {
              ...chunk.metadata,
              tokenCount: chunk.tokenCount,
              pageNumber: chunk.pageNumber,
              startChar: chunk.startChar,
              endChar: chunk.endChar,
              chunkIndex: chunk.chunkIndex,
              embeddingModel: embeddingResult.model
            },
            embedding: embeddingResult.embedding
          });
        }
      }

      if (vectorDocuments.length > 0) {
        console.log(`🧠 Storing ${vectorDocuments.length} vectors...`);
        await this.vectorStore.addDocuments(vectorDocuments);
        stats.documentsProcessed++;
        console.log(`✅ Successfully processed ${document.metadata.filename}`);
      } else {
        console.log('⚠️  No valid vectors to store');
      }

    } catch (error) {
      console.error(`❌ Embedding error for ${document.metadata.filename}:`, error);
      throw error;
    }
  }

  /**
   * Search for documents
   */
  async search(query: string, options: any = {}) {
    await this.vectorStore.initialize();
    return this.vectorStore.search(query, {
      topK: options.topK || 5,
      minSimilarity: options.minSimilarity || 0.3
    });
  }

  /**
   * Test search functionality
   */
  async testSearch(query: string): Promise<void> {
    console.log(`\n🔍 Testing: "${query}"`);
    
    const results = await this.search(query, { topK: 5 });

    console.log(`\n📊 Found ${results.length} results:`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Score: ${result.similarity.toFixed(3)}`);
      console.log(`   File: ${result.metadata.filename}`);
      console.log(`   Region: ${result.metadata.region}`);
      if (result.metadata.organization) {
        console.log(`   Org: ${result.metadata.organization}`);
      }
      console.log(`   Preview: ${result.content.substring(0, 150)}...`);
    });
  }

  /**
   * Get statistics
   */
  async getStats() {
    const vectorStats = await this.vectorStore.getStats();
    return {
      vector: vectorStats,
      chunks: {
        _count: { id: vectorStats.databaseCount },
        _avg: { tokenCount: null }
      }
    };
  }

  /**
   * Reset the pipeline
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting...');
    await this.vectorStore.reset();
    console.log('✅ Reset complete');
  }

  /**
   * Log processing statistics
   */
  private logStats(stats: ProcessingStats): void {
    console.log('\n✅ Processing Complete!');
    console.log(`📊 Statistics:`);
    console.log(`  - Documents: ${stats.documentsProcessed}`);
    console.log(`  - Chunks: ${stats.chunksCreated}`);
    console.log(`  - Embeddings: ${stats.embeddingsGenerated}`);
    console.log(`  - Time: ${(stats.processingTime / 1000).toFixed(2)}s`);
    console.log(`  - Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const processor = new ESGRAGProcessor();

  try {
    switch (command) {
      case 'process':
        await processor.processDocuments();
        break;
        
      case 'test':
        const query = args[1] || 'climate change disclosure';
        await processor.testSearch(query);
        break;
        
      case 'stats':
        const stats = await processor.getStats();
        console.log('📊 Stats:', JSON.stringify(stats, null, 2));
        break;
        
      case 'reset':
        await processor.reset();
        break;
        
      default:
        console.log('Usage:');
        console.log('  bun run processor-final.ts process');
        console.log('  bun run processor-final.ts test [query]');
        console.log('  bun run processor-final.ts stats');
        console.log('  bun run processor-final.ts reset');
        break;
    }
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Export for API use
export { ESGRAGProcessor };

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
} 