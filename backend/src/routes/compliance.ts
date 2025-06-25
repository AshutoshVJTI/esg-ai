import { Elysia, t } from 'elysia';
import { ESGComplianceAnalyzer } from '../rag/compliance-analyzer.js';
import { DocumentExtractor } from '../rag/document-extractor.js';
import type { ComplianceAnalysisConfig, ComplianceAnalysisResult } from '../rag/compliance-analyzer.js';
import { ReportsRepository } from '../repositories/reports.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = './uploads';

const ComplianceAnalysisSchema = t.Object({
  reportId: t.String(),
  standards: t.Array(t.String()),
  analysisDepth: t.Optional(t.Union([
    t.Literal('basic'),
    t.Literal('detailed'),
    t.Literal('comprehensive')
  ])),
  includeRecommendations: t.Optional(t.Boolean()),
  generateAnalytics: t.Optional(t.Boolean())
});

const ComplianceResultSchema = t.Object({
  overallScore: t.Number(),
  summary: t.String(),
  findings: t.Array(t.Object({
    standard: t.String(),
    compliance: t.Number(),
    issues: t.Array(t.Object({
      id: t.String(),
      description: t.String(),
      severity: t.Union([t.Literal('critical'), t.Literal('warning'), t.Literal('info')]),
      type: t.String(),
      category: t.String(),
      standard: t.String(),
      recommendation: t.Optional(t.String()),
      context: t.Optional(t.String()),
      page: t.Optional(t.Number()),
      highlightedText: t.Optional(t.String())
    }))
  })),
  analytics: t.Object({
    issuesByCategory: t.Array(t.Object({
      category: t.String(),
      count: t.Number(),
      percentage: t.Number()
    })),
    issuesBySeverity: t.Array(t.Object({
      severity: t.String(),
      count: t.Number(),
      percentage: t.Number()
    })),
    topIssueAreas: t.Array(t.Object({
      area: t.String(),
      category: t.String(),
      count: t.Number()
    })),
    improvementOpportunities: t.Array(t.Object({
      area: t.String(),
      description: t.String(),
      potential: t.String()
    }))
  }),
  processedAt: t.String(),
  reportName: t.String(),
  status: t.Literal('COMPLETED')
});

