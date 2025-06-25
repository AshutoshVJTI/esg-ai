import { Elysia, t } from 'elysia';
import { ESGRAGProcessor } from '../rag/processor-final.js';

let processor: ESGRAGProcessor | null = null;

function getProcessor(): ESGRAGProcessor {
  if (!processor) {
    processor = new ESGRAGProcessor();
  }
  return processor;
}

export const ragFinalRoutes = new Elysia({ prefix: '/api/rag' })
  .post('/search', async ({ body }) => {
    try {
      const { query, topK = 5, minSimilarity = 0.3 } = body;
      
      const processor = getProcessor();
      const results = await processor.search(query, { topK, minSimilarity });
      
      return {
        success: true,
        data: {
          query,
          resultsCount: results.length,
          results: results.map(result => ({
            id: result.id,
            content: result.content.substring(0, 400) + (result.content.length > 400 ? '...' : ''),
            similarity: Math.round(result.similarity * 1000) / 1000,
            metadata: {
              filename: result.metadata.filename,
              region: result.metadata.region,
              organization: result.metadata.organization,
              pageNumber: result.metadata.pageNumber,
              chunkIndex: result.metadata.chunkIndex,
              tokenCount: result.metadata.tokenCount
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
      topK: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
      minSimilarity: t.Optional(t.Number({ minimum: 0, maximum: 1 }))
    })
  })
  
  .get('/stats', async () => {
    try {
      const processor = getProcessor();
      const stats = await processor.getStats();
      
      return {
        success: true,
        data: {
          totalChunks: stats.vector.databaseCount,
          isInitialized: stats.vector.databaseCount > 0,
          ...stats
        }
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
      const stats = await processor.processDocuments();
      
      return {
        success: true,
        data: {
          message: 'Processing completed',
          stats: {
            documentsProcessed: stats.documentsProcessed,
            chunksCreated: stats.chunksCreated,
            embeddingsGenerated: stats.embeddingsGenerated,
            processingTimeSeconds: Math.round(stats.processingTime / 1000),
            errorCount: stats.errors.length,
            errors: stats.errors
          }
        }
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
  }); 