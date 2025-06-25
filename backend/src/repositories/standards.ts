import { prisma } from '../lib/db';
import type { Standard, File } from '@prisma/client';

export interface CreateStandardInput {
  name: string;
  description: string;
  categories: string[];
  isCustom?: boolean;
  isActive?: boolean;
  website?: string;
  files?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
}

export interface UpdateStandardInput {
  name?: string;
  description?: string;
  categories?: string[];
  isCustom?: boolean;
  isActive?: boolean;
  website?: string | null;
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

export class StandardsRepository {
  // Get all standards
  static async findAll(): Promise<Standard[]> {
    return prisma.standard.findMany({
      include: {
        files: true
      }
    });
  }

  // Get a single standard by ID
  static async findById(id: string): Promise<Standard | null> {
    return prisma.standard.findUnique({
      where: { id },
      include: {
        files: true
      }
    });
  }

  // Create a new standard
  static async create(data: CreateStandardInput): Promise<Standard> {
    const { files, ...standardData } = data;
    
    const standard = await prisma.standard.create({
      data: {
        ...standardData,
        files: files ? {
          create: files
        } : undefined
      },
      include: {
        files: true
      }
    });
    
    // Create activity for standard creation
    await createActivity({
      type: 'standard',
      details: `Added new standard: ${standard.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return standard;
  }

  // Update a standard
  static async update(id: string, data: UpdateStandardInput): Promise<Standard> {
    const standard = await prisma.standard.update({
      where: { id },
      data,
      include: {
        files: true
      }
    });
    
    // Create activity for standard update
    await createActivity({
      type: 'standard',
      details: `Updated standard: ${standard.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return standard;
  }

  // Delete a standard
  static async delete(id: string): Promise<Standard> {
    const standard = await prisma.standard.findUnique({
      where: { id },
      include: {
        files: true
      }
    });
    
    if (!standard) {
      throw new Error('Standard not found');
    }
    
    const deletedStandard = await prisma.standard.delete({
      where: { id },
      include: {
        files: true
      }
    });
    
    // Create activity for standard deletion
    await createActivity({
      type: 'standard',
      details: `Deleted standard: ${standard.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return deletedStandard;
  }

  // Add files to a standard
  static async addFiles(standardId: string, files: Omit<File, 'id' | 'standardId' | 'createdAt' | 'updatedAt'>[]): Promise<File[]> {
    const standard = await prisma.standard.findUnique({
      where: { id: standardId },
      select: { name: true }
    });
    
    if (!standard) {
      throw new Error('Standard not found');
    }
    
    const createdFiles = await prisma.file.createMany({
      data: files.map(file => ({
        ...file,
        standardId
      }))
    });
    
    // Create activity for adding files
    await createActivity({
      type: 'standard',
      details: `Added files to standard: ${standard.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });

    return prisma.file.findMany({
      where: {
        standardId
      }
    });
  }

  // Remove a file from a standard
  static async removeFile(fileId: string): Promise<File> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        standard: {
          select: { name: true }
        }
      }
    });
    
    if (!file) {
      throw new Error('File not found');
    }
    
    const deletedFile = await prisma.file.delete({
      where: { id: fileId }
    });
    
    // Create activity for removing file
    await createActivity({
      type: 'standard',
      details: `Removed file ${file.name} from standard: ${file.standard.name}`,
      user: 'System' // In a real app, this would be the authenticated user
    });
    
    return deletedFile;
  }
} 