export const complianceRouter = new Elysia({ prefix: '/compliance' })
  
  // Analyze a report for compliance
  .post('/analyze', async ({ body }) => {
    try {
      const {
        reportId,
        standards,
        analysisDepth = 'detailed',
        includeRecommendations = true,
        generateAnalytics = true
      } = body;

      console.log(`🔍 Starting compliance analysis for report: ${reportId}`);

      // Get the report from database
      const report = await ReportsRepository.findById(reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      // Update report status to processing
      await ReportsRepository.update(reportId, {
        status: 'IN_PROGRESS'
      });

      // Extract the file name from the fileUrl
      const fileUrl = report.fileUrl;
      if (!fileUrl) {
        throw new Error('Report file not found');
      }

      const fileName = fileUrl.split('/').pop();
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      // Construct the full file path
      const filePath = join(UPLOAD_DIR, fileName);

      // Extract text from the document
      console.log(`📄 Extracting text from: ${fileName}`);
      const documentExtractor = new DocumentExtractor();
      
      let reportText: string;
      try {
        reportText = await documentExtractor.extractText(filePath);
        reportText = documentExtractor.cleanExtractedText(reportText);
      } catch (extractionError) {
        console.error('Document extraction failed:', extractionError);
        
        // Update report status to failed
        await ReportsRepository.update(reportId, {
          status: 'FAILED'
        });
        
        return {
          success: false,
          error: `Failed to extract text from document: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`
        };
      }

      if (reportText.length < 100) {
        // Update report status to failed
        await ReportsRepository.update(reportId, {
          status: 'FAILED'
        });
        
        return {
          success: false,
          error: 'Insufficient text content extracted from document'
        };
      }

      console.log(`📊 Extracted ${reportText.length} characters of text`);

      // Initialize compliance analyzer
      const analyzer = new ESGComplianceAnalyzer();

      // Configure analysis
      const config: ComplianceAnalysisConfig = {
        standards,
        analysisDepth,
        includeRecommendations,
        generateAnalytics
      };

      // Perform compliance analysis
      console.log(`🔬 Running compliance analysis against standards: ${standards.join(', ')}`);
      const analysisResult: ComplianceAnalysisResult = await analyzer.analyzeReport(
        reportText,
        report.name,
        config
      );

      console.log(`✅ Analysis completed with score: ${analysisResult.overallScore}%`);

      // Transform the result to match frontend expectations
      const transformedResult = {
        overallScore: analysisResult.overallScore,
        summary: analysisResult.summary,
        findings: analysisResult.findings,
        analytics: analysisResult.analytics,
        processedAt: analysisResult.processedAt,
        reportName: analysisResult.reportName,
        status: 'COMPLETED' as const
      };

      // Update the report with analysis results
      const updatedReport = await ReportsRepository.update(reportId, {
        status: 'COMPLETED',
        results: transformedResult
      });

      console.log(`💾 Analysis results saved to database`);

      return {
        success: true,
        data: {
          reportId,
          analysis: transformedResult,
          report: updatedReport
        }
      };

    } catch (error) {
      console.error('❌ Compliance analysis failed:', error);
      
      // Try to update report status to failed if we have a reportId
      if (body.reportId) {
        try {
          await ReportsRepository.update(body.reportId, {
            status: 'FAILED'
          });
        } catch (updateError) {
          console.error('Failed to update report status:', updateError);
        }
      }
      
      return {
        success: false,
        error: `Compliance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: ComplianceAnalysisSchema
  })

  // Quick compliance check for a specific section
  .post('/check-section', async ({ body }) => {
    try {
      const { text, standards, analysisType = 'basic' } = body;

      if (!text || text.length < 50) {
        return { success: false, error: 'Text content too short for analysis' };
      }

      console.log(`🔍 Quick compliance check for ${text.length} characters`);

      // Initialize compliance analyzer
      const analyzer = new ESGComplianceAnalyzer();

      // Configure basic analysis
      const config: ComplianceAnalysisConfig = {
        standards,
        analysisDepth: analysisType as 'basic' | 'detailed' | 'comprehensive',
        includeRecommendations: true,
        generateAnalytics: false // Skip analytics for quick checks
      };

      // Perform analysis
      const result = await analyzer.analyzeReport(
        text,
        'Quick Check',
        config
      );

      // Return simplified result
      return {
        success: true,
        data: {
          overallScore: result.overallScore,
          summary: result.summary,
          findings: result.findings,
          processedAt: result.processedAt
        }
      };

    } catch (error) {
      console.error('Quick compliance check failed:', error);
      return {
        success: false,
        error: `Quick compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, {
    body: t.Object({
      text: t.String(),
      standards: t.Array(t.String()),
      analysisType: t.Optional(t.Union([
        t.Literal('basic'),
        t.Literal('detailed'),
        t.Literal('comprehensive')
      ]))
    })
  })

  // Get available analysis configurations
  .get('/config', () => {
    return {
      success: true,
      data: {
        analysisDepths: [
          { value: 'basic', label: 'Basic Analysis', description: 'Quick compliance check with core requirements' },
          { value: 'detailed', label: 'Detailed Analysis', description: 'Comprehensive analysis with detailed findings' },
          { value: 'comprehensive', label: 'Comprehensive Analysis', description: 'Full analysis with all available checks' }
        ],
        supportedStandards: [
          { id: 'TCFD', name: 'Task Force on Climate-related Financial Disclosures', category: 'Climate' },
          { id: 'ESRS', name: 'European Sustainability Reporting Standards', category: 'EU Regulation' },
          { id: 'GRI', name: 'Global Reporting Initiative', category: 'Global Standard' },
          { id: 'SASB', name: 'Sustainability Accounting Standards Board', category: 'Industry-Specific' },
          { id: 'SEC', name: 'SEC Climate Disclosure Rules', category: 'US Regulation' }
        ],
        analysisFeatures: {
          includeRecommendations: {
            description: 'Include specific recommendations for addressing compliance gaps',
            default: true
          },
          generateAnalytics: {
            description: 'Generate detailed analytics and charts for compliance insights',
            default: true
          }
        }
      }
    };
  })

  // Get compliance analysis status for a report
  .get('/status/:reportId', async ({ params: { reportId } }) => {
    try {
      const report = await ReportsRepository.findById(reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      return {
        success: true,
        data: {
          reportId,
          status: report.status,
          hasResults: !!report.results,
          lastUpdated: report.updatedAt,
          results: report.results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get compliance status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  })

  // Get compliance insights summary
  .get('/insights', async () => {
    try {
      // Get all completed reports
      const reports = await ReportsRepository.findAll();
      const completedReports = reports.data.filter(
        report => (report.status === 'COMPLETED' || report.status === 'completed') && report.results
      );

      if (completedReports.length === 0) {
        return {
          success: true,
          data: {
            totalReports: 0,
            averageScore: 0,
            commonIssues: [],
            topStandards: [],
            improvementAreas: []
          }
        };
      }

      // Calculate insights
      let totalScore = 0;
      const issueCategories: Record<string, number> = {};
      const standardsUsed: Record<string, number> = {};
      const allIssues: any[] = [];

      for (const report of completedReports) {
        const results = report.results as any;
        
        // Add to total score
        if (results.overallScore !== undefined) {
          totalScore += results.overallScore;
        }

        // Count standards used
        if (results.findings) {
          results.findings.forEach((finding: any) => {
            standardsUsed[finding.standard] = (standardsUsed[finding.standard] || 0) + 1;
            
            // Count issue categories
            if (finding.issues) {
              finding.issues.forEach((issue: any) => {
                allIssues.push(issue);
                issueCategories[issue.category] = (issueCategories[issue.category] || 0) + 1;
              });
            }
          });
        }
      }

      const averageScore = Math.round(totalScore / completedReports.length);

      // Get top issue categories
      const commonIssues = Object.entries(issueCategories)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      // Get top standards
      const topStandards = Object.entries(standardsUsed)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([standard, count]) => ({ standard, count }));

      // Get improvement areas (categories with most critical issues)
      const criticalIssuesByCategory: Record<string, number> = {};
      allIssues.filter(issue => issue.severity === 'critical').forEach(issue => {
        criticalIssuesByCategory[issue.category] = (criticalIssuesByCategory[issue.category] || 0) + 1;
      });

      const improvementAreas = Object.entries(criticalIssuesByCategory)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([area, criticalCount]) => ({ area, criticalCount }));

      return {
        success: true,
        data: {
          totalReports: completedReports.length,
          averageScore,
          commonIssues,
          topStandards,
          improvementAreas
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get compliance insights: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }); 