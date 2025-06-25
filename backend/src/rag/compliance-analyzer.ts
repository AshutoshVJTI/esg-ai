import { ESGRAGChain } from './rag-chain.js';
import type { RAGConfig } from './rag-chain.js';
import { ESGPromptStrategy } from './prompt-strategy.js';
import type { PromptContext } from './prompt-strategy.js';

// Environment variables for configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_PROVIDER = (process.env.LLM_PROVIDER as 'openai' | 'local') || 'local';

export interface ComplianceAnalysisConfig {
  standards: string[];
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  includeRecommendations: boolean;
  generateAnalytics: boolean;
}

export interface ComplianceIssue {
  id: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  context?: string;
  page?: number;
  recommendation?: string;
  highlightedText?: string;
  standard: string;
  category: string;
}

export interface StandardFinding {
  standard: string;
  compliance: number;
  issues: ComplianceIssue[];
}

export interface ComplianceAnalytics {
  issuesByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  issuesBySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  topIssueAreas: Array<{
    area: string;
    category: string;
    count: number;
  }>;
  improvementOpportunities: Array<{
    area: string;
    description: string;
    potential: string;
  }>;
}

export interface ComplianceAnalysisResult {
  overallScore: number;
  summary: string;
  findings: StandardFinding[];
  analytics: ComplianceAnalytics;
  processedAt: string;
  reportName: string;
  status: 'COMPLETED';
}

export class ESGComplianceAnalyzer {
  private ragChain: ESGRAGChain;
  private promptStrategy: ESGPromptStrategy;

  constructor() {
    // Initialize RAG chain with compliance-focused configuration
    const config: RAGConfig = {
      llm: {
        provider: LLM_PROVIDER,
        apiKey: OPENAI_API_KEY,
        model: LLM_PROVIDER === 'openai' ? 'gpt-4-turbo' : 'local-model',
        temperature: 0.1, // Lower temperature for more consistent compliance analysis
        maxTokens: 2000
      },
      retrieval: {
        topK: 8, // More sources for comprehensive analysis
        minSimilarity: 0.2, // Lower threshold to catch more potential issues
        enableReranking: true
      },
      generation: {
        includeSourceCitations: true,
        maxContextTokens: 4000,
        responseFormat: 'structured',
        promptTemplate: 'legal-audit', // Use legal-audit template for compliance
        enableGuardrails: true
      }
    };

    this.ragChain = new ESGRAGChain(config);
    this.promptStrategy = new ESGPromptStrategy();
  }

