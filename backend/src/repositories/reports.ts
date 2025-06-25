import { prisma } from '../lib/db';
import type { Report as PrismaReport } from '.prisma/client';
import type { Prisma } from '@prisma/client';

export interface CreateReportInput {
  name: string;
  description: string;
  standards: string[];
  fileUrl: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface UpdateReportInput {
  name?: string;
  description?: string;
  standards?: string[];
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  results?: any;
}

export interface FindAllOptions {
  search?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  standardId?: string;
  sortBy?: 'name' | 'uploadedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Helper function to create activity
async function createActivity(data: {
  type: string;
  details: string;
  user?: string;
  reportId?: string;
}) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "Activity" ("id", "type", "details", "user", "reportId", "createdAt")
      VALUES (gen_random_uuid(), ${data.type}, ${data.details}, ${data.user || null}, ${data.reportId || null}, now())
    `;
  } catch (error) {
    // Failed to create activity, but we don't want to fail the main operation
  }
}

export class ReportsRepository {
  // Get all reports with search, filter, and sort
  static async findAll(options: FindAllOptions = {}): Promise<{ data: PrismaReport[]; total: number }> {
    const {
      search,
      status,
      standardId,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = options;

    // Build where clause
    const where: Prisma.ReportWhereInput = {
      AND: [
        // Search
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        // Status filter
        status ? { status } : {},
        // Standard filter
        standardId ? {
          standards: {
            some: { id: standardId }
          }
        } : {}
      ]
    };

    // Get total count for pagination
    const total = await prisma.report.count({ where });

    // Get paginated and sorted data
    const data = await prisma.report.findMany({
      where,
      include: {
        standards: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });

    return { data, total };
  }

  // Get a single report by ID
  static async findById(id: string): Promise<PrismaReport | null> {
    return prisma.report.findUnique({
      where: { id },
      include: {
        standards: true
      }
    });
  }

  // Get reports by standard ID
  static async findByStandardId(standardId: string): Promise<PrismaReport[]> {
    return prisma.report.findMany({
      where: {
        standards: {
          some: {
            id: standardId
          }
        }
      },
      include: {
        standards: true
      }
    });
  }

  // Create a new report
  static async create(data: CreateReportInput): Promise<PrismaReport> {
    const { standards, ...reportData } = data;
    
    const report = await prisma.report.create({
      data: {
        ...reportData,
        uploadedAt: new Date(),
        standards: {
          connect: standards.map(id => ({ id }))
        }
      },
      include: {
        standards: true
      }
    });
    
    // Create activity for report upload
    await createActivity({
      type: 'upload',
      details: `Uploaded new report: ${report.name}`,
      reportId: report.id,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return report;
  }

  // Update a report
  static async update(id: string, data: UpdateReportInput): Promise<PrismaReport> {
    const { standards, ...updateData } = data;
    
    const report = await prisma.report.update({
      where: { id },
      data: {
        ...updateData,
        ...(standards && {
          standards: {
            set: standards.map(id => ({ id }))
          }
        })
      },
      include: {
        standards: true
      }
    });
    
    // Create activity for report update
    await createActivity({
      type: 'edit',
      details: `Updated report: ${report.name}`,
      reportId: report.id,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return report;
  }

  // Delete a report
  static async delete(id: string): Promise<PrismaReport> {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        standards: true
      }
    });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    const deletedReport = await prisma.report.delete({
      where: { id },
      include: {
        standards: true
      }
    });
    
    // Create activity for report deletion
    await createActivity({
      type: 'delete',
      details: `Deleted report: ${report.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return deletedReport;
  }

  // Add analysis result to a report
  static async addAnalysisResult(reportId: string, data: { 
    type: string;
    result: Record<string, any>;
    score?: number;
    recommendations?: string[];
  }): Promise<PrismaReport> {
    return prisma.report.update({
      where: { id: reportId },
      data: {
        results: data.result,
      },
      include: {
        standards: true
      }
    });
  }
} 