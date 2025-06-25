import { prisma } from '../lib/db.js';
import { ESGRAGChain } from './rag-chain.js';
import type { RAGConfig } from './rag-chain.js';

export interface TrainingExampleData {
  input: string;
  context: string;
  expectedOutput: string;
  standard: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DatasetSplit {
  train: string[];  // Example IDs
  validation: string[];
  test: string[];
}

export interface DatasetConfig {
  name: string;
  version: string;
  description?: string;
  standards: string[];
  categories: string[];
  splitRatio: {
    train: number;
    validation: number;
    test: number;
  };
  minExamplesPerCategory: number;
  balanceStandards: boolean;
}

export class TrainingDataManager {
  private ragChain: ESGRAGChain;

  constructor() {
    // Initialize RAG chain for generating synthetic examples
    const config: RAGConfig = {
      llm: {
        provider: process.env.LLM_PROVIDER as 'openai' | 'local' || 'local',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo',
        temperature: 0.1,
        maxTokens: 2000
      },
      retrieval: {
        topK: 5,
        minSimilarity: 0.3,
        enableReranking: true
      },
      generation: {
        includeSourceCitations: true,
        maxContextTokens: 3000,
        responseFormat: 'structured',
        promptTemplate: 'legal-audit',
        enableGuardrails: true
      }
    };

    this.ragChain = new ESGRAGChain(config);
  }

  /**
   * Add a manually annotated training example
   */
  async addTrainingExample(data: TrainingExampleData): Promise<string> {
    const example = await prisma.trainingExample.create({
      data: {
        input: data.input,
        context: data.context,
        expectedOutput: data.expectedOutput,
        standard: data.standard,
        category: data.category,
        difficulty: data.difficulty,
        tags: data.tags || [],
        metadata: data.metadata || {},
        isValidated: false
      }
    });

    console.log(`✅ Added training example: ${example.id}`);
    return example.id;
  }

