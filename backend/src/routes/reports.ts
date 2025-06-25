import { Elysia, t } from 'elysia';
import { ReportsRepository } from '../repositories/reports';
import type { CreateReportInput, UpdateReportInput } from '../repositories/reports';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { prisma } from '../lib/db';
import crypto from 'crypto';
import fetch from 'node-fetch';

const UPLOAD_DIR = './uploads';

// Ensure upload directory exists
try {
  await mkdir(UPLOAD_DIR, { recursive: true });
} catch (error) {
  // Failed to create upload directory
}

// File upload types
const FileUploadBody = t.Object({
  file: t.Any() // Elysia will handle the file type internally
});

const ReportSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  uploadedAt: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
  ]),
  standards: t.Array(t.String()),
  fileUrl: t.String(),
  results: t.Optional(t.Object({
    score: t.Number(),
    findings: t.Array(t.Object({
      standard: t.String(),
      compliance: t.Number(),
      issues: t.Array(t.Object({
        type: t.String(),
        description: t.String(),
        severity: t.String(),
        recommendation: t.String()
      }))
    }))
  }))
});

type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Define a type for the Standard object
interface Standard {
  id: string;
  name: string;
  description: string;
  categories: string[];
  isCustom: boolean;
  isActive: boolean;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define a type for the Report object that includes standards
interface ReportWithStandards {
  id: string;
  name: string;
  description: string | null;
  uploadedAt: Date;
  status: string;
  fileUrl: string;
  results: any;
  createdAt: Date;
  updatedAt: Date;
  standards: Standard[];
}

interface ReportResults {
  issues: Array<{ severity: string }>;
  score: number;
  findings?: Array<{
    standard: string;
    compliance: number;
    issues: Array<{
      type: string;
      description: string;
      severity: string;
      recommendation: string;
      highlightedText?: string;
      page?: number;
    }>;
  }>;
  summary?: string;
  overallScore?: number;
  analytics?: {
    complianceTrend?: Array<{ period: string; score: number }>;
    improvementOpportunities?: Array<{ area: string; description: string; potential: string }>;
    issuesByCategory?: Array<{ category: string; count: number; percentage: number }>;
    issuesBySeverity?: Array<{ severity: string; count: number; percentage: number }>;
    topIssueAreas?: Array<{ area: string; category: string; count: number }>;
  };
}

export const reportsRouter = new Elysia({ prefix: '/reports' })
  // Add file upload endpoint with multipart handling
  .post('/upload', async ({ body, request }) => {
    try {
      // Remove the formData parsing since we're using Elysia's built-in multipart handling
      const file = body.file;
      
      if (!file || !file.size) {
        return { success: false, error: 'No file provided in form data' };
      }

      // Validate file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_SIZE) {
        return { success: false, error: `File size exceeds limit of 10MB (got ${(file.size / 1024 / 1024).toFixed(2)}MB)` };
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: `Invalid file type: ${file.type}. Only PDF and DOCX files are allowed.` };
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = join(UPLOAD_DIR, fileName);
      
      try {
        await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error while saving file';
        throw new Error(`Failed to save file: ${errorMessage}`);
      }
      
      // Return the file URL
      const fileUrl = `/uploads/${fileName}`;
      return { 
        success: true, 
        data: { 
          fileUrl,
          fileName: file.name,
          size: file.size,
          type: file.type
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during file upload',
        details: error instanceof Error ? error.stack : undefined
      };
    }
  }, {
    body: t.Object({
      file: t.File() // Use Elysia's built-in File type
    })
  })

