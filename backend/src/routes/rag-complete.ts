import { Elysia, t } from 'elysia';
import { ESGRAGChain } from '../rag/rag-chain.js';
import type { RAGConfig } from '../rag/rag-chain.js';

// Environment variables for configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_PROVIDER = (process.env.LLM_PROVIDER as 'openai' | 'local') || 'local';

let ragChain: ESGRAGChain | null = null;

function getRAGChain(): ESGRAGChain {
  if (!ragChain) {
    const config: RAGConfig = {
      llm: {
        provider: LLM_PROVIDER,
        apiKey: OPENAI_API_KEY,
        model: LLM_PROVIDER === 'openai' ? 'gpt-4-turbo' : 'local-model',
        temperature: 0.2,
        maxTokens: 1000
      },
      retrieval: {
        topK: 5,
        minSimilarity: 0.3,
        enableReranking: false
      },
      generation: {
        includeSourceCitations: true,
        maxContextTokens: 3000,
        responseFormat: 'standard',
        promptTemplate: 'esg-compliance',
        enableGuardrails: true
      }
    };

    ragChain = new ESGRAGChain(config);
  }
  return ragChain;
}

export const ragCompleteRoutes = new Elysia({ prefix: '/api/rag' })
  
  // Simple chat endpoint for frontend compatibility
  .post('/chat', async ({ body }) => {
    try {
      const { message } = body;
      
      console.log(`💬 Chat Query: "${message}"`);
      
      const chain = getRAGChain();
      
      // Configure for chat-friendly responses
      chain.getConfig().generation.responseFormat = 'standard';
      chain.getConfig().generation.promptTemplate = 'esg-compliance';
      chain.getConfig().generation.enableGuardrails = true;
      
      const response = await chain.query(message);
      
      // Format response for chat interface
      let chatMessage = response.answer;
      
             // Add source citations if available and response has content
       if (response.sources.length > 0 && response.answer.length > 50) {
         chatMessage += "\n\n📚 **Sources:**";
         response.sources.slice(0, 3).forEach((source, index) => {
           chatMessage += `\n• ${source.filename}`;
           if (source.pageNumber) {
             chatMessage += ` (page ${source.pageNumber})`;
           }
         });
         
         if (response.sources.length > 3) {
           chatMessage += `\n• ... and ${response.sources.length - 3} more sources`;
         }
       }
      
      return {
        success: true,
        message: chatMessage
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        success: false,
        message: "I apologize, but I'm having trouble accessing the ESG knowledge base right now. Please try again in a moment, or rephrase your question."
      };
    }
  }, {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 1000 })
    })
  })

  // Main RAG query endpoint
  .post('/ask', async ({ body }) => {
    try {
      const { question, filters, options = {} } = body;
      
      console.log(`📝 RAG Query: "${question}"`);
      
      const chain = getRAGChain();
      
      // Update config if options provided
      if (options.responseFormat) {
        chain.getConfig().generation.responseFormat = options.responseFormat;
      }
      if (options.promptTemplate) {
        chain.getConfig().generation.promptTemplate = options.promptTemplate;
      }
      if (options.enableGuardrails !== undefined) {
        chain.getConfig().generation.enableGuardrails = options.enableGuardrails;
      }
      
      const response = await chain.query(question, filters);
      
      return {
        success: true,
        data: {
          question,
          answer: response.answer,
          sources: response.sources,
          metadata: {
            ...response.metadata,
            timestamp: new Date().toISOString(),
            hasRelevantSources: response.sources.length > 0
          }
        }
      };
    } catch (error) {
      console.error('RAG ask error:', error);
      return {
        success: false,
        error: 'Query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }, {
    body: t.Object({
      question: t.String({ minLength: 5, maxLength: 1000 }),
      filters: t.Optional(t.Object({
        region: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        documentType: t.Optional(t.String())
      })),
      options: t.Optional(t.Object({
        responseFormat: t.Optional(t.Union([
          t.Literal('standard'),
          t.Literal('structured'), 
          t.Literal('bullet-points')
        ])),
        promptTemplate: t.Optional(t.Union([
          t.Literal('esg-compliance'),
          t.Literal('legal-audit'),
          t.Literal('technical-implementation'),
          t.Literal('quick-reference')
        ])),
        includeSourceCitations: t.Optional(t.Boolean()),
        enableGuardrails: t.Optional(t.Boolean()),
        topK: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
        minSimilarity: t.Optional(t.Number({ minimum: 0, maximum: 1 }))
      }))
    })
  })

  // Batch questions endpoint
  .post('/ask-batch', async ({ body }) => {
    try {
      const { questions, filters, options = {} } = body;
      
      console.log(`📝 Batch RAG Query: ${questions.length} questions`);
      
      const chain = getRAGChain();
      const results = [];
      
      for (const question of questions) {
        try {
          const response = await chain.query(question, filters);
          results.push({
            question,
            success: true,
            data: response
          });
        } catch (error) {
          results.push({
            question,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return {
        success: true,
        data: {
          results,
          summary: {
            totalQuestions: questions.length,
            successfulQuestions: results.filter(r => r.success).length,
            failedQuestions: results.filter(r => !r.success).length
          }
        }
      };
    } catch (error) {
      console.error('RAG batch ask error:', error);
      return {
        success: false,
        error: 'Batch query failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, {
    body: t.Object({
      questions: t.Array(t.String({ minLength: 5, maxLength: 1000 }), { minItems: 1, maxItems: 5 }),
      filters: t.Optional(t.Object({
        region: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        documentType: t.Optional(t.String())
      })),
      options: t.Optional(t.Object({
        responseFormat: t.Optional(t.Union([
          t.Literal('standard'),
          t.Literal('structured'), 
          t.Literal('bullet-points')
        ]))
      }))
    })
  })

  // Test RAG pipeline
  .post('/test', async () => {
    try {
      console.log('🧪 Testing complete RAG pipeline...');
      
      const chain = getRAGChain();
      const isWorking = await chain.testPipeline();
      
      if (isWorking) {
        // Test with sample ESG questions
        const testQuestions = [
          "What are the key ESRS environmental disclosure requirements?",
          "How should companies report climate-related risks under TCFD?",
          "What social metrics must be disclosed under ESRS?"
        ];
        
        const testResults = [];
        for (const question of testQuestions) {
          try {
            const response = await chain.query(question);
            testResults.push({
              question,
              hasAnswer: response.answer.length > 0,
              sourcesCount: response.sources.length,
              processingTime: response.metadata.processingTimeMs
            });
          } catch (error) {
            testResults.push({
              question,
              hasAnswer: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        return {
          success: true,
          data: {
            pipelineStatus: 'working',
            testResults,
            config: chain.getConfig()
          }
        };
      } else {
        return {
          success: false,
          error: 'Pipeline test failed',
          data: {
            pipelineStatus: 'failed'
          }
        };
      }
    } catch (error) {
      console.error('RAG test error:', error);
      return {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })

  // Get RAG configuration
  .get('/config', async () => {
    try {
      const chain = getRAGChain();
      const config = chain.getConfig();
      
      return {
        success: true,
        data: {
          ...config,
          isConfigured: true,
          llmProvider: config.llm.provider,
          hasApiKey: config.llm.provider === 'openai' ? !!OPENAI_API_KEY : true
        }
      };
    } catch (error) {
      console.error('RAG config error:', error);
      return {
        success: false,
        error: 'Failed to get configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })

  // Health check for RAG system
  .get('/health', async () => {
    try {
      const chain = getRAGChain();
      
      // Quick health checks
      const checks = {
        llmConnected: false,
        vectorStoreReady: false,
        documentsLoaded: false
      };
      
      try {
        // Test LLM connection (quick)
        const testResponse = await chain.query('test', {});
        checks.llmConnected = true;
        checks.vectorStoreReady = true;
        checks.documentsLoaded = testResponse.sources.length > 0;
      } catch (error) {
        console.log('Health check failed:', error);
      }
      
      const isHealthy = checks.llmConnected && checks.vectorStoreReady;
      
      return {
        success: true,
        data: {
          status: isHealthy ? 'healthy' : 'degraded',
          checks,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      };
    } catch (error) {
      console.error('RAG health check error:', error);
      return {
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })

  // Get available prompt templates
  .get('/prompt-templates', async () => {
    try {
      // Import here to avoid circular dependencies
      const { ESGPromptStrategy } = await import('../rag/prompt-strategy.js');
      const promptStrategy = new ESGPromptStrategy();
      const templates = promptStrategy.getAvailableTemplates();

      return {
        success: true,
        data: {
          templates: templates.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            complianceTone: template.complianceTone,
            responseFormat: template.responseFormat,
            guardrails: template.guardrails
          })),
          defaultTemplate: 'esg-compliance',
          usage: {
            'esg-compliance': 'General ESG compliance questions and regulatory guidance',
            'legal-audit': 'Legal analysis, audit preparation, and compliance verification',
            'technical-implementation': 'Technical procedures, methodologies, and implementation guidance',
            'quick-reference': 'Quick lookups and concise regulatory information'
          }
        }
      };
    } catch (error) {
      console.error('Prompt templates error:', error);
      return {
        success: false,
        error: 'Failed to get prompt templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })

  // Test prompt validation and guardrails
  .post('/validate-response', async ({ body }) => {
    try {
      const { response, templateId, context } = body;
      
      // Import here to avoid circular dependencies
      const { ESGPromptStrategy } = await import('../rag/prompt-strategy.js');
      const promptStrategy = new ESGPromptStrategy();
      
      const validation = promptStrategy.validateResponse(response, templateId || 'esg-compliance');
      
      return {
        success: true,
        data: {
          validation,
          recommendations: validation.recommendations,
          guardrailsApplied: validation.violations.length > 0
        }
      };
    } catch (error) {
      console.error('Response validation error:', error);
      return {
        success: false,
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, {
    body: t.Object({
      response: t.String(),
      templateId: t.Optional(t.String()),
      context: t.Optional(t.Any())
    })
  })

  // Sample ESG questions for testing
  .get('/sample-questions', async () => {
    try {
      const sampleQuestions = {
        environmental: [
          "What are the ESRS E1 climate change disclosure requirements?",
          "How should companies calculate and report Scope 3 emissions?",
          "What climate transition plan requirements are specified in TCFD?",
          "What environmental data points must be disclosed under EU Taxonomy?",
          "How should companies assess climate-related physical risks?"
        ],
        social: [
          "What are the ESRS S1 own workforce disclosure requirements?",
          "How should companies report on diversity and inclusion metrics?",
          "What human rights due diligence requirements apply under ESRS?",
          "What social metrics must be disclosed in sustainability reports?",
          "How should companies assess impacts on affected communities?"
        ],
        governance: [
          "What governance arrangements for sustainability must be disclosed?",
          "How should companies report on ESG board oversight?",
          "What due diligence processes are required under ESRS?",
          "How should companies disclose sustainability-related executive compensation?",
          "What stakeholder engagement requirements apply under ESG frameworks?"
        ],
        general: [
          "What is double materiality assessment under ESRS?",
          "How do TCFD and ESRS requirements differ?",
          "What are the key differences between GRI and SASB standards?",
          "When do the ESRS disclosure requirements become mandatory?",
          "How should companies prepare for CSRD implementation?"
        ]
      };
      
      return {
        success: true,
        data: {
          categories: Object.keys(sampleQuestions),
          questions: sampleQuestions,
          totalQuestions: Object.values(sampleQuestions).reduce((sum, arr) => sum + arr.length, 0)
        }
      };
    } catch (error) {
      console.error('Sample questions error:', error);
      return {
        success: false,
        error: 'Failed to get sample questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }); 