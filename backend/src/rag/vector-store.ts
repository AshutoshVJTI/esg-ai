import { ChromaClient, Collection } from 'chromadb';
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
  distance?: number;
}

export interface SearchOptions {
  topK?: number;
  minSimilarity?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export class VectorStore {
  private chromaClient: ChromaClient | null = null;
  private collection: Collection | null = null;
  private readonly collectionName = 'esg_documents';
  private readonly fallbackToDatabase = true;

  constructor(
    private embeddingsGenerator: EmbeddingsGenerator,
    private chromaUrl?: string
  ) {
    this.chromaUrl = chromaUrl || 'http://localhost:8000';
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    try {
      // Try to initialize ChromaDB
      await this.initializeChroma();
    } catch (error) {
      console.warn('ChromaDB not available, falling back to PostgreSQL:', error);
      if (!this.fallbackToDatabase) {
        throw error;
      }
    }
  }

  /**
   * Initialize ChromaDB client and collection
   */
  private async initializeChroma(): Promise<void> {
    this.chromaClient = new ChromaClient({
      path: this.chromaUrl
    });

    // Test connection
    await this.chromaClient.heartbeat();
    console.log('ChromaDB connection established');

    // Create or get collection
    try {
      this.collection = await this.chromaClient.createCollection({
        name: this.collectionName,
        metadata: { 
          description: 'ESG document embeddings for RAG pipeline',
          hnsw_space: 'cosine'
        }
      });
    } catch (error) {
      // Collection might already exist
      this.collection = await this.chromaClient.getCollection({
        name: this.collectionName
      });
    }

    console.log(`ChromaDB collection '${this.collectionName}' ready`);
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (this.collection) {
      await this.addToChroma(documents);
    } else if (this.fallbackToDatabase) {
      await this.addToDatabase(documents);
    } else {
      throw new Error('No vector store available');
    }
  }

  /**
   * Add documents to ChromaDB
   */
  private async addToChroma(documents: VectorDocument[]): Promise<void> {
    const ids = documents.map(doc => doc.id);
    const embeddings = documents.map(doc => doc.embedding);
    const metadatas = documents.map(doc => ({
      content: doc.content,
      ...doc.metadata
    }));
    const documents_content = documents.map(doc => doc.content);

    await this.collection!.add({
      ids,
      embeddings,
      metadatas,
      documents: documents_content
    });

    console.log(`Added ${documents.length} documents to ChromaDB`);
  }

  /**
   * Add documents to PostgreSQL database
   */
  private async addToDatabase(documents: VectorDocument[]): Promise<void> {
    const operations = documents.map(doc => {
      // Parse the document ID to get documentId and chunkIndex
      const [documentId, chunkIndexStr] = doc.id.split('_chunk_');
      const chunkIndex = parseInt(chunkIndexStr, 10);

      return prisma.documentChunk.upsert({
        where: {
          documentId_chunkIndex: {
            documentId,
            chunkIndex
          }
        },
        update: {
          content: doc.content,
          metadata: doc.metadata,
          embedding: doc.embedding,
          tokenCount: doc.metadata.tokenCount || null,
          pageNumber: doc.metadata.pageNumber || null,
          startChar: doc.metadata.startChar || null,
          endChar: doc.metadata.endChar || null
        },
        create: {
          documentId,
          chunkIndex,
          content: doc.content,
          metadata: doc.metadata,
          embedding: doc.embedding,
          tokenCount: doc.metadata.tokenCount || null,
          pageNumber: doc.metadata.pageNumber || null,
          startChar: doc.metadata.startChar || null,
          endChar: doc.metadata.endChar || null
        }
      });
    });

    await prisma.$transaction(operations);
    console.log(`Added ${documents.length} documents to PostgreSQL`);
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string | number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const config = {
      topK: 10,
      minSimilarity: 0.7,
      includeMetadata: true,
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

    if (this.collection) {
      return this.searchChroma(queryEmbedding, config);
    } else if (this.fallbackToDatabase) {
      return this.searchDatabase(queryEmbedding, config);
    } else {
      throw new Error('No vector store available for search');
    }
  }

  /**
   * Search using ChromaDB
   */
  private async searchChroma(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results = await this.collection!.query({
      queryEmbeddings: [queryEmbedding],
      nResults: options.topK,
      where: options.filter,
      include: ['documents', 'metadatas', 'distances'] as any
    });

    if (!results.ids?.[0] || !results.documents?.[0] || !results.metadatas?.[0] || !results.distances?.[0]) {
      return [];
    }

    return results.ids[0].map((id, index) => {
      const distance = results.distances![0][index];
      const similarity = 1 - distance; // Convert distance to similarity
      const content = results.documents![0][index];

      return {
        id,
        content: content || '',
        metadata: (results.metadatas![0][index] as Record<string, any>) || {},
        similarity,
        distance
      };
    }).filter(result => result.similarity >= (options.minSimilarity || 0));
  }

  /**
   * Search using PostgreSQL with cosine similarity
   */
  private async searchDatabase(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // Get all document chunks with embeddings
    const chunks = await prisma.documentChunk.findMany({
      where: {
        embedding: {
          not: null
        }
      },
      include: {
        document: true
      },
      take: 1000 // Limit for performance
    });

    // Calculate similarities
    const results = chunks
      .map(chunk => {
        const embedding = chunk.embedding as number[];
        if (!embedding || !Array.isArray(embedding)) {
          return null;
        }

        const similarity = EmbeddingsGenerator.cosineSimilarity(queryEmbedding, embedding);
        
        return {
          id: `${chunk.documentId}_chunk_${chunk.chunkIndex}`,
          content: chunk.content,
          metadata: {
            ...chunk.metadata as Record<string, any>,
            documentId: chunk.documentId,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            tokenCount: chunk.tokenCount,
            document: {
              filename: chunk.document.filename,
              title: chunk.document.title,
              region: chunk.document.region,
              organization: chunk.document.organization
            }
          },
          similarity
        };
      })
      .filter((result): result is SearchResult => 
        result !== null && result.similarity >= (options.minSimilarity || 0)
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.topK || 10);

    return results;
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    if (this.collection) {
      return this.getFromChroma(id);
    } else if (this.fallbackToDatabase) {
      return this.getFromDatabase(id);
    } else {
      throw new Error('No vector store available');
    }
  }

  /**
   * Get document from ChromaDB
   */
  private async getFromChroma(id: string): Promise<VectorDocument | null> {
    const results = await this.collection!.get({
      ids: [id],
      include: ['documents', 'metadatas', 'embeddings']
    });

    if (!results.ids || results.ids.length === 0) {
      return null;
    }

    return {
      id: results.ids[0],
      content: results.documents![0],
      metadata: results.metadatas![0] as Record<string, any>,
      embedding: results.embeddings![0]
    };
  }

  /**
   * Get document from PostgreSQL
   */
  private async getFromDatabase(id: string): Promise<VectorDocument | null> {
    const [documentId, chunkIndexStr] = id.split('_chunk_');
    const chunkIndex = parseInt(chunkIndexStr, 10);

    const chunk = await prisma.documentChunk.findUnique({
      where: {
        documentId_chunkIndex: {
          documentId,
          chunkIndex
        }
      },
      include: {
        document: true
      }
    });

    if (!chunk || !chunk.embedding) {
      return null;
    }

    return {
      id,
      content: chunk.content,
      metadata: {
        ...chunk.metadata as Record<string, any>,
        document: chunk.document
      },
      embedding: chunk.embedding as number[]
    };
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    if (this.collection) {
      await this.collection.delete({
        ids
      });
    }

    if (this.fallbackToDatabase) {
      const operations = ids.map(id => {
        const [documentId, chunkIndexStr] = id.split('_chunk_');
        const chunkIndex = parseInt(chunkIndexStr, 10);

        return prisma.documentChunk.delete({
          where: {
            documentId_chunkIndex: {
              documentId,
              chunkIndex
            }
          }
        });
      });

      await prisma.$transaction(operations);
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    chromaCount?: number;
    databaseCount: number;
    collections?: string[];
  }> {
    const stats: any = {};

    if (this.collection) {
      const chromaCount = await this.collection.count();
      stats.chromaCount = chromaCount;
    }

    const databaseCount = await prisma.documentChunk.count({
      where: {
        embedding: {
          not: null
        }
      }
    });
    stats.databaseCount = databaseCount;

    if (this.chromaClient) {
      const collections = await this.chromaClient.listCollections();
      stats.collections = collections.map(c => c.name);
    }

    return stats;
  }

  /**
   * Reset the vector store (delete all documents)
   */
  async reset(): Promise<void> {
    if (this.collection) {
      await this.chromaClient!.deleteCollection({
        name: this.collectionName
      });
      await this.initializeChroma();
    }

    if (this.fallbackToDatabase) {
      await prisma.documentChunk.deleteMany({});
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.chromaClient = null;
    this.collection = null;
  }
} 