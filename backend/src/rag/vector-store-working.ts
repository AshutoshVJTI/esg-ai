import { prisma } from '../lib/db.js';
import { EmbeddingsGenerator } from './embeddings.js';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface SearchOptions {
  topK?: number;
  minSimilarity?: number;
  filter?: Record<string, any>;
}

export class VectorStoreWorking {
  constructor(private embeddingsGenerator: EmbeddingsGenerator) {}

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    console.log('Vector store initialized (Direct SQL mode)');
  }

  /**
   * Add documents using direct SQL to avoid Prisma model issues
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      for (const doc of documents) {
        const [documentId, chunkIndexStr] = doc.id.split('_chunk_');
        const chunkIndex = parseInt(chunkIndexStr, 10);

        // First, ensure the Document record exists
        await prisma.$executeRaw`
          INSERT INTO "Document" (
            id, filename, filepath, title, region, organization, "documentType", 
            "fileSize", "totalPages", processed, "createdAt", "updatedAt"
          ) VALUES (
            ${documentId}, 
            ${doc.metadata.filename || 'Unknown'},
            ${'/sample/' + (doc.metadata.filename || 'unknown.txt')},
            ${doc.metadata.filename || 'Unknown'},
            ${doc.metadata.region || null},
            ${doc.metadata.organization || null},
            ${doc.metadata.documentType || 'text'},
            ${doc.content.length},
            ${doc.metadata.pageNumber || 1},
            true,
            NOW(), NOW()
          )
          ON CONFLICT (id) DO NOTHING
        `;

        // Then insert the DocumentChunk
        await prisma.$executeRaw`
          INSERT INTO "DocumentChunk" (
            id, "documentId", "chunkIndex", content, metadata, embedding,
            "tokenCount", "pageNumber", "startChar", "endChar", "createdAt", "updatedAt"
          ) VALUES (
            ${doc.id}, ${documentId}, ${chunkIndex}, ${doc.content}, 
            ${JSON.stringify(doc.metadata)}::jsonb, ${JSON.stringify(doc.embedding)}::jsonb,
            ${doc.metadata.tokenCount || null}, ${doc.metadata.pageNumber || null},
            ${doc.metadata.startChar || null}, ${doc.metadata.endChar || null},
            NOW(), NOW()
          )
        `;
      }

      console.log(`Added ${documents.length} documents using direct SQL`);
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents using direct SQL
   */
  async search(
    query: string | number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const config = {
      topK: 10,
      minSimilarity: 0.3,
      ...options
    };

    // Get query embedding if needed
    let queryEmbedding: number[];
    if (typeof query === 'string') {
      const embeddingResult = await this.embeddingsGenerator.generateEmbedding(query);
      queryEmbedding = embeddingResult.embedding;
    } else {
      queryEmbedding = query;
    }

    return this.searchDatabase(queryEmbedding, config);
  }

  /**
   * Search using direct SQL queries
   */
  private async searchDatabase(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      // Get all chunks with embeddings using raw SQL
      const chunks: any[] = await prisma.$queryRaw`
        SELECT 
          id,
          "documentId",
          "chunkIndex", 
          content,
          metadata,
          embedding,
          "pageNumber",
          "tokenCount"
        FROM "DocumentChunk"
        WHERE embedding IS NOT NULL
        LIMIT 1000
      `;

      // Calculate similarities
      const results = chunks
        .map((chunk: any) => {
          let embedding: number[];
          try {
            embedding = typeof chunk.embedding === 'string' 
              ? JSON.parse(chunk.embedding) 
              : chunk.embedding;
          } catch (e) {
            return null;
          }

          if (!embedding || !Array.isArray(embedding)) {
            return null;
          }

          const similarity = EmbeddingsGenerator.cosineSimilarity(queryEmbedding, embedding);
          
          let metadata: any = {};
          try {
            metadata = typeof chunk.metadata === 'string' 
              ? JSON.parse(chunk.metadata) 
              : chunk.metadata || {};
          } catch (e) {
            metadata = {};
          }
          
          return {
            id: chunk.id,
            content: chunk.content,
            metadata: {
              ...metadata,
              documentId: chunk.documentId,
              chunkIndex: chunk.chunkIndex,
              pageNumber: chunk.pageNumber,
              tokenCount: chunk.tokenCount
            },
            similarity
          };
        })
        .filter((result: any): result is SearchResult => 
          result !== null && result.similarity >= (options.minSimilarity || 0)
        )
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, options.topK || 10);

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get collection statistics using direct SQL
   */
  async getStats(): Promise<{ databaseCount: number }> {
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "DocumentChunk"
        WHERE embedding IS NOT NULL
      `;
      
      return { 
        databaseCount: parseInt(result[0]?.count || '0', 10)
      };
    } catch (error) {
      console.error('Stats error:', error);
      return { databaseCount: 0 };
    }
  }

  /**
   * Reset the vector store using direct SQL
   */
  async reset(): Promise<void> {
    try {
      await prisma.$executeRaw`DELETE FROM "DocumentChunk"`;
      console.log('Vector store reset completed');
    } catch (error) {
      console.error('Reset error:', error);
      throw error;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Nothing to dispose in direct SQL mode
  }
} 