  /**
   * Generate synthetic training examples using RAG
   */
  async generateSyntheticExamples(
    standard: string,
    category: string,
    count: number = 10,
    difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<string[]> {
    console.log(`🤖 Generating ${count} synthetic examples for ${standard} - ${category}`);
    
    const generatedIds: string[] = [];
    const baseQuestions = this.getTemplateQuestions(standard, category, difficulty);

    for (let i = 0; i < count; i++) {
      try {
        // Vary the question slightly to create diversity
        const questionTemplate = baseQuestions[i % baseQuestions.length];
        const question = this.varyQuestion(questionTemplate, i);

        // Get RAG response to use as training data
        const ragResponse = await this.ragChain.query(question, {
          standard: standard
        });

        if (ragResponse.sources.length === 0) {
          console.warn(`⚠️  No sources found for question: ${question}`);
          continue;
        }

        // Create context from retrieved sources
        const context = ragResponse.sources.map((source: any, idx: number) => 
          `[Source ${idx + 1}: ${source.metadata?.filename || 'Unknown'}]\n${source.content || source.snippet}`
        ).join('\n\n---\n\n');

        // Use the RAG answer as expected output (this would ideally be human-reviewed)
        const exampleData: TrainingExampleData = {
          input: question,
          context: context,
          expectedOutput: ragResponse.answer,
          standard: standard,
          category: category,
          difficulty: difficulty,
          tags: this.extractTags(question, ragResponse.answer),
          metadata: {
            generated: true,
            generationMethod: 'rag_response',
            sources: ragResponse.sources.length,
            confidence: ragResponse.sources[0]?.similarity || 0
          }
        };

        const exampleId = await this.addTrainingExample(exampleData);
        generatedIds.push(exampleId);

        // Small delay to avoid overwhelming the system
        await this.delay(500);

      } catch (error) {
        console.error(`❌ Error generating example ${i + 1}:`, error);
      }
    }

    console.log(`✅ Generated ${generatedIds.length}/${count} synthetic examples`);
    return generatedIds;
  }

  /**
   * Create a training dataset with proper splits
   */
  async createDataset(config: DatasetConfig): Promise<string> {
    console.log(`📊 Creating dataset: ${config.name} v${config.version}`);

    // Get examples matching criteria
    const examples = await prisma.trainingExample.findMany({
      where: {
        standard: { in: config.standards },
        category: { in: config.categories },
        isValidated: true // Only use validated examples
      },
      orderBy: [
        { qualityScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (examples.length < config.minExamplesPerCategory * config.categories.length) {
      throw new Error(`Insufficient training examples. Need at least ${config.minExamplesPerCategory} per category.`);
    }

    // Create balanced splits
    const splits = this.createBalancedSplits(examples, config);
    
    const dataset = await prisma.trainingDataset.create({
      data: {
        name: config.name,
        version: config.version,
        description: config.description,
        splitConfig: {
          ratio: config.splitRatio,
          strategy: 'stratified',
          balanceStandards: config.balanceStandards
        },
        examples: examples.map(e => e.id),
        standards: config.standards,
        categories: config.categories,
        totalSize: examples.length,
        trainSize: splits.train.length,
        valSize: splits.validation.length,
        testSize: splits.test.length
      }
    });

    console.log(`✅ Created dataset ${dataset.id} with ${examples.length} examples`);
    console.log(`   📈 Train: ${splits.train.length}, Val: ${splits.validation.length}, Test: ${splits.test.length}`);
    
    return dataset.id;
  }

  /**
   * Validate a training example (human review)
   */
  async validateExample(
    exampleId: string,
    isValid: boolean,
    qualityScore: number,
    validatedBy: string,
    notes?: string
  ): Promise<void> {
    await prisma.trainingExample.update({
      where: { id: exampleId },
      data: {
        isValidated: isValid,
        qualityScore: qualityScore,
        validatedBy: validatedBy,
        validatedAt: new Date(),
        metadata: {
          ...((await prisma.trainingExample.findUnique({ where: { id: exampleId } }))?.metadata as any || {}),
          validationNotes: notes
        }
      }
    });

    console.log(`✅ Validated example ${exampleId}: ${isValid ? 'PASS' : 'FAIL'} (score: ${qualityScore})`);
  }

  /**
   * Get examples for human review
   */
  async getExamplesForReview(
    limit: number = 10,
    standard?: string,
    category?: string
  ): Promise<any[]> {
    return prisma.trainingExample.findMany({
      where: {
        isValidated: false,
        ...(standard && { standard }),
        ...(category && { category })
      },
      orderBy: [
        { createdAt: 'asc' }
      ],
      take: limit
    });
  }

  /**
   * Export dataset in various formats
   */
  async exportDataset(
    datasetId: string,
    format: 'jsonl' | 'csv' | 'huggingface' = 'jsonl'
  ): Promise<string> {
    const dataset = await prisma.trainingDataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const exampleIds = dataset.examples as string[];
    const examples = await prisma.trainingExample.findMany({
      where: {
        id: { in: exampleIds }
      }
    });

    switch (format) {
      case 'jsonl':
        return this.exportAsJSONL(examples, dataset);
      case 'csv':
        return this.exportAsCSV(examples, dataset);
      case 'huggingface':
        return this.exportAsHuggingFace(examples, dataset);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(datasetId?: string): Promise<any> {
    if (datasetId) {
      const dataset = await prisma.trainingDataset.findUnique({
        where: { id: datasetId }
      });

      if (!dataset) {
        throw new Error(`Dataset not found: ${datasetId}`);
      }

      const exampleIds = dataset.examples as string[];
      const examples = await prisma.trainingExample.findMany({
        where: { id: { in: exampleIds } }
      });

      return this.calculateDatasetStats(examples, dataset);
    }

    // Overall statistics
    const totalExamples = await prisma.trainingExample.count();
    const validatedExamples = await prisma.trainingExample.count({
      where: { isValidated: true }
    });

    const byStandard = await prisma.trainingExample.groupBy({
      by: ['standard'],
      _count: true,
      orderBy: { _count: { standard: 'desc' } }
    });

    const byCategory = await prisma.trainingExample.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } }
    });

    const avgQualityScore = await prisma.trainingExample.aggregate({
      _avg: { qualityScore: true },
      where: { qualityScore: { not: null } }
    });

    return {
      total: totalExamples,
      validated: validatedExamples,
      validationRate: validatedExamples / totalExamples,
      averageQualityScore: avgQualityScore._avg.qualityScore,
      byStandard: byStandard.map((s: any) => ({ standard: s.standard, count: s._count })),
      byCategory: byCategory.map((c: any) => ({ category: c.category, count: c._count }))
    };
  }

  // === PRIVATE HELPER METHODS ===

  private getTemplateQuestions(
    standard: string,
    category: string,
    difficulty: string
  ): string[] {
    const templates: Record<string, Record<string, string[]>> = {
      'TCFD': {
        'Governance': [
          'What are the TCFD governance disclosure requirements for board oversight?',
          'How should companies disclose management\'s role in climate governance?',
          'What climate-related governance structures must be disclosed under TCFD?'
        ],
        'Strategy': [
          'What climate strategy disclosures are required under TCFD?',
          'How should companies disclose climate-related risks and opportunities?',
          'What scenario analysis requirements exist under TCFD?'
        ],
        'Risk Management': [
          'What climate risk management processes must be disclosed?',
          'How should companies integrate climate risks into overall risk management?',
          'What climate risk assessment methodologies are recommended by TCFD?'
        ]
      },
      'ESRS': {
        'Governance': [
          'What governance arrangements must be disclosed under ESRS?',
          'How should companies disclose sustainability governance structures?',
          'What board oversight requirements exist under ESRS?'
        ],
        'Environmental': [
          'What environmental disclosures are required under ESRS E1?',
          'How should companies assess environmental impacts under ESRS?',
          'What climate change disclosures are mandated by ESRS?'
        ],
        'Social': [
          'What workforce disclosures are required under ESRS S1?',
          'How should companies report on social impacts under ESRS?',
          'What human rights disclosures are mandated by ESRS?'
        ]
      }
    };

    return templates[standard]?.[category] || [
      `What are the ${standard} requirements for ${category.toLowerCase()}?`,
      `How should companies comply with ${standard} ${category.toLowerCase()} standards?`,
      `What disclosures are required under ${standard} for ${category.toLowerCase()}?`
    ];
  }

  private varyQuestion(template: string, variation: number): string {
    const variations = [
      template,
      template.replace('What are', 'Can you explain'),
      template.replace('How should', 'What is the recommended approach for'),
      template.replace('requirements', 'obligations'),
      template.replace('must be disclosed', 'should companies disclose'),
      template.replace('required', 'mandated'),
    ];

    return variations[variation % variations.length];
  }

  private extractTags(question: string, answer: string): string[] {
    const text = `${question} ${answer}`.toLowerCase();
    const tags: string[] = [];

    const keywords = [
      'governance', 'strategy', 'risk', 'metrics', 'targets', 'climate', 
      'environmental', 'social', 'disclosure', 'reporting', 'compliance',
      'materiality', 'stakeholder', 'sustainability', 'emissions', 'scenario'
    ];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return [...new Set(tags)].slice(0, 5); // Max 5 tags, deduplicated
  }

  private createBalancedSplits(
    examples: any[],
    config: DatasetConfig
  ): DatasetSplit {
    // Group by standard and category for balanced splitting
    const groups: Record<string, any[]> = {};
    
    for (const example of examples) {
      const key = `${example.standard}_${example.category}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(example);
    }

    const splits: DatasetSplit = { train: [], validation: [], test: [] };

    // Split each group proportionally
    for (const group of Object.values(groups)) {
      const shuffled = group.sort(() => Math.random() - 0.5);
      
      const trainSize = Math.floor(shuffled.length * config.splitRatio.train);
      const valSize = Math.floor(shuffled.length * config.splitRatio.validation);
      
      splits.train.push(...shuffled.slice(0, trainSize).map(e => e.id));
      splits.validation.push(...shuffled.slice(trainSize, trainSize + valSize).map(e => e.id));
      splits.test.push(...shuffled.slice(trainSize + valSize).map(e => e.id));
    }

    return splits;
  }

  private exportAsJSONL(examples: any[], dataset: any): string {
    const lines = examples.map(example => {
      return JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are an expert ESG compliance assistant. Provide accurate guidance based on the provided regulatory context."
          },
          {
            role: "user", 
            content: `Context: ${example.context}\n\nQuestion: ${example.input}`
          },
          {
            role: "assistant",
            content: example.expectedOutput
          }
        ],
        metadata: {
          standard: example.standard,
          category: example.category,
          difficulty: example.difficulty,
          tags: example.tags
        }
      });
    });

    return lines.join('\n');
  }

  private exportAsCSV(examples: any[], dataset: any): string {
    const headers = ['input', 'context', 'expected_output', 'standard', 'category', 'difficulty', 'tags'];
    const rows = examples.map(example => [
      `"${example.input.replace(/"/g, '""')}"`,
      `"${example.context.replace(/"/g, '""')}"`,
      `"${example.expectedOutput.replace(/"/g, '""')}"`,
      example.standard,
      example.category,
      example.difficulty,
      `"${example.tags.join(', ')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportAsHuggingFace(examples: any[], dataset: any): string {
    const data = {
      info: {
        name: dataset.name,
        version: dataset.version,
        description: dataset.description,
        size: examples.length
      },
      data: examples.map(example => ({
        input: example.input,
        context: example.context,
        output: example.expectedOutput,
        standard: example.standard,
        category: example.category,
        difficulty: example.difficulty,
        tags: example.tags,
        quality_score: example.qualityScore
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  private calculateDatasetStats(examples: any[], dataset: any): any {
    const stats = {
      name: dataset.name,
      version: dataset.version,
      totalExamples: examples.length,
      splits: {
        train: dataset.trainSize,
        validation: dataset.valSize,
        test: dataset.testSize
      },
      standards: {} as Record<string, number>,
      categories: {} as Record<string, number>,
      difficulties: {} as Record<string, number>,
      qualityScores: {
        average: 0,
        min: 0,
        max: 0,
        distribution: {} as Record<string, number>
      }
    };

    // Count by dimensions
    for (const example of examples) {
      stats.standards[example.standard] = (stats.standards[example.standard] || 0) + 1;
      stats.categories[example.category] = (stats.categories[example.category] || 0) + 1;
      stats.difficulties[example.difficulty] = (stats.difficulties[example.difficulty] || 0) + 1;
    }

    // Quality score statistics
    const scores = examples.filter(e => e.qualityScore).map(e => e.qualityScore);
    if (scores.length > 0) {
      stats.qualityScores.average = scores.reduce((a, b) => a + b) / scores.length;
      stats.qualityScores.min = Math.min(...scores);
      stats.qualityScores.max = Math.max(...scores);
    }

    return stats;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 