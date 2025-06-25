import { Elysia, t } from 'elysia';
import { TrainingDataManager } from '../rag/training-data-manager.js';
import { ModelFinetuner } from '../rag/model-finetuner.js';
import { prisma } from '../lib/db.js';

const trainingDataManager = new TrainingDataManager();
const modelFinetuner = new ModelFinetuner();

export const finetuningRouter = new Elysia({ prefix: '/api/finetuning' })

  // === TRAINING DATA MANAGEMENT ===

  // Add manual training example
  .post('/examples', async ({ body }) => {
    try {
      const exampleId = await trainingDataManager.addTrainingExample(body);
      return {
        success: true,
        data: { exampleId },
        message: 'Training example added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add training example: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      input: t.String({ minLength: 10, maxLength: 5000 }),
      context: t.String({ minLength: 10, maxLength: 20000 }),
      expectedOutput: t.String({ minLength: 10, maxLength: 10000 }),
      standard: t.String(),
      category: t.String(),
      difficulty: t.Union([t.Literal('basic'), t.Literal('intermediate'), t.Literal('advanced')]),
      tags: t.Optional(t.Array(t.String())),
      metadata: t.Optional(t.Record(t.String(), t.Any()))
    })
  })

  // Generate synthetic training examples
  .post('/examples/generate', async ({ body }) => {
    try {
      const { standard, category, count, difficulty } = body;
      const generatedIds = await trainingDataManager.generateSyntheticExamples(
        standard, 
        category, 
        count || 10, 
        difficulty || 'intermediate'
      );
      
      return {
        success: true,
        data: { 
          generatedIds,
          count: generatedIds.length 
        },
        message: `Generated ${generatedIds.length} synthetic examples`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate examples: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      standard: t.String(),
      category: t.String(),
      count: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      difficulty: t.Optional(t.Union([t.Literal('basic'), t.Literal('intermediate'), t.Literal('advanced')]))
    })
  })

  // Get examples for human review
  .get('/examples/review', async ({ query }) => {
    try {
      const { limit = 10, standard, category } = query;
      const examples = await trainingDataManager.getExamplesForReview(
        Number(limit), 
        standard, 
        category
      );
      
      return {
        success: true,
        data: examples,
        message: `Found ${examples.length} examples for review`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get examples for review: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // Validate training example
  .post('/examples/:id/validate', async ({ params, body }) => {
    try {
      const { id } = params;
      const { isValid, qualityScore, validatedBy, notes } = body;
      
      await trainingDataManager.validateExample(
        id, 
        isValid, 
        qualityScore, 
        validatedBy, 
        notes
      );
      
      return {
        success: true,
        message: 'Example validated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate example: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      isValid: t.Boolean(),
      qualityScore: t.Number({ minimum: 0, maximum: 1 }),
      validatedBy: t.String(),
      notes: t.Optional(t.String())
    })
  })

  // === DATASET MANAGEMENT ===

  // Create training dataset
  .post('/datasets', async ({ body }) => {
    try {
      const datasetId = await trainingDataManager.createDataset(body);
      return {
        success: true,
        data: { datasetId },
        message: 'Dataset created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create dataset: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      name: t.String(),
      version: t.String(),
      description: t.Optional(t.String()),
      standards: t.Array(t.String()),
      categories: t.Array(t.String()),
      splitRatio: t.Object({
        train: t.Number({ minimum: 0.1, maximum: 0.9 }),
        validation: t.Number({ minimum: 0.05, maximum: 0.3 }),
        test: t.Number({ minimum: 0.05, maximum: 0.3 })
      }),
      minExamplesPerCategory: t.Number({ minimum: 5 }),
      balanceStandards: t.Boolean()
    })
  })

  // Export dataset
  .get('/datasets/:id/export', async ({ params, query }) => {
    try {
      const { id } = params;
      const { format = 'jsonl' } = query;
      
      const exportedData = await trainingDataManager.exportDataset(
        id, 
        format as 'jsonl' | 'csv' | 'huggingface'
      );
      
      return new Response(exportedData, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
          'Content-Disposition': `attachment; filename="dataset_${id}.${format}"`
        }
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to export dataset: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // Get dataset statistics
  .get('/datasets/stats', async ({ query }) => {
    try {
      const { datasetId } = query;
      const stats = await trainingDataManager.getDatasetStats(datasetId);
      
      return {
        success: true,
        data: stats,
        message: 'Dataset statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get dataset stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // === MODEL TRAINING ===

  // Start finetuning job
  .post('/models/train', async ({ body }) => {
    try {
      const modelId = await modelFinetuner.startFinetuning(body);
      return {
        success: true,
        data: { modelId },
        message: 'Finetuning job started successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start finetuning: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      name: t.String(),
      version: t.String(),
      baseModel: t.String(),
      trainingConfig: t.Object({
        epochs: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
        learningRate: t.Optional(t.Number({ minimum: 0.00001, maximum: 0.1 })),
        batchSize: t.Optional(t.Number({ minimum: 1, maximum: 128 })),
        validationSplit: t.Optional(t.Number({ minimum: 0.1, maximum: 0.3 })),
        warmupSteps: t.Optional(t.Number({ minimum: 0 })),
        maxTokens: t.Optional(t.Number({ minimum: 512, maximum: 8192 }))
      }),
      datasetId: t.String(),
      description: t.Optional(t.String())
    })
  })

  // Monitor training progress
  .post('/models/:id/monitor', async ({ params }) => {
    try {
      const { id } = params;
      await modelFinetuner.monitorTraining(id);
      
      return {
        success: true,
        message: 'Training monitoring updated'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to monitor training: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // Get model training status
  .get('/models/:id/status', async ({ params }) => {
    try {
      const { id } = params;
      const model = await prisma.finetunedModel.findUnique({
        where: { id },
        include: { evaluations: true }
      });

      if (!model) {
        return {
          success: false,
          error: 'Model not found'
        };
      }

      return {
        success: true,
        data: {
          id: model.id,
          name: model.name,
          version: model.version,
          status: model.status,
          trainingStarted: model.trainingStarted,
          trainingCompleted: model.trainingCompleted,
          trainingMetrics: model.trainingMetrics,
          evaluationScore: model.evaluationScore,
          isActive: model.isActive,
          isProduction: model.isProduction
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get model status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // === MODEL EVALUATION ===

  // Evaluate model
  .post('/models/:id/evaluate', async ({ params, body }) => {
    try {
      const { id } = params;
      const { testDatasetId } = body;
      
      const results = await modelFinetuner.evaluateModel(id, testDatasetId);
      
      return {
        success: true,
        data: results,
        message: 'Model evaluation completed'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to evaluate model: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      testDatasetId: t.Optional(t.String())
    })
  })

  // Compare models
  .post('/models/compare', async ({ body }) => {
    try {
      const { modelIds } = body;
      const comparison = await modelFinetuner.compareModels(modelIds);
      
      return {
        success: true,
        data: comparison,
        message: 'Model comparison completed'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to compare models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      modelIds: t.Array(t.String(), { minItems: 2, maxItems: 10 })
    })
  })

  // === MODEL DEPLOYMENT ===

  // Deploy model to production
  .post('/models/:id/deploy', async ({ params }) => {
    try {
      const { id } = params;
      await modelFinetuner.deployModel(id);
      
      return {
        success: true,
        message: 'Model deployed to production successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to deploy model: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // List all models
  .get('/models', async ({ query }) => {
    try {
      const { status, isProduction, limit = 20 } = query;
      
      const models = await prisma.finetunedModel.findMany({
        where: {
          ...(status && { status }),
          ...(isProduction !== undefined && { isProduction: isProduction === 'true' })
        },
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      });

      return {
        success: true,
        data: models.map(model => ({
          id: model.id,
          name: model.name,
          version: model.version,
          baseModel: model.baseModel,
          status: model.status,
          evaluationScore: model.evaluationScore,
          isProduction: model.isProduction,
          isActive: model.isActive,
          trainingStarted: model.trainingStarted,
          trainingCompleted: model.trainingCompleted,
          latestEvaluation: model.evaluations[0] || null
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // Get training overview/dashboard
  .get('/overview', async () => {
    try {
      const [
        totalExamples,
        validatedExamples,
        totalModels,
        activeModels,
        productionModels,
        recentTraining
      ] = await Promise.all([
        prisma.trainingExample.count(),
        prisma.trainingExample.count({ where: { isValidated: true } }),
        prisma.finetunedModel.count(),
        prisma.finetunedModel.count({ where: { isActive: true } }),
        prisma.finetunedModel.count({ where: { isProduction: true } }),
        prisma.finetunedModel.findMany({
          where: { status: 'training' },
          orderBy: { trainingStarted: 'desc' },
          take: 5
        })
      ]);

      return {
        success: true,
        data: {
          trainingData: {
            totalExamples,
            validatedExamples,
            validationRate: totalExamples > 0 ? validatedExamples / totalExamples : 0
          },
          models: {
            total: totalModels,
            active: activeModels,
            production: productionModels
          },
          recentActivity: {
            activeTraining: recentTraining.length,
            recentJobs: recentTraining.map(job => ({
              id: job.id,
              name: job.name,
              version: job.version,
              status: job.status,
              startedAt: job.trainingStarted
            }))
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get overview: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }); 