import { Elysia, t } from 'elysia';
import { DocumentProcessor } from '../rag/process-documents.js';

// Initialize processor (singleton pattern)
let processor: DocumentProcessor | null = null;

function getProcessor(): DocumentProcessor {
  if (!processor) {
    processor = new DocumentProcessor({
      embeddings: {
        model: 'local'
      },
      chunking: {
        maxTokens: 1000,
        overlapTokens: 200,
        preserveParagraphs: true
      },
      batchSize: 3,
      skipExisting: true
    });
  }
  return processor;
}

export const ragRoutes = new Elysia({ prefix: '/api/rag' })
  .post('/search', async ({ body }) => {
    try {
      const { query, topK = 10, minSimilarity = 0.5 } = body;
      
      const processor = getProcessor();
      const results = await processor.search(query, {
        topK,
        minSimilarity
      });
      
      return {
        success: true,
        data: {
          query,
          results: results.map(result => ({
            id: result.id,
            content: result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''),
            similarity: result.similarity,
            metadata: {
              filename: result.metadata.filename || result.metadata.document?.filename,
              region: result.metadata.region || result.metadata.document?.region,
              organization: result.metadata.organization || result.metadata.document?.organization,
              pageNumber: result.metadata.pageNumber,
              chunkIndex: result.metadata.chunkIndex
            }
          }))
        }
      };
    } catch (error) {
      console.error('RAG search error:', error);
      return {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, {
    body: t.Object({
      query: t.String({ minLength: 1, maxLength: 1000 }),
      topK: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      minSimilarity: t.Optional(t.Number({ minimum: 0, maximum: 1 }))
    })
  })
  
  .get('/stats', async () => {
    try {
      const processor = getProcessor();
      const stats = await processor.getStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('RAG stats error:', error);
      return {
        success: false,
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })
  
  .post('/process', async () => {
    try {
      const processor = getProcessor();
      const stats = await processor.processAllDocuments();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('RAG processing error:', error);
      return {
        success: false,
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })
  
  .delete('/reset', async () => {
    try {
      const processor = getProcessor();
      await processor.reset();
      
      return {
        success: true,
        message: 'RAG pipeline reset successfully'
      };
    } catch (error) {
      console.error('RAG reset error:', error);
      return {
        success: false,
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })
  
  .get('/documents', async ({ query }) => {
    try {
      const { page = 1, limit = 10, region, processed } = query;
      
      const skip = (page - 1) * limit;
      const where: any = {};
      
      if (region) where.region = region;
      if (processed !== undefined) where.processed = processed === 'true';
      
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { chunks: true }
            }
          }
        }),
        prisma.document.count({ where })
      ]);
      
      return {
        success: true,
        data: {
          documents,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get documents error:', error);
      return {
        success: false,
        error: 'Failed to get documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      region: t.Optional(t.String()),
      processed: t.Optional(t.String())
    })
  });

// Import prisma at the bottom to avoid circular dependencies
import { prisma } from '../lib/db.js'; 