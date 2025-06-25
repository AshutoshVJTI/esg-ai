import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db.js';

// Type definitions for external modules
interface PDFData {
  text: string;
  numpages: number;
}

// Dynamic imports for external modules
async function parsePDF(buffer: Buffer): Promise<PDFData> {
  const pdfParse = await import('pdf-parse');
  return pdfParse.default(buffer);
}

async function parseExcel(buffer: Buffer) {
  const XLSX = await import('xlsx');
  return XLSX.read(buffer);
}

async function parseWord(buffer: Buffer) {
  const mammoth = await import('mammoth');
  return mammoth.extractRawText({ buffer });
}

export interface DocumentMetadata {
  filename: string;
  filepath: string;
  region: string;
  organization?: string;
  documentType: string;
  fileSize: number;
  totalPages?: number;
  title?: string;
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  pageCount?: number;
}

export class DocumentLoader {
  private esgCorpusPath: string;

  constructor(esgCorpusPath?: string) {
    if (esgCorpusPath) {
      this.esgCorpusPath = path.resolve(esgCorpusPath);
    } else {
      // Try to find esg_corpus directory relative to project root
      const projectRoot = process.cwd().includes('backend') 
        ? path.resolve(process.cwd(), '..')
        : process.cwd();
      this.esgCorpusPath = path.join(projectRoot, 'esg_corpus');
    }
  }

  /**
   * Recursively scan the esg_corpus directory and extract all documents
   */
  async loadAllDocuments(): Promise<ExtractedContent[]> {
    const documents: ExtractedContent[] = [];
    
    try {
      const regions = await this.getRegions();
      
      for (const region of regions) {
        const regionPath = path.join(this.esgCorpusPath, region);
        const regionDocs = await this.loadRegionDocuments(region, regionPath);
        documents.push(...regionDocs);
      }
      
      return documents;
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }

  /**
   * Get all regions (subdirectories) in esg_corpus
   */
  private async getRegions(): Promise<string[]> {
    const items = await fs.promises.readdir(this.esgCorpusPath);
    const regions = [];
    
    for (const item of items) {
      const itemPath = path.join(this.esgCorpusPath, item);
      const stat = await fs.promises.stat(itemPath);
      if (stat.isDirectory()) {
        regions.push(item);
      }
    }
    
    return regions;
  }

  /**
   * Load all documents from a specific region
   */
  private async loadRegionDocuments(region: string, regionPath: string): Promise<ExtractedContent[]> {
    const documents: ExtractedContent[] = [];
    
    const items = await fs.promises.readdir(regionPath);
    
    for (const item of items) {
      const itemPath = path.join(regionPath, item);
      const stat = await fs.promises.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively load from subdirectories
        const organization = item;
        const subDocs = await this.loadOrganizationDocuments(region, organization, itemPath);
        documents.push(...subDocs);
      } else if (this.isDocumentFile(item)) {
        // Load document directly from region folder
        const content = await this.loadDocument(itemPath, {
          filename: item,
          filepath: itemPath,
          region,
          documentType: this.getFileExtension(item),
          fileSize: stat.size
        });
        if (content) {
          documents.push(content);
        }
      }
    }
    
    return documents;
  }

  /**
   * Load documents from organization subdirectories
   */
  private async loadOrganizationDocuments(
    region: string, 
    organization: string, 
    orgPath: string
  ): Promise<ExtractedContent[]> {
    const documents: ExtractedContent[] = [];
    
    const items = await fs.promises.readdir(orgPath);
    
    for (const item of items) {
      const itemPath = path.join(orgPath, item);
      const stat = await fs.promises.stat(itemPath);
      
      if (stat.isFile() && this.isDocumentFile(item)) {
        const content = await this.loadDocument(itemPath, {
          filename: item,
          filepath: itemPath,
          region,
          organization,
          documentType: this.getFileExtension(item),
          fileSize: stat.size
        });
        if (content) {
          documents.push(content);
        }
      }
    }
    
    return documents;
  }

  /**
   * Load and extract content from a single document
   */
  async loadDocument(filePath: string, baseMetadata: Partial<DocumentMetadata>): Promise<ExtractedContent | null> {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const extension = this.getFileExtension(filePath);
      
      let extractedText = '';
      let pageCount: number | undefined;
      
      switch (extension.toLowerCase()) {
        case 'pdf':
          const pdfData = await parsePDF(fileBuffer);
          extractedText = pdfData.text;
          pageCount = pdfData.numpages;
          break;
          
        case 'xlsx':
        case 'xls':
          const workbook = await parseExcel(fileBuffer);
          const sheets = workbook.SheetNames;
          const XLSX = await import('xlsx');
          const allSheetText = sheets.map((sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_txt(sheet);
          }).join('\n\n--- SHEET BREAK ---\n\n');
          extractedText = allSheetText;
          break;
          
        case 'docx':
          const result = await parseWord(fileBuffer);
          extractedText = result.value;
          break;
          
        case 'txt':
          extractedText = fileBuffer.toString('utf-8');
          break;
          
        default:
          console.warn(`Unsupported file type: ${extension} for file: ${filePath}`);
          return null;
      }

      // Extract title from filename or content
      const title = this.extractTitle(baseMetadata.filename || '', extractedText);
      
      const metadata: DocumentMetadata = {
        filename: baseMetadata.filename || path.basename(filePath),
        filepath: filePath,
        region: baseMetadata.region || 'Unknown',
        organization: baseMetadata.organization,
        documentType: extension,
        fileSize: baseMetadata.fileSize || 0,
        totalPages: pageCount,
        title
      };

      return {
        text: this.cleanText(extractedText),
        metadata,
        pageCount
      };
      
    } catch (error) {
      console.error(`Error loading document ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Check if file is a supported document type
   */
  private isDocumentFile(filename: string): boolean {
    const supportedExtensions = ['.pdf', '.xlsx', '.xls', '.docx', '.txt'];
    const extension = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(extension);
  }

  /**
   * Get file extension without the dot
   */
  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().replace('.', '');
  }

  /**
   * Extract a meaningful title from filename or document content
   */
  private extractTitle(filename: string, content: string): string {
    // Clean filename for title
    let title = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    title = title.replace(/[-_]/g, ' '); // Replace dashes and underscores with spaces
    title = title.replace(/\s+/g, ' ').trim(); // Clean up whitespace
    
    // Try to extract a better title from content if available
    const lines = content.split('\n').slice(0, 10); // Check first 10 lines
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10 && trimmedLine.length < 100 && 
          !trimmedLine.includes('Page') && !trimmedLine.includes('www.')) {
        // Likely a title
        return trimmedLine;
      }
    }
    
    return title;
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .replace(/\s{2,}/g, ' ') // Reduce excessive spaces
      .replace(/[^\S\n]+/g, ' ') // Clean up other whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Save document metadata to database
   */
  async saveDocumentToDatabase(content: ExtractedContent, standardId?: string): Promise<string> {
    try {
      const document = await prisma.document.create({
        data: {
          filename: content.metadata.filename,
          filepath: content.metadata.filepath,
          title: content.metadata.title,
          region: content.metadata.region,
          organization: content.metadata.organization,
          documentType: content.metadata.documentType,
          fileSize: content.metadata.fileSize,
          totalPages: content.metadata.totalPages,
          processed: false,
          standardId: standardId || null
        }
      });
      
      return document.id;
    } catch (error) {
      console.error('Error saving document to database:', error);
      throw error;
    }
  }
} 