  /**
   * Analyze a report for ESG compliance
   */
  async analyzeReport(
    reportContent: string,
    reportName: string,
    config: ComplianceAnalysisConfig
  ): Promise<ComplianceAnalysisResult> {
    console.log(`🔍 Starting compliance analysis for: ${reportName}`);
    console.log(`📊 Standards: ${config.standards.join(', ')}`);
    
    try {
      // Break report into sections for analysis
      const reportSections = this.extractReportSections(reportContent);
      
      // Analyze each standard
      const findings: StandardFinding[] = [];
      
      for (const standard of config.standards) {
        console.log(`📋 Analyzing against standard: ${standard}`);
        const standardFinding = await this.analyzeAgainstStandard(
          reportSections,
          standard,
          config.analysisDepth
        );
        findings.push(standardFinding);
      }

      // Calculate overall compliance score
      const overallScore = this.calculateOverallScore(findings);

      // Generate summary
      const summary = await this.generateComplianceSummary(findings, overallScore);

      // Generate analytics if requested
      const analytics = config.generateAnalytics 
        ? this.generateAnalytics(findings)
        : this.getEmptyAnalytics();

      const result: ComplianceAnalysisResult = {
        overallScore,
        summary,
        findings,
        analytics,
        processedAt: new Date().toISOString(),
        reportName,
        status: 'COMPLETED'
      };

      console.log(`✅ Compliance analysis completed. Overall score: ${overallScore}%`);
      return result;

    } catch (error) {
      console.error('❌ Compliance analysis failed:', error);
      throw new Error(`Compliance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze report against a specific standard
   */
  private async analyzeAgainstStandard(
    reportSections: string[],
    standard: string,
    analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  ): Promise<StandardFinding> {
    const issues: ComplianceIssue[] = [];
    
    // Get standard-specific analysis questions based on depth
    const analysisQuestions = this.getStandardAnalysisQuestions(standard, analysisDepth);
    
    for (const question of analysisQuestions) {
      try {
        // Query RAG system for compliance requirements
        const response = await this.ragChain.query(question, {
          organization: this.getStandardOrganization(standard)
        });

        if (response.sources.length > 0) {
          // Analyze report sections against requirements
          const sectionIssues = await this.findComplianceIssues(
            reportSections,
            question,
            response.answer,
            standard
          );
          issues.push(...sectionIssues);
        }
      } catch (error) {
        console.warn(`Warning: Failed to analyze question "${question}" for ${standard}:`, error);
      }
    }

    // Calculate compliance score for this standard
    const compliance = this.calculateStandardCompliance(issues, analysisDepth);

    return {
      standard,
      compliance,
      issues: this.deduplicateIssues(issues)
    };
  }

  /**
   * Extract key sections from the report for analysis
   */
  private extractReportSections(reportContent: string): string[] {
    // Split report into logical sections
    const sections: string[] = [];
    
    // Split by common section headers
    const sectionDelimiters = [
      /executive\s+summary/i,
      /governance/i,
      /strategy/i,
      /risk\s+management/i,
      /metrics\s+and\s+targets/i,
      /environmental/i,
      /social/i,
      /climate/i,
      /emissions/i,
      /sustainability/i
    ];

    let currentSection = '';
    const lines = reportContent.split('\n');

    for (const line of lines) {
      const isNewSection = sectionDelimiters.some(delimiter => 
        delimiter.test(line.trim())
      );

      if (isNewSection && currentSection.length > 100) {
        sections.push(currentSection.trim());
        currentSection = line;
      } else {
        currentSection += '\n' + line;
      }
    }

    // Add the last section
    if (currentSection.trim().length > 100) {
      sections.push(currentSection.trim());
    }

    // If no clear sections found, split into chunks
    if (sections.length < 2) {
      const chunkSize = 2000;
      for (let i = 0; i < reportContent.length; i += chunkSize) {
        sections.push(reportContent.substring(i, i + chunkSize));
      }
    }

    return sections;
  }

  /**
   * Get analysis questions for a specific standard
   */
  private getStandardAnalysisQuestions(
    standard: string,
    depth: 'basic' | 'detailed' | 'comprehensive'
  ): string[] {
    const baseQuestions = this.getBaseQuestions(standard);
    
    if (depth === 'basic') {
      return baseQuestions.slice(0, 3);
    } else if (depth === 'detailed') {
      return baseQuestions.slice(0, 6);
    } else {
      return baseQuestions;
    }
  }

  /**
   * Get base compliance questions for each standard
   */
  private getBaseQuestions(standard: string): string[] {
    const standardQuestions: Record<string, string[]> = {
      'TCFD': [
        'What are the TCFD governance disclosure requirements?',
        'What climate strategy disclosures are required under TCFD?',
        'What climate risk management disclosures must be made?',
        'What climate metrics and targets must be disclosed under TCFD?',
        'How should companies assess climate-related financial risks?',
        'What scenario analysis requirements exist under TCFD?'
      ],
      'ESRS': [
        'What are the ESRS governance arrangements disclosure requirements?',
        'What environmental disclosure requirements exist under ESRS E1?',
        'What social workforce disclosure requirements are mandated by ESRS S1?',
        'What double materiality assessment requirements apply under ESRS?',
        'What due diligence process disclosures are required under ESRS?',
        'What sustainability metrics must be disclosed under ESRS?'
      ],
      'GRI': [
        'What organizational context disclosures are required under GRI?',
        'What stakeholder engagement disclosures must be made per GRI?',
        'What material topic identification requirements exist in GRI?',
        'What environmental impact disclosures are mandated by GRI?',
        'What social impact disclosures are required under GRI?',
        'What governance practice disclosures must be made per GRI?'
      ],
      'SASB': [
        'What industry-specific sustainability disclosures are required under SASB?',
        'What material sustainability factors must be disclosed per SASB?',
        'What environmental performance metrics are mandated by SASB?',
        'What social capital disclosures are required under SASB?',
        'What governance disclosures must be made per SASB standards?',
        'What forward-looking sustainability information should be disclosed per SASB?'
      ]
    };

    return standardQuestions[standard] || [
      `What are the key disclosure requirements under ${standard}?`,
      `What compliance obligations exist under ${standard}?`,
      `What reporting requirements are mandated by ${standard}?`
    ];
  }

  /**
   * Find compliance issues by comparing report content against requirements
   */
  private async findComplianceIssues(
    reportSections: string[],
    question: string,
    requirements: string,
    standard: string
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Create a specific prompt for compliance checking
    const compliancePrompt = `
Based on the following ${standard} requirement:
${requirements}

And the following report content, identify any compliance gaps, missing disclosures, or issues:

REPORT CONTENT:
${reportSections.join('\n\n---\n\n')}

Please identify specific compliance issues in the following format:
- Issue description
- Severity (critical/warning/info)  
- Category
- Specific recommendation

Focus only on clear gaps or deficiencies relative to the stated requirements.
`;

    try {
      // Use a focused prompt template for compliance analysis
      const promptContext: PromptContext = {
        question: compliancePrompt,
        retrievedChunks: [{
          content: requirements,
          metadata: {
            filename: `${standard} Requirements`,
            organization: this.getStandardOrganization(standard)
          }
        }]
      };

      const promptData = this.promptStrategy.generatePrompt('legal-audit', promptContext);
      const response = await this.ragChain.getLLMIntegration().generateResponse(
        promptData.userPrompt,
        promptData.systemPrompt
      );

      // Parse the response to extract issues
      const parsedIssues = this.parseComplianceIssues(response.content, standard);
      issues.push(...parsedIssues);

    } catch (error) {
      console.warn(`Failed to analyze compliance for question: ${question}`, error);
    }

    return issues;
  }

  /**
   * Parse compliance issues from LLM response
   */
  private parseComplianceIssues(responseContent: string, standard: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    
    // Look for issue patterns in the response
    const issuePatterns = [
      /missing|absent|not\s+disclosed|lacks|inadequate|insufficient/gi,
      /fails\s+to|does\s+not|cannot\s+find|no\s+evidence/gi,
      /should\s+include|must\s+disclose|required\s+to/gi
    ];

    const lines = responseContent.split('\n');
    let currentIssue: Partial<ComplianceIssue> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      // Check if this line describes an issue
      const hasIssueIndicator = issuePatterns.some(pattern => pattern.test(trimmedLine));
      
      if (hasIssueIndicator && trimmedLine.length > 20) {
        // Save previous issue if exists
        if (currentIssue.description) {
          issues.push(this.completeIssue(currentIssue, standard));
        }

        // Start new issue
        currentIssue = {
          description: trimmedLine,
          standard: standard
        };
      } else if (currentIssue.description) {
        // Continue building current issue
        if (trimmedLine.toLowerCase().includes('critical')) {
          currentIssue.severity = 'critical';
        } else if (trimmedLine.toLowerCase().includes('warning')) {
          currentIssue.severity = 'warning';
        } else if (trimmedLine.toLowerCase().includes('recommendation')) {
          currentIssue.recommendation = trimmedLine;
        }
      }
    }

    // Add the last issue
    if (currentIssue.description) {
      issues.push(this.completeIssue(currentIssue, standard));
    }

    return issues;
  }

  /**
   * Complete an issue with default values
   */
  private completeIssue(partialIssue: Partial<ComplianceIssue>, standard: string): ComplianceIssue {
    return {
      id: `${standard}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: partialIssue.description || 'Compliance issue identified',
      severity: partialIssue.severity || 'warning',
      type: this.categorizeIssue(partialIssue.description || ''),
      standard: standard,
      category: this.categorizeIssue(partialIssue.description || ''),
      recommendation: partialIssue.recommendation || 'Review and enhance disclosure',
      ...partialIssue
    };
  }

  /**
   * Categorize an issue based on its description
   */
  private categorizeIssue(description: string): string {
    const categories = {
      'Governance': ['governance', 'board', 'oversight', 'management', 'leadership'],
      'Strategy': ['strategy', 'strategic', 'planning', 'scenario', 'transition'],
      'Risk Management': ['risk', 'risks', 'management', 'assessment', 'mitigation'],
      'Metrics and Targets': ['metrics', 'targets', 'kpi', 'indicators', 'measurement'],
      'Environmental': ['environmental', 'climate', 'emissions', 'carbon', 'energy'],
      'Social': ['social', 'workforce', 'human rights', 'diversity', 'community'],
      'Disclosure': ['disclosure', 'reporting', 'transparency', 'information']
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return 'Compliance';
  }

  /**
   * Calculate compliance score for a standard
   */
  private calculateStandardCompliance(issues: ComplianceIssue[], depth: string): number {
    if (issues.length === 0) return 100;

    // Weight issues by severity
    const severityWeights = { critical: 3, warning: 2, info: 1 };
    const totalWeight = issues.reduce((sum, issue) => 
      sum + severityWeights[issue.severity], 0
    );

    // Base penalty calculation
    const maxPossibleWeight = this.getMaxPossibleWeight(depth);
    const penaltyPercentage = Math.min((totalWeight / maxPossibleWeight) * 100, 100);
    
    return Math.max(0, Math.round(100 - penaltyPercentage));
  }

  /**
   * Get maximum possible weight based on analysis depth
   */
  private getMaxPossibleWeight(depth: string): number {
    const weights = { basic: 15, detailed: 30, comprehensive: 50 };
    return weights[depth as keyof typeof weights] || 30;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(findings: StandardFinding[]): number {
    if (findings.length === 0) return 0;
    
    const totalScore = findings.reduce((sum, finding) => sum + finding.compliance, 0);
    return Math.round(totalScore / findings.length);
  }

  /**
   * Generate compliance summary
   */
  private async generateComplianceSummary(
    findings: StandardFinding[],
    overallScore: number
  ): Promise<string> {
    const totalIssues = findings.reduce((sum, finding) => sum + finding.issues.length, 0);
    const criticalIssues = findings.reduce((sum, finding) => 
      sum + finding.issues.filter(issue => issue.severity === 'critical').length, 0
    );

    let summary = `ESG Compliance Analysis Summary\n\n`;
    summary += `Overall Compliance Score: ${overallScore}%\n`;
    summary += `Total Issues Identified: ${totalIssues}\n`;
    summary += `Critical Issues: ${criticalIssues}\n\n`;

    if (overallScore >= 80) {
      summary += `The report demonstrates strong ESG compliance with most requirements met. `;
    } else if (overallScore >= 60) {
      summary += `The report shows moderate ESG compliance but has areas requiring improvement. `;
    } else {
      summary += `The report has significant compliance gaps that need immediate attention. `;
    }

    // Add standard-specific insights
    summary += `\n\nStandard-specific findings:\n`;
    for (const finding of findings) {
      summary += `• ${finding.standard}: ${finding.compliance}% compliant (${finding.issues.length} issues)\n`;
    }

    return summary;
  }

  /**
   * Generate analytics from findings
   */
  private generateAnalytics(findings: StandardFinding[]): ComplianceAnalytics {
    const allIssues = findings.flatMap(finding => finding.issues);
    
    // Issues by category
    const categoryCount: Record<string, number> = {};
    allIssues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });
    
    const issuesByCategory = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / allIssues.length) * 100)
    }));

    // Issues by severity
    const severityCount: Record<string, number> = {};
    allIssues.forEach(issue => {
      severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
    });
    
    const issuesBySeverity = Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count,
      percentage: Math.round((count / allIssues.length) * 100)
    }));

    // Top issue areas
    const topIssueAreas = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([area, count]) => ({
        area,
        category: area,
        count
      }));

    // Improvement opportunities
    const improvementOpportunities = this.generateImprovementOpportunities(findings);

    return {
      issuesByCategory,
      issuesBySeverity,
      topIssueAreas,
      improvementOpportunities
    };
  }

  /**
   * Generate improvement opportunities
   */
  private generateImprovementOpportunities(findings: StandardFinding[]): Array<{
    area: string;
    description: string;
    potential: string;
  }> {
    const opportunities: Array<{area: string, description: string, potential: string}> = [];
    
    // Find standards with low compliance scores
    const lowCompliance = findings.filter(finding => finding.compliance < 70);
    
    for (const finding of lowCompliance) {
      const criticalIssues = finding.issues.filter(issue => issue.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        opportunities.push({
          area: finding.standard,
          description: `Address ${criticalIssues.length} critical compliance gaps in ${finding.standard}`,
          potential: `Could improve compliance score by ${Math.min(30, criticalIssues.length * 5)}%`
        });
      }
    }

    return opportunities.slice(0, 5);
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(): ComplianceAnalytics {
    return {
      issuesByCategory: [],
      issuesBySeverity: [],
      topIssueAreas: [],
      improvementOpportunities: []
    };
  }

  /**
   * Deduplicate similar issues
   */
  private deduplicateIssues(issues: ComplianceIssue[]): ComplianceIssue[] {
    const uniqueIssues: ComplianceIssue[] = [];
    const seen = new Set<string>();

    for (const issue of issues) {
      const key = `${issue.description.substring(0, 50)}-${issue.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    }

    return uniqueIssues;
  }

  /**
   * Get organization name for standard
   */
  private getStandardOrganization(standard: string): string {
    const organizations: Record<string, string> = {
      'TCFD': 'TCFD',
      'ESRS': 'EFRAG',
      'GRI': 'GRI',
      'SASB': 'SASB',
      'SEC': 'SEC'
    };
    
    return organizations[standard] || standard;
  }

  /**
   * Get LLM integration for direct access
   */
  public getLLMIntegration() {
    return this.ragChain.getLLMIntegration();
  }
}