  .get('/', async ({ query }) => {
    try {
      const { 
        search, 
        status, 
        standardId, 
        sortBy, 
        sortOrder, 
        page, 
        limit 
      } = query;

      const reports = await ReportsRepository.findAll({
        search: search as string,
        status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
        standardId: standardId as string,
        sortBy: sortBy as 'name' | 'uploadedAt' | 'status',
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      return { success: true, ...reports };
    } catch (error) {
      return { success: false, error: 'Failed to fetch reports' };
    }
  }, {
    query: t.Object({
      search: t.Optional(t.String()),
      status: t.Optional(t.Union([
        t.Literal('PENDING'),
        t.Literal('IN_PROGRESS'),
        t.Literal('COMPLETED'),
        t.Literal('FAILED')
      ])),
      standardId: t.Optional(t.String()),
      sortBy: t.Optional(t.Union([
        t.Literal('name'),
        t.Literal('uploadedAt'),
        t.Literal('status')
      ])),
      sortOrder: t.Optional(t.Union([
        t.Literal('asc'),
        t.Literal('desc')
      ])),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })
  
  .get('/:id', async ({ params: { id } }) => {
    try {
      const report = await ReportsRepository.findById(id);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: 'Failed to fetch report' };
    }
  })
  
  .get('/standard/:standardId', async ({ params: { standardId } }) => {
    try {
      const reports = await ReportsRepository.findByStandardId(standardId);
      return { success: true, data: reports };
    } catch (error) {
      return { success: false, error: 'Failed to fetch reports' };
    }
  })
  
  .post('/', async ({ body }) => {
    try {
      const report = await ReportsRepository.create(body as CreateReportInput);
      
      // Automatically trigger validation after report creation
      try {
        // Update status to processing
        await ReportsRepository.update(report.id, {
          status: 'IN_PROGRESS'
        });
        
        // Get the file path from the fileUrl
        const fileUrl = report.fileUrl;
        if (!fileUrl) {
          throw new Error('Report file not found');
        }
        
        // Extract the file name from the fileUrl
        const fileName = fileUrl.split('/').pop();
        if (!fileName) {
          throw new Error('Invalid file URL');
        }
        
        // Construct the full file path
        const filePath = join(UPLOAD_DIR, fileName);
        
        // Read the file as base64
        const fileBuffer = await readFile(filePath);
        const base64File = fileBuffer.toString('base64');
        
        // Determine the guideline from the standards
        let guideline = 'TCFD'; // Default guideline
        
        // Get the standards from the body since they might not be in the report object yet
        const standards = body.standards || [];
        if (standards.length > 0) {
          // Use the first standard as the guideline
          guideline = standards[0];
        }
        
        // Use the new RAG-powered compliance analyzer
        console.log(`🔬 Using RAG-powered compliance analysis for ${guideline}`);
        
        // Import compliance analyzer
        const { ESGComplianceAnalyzer } = await import('../rag/compliance-analyzer.js');
        const { DocumentExtractor } = await import('../rag/document-extractor.js');
        
        // Extract text from the document
        const documentExtractor = new DocumentExtractor();
        const reportText = await documentExtractor.extractFromBase64(base64File, fileName);
        const cleanedText = documentExtractor.cleanExtractedText(reportText);
        
        if (cleanedText.length < 100) {
          throw new Error('Insufficient text content extracted from document');
        }
        
        console.log(`📊 Extracted ${cleanedText.length} characters of text`);
        
        // Initialize compliance analyzer
        const analyzer = new ESGComplianceAnalyzer();
        
        // Configure analysis
        const config = {
          standards: [guideline],
          analysisDepth: 'detailed' as const,
          includeRecommendations: true,
          generateAnalytics: true
        };
        
        // Perform compliance analysis
        const analysisResult = await analyzer.analyzeReport(
          cleanedText,
          report.name,
          config
        );
        
        console.log(`✅ RAG analysis completed with score: ${analysisResult.overallScore}%`);
        
        // Update the report with the analysis results
        const updatedReport = await ReportsRepository.update(report.id, {
          status: 'COMPLETED',
          results: analysisResult
        });
        
        // Create activity for validation completion
        await prisma.$executeRaw`
          INSERT INTO "Activity" ("id", "type", "details", "user", "reportId", "createdAt")
          VALUES (gen_random_uuid(), 'validation', ${`Completed validation for report: ${report.name}`}, 'System', ${report.id}, now())
        `;
        
        return { success: true, data: updatedReport };
      } catch (validationError: unknown) {
        // Update report status to failed
        await ReportsRepository.update(report.id, {
          status: 'FAILED'
        });
        
        // Create activity for validation failure
        await prisma.$executeRaw`
          INSERT INTO "Activity" ("id", "type", "details", "user", "reportId", "createdAt")
          VALUES (gen_random_uuid(), 'validation_failed', ${`Failed to validate report: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`}, 'System', ${report.id}, now())
        `;
        
        // Still return the created report, but with error details
        return { 
          success: true, 
          data: report,
          validationError: validationError instanceof Error ? validationError.message : 'Failed to validate report'
        };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create report' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
      standards: t.Array(t.String()),
      fileUrl: t.String(),
      status: t.Optional(t.Union([
        t.Literal('PENDING'),
        t.Literal('IN_PROGRESS'),
        t.Literal('COMPLETED'),
        t.Literal('FAILED')
      ]))
    })
  })
  
  .put('/:id', async ({ params: { id }, body }) => {
    try {
      const report = await ReportsRepository.update(id, body as UpdateReportInput);
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: 'Failed to update report' };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      standardId: t.Optional(t.String()),
      status: t.Optional(t.Union([
        t.Literal('PENDING'),
        t.Literal('IN_PROGRESS'),
        t.Literal('COMPLETED'),
        t.Literal('FAILED')
      ])),
      data: t.Optional(t.Any()),
      score: t.Optional(t.Number()),
      recommendations: t.Optional(t.Array(t.String()))
    })
  })
  
  .delete('/:id', async ({ params: { id } }) => {
    try {
      const report = await ReportsRepository.delete(id);
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: 'Failed to delete report' };
    }
  })
  
