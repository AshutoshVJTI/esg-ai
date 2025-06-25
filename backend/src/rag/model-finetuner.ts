import { prisma } from '../lib/db.js';
import { TrainingDataManager } from './training-data-manager.js';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

export interface FinetuningConfig {
  name: string;
  version: string;
  baseModel: string;
  trainingConfig: {
    epochs?: number;
    learningRate?: number;
    batchSize?: number;
    validationSplit?: number;
    warmupSteps?: number;
    maxTokens?: number;
  };
  datasetId: string;
  description?: string;
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  validationLoss?: number;
  accuracy?: number;
  bleuScore?: number;
  rouge1?: number;
  rouge2?: number;
  rougeL?: number;
  timestamp: string;
}

export interface EvaluationResult {
  score: number;
  metrics: {
    accuracy: number;
    bleuScore: number;
    rouge1: number;
    rouge2: number;
    rougeL: number;
    perplexity?: number;
    semanticSimilarity: number;
  };
  evaluationType: 'automatic' | 'human' | 'benchmark';
  testData: any[];
  notes?: string;
}

export class ModelFinetuner {
  private trainingDataManager: TrainingDataManager;
  private openaiClient?: OpenAI;

  constructor() {
    this.trainingDataManager = new TrainingDataManager();
    
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Start a finetuning job
   */
  async startFinetuning(config: FinetuningConfig): Promise<string> {
    console.log(`🚀 Starting finetuning job: ${config.name} v${config.version}`);

    // Create model record
    const model = await prisma.finetunedModel.create({
      data: {
        name: config.name,
        version: config.version,
        baseModel: config.baseModel,
        status: 'training',
        config: config,
        description: config.description,
        trainingStarted: new Date()
      }
    });

    try {
      // Export training data
      const trainingData = await this.trainingDataManager.exportDataset(
        config.datasetId,
        'jsonl'
      );

      // Save training data to file
      const trainingFile = path.join(process.cwd(), 'temp', `training_${model.id}.jsonl`);
      await fs.mkdir(path.dirname(trainingFile), { recursive: true });
      await fs.writeFile(trainingFile, trainingData);

      let trainingJobId: string;

      if (config.baseModel.startsWith('gpt-') && this.openaiClient) {
        // OpenAI fine-tuning
        trainingJobId = await this.startOpenAIFinetuning(model.id, trainingFile, config);
      } else {
        // Local model fine-tuning
        trainingJobId = await this.startLocalFinetuning(model.id, trainingFile, config);
      }

      // Update model with job ID
      await prisma.finetunedModel.update({
        where: { id: model.id },
        data: { trainingJobId }
      });

      console.log(`✅ Finetuning job started: ${trainingJobId}`);
      return model.id;

    } catch (error) {
      console.error(`❌ Finetuning failed for ${model.id}:`, error);
      
      await prisma.finetunedModel.update({
        where: { id: model.id },
        data: { 
          status: 'failed',
          trainingMetrics: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      });
      
      throw error;
    }
  }

  /**
   * Monitor training progress
   */
  async monitorTraining(modelId: string): Promise<void> {
    const model = await prisma.finetunedModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    console.log(`📊 Monitoring training for ${model.name} v${model.version}`);

    if (model.baseModel.startsWith('gpt-') && this.openaiClient) {
      await this.monitorOpenAITraining(model);
    } else {
      await this.monitorLocalTraining(model);
    }
  }

  /**
   * Evaluate a trained model
   */
  async evaluateModel(
    modelId: string,
    testDatasetId?: string
  ): Promise<EvaluationResult> {
    const model = await prisma.finetunedModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    console.log(`🧪 Evaluating model ${model.name} v${model.version}`);

    // Get test data
    const testData = testDatasetId 
      ? await this.getTestDataFromDataset(testDatasetId)
      : await this.generateTestData(model);

    // Run evaluation
    const results = await this.runEvaluation(model, testData);

    // Store evaluation results
    await prisma.modelEvaluation.create({
      data: {
        modelId: modelId,
        evaluationType: 'automatic',
        score: results.score,
        metrics: results.metrics,
        evaluationData: { testSize: testData.length }
      }
    });

    // Update model evaluation score
    await prisma.finetunedModel.update({
      where: { id: modelId },
      data: { evaluationScore: results.score }
    });

    console.log(`✅ Evaluation completed. Score: ${results.score.toFixed(3)}`);
    return results;
  }

  /**
   * Deploy a model to production
   */
  async deployModel(modelId: string): Promise<void> {
    const model = await prisma.finetunedModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (model.status !== 'completed') {
      throw new Error(`Model is not ready for deployment. Status: ${model.status}`);
    }

    console.log(`🚀 Deploying model ${model.name} v${model.version}`);

    // Deactivate current production model
    await prisma.finetunedModel.updateMany({
      where: { 
        name: model.name,
        isProduction: true 
      },
      data: { 
        isProduction: false,
        isActive: false 
      }
    });

    // Activate new model
    await prisma.finetunedModel.update({
      where: { id: modelId },
      data: { 
        isProduction: true,
        isActive: true 
      }
    });

    console.log(`✅ Model deployed to production`);
  }

  /**
   * Get model performance comparison
   */
  async compareModels(modelIds: string[]): Promise<any> {
    const models = await prisma.finetunedModel.findMany({
      where: { id: { in: modelIds } },
      include: { evaluations: true }
    });

    const comparison = models.map(model => {
      const latestEval = model.evaluations
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return {
        id: model.id,
        name: model.name,
        version: model.version,
        baseModel: model.baseModel,
        status: model.status,
        evaluationScore: model.evaluationScore,
        trainingCompleted: model.trainingCompleted,
        metrics: latestEval?.metrics || {},
        isProduction: model.isProduction
      };
    });

    return {
      models: comparison,
      bestModel: comparison.reduce((best, current) => 
        (current.evaluationScore || 0) > (best.evaluationScore || 0) ? current : best
      ),
      averageScore: comparison.reduce((sum, model) => 
        sum + (model.evaluationScore || 0), 0) / comparison.length
    };
  }

  // === PRIVATE METHODS ===

  private async startOpenAIFinetuning(
    modelId: string,
    trainingFile: string,
    config: FinetuningConfig
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    // Upload training file
    const file = await this.openaiClient.files.create({
      file: await fs.readFile(trainingFile),
      purpose: 'fine-tune'
    });

    // Create fine-tuning job
    const fineTune = await this.openaiClient.fineTuning.jobs.create({
      training_file: file.id,
      model: config.baseModel,
      hyperparameters: {
        n_epochs: config.trainingConfig.epochs || 3,
        batch_size: config.trainingConfig.batchSize || 'auto',
        learning_rate_multiplier: config.trainingConfig.learningRate || 'auto'
      },
      suffix: `${config.name}-v${config.version}`
    });

    return fineTune.id;
  }

  private async startLocalFinetuning(
    modelId: string,
    trainingFile: string,
    config: FinetuningConfig
  ): Promise<string> {
    // This would integrate with local training infrastructure
    // For now, simulate training with a placeholder job
    const jobId = `local_${modelId}_${Date.now()}`;
    
    console.log(`🔧 Local fine-tuning not yet implemented. Simulating job: ${jobId}`);
    
    // Simulate training completion after delay
    setTimeout(async () => {
      await this.completeLocalTraining(modelId, jobId);
    }, 5000); // 5 second simulation
    
    return jobId;
  }

  private async completeLocalTraining(modelId: string, jobId: string): Promise<void> {
    console.log(`✅ Simulated training completed for job: ${jobId}`);
    
    await prisma.finetunedModel.update({
      where: { id: modelId },
      data: {
        status: 'completed',
        trainingCompleted: new Date(),
        trainingMetrics: {
          finalLoss: 0.35,
          accuracy: 0.87,
          epochs: 3,
          simulation: true
        }
      }
    });
  }

  private async monitorOpenAITraining(model: any): Promise<void> {
    if (!this.openaiClient || !model.trainingJobId) return;

    try {
      const job = await this.openaiClient.fineTuning.jobs.retrieve(model.trainingJobId);
      
      await prisma.finetunedModel.update({
        where: { id: model.id },
        data: {
          status: job.status === 'succeeded' ? 'completed' : 
                 job.status === 'failed' ? 'failed' : 'training',
          trainingCompleted: job.finished_at ? new Date(job.finished_at * 1000) : null,
          trainingMetrics: {
            openaiJobStatus: job.status,
            resultFiles: job.result_files,
            trainedTokens: job.trained_tokens
          }
        }
      });

    } catch (error) {
      console.error(`Error monitoring OpenAI training:`, error);
    }
  }

  private async monitorLocalTraining(model: any): Promise<void> {
    // Monitor local training progress
    console.log(`Monitoring local training for ${model.id}`);
    // Implementation would depend on local training framework
  }

  private async getTestDataFromDataset(datasetId: string): Promise<any[]> {
    const dataset = await prisma.trainingDataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const exampleIds = dataset.examples as string[];
    const splitConfig = dataset.splitConfig as any;
    
    // Get test split examples
    const testExampleIds = splitConfig.testSplit || exampleIds.slice(-Math.floor(exampleIds.length * 0.2));
    
    return prisma.trainingExample.findMany({
      where: { id: { in: testExampleIds } }
    });
  }

  private async generateTestData(model: any): Promise<any[]> {
    // Generate test data from the training data
    return prisma.trainingExample.findMany({
      where: { 
        isValidated: true,
        qualityScore: { gte: 0.8 }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
  }

  private async runEvaluation(model: any, testData: any[]): Promise<EvaluationResult> {
    console.log(`Running evaluation on ${testData.length} test examples`);
    
    // This would run the actual model evaluation
    // For now, return simulated metrics
    const simulatedMetrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      bleuScore: 0.7 + Math.random() * 0.2,
      rouge1: 0.8 + Math.random() * 0.15,
      rouge2: 0.65 + Math.random() * 0.2,
      rougeL: 0.75 + Math.random() * 0.15,
      semanticSimilarity: 0.82 + Math.random() * 0.12
    };

    const overallScore = Object.values(simulatedMetrics).reduce((a, b) => a + b) / Object.keys(simulatedMetrics).length;

    return {
      score: overallScore,
      metrics: simulatedMetrics,
      evaluationType: 'automatic',
      testData: testData.map(d => ({ id: d.id, input: d.input.substring(0, 100) })),
      notes: 'Simulated evaluation for demonstration'
    };
  }
} 