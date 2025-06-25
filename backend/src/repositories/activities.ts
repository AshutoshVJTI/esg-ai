import { prisma } from '../lib/db';
import type { Prisma } from '@prisma/client';

// Define the Activity type since it's a new model
type Activity = {
  id: string;
  type: string;
  details: string;
  user?: string | null;
  reportId?: string | null;
  createdAt: Date;
  report?: {
    id: string;
    name: string;
  } | null;
};

export interface CreateActivityInput {
  type: string;
  details: string;
  user?: string;
  reportId?: string;
}

export interface FindActivitiesOptions {
  type?: string;
  reportId?: string;
  user?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ActivitiesRepository {
  // Create a new activity
  static async create(data: CreateActivityInput): Promise<Activity> {
    return prisma.$queryRaw`
      INSERT INTO "Activity" ("type", "details", "user", "reportId")
      VALUES (${data.type}, ${data.details}, ${data.user || null}, ${data.reportId || null})
      RETURNING *
    `;
  }

  // Find all activities with filtering and sorting
  static async findAll(options: FindActivitiesOptions = {}): Promise<Activity[]> {
    const {
      type,
      reportId,
      user,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = options;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where conditions for raw query
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (type) {
      conditions.push(`"type" = $${params.length + 1}`);
      params.push(type);
    }
    
    if (reportId) {
      conditions.push(`"reportId" = $${params.length + 1}`);
      params.push(reportId);
    }
    
    if (user) {
      conditions.push(`"user" = $${params.length + 1}`);
      params.push(user);
    }
    
    // Date range filter
    if (startDate) {
      conditions.push(`"createdAt" >= $${params.length + 1}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`"createdAt" <= $${params.length + 1}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Execute query with filters, sorting and pagination
    const query = `
      SELECT a.*, r.id as "reportId", r.name as "reportName"
      FROM "Activity" a
      LEFT JOIN "Report" r ON a."reportId" = r.id
      ${whereClause}
      ORDER BY a."${sortBy}" ${sortOrder}
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    const activities = await prisma.$queryRawUnsafe(query, ...params);
    
    // Transform the result to match the expected format
    return (activities as any[]).map(a => ({
      id: a.id,
      type: a.type,
      details: a.details,
      user: a.user,
      reportId: a.reportId,
      createdAt: a.createdAt,
      report: a.reportId ? {
        id: a.reportId,
        name: a.reportName
      } : null
    }));
  }

  // Get activities by report ID
  static async findByReportId(reportId: string): Promise<Activity[]> {
    const activities = await prisma.$queryRaw`
      SELECT a.*, r.id as "reportId", r.name as "reportName"
      FROM "Activity" a
      LEFT JOIN "Report" r ON a."reportId" = r.id
      WHERE a."reportId" = ${reportId}
      ORDER BY a."createdAt" DESC
    `;
    
    // Transform the result to match the expected format
    return (activities as any[]).map(a => ({
      id: a.id,
      type: a.type,
      details: a.details,
      user: a.user,
      reportId: a.reportId,
      createdAt: a.createdAt,
      report: a.reportId ? {
        id: a.reportId,
        name: a.reportName
      } : null
    }));
  }

  // Export activities as CSV
  static async exportActivities(options: FindActivitiesOptions = {}): Promise<string> {
    const activities = await this.findAll(options);
    
    // Create CSV header
    const header = 'ID,Type,Details,User,Report,Date\n';
    
    // Create CSV rows
    const rows = activities.map(activity => {
      const date = activity.createdAt.toISOString();
      const reportName = activity.report?.name || '';
      
      return `${activity.id},${activity.type},"${activity.details.replace(/"/g, '""')}",${activity.user || ''},"${reportName}",${date}`;
    }).join('\n');
    
    return header + rows;
  }
} 