  .post('/:id/analysis', async ({ params: { id }, body }) => {
    try {
      const report = await ReportsRepository.update(id, {
        status: 'COMPLETED',
        ...body
      });
      
      // Create activity for analysis completion
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "reportId", "createdAt")
        VALUES (gen_random_uuid(), 'analysis', ${`Completed analysis for report: ${report.name}`}, 'System', ${id}, now())
      `;
      
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: 'Failed to add analysis' };
    }
  }, {
    body: t.Object({
      type: t.String(),
      result: t.Any(),
      score: t.Optional(t.Number()),
      recommendations: t.Optional(t.Array(t.String()))
    })
  })
  
  .get('/stats', async () => {
    try {
      const reports = await ReportsRepository.findAll();
      
      let compliantReports = 0;
      let totalIssues = 0;
      let criticalIssues = 0;
      let totalScore = 0;
      
      // Initialize category counters from analytics data
      const categoryCounters: Record<string, number> = {};
      
      reports.data.forEach(report => {
        // Check for both uppercase and lowercase status values
        if ((report.status === 'completed' || report.status === 'COMPLETED') && report.results) {
          const results = report.results as any;
          
          // Get score from either overallScore or score
          const score = results.overallScore !== undefined ? results.overallScore : results.score;
          
          if (score !== undefined) {
            totalScore += score;
            if (score >= 80) {
              compliantReports++;
            }
          }
          
          // Extract issues from findings array or directly from issues array
          let issues: any[] = [];
          if (results.findings && Array.isArray(results.findings)) {
            issues = results.findings.flatMap((finding: any) => finding.issues || []);
          } else if (results.issues && Array.isArray(results.issues)) {
            issues = results.issues;
          }
          
          totalIssues += issues.length;
          criticalIssues += issues.filter((issue: any) => issue.severity === 'critical').length;
          
          // Process analytics data if available
          if (results.analytics && results.analytics.issuesByCategory) {
            results.analytics.issuesByCategory.forEach((category: any) => {
              if (category.category && category.count) {
                if (!categoryCounters[category.category]) {
                  categoryCounters[category.category] = 0;
                }
                categoryCounters[category.category] += category.count;
              }
            });
          } else {
            // Fallback to categorizing issues manually if analytics not available
            issues.forEach((issue: any) => {
              const category = issue.type || 'Governance';
              if (!categoryCounters[category]) {
                categoryCounters[category] = 0;
              }
              categoryCounters[category]++;
            });
          }
        }
      });
      
      // Update to check for both uppercase and lowercase status values
      const completedReports = reports.data.filter(report => 
        report.status === 'completed' || report.status === 'COMPLETED'
      ).length;
      const averageScore = completedReports > 0 ? Math.round(totalScore / completedReports) : 0;
      
      const stats = {
        compliant: compliantReports,
        issues: totalIssues,
        critical: criticalIssues,
        totalReports: completedReports,
        averageScore,
        categories: categoryCounters
      };
      
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Failed to fetch compliance statistics' };
    }
  })
  
  .get('/export', async ({ query }) => {
    try {
      const {
        search,
        status,
        standardId,
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = query;
      
      // Get reports with filters
      const reportsResult = await ReportsRepository.findAll({
        search,
        status,
        standardId,
        sortBy: sortBy as 'name' | 'uploadedAt' | 'status',
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: 1000 // Allow exporting more reports
      });
      
      const reports = reportsResult.data as unknown as ReportWithStandards[]; // Cast to the correct type
      
      // Create CSV header
      const header = 'ID,Name,Description,Status,Upload Date,Standards\n';
      
      // Create CSV rows
      const rows = reports.map(report => {
        const date = report.uploadedAt.toISOString();
        
        // Get standards from the report
        let standardsText = '';
        if (report.standards && Array.isArray(report.standards)) {
          standardsText = report.standards.map(s => s.name).join('; ');
        }
        
        return `${report.id},"${report.name.replace(/"/g, '""')}","${(report.description || '').replace(/"/g, '""')}",${report.status},${date},"${standardsText}"`;
      }).join('\n');
      
      // Create activity for export
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "createdAt")
        VALUES (gen_random_uuid(), 'export', 'Exported reports as CSV', 'System', now())
      `;
      
      return new Response(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="reports.csv"'
        }
      });
    } catch (error) {
      return { success: false, error: 'Failed to export reports' };
    }
  }, {
    query: t.Object({
      search: t.Optional(t.String()),
      status: t.Optional(t.Union([
        t.Literal('PENDING'),
        t.Literal('IN_PROGRESS'),
        t.Literal('COMPLETED'),
        t.Literal('FAILED')
      ])),
      standardId: t.Optional(t.String()),
      sortBy: t.Optional(t.Union([
        t.Literal('name'),
        t.Literal('uploadedAt'),
        t.Literal('status')
      ])),
      sortOrder: t.Optional(t.Union([
        t.Literal('asc'),
        t.Literal('desc')
      ]))
    })
  })
  
  // Export a single report
  .get('/:id/export', async ({ params }) => {
    try {
      const { id } = params;
      
      // Get the report
      const report = await ReportsRepository.findById(id) as unknown as ReportWithStandards;
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      
      // Create CSV header
      const header = 'ID,Name,Description,Status,Upload Date,Standards,Summary,Issues,Recommendations\n';
      
      // Create CSV row
      const date = report.uploadedAt.toISOString();
      
      // Get standards from the report
      let standardsText = '';
      if (report.standards && Array.isArray(report.standards)) {
        standardsText = report.standards.map(s => s.name).join('; ');
      }
      
      // Extract data from results
      const results = report.results as any;
      const summary = results?.summary || '';
      
      // Extract issues
      let issuesText = '';
      if (results?.findings) {
        const allIssues = results.findings.flatMap((finding: any) => 
          finding.issues || []
        );
        issuesText = allIssues.map((issue: any) => issue.description).join('; ');
      }
      
      // Extract recommendations
      let recommendationsText = '';
      if (results?.findings) {
        const allRecommendations = results.findings.flatMap((finding: any) => 
          finding.issues.map((issue: any) => issue.recommendation) || []
        );
        recommendationsText = allRecommendations.join('; ');
      }
      
      const row = `${report.id},"${report.name.replace(/"/g, '""')}","${(report.description || '').replace(/"/g, '""')}",${report.status},${date},"${standardsText}","${summary.replace(/"/g, '""')}","${issuesText.replace(/"/g, '""')}","${recommendationsText.replace(/"/g, '""')}"`;
      
      // Create activity for export
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "createdAt")
        VALUES (gen_random_uuid(), 'export', 'Exported report ${report.name}', 'System', now())
      `;
      
      return new Response(header + row, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${id}.csv"`
        }
      });
    } catch (error) {
      return { success: false, error: 'Failed to export report' };
    }
  })
  
  // Share a report
  .post('/:id/share', async ({ params, body }) => {
    try {
      const { id } = params;
      const { email } = body as { email: string };
      
      if (!email) {
        return { success: false, error: 'Email is required' };
      }
      
      // Get the report
      const report = await ReportsRepository.findById(id);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      
      // Generate a unique share token
      const shareToken = crypto.randomUUID();
      
      // Store the share token in the database
      await prisma.reportShare.create({
        data: {
          id: shareToken,
          reportId: id,
          email,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiration
        }
      });
      
      // Generate shareable link
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shareLink = `${baseUrl}/shared/${shareToken}`;
      
      // In a real application, you would send an email with the link here
      console.log(`Sharing report ${report.name} with ${email}. Link: ${shareLink}`);
      
      // Create activity for sharing
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "createdAt")
        VALUES (gen_random_uuid(), 'share', 'Shared report ${report.name} with ${email}', 'System', now())
      `;
      
      return { success: true, data: { shareLink } };
    } catch (error) {
      return { success: false, error: 'Failed to share report' };
    }
  }, {
    body: t.Object({
      email: t.String()
    })
  })
  
  // Get a shared report
  .get('/shared/:token', async ({ params }) => {
    try {
      const { token } = params;
      
      // Find the share record
      const share = await prisma.reportShare.findUnique({
        where: { id: token }
      });
      
      if (!share) {
        return { success: false, error: 'Shared report not found' };
      }
      
      // Check if the share has expired
      if (share.expiresAt < new Date()) {
        return { success: false, error: 'Shared report link has expired' };
      }
      
      // Get the report
      const report = await ReportsRepository.findById(share.reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      
      // Create activity for viewing shared report
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "createdAt")
        VALUES (gen_random_uuid(), 'view_shared', 'Viewed shared report ${report.name}', 'Anonymous', now())
      `;
      
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: 'Failed to get shared report' };
    }
  })
  
  // Validate report using LLM API
  .post('/:id/validate', async ({ params, body }) => {
    try {
      const { id } = params;
      const { guideline } = body as { guideline: string };
      
      // Get the report
      const report = await ReportsRepository.findById(id);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      
      // Get the file path from the fileUrl
      const fileUrl = report.fileUrl;
      if (!fileUrl) {
        return { success: false, error: 'Report file not found' };
      }
      
      // Extract the file name from the fileUrl
      const fileName = fileUrl.split('/').pop();
      if (!fileName) {
        return { success: false, error: 'Invalid file URL' };
      }
      
      // Construct the full file path
      const filePath = join(UPLOAD_DIR, fileName);
      
      // Read the file as base64
      const fileBuffer = await readFile(filePath);
      const base64File = fileBuffer.toString('base64');
      
      // Use the new RAG-powered compliance analyzer
      console.log(`🔬 Using RAG-powered compliance analysis for ${guideline || 'TCFD'}`);
      
      // Import compliance analyzer
      const { ESGComplianceAnalyzer } = await import('../rag/compliance-analyzer.js');
      const { DocumentExtractor } = await import('../rag/document-extractor.js');
      
      // Extract text from the document
      const documentExtractor = new DocumentExtractor();
      const reportText = await documentExtractor.extractFromBase64(base64File, fileName);
      const cleanedText = documentExtractor.cleanExtractedText(reportText);
      
      if (cleanedText.length < 100) {
        return { success: false, error: 'Insufficient text content extracted from document' };
      }
      
      console.log(`📊 Extracted ${cleanedText.length} characters of text`);
      
      // Initialize compliance analyzer
      const analyzer = new ESGComplianceAnalyzer();
      
      // Configure analysis
      const config = {
        standards: [guideline || 'TCFD'],
        analysisDepth: 'detailed' as const,
        includeRecommendations: true,
        generateAnalytics: true
      };
      
      // Perform compliance analysis
      const analysisResult = await analyzer.analyzeReport(
        cleanedText,
        report.name,
        config
      );
      
      console.log(`✅ RAG analysis completed with score: ${analysisResult.overallScore}%`);
      
      // Update the report with the analysis results
      const updatedReport = await ReportsRepository.update(id, {
        status: 'COMPLETED',
        results: analysisResult
      });
      
      // Create activity for validation completion
      await prisma.$executeRaw`
        INSERT INTO "Activity" ("id", "type", "details", "user", "reportId", "createdAt")
        VALUES (gen_random_uuid(), 'validation', ${`Completed validation for report: ${report.name}`}, 'System', ${id}, now())
      `;
      
      return { success: true, data: updatedReport };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate report',
        details: error instanceof Error ? error.stack : undefined
      };
    }
  }, {
    body: t.Object({
      guideline: t.Optional(t.String())
    })
  }); 